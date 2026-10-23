export interface HttpRequest {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string;
}
export interface HttpResponse {
  status: number;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  body: string;
}
/** Injected transport; tests pass a fake, production wires `fetch` outside core. */
export type HttpTransport = (request: HttpRequest) => Promise<HttpResponse>;

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  syncWindowDays: number;
}

/**
 * Env names: GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET,
 * GMAIL_OAUTH_SCOPES (space separated). Values are never committed.
 */
export function readGmailConfig(env: Record<string, string | undefined>): GmailConfig {
  const clientId = env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = env.GMAIL_OAUTH_CLIENT_SECRET;
  const scopes = (env.GMAIL_OAUTH_SCOPES ?? "").split(/\s+/).filter(Boolean);
  if (!clientId || !clientSecret || scopes.length === 0) {
    throw new Error("Gmail connector is not configured.");
  }
  return { clientId, clientSecret, scopes, syncWindowDays: 30 };
}
