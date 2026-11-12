import { schema } from "@crm/db";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "../../database";
import { systemOrgContext, withOrg } from "../../tenancy";
import type { Transaction } from "../../tenancy/types";
import { computeClientHash } from "../../webforms/tokens";
import { fixtureContactReader, type PortalContactReader } from "../contacts";
import { buildPortalMail, type PortalMailer, portalLink } from "../mail";
import {
  checkPasswordPolicy,
  dummyVerify,
  hashPortalPassword,
  PASSWORD_MESSAGES,
  type PasswordProblem,
  verifyPortalPassword,
} from "./password";
import { hitPortalLimit, LOCK_MS } from "./rate-limit";
import { createOpaqueToken, hashPortalSlug, hashToken, isTokenShape } from "./tokens";

/** ADR 0019a §1.5 lifetimes. */
export const SESSION_IDLE_MS = 2 * 60 * 60_000;
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60_000;
export const SESSION_TOUCH_MS = 5 * 60_000;
export const MAX_LIVE_SESSIONS = 5;
export const INVITE_TTL_MS = 7 * 24 * 60 * 60_000;
export const RESET_TTL_MS = 60 * 60_000;

/** One message for every login failure (ADR 0019a §2.5). */
export const LOGIN_FAILED_MESSAGE = "Invalid email or password.";
export const LINK_INVALID_MESSAGE = "This link is no longer valid.";
export const RESET_ACCEPTED_MESSAGE =
  "If an account exists for this email, we have sent a link to reset the password.";

export type PortalAuthEventKind =
  | "login_succeeded"
  | "login_failed"
  | "locked"
  | "invitation_accepted"
  | "reset_requested"
  | "reset_completed"
  | "logout"
  | "invited"
  | "disabled"
  | "enabled";

export interface PortalRequestMeta {
  ip: string;
  now?: Date;
}

export interface ResolvedPortal {
  orgId: string;
  portalId: string;
}

export interface PortalPrincipal {
  orgId: string;
  portalId: string;
  sessionId: string;
  identityId: string;
  userTypeId: string;
  email: string;
  displayName: string;
  recordModule: "Contacts";
  recordId: string;
}

export type PortalAuthFailure =
  | { ok: false; status: 401; message: string }
  | { ok: false; status: 403; message: string }
  | { ok: false; status: 404; message: string }
  | { ok: false; status: 410; message: string }
  | { ok: false; status: 422; message: string; problem: PasswordProblem }
  | { ok: false; status: 429; message: string };

export type PortalSessionIssued = { ok: true; token: string; principal: PortalPrincipal };

const NOT_FOUND = { ok: false, status: 404, message: "Portal not found." } as const;
const UNAUTHORIZED = { ok: false, status: 401, message: "Sign in to continue." } as const;
const LOGIN_FAILED = { ok: false, status: 401, message: LOGIN_FAILED_MESSAGE } as const;
const LINK_INVALID = { ok: false, status: 410, message: LINK_INVALID_MESSAGE } as const;
const TOO_MANY = {
  ok: false,
  status: 429,
  message: "Too many requests. Try again later.",
} as const;

const SLUG_SHAPE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export interface PortalAuthDeps {
  contacts?: PortalContactReader;
  mailer?: PortalMailer;
  appUrl?: string;
}

/**
 * Resolves a portal slug through the auth-boundary table before any CRM context exists
 * (ADR 0019a §1.2). No organisation id is ever taken from the client.
 */
export async function resolvePortalSlug(slug: string): Promise<ResolvedPortal | null> {
  if (typeof slug !== "string" || !SLUG_SHAPE.test(slug)) return null;
  const [row] = await getDb()
    .select({
      orgId: schema.publicEndpointKeys.organizationId,
      portalId: schema.publicEndpointKeys.targetId,
    })
    .from(schema.publicEndpointKeys)
    .where(
      and(
        eq(schema.publicEndpointKeys.keyHash, hashPortalSlug(slug)),
        eq(schema.publicEndpointKeys.kind, "portal"),
        isNull(schema.publicEndpointKeys.revokedAt),
      ),
    );
  return row ?? null;
}

type PortalRow = typeof schema.portals.$inferSelect;
type IdentityRow = typeof schema.portalIdentities.$inferSelect;

async function activePortal(tx: Transaction, resolved: ResolvedPortal): Promise<PortalRow | null> {
  const [portal] = await tx
    .select()
    .from(schema.portals)
    .where(
      and(
        eq(schema.portals.organizationId, resolved.orgId),
        eq(schema.portals.id, resolved.portalId),
      ),
    );
  return portal && portal.status === "active" ? portal : null;
}

export async function recordPortalEvent(
  tx: Transaction,
  input: {
    orgId: string;
    portalId: string;
    identityId: string | null;
    kind: PortalAuthEventKind;
    clientHash?: string;
    at: Date;
  },
): Promise<void> {
  // No raw IP, password or token is ever written here (ADR 0019a §2.5).
  await tx.insert(schema.portalAuthEvents).values({
    organizationId: input.orgId,
    portalId: input.portalId,
    identityId: input.identityId,
    kind: input.kind,
    clientHash: input.clientHash ?? "",
    at: input.at,
  });
}

/** Revokes every live session of the given identities in the caller's transaction. */
export async function revokeIdentitySessions(
  tx: Transaction,
  orgId: string,
  identityIds: readonly string[],
  at: Date,
): Promise<number> {
  if (identityIds.length === 0) return 0;
  const result = await tx
    .update(schema.portalSessions)
    .set({ revokedAt: at })
    .where(
      and(
        eq(schema.portalSessions.organizationId, orgId),
        inArray(schema.portalSessions.identityId, [...identityIds]),
        isNull(schema.portalSessions.revokedAt),
      ),
    );
  return result.rowCount ?? 0;
}

function principalOf(identity: IdentityRow, sessionId: string): PortalPrincipal {
  return {
    orgId: identity.organizationId,
    portalId: identity.portalId,
    sessionId,
    identityId: identity.id,
    userTypeId: identity.userTypeId,
    email: identity.email,
    displayName: identity.displayName,
    recordModule: "Contacts",
    recordId: identity.recordId,
  };
}

/** Issues a session; at most MAX_LIVE_SESSIONS stay live, the oldest are revoked. */
async function issueSession(
  tx: Transaction,
  identity: IdentityRow,
  clientHash: string,
  now: Date,
): Promise<PortalSessionIssued> {
  const live = await tx
    .select({ id: schema.portalSessions.id })
    .from(schema.portalSessions)
    .where(
      and(
        eq(schema.portalSessions.organizationId, identity.organizationId),
        eq(schema.portalSessions.identityId, identity.id),
        isNull(schema.portalSessions.revokedAt),
        gt(schema.portalSessions.expiresAt, now),
      ),
    )
    .orderBy(asc(schema.portalSessions.createdAt), asc(schema.portalSessions.id));
  const excess = live.length - (MAX_LIVE_SESSIONS - 1);
  if (excess > 0) {
    await tx
      .update(schema.portalSessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(schema.portalSessions.organizationId, identity.organizationId),
          inArray(
            schema.portalSessions.id,
            live.slice(0, excess).map((s) => s.id),
          ),
        ),
      );
  }
  const { token, hash } = createOpaqueToken();
  const [session] = await tx
    .insert(schema.portalSessions)
    .values({
      organizationId: identity.organizationId,
      identityId: identity.id,
      tokenHash: hash,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
      clientHash,
    })
    .returning({ id: schema.portalSessions.id });
  if (!session) throw new Error("Portal session insert failed");
  return { ok: true, token, principal: principalOf(identity, session.id) };
}

async function revokeByToken(tx: Transaction, orgId: string, token: string | null, at: Date) {
  if (!isTokenShape(token)) return;
  await tx
    .update(schema.portalSessions)
    .set({ revokedAt: at })
    .where(
      and(
        eq(schema.portalSessions.organizationId, orgId),
        eq(schema.portalSessions.tokenHash, hashToken(token)),
        isNull(schema.portalSessions.revokedAt),
      ),
    );
}

async function userTypeExists(tx: Transaction, orgId: string, id: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: schema.portalUserTypes.id })
    .from(schema.portalUserTypes)
    .where(
      and(eq(schema.portalUserTypes.organizationId, orgId), eq(schema.portalUserTypes.id, id)),
    );
  return Boolean(row);
}

export function createPortalAuthService(deps: PortalAuthDeps = {}) {
  const contacts = deps.contacts ?? fixtureContactReader;

  async function contactAlive(orgId: string, contactId: string): Promise<boolean> {
    return (await contacts(orgId, contactId)) !== null;
  }

  const service = {
    resolvePortalSlug,

    /** ADR 0019a §2.5: identical failures, dummy verify, lockout, limits, audit. */
    async login(
      slug: string,
      input: { email: unknown; password: unknown },
      meta: PortalRequestMeta & { previousToken?: string | null },
    ): Promise<PortalSessionIssued | PortalAuthFailure> {
      const resolved = await resolvePortalSlug(slug);
      if (!resolved) return NOT_FOUND;
      const now = meta.now ?? new Date();
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const password = typeof input.password === "string" ? input.password : "";
      const clientHash = computeClientHash(meta.ip);
      return withOrg(systemOrgContext(resolved.orgId), async (tx) => {
        const portal = await activePortal(tx, resolved);
        if (!portal) return NOT_FOUND;
        const orgId = resolved.orgId;
        if (!(await hitPortalLimit(tx, orgId, "loginClient", clientHash, now)).allowed)
          return TOO_MANY;
        if (!(await hitPortalLimit(tx, orgId, "loginOrg", portal.id, now)).allowed) return TOO_MANY;

        const [identity] =
          email && email.length <= 254
            ? await tx
                .select()
                .from(schema.portalIdentities)
                .where(
                  and(
                    eq(schema.portalIdentities.organizationId, orgId),
                    eq(schema.portalIdentities.portalId, portal.id),
                    eq(schema.portalIdentities.email, email),
                  ),
                )
                .for("update")
            : [];
        const fail = async (identityId: string | null) => {
          await recordPortalEvent(tx, {
            orgId,
            portalId: portal.id,
            identityId,
            kind: "login_failed",
            clientHash,
            at: now,
          });
          return LOGIN_FAILED;
        };
        if (!identity?.passwordHash) {
          await dummyVerify(password);
          return fail(identity?.id ?? null);
        }
        // Verify runs in every remaining branch so timing does not reveal the reason.
        const verified = await verifyPortalPassword(identity.passwordHash, password);
        if (identity.lockedUntil && identity.lockedUntil > now) return fail(identity.id);
        if (identity.status !== "active") return fail(identity.id);
        if (!verified) {
          const hit = await hitPortalLimit(tx, orgId, "loginIdentityFailures", identity.id, now);
          if (hit.count >= 5) {
            await tx
              .update(schema.portalIdentities)
              .set({ lockedUntil: new Date(now.getTime() + LOCK_MS) })
              .where(
                and(
                  eq(schema.portalIdentities.organizationId, orgId),
                  eq(schema.portalIdentities.id, identity.id),
                ),
              );
            if (hit.count === 5) {
              await recordPortalEvent(tx, {
                orgId,
                portalId: portal.id,
                identityId: identity.id,
                kind: "locked",
                clientHash,
                at: now,
              });
            }
          }
          return fail(identity.id);
        }
        if (
          !(await userTypeExists(tx, orgId, identity.userTypeId)) ||
          !(await contactAlive(orgId, identity.recordId))
        ) {
          return fail(identity.id);
        }
        // Rotation: the session the browser held before login is revoked (ADR 0019a §1.5).
        await revokeByToken(tx, orgId, meta.previousToken ?? null, now);
        await tx
          .update(schema.portalIdentities)
          .set({ lastLoginAt: now })
          .where(
            and(
              eq(schema.portalIdentities.organizationId, orgId),
              eq(schema.portalIdentities.id, identity.id),
            ),
          );
        await recordPortalEvent(tx, {
          orgId,
          portalId: portal.id,
          identityId: identity.id,
          kind: "login_succeeded",
          clientHash,
          at: now,
        });
        return issueSession(tx, identity, clientHash, now);
      });
    },

    /**
     * Validates the cookie token (ADR 0019a §1.3). Every failure is a 401; a session that
     * fails for a state reason (identity, user type, Contact, portal) is revoked.
     */
    async authenticate(
      slug: string,
      token: string | null,
      meta: PortalRequestMeta,
    ): Promise<{ ok: true; principal: PortalPrincipal } | PortalAuthFailure> {
      if (!isTokenShape(token)) return UNAUTHORIZED;
      const resolved = await resolvePortalSlug(slug);
      if (!resolved) return UNAUTHORIZED;
      const now = meta.now ?? new Date();
      return withOrg(systemOrgContext(resolved.orgId), async (tx) => {
        const orgId = resolved.orgId;
        const [session] = await tx
          .select()
          .from(schema.portalSessions)
          .where(
            and(
              eq(schema.portalSessions.organizationId, orgId),
              eq(schema.portalSessions.tokenHash, hashToken(token)),
            ),
          );
        if (!session || session.revokedAt) return UNAUTHORIZED;
        const revoke = async () => {
          await tx
            .update(schema.portalSessions)
            .set({ revokedAt: now })
            .where(
              and(
                eq(schema.portalSessions.organizationId, orgId),
                eq(schema.portalSessions.id, session.id),
              ),
            );
          return UNAUTHORIZED;
        };
        if (now >= session.expiresAt) return revoke();
        if (now.getTime() - session.lastSeenAt.getTime() >= SESSION_IDLE_MS) return revoke();
        const [identity] = await tx
          .select()
          .from(schema.portalIdentities)
          .where(
            and(
              eq(schema.portalIdentities.organizationId, orgId),
              eq(schema.portalIdentities.id, session.identityId),
            ),
          );
        if (identity?.status !== "active" || identity.portalId !== resolved.portalId)
          return revoke();
        if (!(await activePortal(tx, resolved))) return revoke();
        if (!(await userTypeExists(tx, orgId, identity.userTypeId))) return revoke();
        if (!(await contactAlive(orgId, identity.recordId))) return revoke();
        if (!(await hitPortalLimit(tx, orgId, "session", session.id, now)).allowed) return TOO_MANY;
        if (now.getTime() - session.lastSeenAt.getTime() >= SESSION_TOUCH_MS) {
          await tx
            .update(schema.portalSessions)
            .set({ lastSeenAt: now })
            .where(
              and(
                eq(schema.portalSessions.organizationId, orgId),
                eq(schema.portalSessions.id, session.id),
              ),
            );
        }
        return { ok: true, principal: principalOf(identity, session.id) };
      });
    },

    /** Revokes the presented session; always succeeds from the client's point of view. */
    async logout(slug: string, token: string | null, meta: PortalRequestMeta): Promise<void> {
      if (!isTokenShape(token)) return;
      const resolved = await resolvePortalSlug(slug);
      if (!resolved) return;
      const now = meta.now ?? new Date();
      await withOrg(systemOrgContext(resolved.orgId), async (tx) => {
        const [session] = await tx
          .update(schema.portalSessions)
          .set({ revokedAt: now })
          .where(
            and(
              eq(schema.portalSessions.organizationId, resolved.orgId),
              eq(schema.portalSessions.tokenHash, hashToken(token)),
              isNull(schema.portalSessions.revokedAt),
            ),
          )
          .returning({ identityId: schema.portalSessions.identityId });
        if (session) {
          await recordPortalEvent(tx, {
            orgId: resolved.orgId,
            portalId: resolved.portalId,
            identityId: session.identityId,
            kind: "logout",
            clientHash: computeClientHash(meta.ip),
            at: now,
          });
        }
      });
    },

    /** Invitation acceptance (ADR 0019a §2.3); single use under concurrency. */
    acceptInvitation(
      slug: string,
      input: { token: unknown; password: unknown },
      meta: PortalRequestMeta,
    ) {
      return consumeToken("invite", slug, input, meta);
    },

    /** Reset completion (ADR 0019a §2.4): revokes every session and issues a new one. */
    completeReset(
      slug: string,
      input: { token: unknown; password: unknown },
      meta: PortalRequestMeta,
    ) {
      return consumeToken("reset", slug, input, meta);
    },

    /**
     * Reset request (ADR 0019a §2.4): always the same 202 answer; only an `active` identity
     * within its per-email limit gets a mail. Only the per-client limit answers 429.
     */
    async requestReset(
      slug: string,
      input: { email: unknown },
      meta: PortalRequestMeta,
    ): Promise<{ ok: true; status: 202; message: string } | PortalAuthFailure> {
      const accepted = { ok: true, status: 202, message: RESET_ACCEPTED_MESSAGE } as const;
      const resolved = await resolvePortalSlug(slug);
      if (!resolved) return NOT_FOUND;
      const now = meta.now ?? new Date();
      const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
      const clientHash = computeClientHash(meta.ip);
      const sender = deps.mailer ? await deps.mailer.resolveSender(resolved.orgId) : null;
      const outcome = await withOrg(systemOrgContext(resolved.orgId), async (tx) => {
        const portal = await activePortal(tx, resolved);
        if (!portal) return NOT_FOUND;
        const orgId = resolved.orgId;
        if (!(await hitPortalLimit(tx, orgId, "resetClient", clientHash, now)).allowed)
          return TOO_MANY;
        if (!email || email.length > 254) return null;
        const emailKey = computeClientHash(`email:${email}`);
        if (!(await hitPortalLimit(tx, orgId, "resetEmail", emailKey, now)).allowed) return null;
        const [identity] = await tx
          .select()
          .from(schema.portalIdentities)
          .where(
            and(
              eq(schema.portalIdentities.organizationId, orgId),
              eq(schema.portalIdentities.portalId, portal.id),
              eq(schema.portalIdentities.email, email),
            ),
          );
        if (identity?.status !== "active" || !sender || !deps.mailer) return null;
        if (!(await contactAlive(orgId, identity.recordId))) return null;
        const issued = await issueToken(tx, identity, "reset", null, now);
        await recordPortalEvent(tx, {
          orgId,
          portalId: portal.id,
          identityId: identity.id,
          kind: "reset_requested",
          clientHash,
          at: now,
        });
        return { portal, identity, issued };
      });
      if (outcome && "status" in outcome) return outcome;
      if (outcome && deps.mailer && sender) {
        const mail = buildPortalMail({
          kind: "reset",
          portalName: outcome.portal.name,
          link: portalLink(appUrlOf(deps), outcome.portal.slug, "reset", outcome.issued.token),
          language: outcome.portal.defaultLanguage,
        });
        await deps.mailer.deliver(resolved.orgId, {
          idempotencyKey: outcome.issued.id,
          kind: "reset",
          from: sender,
          to: outcome.identity.email,
          ...mail,
        });
      }
      return accepted;
    },

    /** Password change with the current password; rotates every session (ADR 0019a §1.5). */
    async changePassword(
      slug: string,
      token: string | null,
      input: { currentPassword: unknown; newPassword: unknown },
      meta: PortalRequestMeta,
    ): Promise<PortalSessionIssued | PortalAuthFailure> {
      const auth = await service.authenticate(slug, token, meta);
      if (!auth.ok) return auth;
      const now = meta.now ?? new Date();
      const current = typeof input.currentPassword === "string" ? input.currentPassword : "";
      const next = typeof input.newPassword === "string" ? input.newPassword : "";
      const { orgId, identityId } = auth.principal;
      return withOrg(systemOrgContext(orgId), async (tx) => {
        const [identity] = await tx
          .select()
          .from(schema.portalIdentities)
          .where(
            and(
              eq(schema.portalIdentities.organizationId, orgId),
              eq(schema.portalIdentities.id, identityId),
            ),
          )
          .for("update");
        if (!identity?.passwordHash) return UNAUTHORIZED;
        if (!(await verifyPortalPassword(identity.passwordHash, current)))
          return { ok: false, status: 403, message: "The current password is incorrect." };
        const problem = checkPasswordPolicy(next, identity.email);
        if (problem)
          return { ok: false, status: 422, message: PASSWORD_MESSAGES[problem], problem };
        await tx
          .update(schema.portalIdentities)
          .set({ passwordHash: await hashPortalPassword(next), updatedAt: now })
          .where(
            and(
              eq(schema.portalIdentities.organizationId, orgId),
              eq(schema.portalIdentities.id, identityId),
            ),
          );
        await revokeIdentitySessions(tx, orgId, [identityId], now);
        return issueSession(tx, identity, computeClientHash(meta.ip), now);
      });
    },
  };
  return service;

  async function consumeToken(
    kind: "invite" | "reset",
    slug: string,
    input: { token: unknown; password: unknown },
    meta: PortalRequestMeta,
  ): Promise<PortalSessionIssued | PortalAuthFailure> {
    const resolved = await resolvePortalSlug(slug);
    if (!resolved) return NOT_FOUND;
    const now = meta.now ?? new Date();
    const clientHash = computeClientHash(meta.ip);
    const password = typeof input.password === "string" ? input.password : "";
    return withOrg(systemOrgContext(resolved.orgId), async (tx) => {
      const portal = await activePortal(tx, resolved);
      if (!portal) return NOT_FOUND;
      const orgId = resolved.orgId;
      if (!(await hitPortalLimit(tx, orgId, "tokenClient", clientHash, now)).allowed)
        return TOO_MANY;
      if (!isTokenShape(input.token)) return LINK_INVALID;
      const [row] = await tx
        .select()
        .from(schema.portalTokens)
        .where(
          and(
            eq(schema.portalTokens.organizationId, orgId),
            eq(schema.portalTokens.tokenHash, hashToken(input.token)),
          ),
        );
      if (!row || row.kind !== kind || row.usedAt || row.expiresAt <= now) return LINK_INVALID;
      const [identity] = await tx
        .select()
        .from(schema.portalIdentities)
        .where(
          and(
            eq(schema.portalIdentities.organizationId, orgId),
            eq(schema.portalIdentities.id, row.identityId),
          ),
        );
      const expected = kind === "invite" ? "invited" : "active";
      if (!identity || identity.status !== expected || identity.portalId !== portal.id)
        return LINK_INVALID;
      if (!(await contactAlive(orgId, identity.recordId))) return LINK_INVALID;
      const problem = checkPasswordPolicy(password, identity.email);
      if (problem) return { ok: false, status: 422, message: PASSWORD_MESSAGES[problem], problem };
      const passwordHash = await hashPortalPassword(password);
      // Single use: the row lock makes a concurrent second accept see `used_at` set.
      const used = await tx
        .update(schema.portalTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(schema.portalTokens.organizationId, orgId),
            eq(schema.portalTokens.id, row.id),
            isNull(schema.portalTokens.usedAt),
          ),
        )
        .returning({ id: schema.portalTokens.id });
      if (used.length !== 1) return LINK_INVALID;
      const [updated] = await tx
        .update(schema.portalIdentities)
        .set({ passwordHash, status: "active", lockedUntil: null, updatedAt: now })
        .where(
          and(
            eq(schema.portalIdentities.organizationId, orgId),
            eq(schema.portalIdentities.id, identity.id),
          ),
        )
        .returning();
      if (!updated) return LINK_INVALID;
      await revokeIdentitySessions(tx, orgId, [identity.id], now);
      await recordPortalEvent(tx, {
        orgId,
        portalId: portal.id,
        identityId: identity.id,
        kind: kind === "invite" ? "invitation_accepted" : "reset_completed",
        clientHash,
        at: now,
      });
      return issueSession(tx, updated, clientHash, now);
    });
  }
}

export type PortalAuthService = ReturnType<typeof createPortalAuthService>;

function appUrlOf(deps: PortalAuthDeps): string {
  return deps.appUrl ?? process.env.APP_URL ?? "http://127.0.0.1:3000";
}

/**
 * Issues an invite/reset token; older unused tokens of the same kind for the identity are
 * marked used (superseded, ADR 0019a §2.2).
 */
export async function issueToken(
  tx: Transaction,
  identity: { organizationId: string; id: string },
  kind: "invite" | "reset",
  createdBy: string | null,
  now: Date,
): Promise<{ id: string; token: string }> {
  await tx
    .update(schema.portalTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(schema.portalTokens.organizationId, identity.organizationId),
        eq(schema.portalTokens.identityId, identity.id),
        eq(schema.portalTokens.kind, kind),
        isNull(schema.portalTokens.usedAt),
      ),
    );
  const { token, hash } = createOpaqueToken();
  const [row] = await tx
    .insert(schema.portalTokens)
    .values({
      organizationId: identity.organizationId,
      identityId: identity.id,
      kind,
      tokenHash: hash,
      expiresAt: new Date(now.getTime() + (kind === "invite" ? INVITE_TTL_MS : RESET_TTL_MS)),
      createdBy,
      createdAt: now,
    })
    .returning({ id: schema.portalTokens.id });
  if (!row) throw new Error("Portal token insert failed");
  return { id: row.id, token };
}
