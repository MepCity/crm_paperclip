import { schema } from "@crm/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "../database";
import { type Env, parseEnv } from "../env";
import { UnauthenticatedError } from "../errors";
import { readBoundedBody } from "../http/body";
import { isProxyTrusted } from "../http/client-ip";
import { DEV_ADMIN_EMAIL, isDevLoginEnabled } from "./dev-login";
import { checkAuthThrottle } from "./throttle";

export type SessionUser = { id: string; email: string; name: string };
export type Session = { user: SessionUser; sessionId: string; expiresAt: Date };

export function secureCookies(appUrl: string): boolean {
  return new URL(appUrl).protocol === "https:";
}

const CLIENT_IP_HEADER = "x-crm-client-ip";
const MAX_AUTH_BODY = 8 * 1024;

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
      // The client IP is injected by handleAuthRequest from the trusted-proxy aware resolver;
      // a caller-supplied value is always overwritten or removed first.
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
    rateLimit: {
      // Per-IP limits need a trustworthy IP; without TRUST_PROXY every caller would share one
      // bucket. handleAuthRequest's own per-account throttle always applies.
      enabled: isProxyTrusted(process.env),
      storage: "memory",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
function getAuth() {
  auth ??= createAuth(parseEnv(process.env));
  return auth;
}

function isProductionRuntime(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === "production" && !env.E2E_PORT;
}

/**
 * Registration is invite-only in production (as in the reference CRM): an address may sign up
 * only while a pending invitation exists for it. `ALLOW_PUBLIC_SIGNUP=true` reopens it for a
 * deployment that bootstraps its first organisation. Local development and tests stay open.
 */
export async function isSignUpAllowed(email: string, env: NodeJS.ProcessEnv): Promise<boolean> {
  if (!isProductionRuntime(env)) return true;
  if (env.ALLOW_PUBLIC_SIGNUP?.trim().toLowerCase() === "true") return true;
  const [row] = await getDb()
    .select({ id: schema.invitations.id })
    .from(schema.invitations)
    .where(
      and(
        sql`lower(${schema.invitations.email}) = ${email}`,
        isNull(schema.invitations.acceptedAt),
        isNull(schema.invitations.revokedAt),
        gt(schema.invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

let reservedGuard: Promise<void> | undefined;
/**
 * Outside the dev gate the reserved development account must not be able to sign in even if a
 * local database was deployed: its credentials and sessions are removed once per process.
 */
export function guardReservedDevAccount(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (isDevLoginEnabled(env)) return Promise.resolve();
  reservedGuard ??= (async () => {
    try {
      const db = getDb();
      const [user] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, DEV_ADMIN_EMAIL));
      if (!user) return;
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
      await db.delete(schema.accounts).where(eq(schema.accounts.userId, user.id));
      console.error("auth: removed the reserved development account credentials");
    } catch (error) {
      reservedGuard = undefined;
      console.error("auth: reserved account guard failed", error);
    }
  })();
  return reservedGuard;
}

export function resetReservedGuardForTests(): void {
  reservedGuard = undefined;
}

const INVALID_LOGIN = {
  code: "INVALID_EMAIL_OR_PASSWORD",
  message: "Invalid email or password.",
};

export async function handleAuthRequest(request: Request): Promise<Response> {
  const env = process.env;
  const appOrigin = new URL(parseEnv(env).APP_URL).origin;
  const origin = request.headers.get("origin");
  if (request.method !== "GET" && request.method !== "HEAD" && origin && origin !== appOrigin) {
    return Response.json({ message: "Invalid request origin." }, { status: 403 });
  }
  await guardReservedDevAccount(env);

  // Never trust a caller-supplied value for the header the library reads the client IP from.
  const headers = new Headers(request.headers);
  headers.delete(CLIENT_IP_HEADER);
  const trusted = isProxyTrusted(env);
  let clientIp: string | null = null;
  if (trusted) {
    const forwarded = headers.get("x-forwarded-for");
    const last = forwarded
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    clientIp = last ?? headers.get("x-real-ip")?.trim() ?? null;
    if (clientIp) headers.set(CLIENT_IP_HEADER, clientIp);
  }

  const path = new URL(request.url).pathname;
  const isCredentialPost =
    request.method === "POST" &&
    (path.endsWith("/sign-up/email") || path.endsWith("/sign-in/email"));
  if (request.method !== "GET" && request.method !== "HEAD") {
    const type = headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    if (
      (isCredentialPost && type !== "application/json") ||
      (type && type !== "application/json")
    ) {
      return Response.json({ message: "Unsupported content type." }, { status: 415 });
    }
  }

  if (isCredentialPost) {
    const raw = await readBoundedBody(request, MAX_AUTH_BODY);
    if (raw === null) return Response.json({ message: "Request too large." }, { status: 413 });
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("shape");
      body = parsed as Record<string, unknown>;
    } catch {
      return Response.json({ message: "Invalid request body." }, { status: 400 });
    }
    if (typeof body.email === "string") body.email = body.email.trim().toLowerCase();
    const email = typeof body.email === "string" ? body.email : "";
    const signIn = path.endsWith("/sign-in/email");
    const devLogin = isDevLoginEnabled(env);
    if (signIn && devLogin && email === "admin") body.email = DEV_ADMIN_EMAIL;
    // Check the value the library will actually use, for both sign-in and sign-up.
    if (!devLogin && body.email === DEV_ADMIN_EMAIL) {
      return signIn
        ? Response.json(INVALID_LOGIN, { status: 401 })
        : Response.json({ message: "Registration is not available." }, { status: 403 });
    }
    if (!checkAuthThrottle(signIn ? "sign-in" : "sign-up", clientIp, email)) {
      return Response.json(
        { message: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    if (!signIn && !(await isSignUpAllowed(email, env))) {
      return Response.json({ message: "Registration is by invitation only." }, { status: 403 });
    }
    request = new Request(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify(body),
    });
  } else if (trusted || headers.has(CLIENT_IP_HEADER) !== request.headers.has(CLIENT_IP_HEADER)) {
    request = new Request(request, { headers });
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
