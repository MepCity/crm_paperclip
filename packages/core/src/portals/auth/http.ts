/**
 * Portal cookie, CSRF and response headers (ADR 0019a §1.4, §1.7). Framework-free so the
 * web routes and tests share one implementation.
 */

export const SECURE_COOKIE_NAME = "__Host-portal";
export const PLAIN_COOKIE_NAME = "portal_session";

export function isSecureAppUrl(appUrl: string): boolean {
  return new URL(appUrl).protocol === "https:";
}

export function portalCookieName(appUrl: string): string {
  return isSecureAppUrl(appUrl) ? SECURE_COOKIE_NAME : PLAIN_COOKIE_NAME;
}

/** `__Host-` requires `Secure; Path=/` and no `Domain` (ADR 0019a §1.4). */
export function serializePortalCookie(
  appUrl: string,
  token: string,
  maxAgeSeconds = 12 * 60 * 60,
): string {
  const secure = isSecureAppUrl(appUrl);
  return [
    `${portalCookieName(appUrl)}=${token}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearPortalCookie(appUrl: string): string {
  return serializePortalCookie(appUrl, "", 0);
}

/** Reads only the portal cookie; member cookies are ignored (ADR 0019a §1.6). */
export function readPortalCookie(headers: Headers, appUrl: string): string | null {
  const raw = headers.get("cookie");
  if (!raw) return null;
  const name = portalCookieName(appUrl);
  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      const value = part.slice(index + 1).trim();
      return value === "" ? null : value;
    }
  }
  return null;
}

export type CsrfFailure = { status: 403 | 415; message: string };

/**
 * Every non-GET/HEAD portal request needs `Origin` equal to the app origin (missing or
 * foreign → 403) and an `application/json` body (else 415).
 */
export function checkPortalCsrf(request: Request, appUrl: string): CsrfFailure | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return null;
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(appUrl).origin) {
    return { status: 403, message: "Invalid request origin." };
  }
  const type = (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") {
    return { status: 415, message: "Content type must be application/json." };
  }
  return null;
}

export const PORTAL_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
