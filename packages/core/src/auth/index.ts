import { schema } from "@crm/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../database";
import { type Env, parseEnv } from "../env";
import { UnauthenticatedError } from "../errors";

export type SessionUser = { id: string; email: string; name: string };
export type Session = { user: SessionUser; sessionId: string; expiresAt: Date };

export function secureCookies(appUrl: string): boolean {
  return new URL(appUrl).protocol === "https:";
}

export function createAuth(env: Env) {
  return betterAuth({
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    secret: env.APP_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    trustedOrigins: [new URL(env.APP_URL).origin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    user: { modelName: "users" },
    session: { modelName: "sessions", cookieCache: { enabled: false } },
    account: { modelName: "accounts" },
    verification: { modelName: "verifications" },
    advanced: {
      useSecureCookies: secureCookies(env.APP_URL),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookies(env.APP_URL),
      },
      database: { generateId: false },
      disableCSRFCheck: false,
      disableOriginCheck: false,
    },
    rateLimit: { enabled: false },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
function getAuth() {
  auth ??= createAuth(parseEnv(process.env));
  return auth;
}

export async function handleAuthRequest(request: Request): Promise<Response> {
  const appOrigin = new URL(parseEnv(process.env).APP_URL).origin;
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && request.method !== "HEAD" && origin && origin !== appOrigin) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }
  const path = new URL(request.url).pathname;
  if (
    request.method === "POST" &&
    (path.endsWith("/sign-up/email") || path.endsWith("/sign-in/email"))
  ) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
      request = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });
    } catch {
      return Response.json({ message: "Invalid request body." }, { status: 400 });
    }
  }
  return getAuth().handler(request);
}

export async function getSession(headers: Headers): Promise<Session | null> {
  const result = await getAuth().api.getSession({ headers });
  if (!result) return null;
  return {
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
    sessionId: result.session.id,
    expiresAt: new Date(result.session.expiresAt),
  };
}

export async function requireUser(headers: Headers): Promise<SessionUser> {
  const session = await getSession(headers);
  if (!session) throw new UnauthenticatedError();
  return session.user;
}
