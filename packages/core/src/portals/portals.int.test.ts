import { randomBytes } from "node:crypto";
import { schema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { toClientPermissions } from "../access";
import { getAccessSnapshot } from "../access/context";
import { getDb } from "../database";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { InMemoryJobQueue } from "../jobs/memory";
import { createFixtureRecordService } from "../records/fixture";
import type { OrgContext } from "../tenancy/types";
import { addAccessTestMember, createTestOrganization } from "../testing";
import { computeClientHash } from "../webforms/tokens";
import * as passwords from "./auth/password";
import {
  createPortalAdminService,
  createPortalAuthService,
  createPortalMailJobCatalog,
  createQueuedPortalMailer,
  hashPortalSlug,
  hashToken,
  LOGIN_FAILED_MESSAGE,
  PORTAL_LIMITS,
  type PortalLimitName,
  portalContactDeleteObserver,
  RESET_ACCEPTED_MESSAGE,
} from "./index";

vi.mock("./auth/password", async (original) => {
  const actual = await original<typeof import("./auth/password")>();
  return { ...actual, dummyVerify: vi.fn(actual.dummyVerify) };
});

function statusOf(result: object): number {
  return "status" in result ? (result as { status: number }).status : 200;
}

const PASSWORD = "Long enough secret 42";
const OTHER = "Another fine secret 77";
const SENDER = { address: "portal-sender@example.test", name: "Portal" };

function ip(): string {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
}

async function setup(options: { sender?: boolean } = {}) {
  const { ctx } = await createTestOrganization();
  const queue = new InMemoryJobQueue(createPortalMailJobCatalog());
  const mailer = createQueuedPortalMailer({
    queue,
    resolveSender: async () => (options.sender === false ? null : SENDER),
  });
  const admin = createPortalAdminService({ mailer, appUrl: "https://crm.example.test" });
  const auth = createPortalAuthService({ mailer, appUrl: "https://crm.example.test" });
  const slug = `p-${randomBytes(5).toString("hex")}`;
  const portal = await admin.createPortal(ctx, { name: "Acme Portal", slug });
  const userType = await admin.createUserType(ctx, {
    name: "Customers",
    modules: { Contacts: { enabled: true, actions: { view: true } } },
  });
  return { ctx, queue, mailer, admin, auth, slug, portal, userType };
}

type Env = Awaited<ReturnType<typeof setup>>;

async function contact(ctx: OrgContext, email: string | null = null) {
  const record = await createFixtureRecordService(ctx, { system: true }).create("Contacts", {
    Last_Name: "Portal Person",
    ...(email === null ? {} : { Email: email }),
  });
  return record.id;
}

function lastToken(env: Env, kind: "accept" | "reset"): string {
  const mails = [...env.mailer.outbox.values()];
  const mail = mails[mails.length - 1];
  const match = mail?.text.match(new RegExp(`/portal/${env.slug}/${kind}#t=([A-Za-z0-9_-]{43})`));
  if (!match?.[1]) throw new Error("No token mailed");
  return match[1];
}

async function activeUser(env: Env, email = `u-${randomBytes(4).toString("hex")}@example.test`) {
  const contactId = await contact(env.ctx, email);
  const identity = await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
  const accepted = await env.auth.acceptInvitation(
    env.slug,
    { token: lastToken(env, "accept"), password: PASSWORD },
    { ip: ip() },
  );
  if (!accepted.ok) throw new Error(`accept failed ${accepted.status}`);
  return { contactId, identity, email, token: accepted.token };
}

async function sessionRow(orgId: string, token: string) {
  const [row] = await getDb()
    .select()
    .from(schema.portalSessions)
    .where(
      and(
        eq(schema.portalSessions.organizationId, orgId),
        eq(schema.portalSessions.tokenHash, hashToken(token)),
      ),
    );
  return row;
}

async function seedBucket(orgId: string, name: PortalLimitName, key: string, count: number) {
  const { windowMs } = PORTAL_LIMITS[name];
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  await getDb()
    .insert(schema.publicRateLimits)
    .values({ organizationId: orgId, bucket: `portal:${name}:${key}`, windowStart, count })
    .onConflictDoUpdate({
      target: [
        schema.publicRateLimits.organizationId,
        schema.publicRateLimits.bucket,
        schema.publicRateLimits.windowStart,
      ],
      set: { count },
    });
}

describe("portal admin service and permission key", () => {
  it("gates every admin call by admin.managePortals; Administrator has it, Standard does not", async () => {
    const { ctx } = await createTestOrganization();
    const standard = await addAccessTestMember(ctx, { profile: "standard" });
    expect(toClientPermissions(await getAccessSnapshot(ctx), ["Leads"]).admin.managePortals).toBe(
      true,
    );
    expect(
      toClientPermissions(await getAccessSnapshot(standard.ctx), ["Leads"]).admin.managePortals,
    ).toBe(false);
    const admin = createPortalAdminService({});
    await expect(admin.getPortal(standard.ctx)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      admin.createPortal(standard.ctx, { name: "X", slug: `x-${randomBytes(4).toString("hex")}` }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await admin.getPortal(ctx)).toBeNull();
  });

  it("stores the slug hashed in public_endpoint_keys with kind portal; slugs are unique", async () => {
    const env = await setup();
    const [key] = await getDb()
      .select()
      .from(schema.publicEndpointKeys)
      .where(eq(schema.publicEndpointKeys.keyHash, hashPortalSlug(env.slug)));
    expect(key).toMatchObject({
      kind: "portal",
      organizationId: env.ctx.orgId,
      targetId: env.portal.id,
    });
    expect(key?.keyHash).not.toContain(env.slug);
    const other = await createTestOrganization();
    await expect(
      env.admin.createPortal(other.ctx, { name: "Copy", slug: env.slug }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      env.admin.createPortal(env.ctx, { name: "Second", slug: `${env.slug}x` }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("validates the user-type matrix and keeps used user types", async () => {
    const env = await setup();
    await expect(
      env.admin.createUserType(env.ctx, {
        name: "Bad",
        modules: { Deals: { enabled: true, actions: { view: true, edit: true } } },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    const updated = await env.admin.updateUserType(env.ctx, env.userType.id, {
      modules: {
        Cases: { enabled: true, scope: "account", actions: { view: true, create: true } },
      },
    });
    expect(updated.modules.Cases?.scope).toBe("account");
    await activeUser(env);
    await expect(env.admin.deleteUserType(env.ctx, env.userType.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("invites from a Contact with an email only, once per Contact, and fails clearly without a sender", async () => {
    const env = await setup();
    const noEmail = await contact(env.ctx);
    await expect(
      env.admin.invite(env.ctx, { contactId: noEmail, userTypeId: env.userType.id }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      env.admin.invite(env.ctx, { contactId: "999999999", userTypeId: env.userType.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const contactId = await contact(env.ctx, "Mixed.Case@Example.test");
    const identity = await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
    expect(identity).toMatchObject({ status: "invited", email: "mixed.case@example.test" });
    await expect(
      env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id }),
    ).rejects.toBeInstanceOf(ConflictError);

    const silent = await setup({ sender: false });
    const c2 = await contact(silent.ctx, "nosender@example.test");
    await expect(
      silent.admin.invite(silent.ctx, { contactId: c2, userTypeId: silent.userType.id }),
    ).rejects.toThrow(/sender/i);
    expect(await silent.admin.listIdentities(silent.ctx)).toHaveLength(0);
  });

  it("mails a fragment link once per token (idempotency key = token id) with portal name only", async () => {
    const env = await setup();
    const contactId = await contact(env.ctx, "mail@example.test");
    const identity = await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
    const [token] = await getDb()
      .select()
      .from(schema.portalTokens)
      .where(
        and(
          eq(schema.portalTokens.organizationId, env.ctx.orgId),
          eq(schema.portalTokens.identityId, identity.id),
        ),
      );
    const mail = [...env.mailer.outbox.values()].at(-1);
    expect(mail?.idempotencyKey).toBe(token?.id);
    expect(mail?.to).toBe("mail@example.test");
    expect(mail?.text).toContain(`/portal/${env.slug}/accept#t=`);
    expect(mail?.text).not.toContain("Portal Person");
    const raw = lastToken(env, "accept");
    expect(token?.tokenHash).toBe(hashToken(raw));
    expect(JSON.stringify(token)).not.toContain(raw);
    const jobs = await env.queue.claim({ workerId: "t", limit: 10, leaseMs: 1000 });
    expect(jobs.map((j) => j.idempotencyKey)).toEqual([token?.id]);
  });
});

describe("portal tokens (invite / reset)", () => {
  it("accepts an invitation once, with the password policy, and issues a session", async () => {
    const env = await setup();
    const contactId = await contact(env.ctx, "accept@example.test");
    await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
    const token = lastToken(env, "accept");
    for (const [password, problem] of [
      ["short", "too_short"],
      ["accept@example.test", "equals_email"],
      ["password123", "too_common"],
      ["x".repeat(129), "too_long"],
    ] as const) {
      const r = await env.auth.acceptInvitation(env.slug, { token, password }, { ip: ip() });
      expect(r).toMatchObject({ ok: false, status: 422, problem });
    }
    const ok = await env.auth.acceptInvitation(
      env.slug,
      { token, password: PASSWORD },
      { ip: ip() },
    );
    expect(ok.ok).toBe(true);
    const again = await env.auth.acceptInvitation(
      env.slug,
      { token, password: PASSWORD },
      { ip: ip() },
    );
    expect(again).toMatchObject({ ok: false, status: 410 });
    const [identity] = await env.admin.listIdentities(env.ctx);
    expect(identity?.status).toBe("active");
  });

  it("rejects expired, superseded and wrong-kind tokens", async () => {
    const env = await setup();
    const contactId = await contact(env.ctx, "tokens@example.test");
    const identity = await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
    const first = lastToken(env, "accept");
    await env.admin.reinvite(env.ctx, identity.id);
    const second = lastToken(env, "accept");
    expect(second).not.toBe(first);
    expect(
      await env.auth.acceptInvitation(env.slug, { token: first, password: PASSWORD }, { ip: ip() }),
    ).toMatchObject({ status: 410 });
    const later = new Date(Date.now() + 8 * 24 * 60 * 60_000);
    expect(
      await env.auth.acceptInvitation(
        env.slug,
        { token: second, password: PASSWORD },
        { ip: ip(), now: later },
      ),
    ).toMatchObject({ status: 410 });
    // An invite token is not a reset token.
    expect(
      await env.auth.completeReset(env.slug, { token: second, password: PASSWORD }, { ip: ip() }),
    ).toMatchObject({ status: 410 });
    expect(
      await env.auth.acceptInvitation(
        env.slug,
        { token: second, password: PASSWORD },
        { ip: ip() },
      ),
    ).toMatchObject({ ok: true });
    // Reset tokens expire after one hour and are rejected on the accept route.
    await env.admin.sendReset(env.ctx, identity.id);
    const reset = lastToken(env, "reset");
    expect(
      await env.auth.acceptInvitation(env.slug, { token: reset, password: OTHER }, { ip: ip() }),
    ).toMatchObject({ status: 410 });
    expect(
      await env.auth.completeReset(
        env.slug,
        { token: reset, password: OTHER },
        { ip: ip(), now: new Date(Date.now() + 61 * 60_000) },
      ),
    ).toMatchObject({ status: 410 });
  });

  it("lets only one of two concurrent accepts succeed", async () => {
    const env = await setup();
    const contactId = await contact(env.ctx, "race@example.test");
    await env.admin.invite(env.ctx, { contactId, userTypeId: env.userType.id });
    const token = lastToken(env, "accept");
    const results = await Promise.all([
      env.auth.acceptInvitation(env.slug, { token, password: PASSWORD }, { ip: ip() }),
      env.auth.acceptInvitation(env.slug, { token, password: OTHER }, { ip: ip() }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.status === 410)).toHaveLength(1);
  });

  it("answers every reset request with the same 202 and mails active identities only", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const invitedContact = await contact(env.ctx, "invited@example.test");
    await env.admin.invite(env.ctx, { contactId: invitedContact, userTypeId: env.userType.id });
    const before = env.mailer.outbox.size;
    const unknown = await env.auth.requestReset(
      env.slug,
      { email: "nobody@example.test" },
      { ip: ip() },
    );
    const invited = await env.auth.requestReset(
      env.slug,
      { email: "invited@example.test" },
      { ip: ip() },
    );
    expect(unknown).toEqual({ ok: true, status: 202, message: RESET_ACCEPTED_MESSAGE });
    expect(invited).toEqual(unknown);
    expect(env.mailer.outbox.size).toBe(before);
    const active = await env.auth.requestReset(
      env.slug,
      { email: user.email.toUpperCase() },
      { ip: ip() },
    );
    expect(active).toEqual(unknown);
    expect(env.mailer.outbox.size).toBe(before + 1);
    // Completing the reset revokes every session and issues a new one (rotation).
    const done = await env.auth.completeReset(
      env.slug,
      { token: lastToken(env, "reset"), password: OTHER },
      { ip: ip() },
    );
    expect(done.ok).toBe(true);
    expect((await env.auth.authenticate(env.slug, user.token, { ip: ip() })).ok).toBe(false);
    if (done.ok)
      expect((await env.auth.authenticate(env.slug, done.token, { ip: ip() })).ok).toBe(true);
    expect(
      (await env.auth.login(env.slug, { email: user.email, password: OTHER }, { ip: ip() })).ok,
    ).toBe(true);
  });
});

describe("portal login, lockout and limits", () => {
  it("answers unknown/wrong/invited/disabled/locked identically and runs the dummy verify", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const disabled = await activeUser(env);
    await env.admin.disable(env.ctx, disabled.identity.id);
    const invitedContact = await contact(env.ctx, "inv2@example.test");
    await env.admin.invite(env.ctx, { contactId: invitedContact, userTypeId: env.userType.id });
    const dummy = vi.mocked(passwords.dummyVerify);
    dummy.mockClear();
    const unknown = await env.auth.login(
      env.slug,
      { email: "ghost@example.test", password: PASSWORD },
      { ip: ip() },
    );
    expect(dummy).toHaveBeenCalledTimes(1);
    const wrong = await env.auth.login(
      env.slug,
      { email: user.email, password: OTHER },
      { ip: ip() },
    );
    const invited = await env.auth.login(
      env.slug,
      { email: "inv2@example.test", password: PASSWORD },
      { ip: ip() },
    );
    const off = await env.auth.login(
      env.slug,
      { email: disabled.email, password: PASSWORD },
      { ip: ip() },
    );
    for (const r of [unknown, wrong, invited, off]) {
      expect(r).toEqual({ ok: false, status: 401, message: LOGIN_FAILED_MESSAGE });
    }
  });

  it("locks an identity for 15 minutes after 5 failures, even for the right password", async () => {
    const env = await setup();
    const user = await activeUser(env);
    for (let i = 0; i < 5; i++) {
      expect(
        await env.auth.login(env.slug, { email: user.email, password: OTHER }, { ip: ip() }),
      ).toMatchObject({ status: 401, message: LOGIN_FAILED_MESSAGE });
    }
    const locked = await env.auth.login(
      env.slug,
      { email: user.email, password: PASSWORD },
      { ip: ip() },
    );
    expect(locked).toEqual({ ok: false, status: 401, message: LOGIN_FAILED_MESSAGE });
    const events = await env.admin.listAuthEvents(env.ctx);
    expect(events.filter((e) => e.kind === "locked")).toHaveLength(1);
    const after = await env.auth.login(
      env.slug,
      { email: user.email, password: PASSWORD },
      { ip: ip(), now: new Date(Date.now() + 16 * 60_000) },
    );
    expect(after.ok).toBe(true);
  });

  it("returns 429 at every §2.5 threshold", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const orgId = env.ctx.orgId;
    // login per client hash: 20 / 15 min
    const client = ip();
    for (let i = 0; i < 20; i++) {
      expect(
        statusOf(
          await env.auth.login(
            env.slug,
            { email: "ghost@example.test", password: OTHER },
            { ip: client },
          ),
        ),
      ).toBe(401);
    }
    expect(
      statusOf(
        await env.auth.login(env.slug, { email: user.email, password: PASSWORD }, { ip: client }),
      ),
    ).toBe(429);
    // reset per client hash: 10 / h
    const resetClient = ip();
    for (let i = 0; i < 10; i++) {
      expect(
        statusOf(
          await env.auth.requestReset(
            env.slug,
            { email: `n${i}@example.test` },
            { ip: resetClient },
          ),
        ),
      ).toBe(202);
    }
    expect(
      statusOf(
        await env.auth.requestReset(env.slug, { email: "x@example.test" }, { ip: resetClient }),
      ),
    ).toBe(429);
    // reset per email: 3 / h → silently no mail, still 202
    const before = env.mailer.outbox.size;
    for (let i = 0; i < 4; i++) {
      expect(
        statusOf(await env.auth.requestReset(env.slug, { email: user.email }, { ip: ip() })),
      ).toBe(202);
    }
    expect(env.mailer.outbox.size).toBe(before + 3);
    // token submit per client hash: 10 / 15 min
    const tokenClient = ip();
    for (let i = 0; i < 10; i++) {
      expect(
        statusOf(
          await env.auth.acceptInvitation(
            env.slug,
            { token: "bad", password: PASSWORD },
            { ip: tokenClient },
          ),
        ),
      ).toBe(410);
    }
    expect(
      statusOf(
        await env.auth.acceptInvitation(
          env.slug,
          { token: "bad", password: PASSWORD },
          { ip: tokenClient },
        ),
      ),
    ).toBe(429);
    // authenticated API per session: 300 / min
    const session = await sessionRow(orgId, user.token);
    await seedBucket(orgId, "session", session?.id ?? "", 300);
    expect(statusOf(await env.auth.authenticate(env.slug, user.token, { ip: ip() }))).toBe(429);
    // login per organisation: 300 / h
    await seedBucket(orgId, "loginOrg", env.portal.id, 300);
    expect(
      statusOf(
        await env.auth.login(env.slug, { email: user.email, password: PASSWORD }, { ip: ip() }),
      ),
    ).toBe(429);
  });
});

describe("portal sessions", () => {
  it("stores only the token hash and rotates on login with a previous cookie", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const row = await sessionRow(env.ctx.orgId, user.token);
    expect(row?.tokenHash).toBe(hashToken(user.token));
    expect(JSON.stringify(row)).not.toContain(user.token);
    const again = await env.auth.login(
      env.slug,
      { email: user.email, password: PASSWORD },
      { ip: ip(), previousToken: user.token },
    );
    expect(again.ok).toBe(true);
    expect((await env.auth.authenticate(env.slug, user.token, { ip: ip() })).ok).toBe(false);
  });

  it("rotates every session on password change", async () => {
    const env = await setup();
    const user = await activeUser(env);
    expect(
      await env.auth.changePassword(
        env.slug,
        user.token,
        { currentPassword: OTHER, newPassword: "Brand new secret 9" },
        { ip: ip() },
      ),
    ).toMatchObject({ status: 403 });
    const changed = await env.auth.changePassword(
      env.slug,
      user.token,
      { currentPassword: PASSWORD, newPassword: "Brand new secret 9" },
      { ip: ip() },
    );
    expect(changed.ok).toBe(true);
    expect((await env.auth.authenticate(env.slug, user.token, { ip: ip() })).ok).toBe(false);
    if (changed.ok)
      expect((await env.auth.authenticate(env.slug, changed.token, { ip: ip() })).ok).toBe(true);
  });

  it("rejects another organisation's session, revoked, idle and absolute-expired sessions", async () => {
    const a = await setup();
    const b = await setup();
    const user = await activeUser(a);
    expect((await a.auth.authenticate(a.slug, user.token, { ip: ip() })).ok).toBe(true);
    expect(await b.auth.authenticate(b.slug, user.token, { ip: ip() })).toMatchObject({
      status: 401,
    });

    const idle = await a.auth.login(
      a.slug,
      { email: user.email, password: PASSWORD },
      { ip: ip() },
    );
    if (!idle.ok) throw new Error("login");
    expect(
      await a.auth.authenticate(a.slug, idle.token, {
        ip: ip(),
        now: new Date(Date.now() + 2 * 60 * 60_000 + 1000),
      }),
    ).toMatchObject({ status: 401 });

    const absolute = await a.auth.login(
      a.slug,
      { email: user.email, password: PASSWORD },
      { ip: ip() },
    );
    if (!absolute.ok) throw new Error("login");
    const late = new Date(Date.now() + 12 * 60 * 60_000 + 1000);
    await getDb()
      .update(schema.portalSessions)
      .set({ lastSeenAt: new Date(late.getTime() - 60_000) })
      .where(eq(schema.portalSessions.tokenHash, hashToken(absolute.token)));
    expect(
      await a.auth.authenticate(a.slug, absolute.token, { ip: ip(), now: late }),
    ).toMatchObject({
      status: 401,
    });

    await a.auth.logout(a.slug, user.token, { ip: ip() });
    expect(await a.auth.authenticate(a.slug, user.token, { ip: ip() })).toMatchObject({
      status: 401,
    });
  });

  it("keeps at most 5 live sessions; the oldest is revoked on the 6th login", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const tokens = [user.token];
    for (let i = 0; i < 5; i++) {
      const r = await env.auth.login(
        env.slug,
        { email: user.email, password: PASSWORD },
        { ip: ip() },
      );
      if (!r.ok) throw new Error("login");
      tokens.push(r.token);
    }
    const live = await Promise.all(
      tokens.map(async (t) => (await env.auth.authenticate(env.slug, t, { ip: ip() })).ok),
    );
    expect(live).toEqual([false, true, true, true, true, true]);
  });

  it("revokes sessions in the same transaction as disable / user-type change / Contact trash / portal delete", async () => {
    const env = await setup();
    const isRevoked = async (token: string) =>
      (await sessionRow(env.ctx.orgId, token))?.revokedAt != null;

    const disabled = await activeUser(env);
    await env.admin.disable(env.ctx, disabled.identity.id);
    expect(await isRevoked(disabled.token)).toBe(true);
    expect(statusOf(await env.auth.authenticate(env.slug, disabled.token, { ip: ip() }))).toBe(401);

    const moved = await activeUser(env);
    const second = await env.admin.createUserType(env.ctx, { name: "Partners", modules: {} });
    await env.admin.changeUserType(env.ctx, moved.identity.id, { userTypeId: second.id });
    expect(await isRevoked(moved.token)).toBe(true);
    expect(statusOf(await env.auth.authenticate(env.slug, moved.token, { ip: ip() }))).toBe(401);

    const trashed = await activeUser(env);
    await createFixtureRecordService(env.ctx, {
      system: true,
      writeObserver: portalContactDeleteObserver(env.ctx),
    }).delete("Contacts", [trashed.contactId]);
    expect(await isRevoked(trashed.token)).toBe(true);
    expect(statusOf(await env.auth.authenticate(env.slug, trashed.token, { ip: ip() }))).toBe(401);
    // A trashed Contact cannot sign in either.
    expect(
      await env.auth.login(env.slug, { email: trashed.email, password: PASSWORD }, { ip: ip() }),
    ).toEqual({ ok: false, status: 401, message: LOGIN_FAILED_MESSAGE });

    const last = await activeUser(env);
    await env.admin.updatePortal(env.ctx, { status: "disabled" });
    expect(await isRevoked(last.token)).toBe(true);
    await env.admin.updatePortal(env.ctx, { status: "active" });
    const fresh = await env.auth.login(
      env.slug,
      { email: last.email, password: PASSWORD },
      { ip: ip() },
    );
    if (!fresh.ok) throw new Error("login");
    await env.admin.deletePortal(env.ctx);
    expect(await sessionRow(env.ctx.orgId, fresh.token)).toBeUndefined();
    expect(statusOf(await env.auth.authenticate(env.slug, fresh.token, { ip: ip() }))).toBe(401);
  });
});

describe("portal GET has no side effects beyond the §1.5 session touch", () => {
  it("authenticate writes no event, token, session or identity change", async () => {
    const env = await setup();
    const user = await activeUser(env);
    const count = async (table: string) =>
      Number(
        (
          await getDb().execute(
            sql`select count(*)::int as n from ${sql.raw(table)} where organization_id = ${env.ctx.orgId}`,
          )
        ).rows[0]?.n,
      );
    const before = await Promise.all(
      ["portal_auth_events", "portal_tokens", "portal_sessions"].map(count),
    );
    const identityBefore = await env.admin.listIdentities(env.ctx);
    for (let i = 0; i < 3; i++) {
      expect((await env.auth.authenticate(env.slug, user.token, { ip: ip() })).ok).toBe(true);
    }
    expect(
      await Promise.all(["portal_auth_events", "portal_tokens", "portal_sessions"].map(count)),
    ).toEqual(before);
    expect(await env.admin.listIdentities(env.ctx)).toEqual(identityBefore);
  });
});

describe("portal audit", () => {
  it("writes auth events without IP, password or token", async () => {
    const env = await setup();
    const clientIp = "203.0.113.77";
    const user = await activeUser(env);
    await env.auth.login(env.slug, { email: user.email, password: OTHER }, { ip: clientIp });
    const ok = await env.auth.login(
      env.slug,
      { email: user.email, password: PASSWORD },
      { ip: clientIp },
    );
    await env.auth.requestReset(env.slug, { email: user.email }, { ip: clientIp });
    const rows = await getDb().execute(
      sql`select * from portal_auth_events where organization_id = ${env.ctx.orgId}`,
    );
    const dump = JSON.stringify(rows.rows);
    expect(rows.rows.length).toBeGreaterThanOrEqual(4);
    expect(dump).not.toContain(clientIp);
    expect(dump).not.toContain(PASSWORD);
    expect(dump).not.toContain(OTHER);
    expect(dump).not.toContain(user.token);
    if (ok.ok) expect(dump).not.toContain(ok.token);
    expect(dump).toContain(computeClientHash(clientIp));
    const kinds = new Set((await env.admin.listAuthEvents(env.ctx)).map((e) => e.kind));
    for (const k of [
      "invited",
      "invitation_accepted",
      "login_failed",
      "login_succeeded",
      "reset_requested",
    ]) {
      expect(kinds.has(k)).toBe(true);
    }
  });
});
