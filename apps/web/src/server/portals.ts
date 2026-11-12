import { parseEnv } from "@crm/core";
import { InMemoryJobQueue } from "@crm/core/jobs";
import {
  checkPortalCsrf,
  clearPortalCookie,
  createFixtureContactReader,
  createPortalAdminService,
  createPortalAuthService,
  createPortalDataService,
  createPortalMailJobCatalog,
  createQueuedPortalMailer,
  isSecureAppUrl,
  PORTAL_RESPONSE_HEADERS,
  type PortalAdminService,
  type PortalAuthService,
  type PortalDataResult,
  type PortalDataService,
  type PortalMailer,
  type PortalPrincipal,
  portalContactDeleteObserver,
  readPortalCookie,
  serializePortalCookie,
} from "@crm/core/portals";
import { combineWriteObservers } from "@crm/core/records/write-observer";
import { getClientIp } from "@crm/core/webforms";
import { getApprovals } from "@/lib/approvals";
import { getCustomizationCoordinator } from "@/lib/customization";
import { getJourneys } from "@/lib/journeys";

/**
 * Portal composition (ADR 0019a). Portal handlers read only the portal cookie; member
 * cookies are never consulted here, and member routes never read the portal cookie.
 */
let mailer: PortalMailer | undefined;
let auth: PortalAuthService | undefined;
let admin: PortalAdminService | undefined;
let data: PortalDataService | undefined;

/** Staging mailer: queue + outbox in memory; no provider is connected (same as member mail). */
export function getPortalMailer(): PortalMailer {
  mailer ??= createQueuedPortalMailer({
    queue: new InMemoryJobQueue(createPortalMailJobCatalog()),
  });
  return mailer;
}

export function getPortalAuth(): PortalAuthService {
  auth ??= createPortalAuthService({
    mailer: getPortalMailer(),
    appUrl: appUrl(),
    contacts: createFixtureContactReader(getCustomizationCoordinator()),
  });
  return auth;
}

export function getPortalAdmin(): PortalAdminService {
  admin ??= createPortalAdminService({
    mailer: getPortalMailer(),
    appUrl: appUrl(),
    contacts: createFixtureContactReader(getCustomizationCoordinator()),
  });
  return admin;
}

/** Portal data access (ADR 0019a §3–§4); writes fire the same observers as member writes. */
export function getPortalData(): PortalDataService {
  data ??= createPortalDataService({
    schema: getCustomizationCoordinator(),
    writeObserver: (ctx) =>
      combineWriteObservers(
        getApprovals().writeObserver(ctx),
        getJourneys().writeObserver(ctx),
        portalContactDeleteObserver(ctx),
      ),
  });
  return data;
}

/**
 * Authenticates the portal session (per-session rate limit inside, ADR 0019a §2.5) and runs
 * a data operation. 401 clears the cookie; data failures keep their 404/422 body.
 */
export async function withPortalSession<T>(
  ctx: PortalRequestContext,
  work: (principal: PortalPrincipal) => Promise<PortalDataResult<T>>,
): Promise<Response> {
  const result = await getPortalAuth().authenticate(ctx.slug, ctx.token, { ip: ctx.ip });
  if (!result.ok) {
    return portalJson(
      { message: result.message },
      result.status,
      result.status === 401 ? { setCookie: clearedCookie() } : {},
    );
  }
  const outcome = await work(result.principal);
  if (!outcome.ok) return portalJson(outcome.body, outcome.status);
  return portalJson(outcome.data, outcome.status);
}

export function appUrl(): string {
  return parseEnv(process.env).APP_URL;
}

const MAX_BODY = 16 * 1024;

export interface PortalRequestContext {
  request: Request;
  slug: string;
  appUrl: string;
  ip: string;
  /** The portal cookie value, if any. */
  token: string | null;
  /** Parsed JSON body (non-GET only). */
  body: Record<string, unknown>;
}

export function portalJson(
  body: unknown,
  status = 200,
  extra: { setCookie?: string } = {},
): Response {
  const headers = new Headers(PORTAL_RESPONSE_HEADERS);
  if (extra.setCookie) headers.append("Set-Cookie", extra.setCookie);
  if (status === 204) return new Response(null, { status, headers });
  return Response.json(body, { status, headers });
}

export function sessionCookie(token: string): string {
  return serializePortalCookie(appUrl(), token);
}

export function clearedCookie(): string {
  return clearPortalCookie(appUrl());
}

/**
 * Wraps a portal route: production refuses plain http, CSRF (Origin + JSON) on every
 * non-GET request, fixed security headers, no member authority (ADR 0019a §1.4, §1.7).
 */
export function portalHandler(
  handler: (ctx: PortalRequestContext) => Promise<Response>,
): (request: Request, context: { params: Promise<{ slug: string }> }) => Promise<Response> {
  return async (request, context) => {
    try {
      const base = appUrl();
      if (process.env.NODE_ENV === "production" && !isSecureAppUrl(base)) {
        return portalJson({ message: "Portal unavailable." }, 503);
      }
      const csrf = checkPortalCsrf(request, base);
      if (csrf) return portalJson({ message: csrf.message }, csrf.status);
      const { slug } = await context.params;
      let body: Record<string, unknown> = {};
      const method = request.method.toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        const raw = await request.text();
        if (raw.length > MAX_BODY) return portalJson({ message: "Request too large." }, 413);
        if (raw.trim() !== "") {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
              return portalJson({ message: "Invalid request body." }, 400);
            }
            body = parsed as Record<string, unknown>;
          } catch {
            return portalJson({ message: "Invalid request body." }, 400);
          }
        }
      }
      return await handler({
        request,
        slug,
        appUrl: base,
        ip: getClientIp(request),
        token: readPortalCookie(request.headers, base),
        body,
      });
    } catch (error) {
      console.error("Unexpected portal error", error);
      return portalJson({ message: "Something went wrong." }, 500);
    }
  };
}

/** Tokens travel only in the JSON body; a token in the query string is refused (§2.2). */
export function hasQueryToken(request: Request): boolean {
  const params = new URL(request.url).searchParams;
  return params.has("t") || params.has("token");
}
