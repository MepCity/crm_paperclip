import {
  checkRateLimit,
  computeClientHash,
  createRenderToken,
  generateChallenge,
  type OrgContext,
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
  "Webform SVG challenge CORS preflight",
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
  "Webform SVG challenge generation",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;
    const resolved = await resolvePublicForm(publicKey);
    if (!resolved) {
      return Response.json({ error: "Form unavailable" }, { status: 404 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]?.trim() || "127.0.0.1"
      : request.headers.get("x-real-ip") || "127.0.0.1";
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

    // Generate challenge
    const { challengeHash, svg } = generateChallenge();

    // Render token bound to challengeHash
    const token = createRenderToken({
      orgId: resolved.form.organizationId,
      formId: resolved.form.id,
      versionId: resolved.version.id,
      issuedAt: Date.now(),
      challengeHash,
    });

    corsHeaders.set("Cache-Control", "no-store, max-age=0");

    if (request.headers.get("accept")?.includes("image/svg+xml")) {
      corsHeaders.set("Content-Type", "image/svg+xml");
      corsHeaders.set("X-Render-Token", token);
      return new Response(svg, {
        status: 200,
        headers: corsHeaders,
      });
    }

    corsHeaders.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ token, svg }), {
      status: 200,
      headers: corsHeaders,
    });
  },
);
