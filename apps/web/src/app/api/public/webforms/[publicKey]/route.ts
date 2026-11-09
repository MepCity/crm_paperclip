import {
  checkRateLimit,
  computeClientHash,
  createRenderToken,
  generateChallenge,
  getClientIp,
  type OrgContext,
  recordVisit,
  resolveLocation,
  resolvePublicForm,
  type Transaction,
  withOrg,
} from "@crm/core";
import { exemptRoute } from "@/lib/access/route-permission";

export const dynamic = "force-dynamic";

function getCorsHeaders(
  request: Request,
  restrictLocations: boolean,
  allowedLocations: { origin: string }[],
): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");

  if (!origin) {
    return headers;
  }

  const isAllowed =
    !restrictLocations ||
    allowedLocations.some((l) => l.origin.toLowerCase() === origin.toLowerCase());

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
    headers.set("Access-Control-Max-Age", "86400");
  }

  return headers;
}

export const OPTIONS = exemptRoute(
  "public",
  "Webform public JSON CORS preflight",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;
    const resolved = await resolvePublicForm(publicKey);
    if (!resolved) {
      return new Response(null, { status: 404 });
    }

    const headers = getCorsHeaders(
      request,
      resolved.version.settings.restrictLocations,
      resolved.locations,
    );

    if (
      resolved.version.settings.restrictLocations &&
      !headers.has("Access-Control-Allow-Origin")
    ) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, { status: 204, headers });
  },
);

export const GET = exemptRoute(
  "public",
  "Webform public JSON definition",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;
    const resolved = await resolvePublicForm(publicKey);
    if (!resolved) {
      return Response.json({ error: "Form unavailable" }, { status: 404 });
    }

    const ip = getClientIp(request);
    const clientHash = computeClientHash(ip);

    const ctx: OrgContext = {
      orgId: resolved.form.organizationId,
      orgSlug: "public-render",
      orgName: "Public Render",
      userId: "00000000-0000-0000-0000-000000000000",
      role: "member",
    };

    // Rate limit check (render)
    const rateLimitCheck = await withOrg(ctx, (tx: Transaction) =>
      checkRateLimit(tx, {
        orgId: resolved.form.organizationId,
        formId: resolved.form.id,
        clientHash,
        isRender: true,
      }),
    );

    const corsHeaders = getCorsHeaders(
      request,
      resolved.version.settings.restrictLocations,
      resolved.locations,
    );

    if (!rateLimitCheck.allowed) {
      corsHeaders.set("Retry-After", "60");
      return Response.json({ error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders });
    }

    // Resolve location and record visit
    const locRes = resolveLocation({
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      restrictLocations: resolved.version.settings.restrictLocations,
      allowedLocations: resolved.locations,
    });
    await recordVisit(resolved.form.organizationId, resolved.form.id, locRes.location);

    // Challenge
    let challengeSvg: string | null = null;
    let challengeHash: string | undefined;
    if (resolved.version.settings.challenge) {
      const ch = generateChallenge();
      challengeSvg = ch.svg;
      challengeHash = ch.challengeHash;
    }

    // Render token
    const token = createRenderToken({
      orgId: resolved.form.organizationId,
      formId: resolved.form.id,
      versionId: resolved.version.id,
      issuedAt: Date.now(),
      challengeHash,
    });

    const body = {
      form: {
        id: resolved.form.id,
        name: resolved.form.name,
        module: resolved.form.module,
      },
      version: {
        id: resolved.version.id,
        number: resolved.version.number,
        fields: resolved.version.fields,
        settings: {
          buttonLabel: resolved.version.settings.buttonLabel,
          challenge: resolved.version.settings.challenge,
          captureAttribution: resolved.version.settings.captureAttribution,
        },
      },
      token,
      challengeSvg,
    };

    corsHeaders.set("Content-Type", "application/json");
    corsHeaders.set("Cache-Control", "no-store, max-age=0");
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: corsHeaders,
    });
  },
);
