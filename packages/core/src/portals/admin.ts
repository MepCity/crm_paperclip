import { schema } from "@crm/db";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getAccessSnapshot } from "../access/context";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  parseInput,
  ValidationError,
} from "../errors";
import type { RecordWriteObserver } from "../records/write-observer";
import { systemOrgContext, withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { issueToken, recordPortalEvent, revokeIdentitySessions } from "./auth/service";
import { hashPortalSlug } from "./auth/tokens";
import { fixtureContactReader, type PortalContactReader } from "./contacts";
import { buildPortalMail, type PortalMailer, portalLink, senderMissingError } from "./mail";
import {
  type PortalModules,
  type PortalUserTypeSettings,
  portalUserTypeSettingsSchema,
  validatePortalModules,
} from "./matrix";

export interface Portal {
  id: string;
  name: string;
  slug: string;
  status: "active" | "disabled";
  defaultLanguage: "en" | "tr";
  createdAt: string;
  updatedAt: string;
}

export interface PortalUserType {
  id: string;
  portalId: string;
  name: string;
  primaryModule: "Contacts";
  modules: PortalModules;
  settings: PortalUserTypeSettings;
  identityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalIdentity {
  id: string;
  portalId: string;
  userTypeId: string;
  email: string;
  displayName: string;
  recordModule: "Contacts";
  recordId: string;
  status: "invited" | "active" | "disabled";
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PortalAuthEvent {
  id: string;
  identityId: string | null;
  kind: string;
  at: string;
}

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "Use 3–50 lowercase letters, digits or hyphens.");

export const createPortalSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  defaultLanguage: z.enum(["en", "tr"]).default("en"),
});
export const updatePortalSchema = z.strictObject({
  name: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  defaultLanguage: z.enum(["en", "tr"]).optional(),
});
export const userTypeInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  modules: z.unknown().optional(),
  settings: z.unknown().optional(),
});
export const userTypeUpdateSchema = userTypeInputSchema.partial();
export const inviteSchema = z.strictObject({
  contactId: z.string().trim().min(1).max(64),
  userTypeId: z.uuid(),
});
export const changeUserTypeSchema = z.strictObject({ userTypeId: z.uuid() });

const uuidInput = z.uuid();

export interface PortalAdminDeps {
  contacts?: PortalContactReader;
  mailer?: PortalMailer;
  appUrl?: string;
  /** Override for tests; defaults to the live AccessSnapshot. */
  canManage?: (ctx: OrgContext) => Promise<boolean>;
  now?: () => Date;
}

function mapPortal(row: typeof schema.portals.$inferSelect): Portal {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status as Portal["status"],
    defaultLanguage: row.defaultLanguage as Portal["defaultLanguage"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapIdentity(row: typeof schema.portalIdentities.$inferSelect): PortalIdentity {
  return {
    id: row.id,
    portalId: row.portalId,
    userTypeId: row.userTypeId,
    email: row.email,
    displayName: row.displayName,
    recordModule: "Contacts",
    recordId: row.recordId,
    status: row.status as PortalIdentity["status"],
    lockedUntil: row.lockedUntil?.toISOString() ?? null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

function isFkViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  // 23503 foreign_key_violation, 23001 restrict_violation (ON DELETE RESTRICT).
  return (
    ["23503", "23001"].includes(e?.code ?? "") || ["23503", "23001"].includes(e?.cause?.code ?? "")
  );
}

/**
 * Member-side portal administration (ADR 0019a §2.3, §1.5, §5), gated by
 * `admin.managePortals` (Administrator always). Routes declare the same key.
 */
export function createPortalAdminService(deps: PortalAdminDeps = {}) {
  const contacts = deps.contacts ?? fixtureContactReader;
  const clock = () => deps.now?.() ?? new Date();
  const appUrl = () => deps.appUrl ?? process.env.APP_URL ?? "http://127.0.0.1:3000";

  async function requireManager(ctx: OrgContext): Promise<void> {
    const allowed = deps.canManage
      ? await deps.canManage(ctx)
      : await getAccessSnapshot(ctx).then(
          (s) => s.profileKind === "administrator" || s.permissions.admin.managePortals === true,
        );
    if (!allowed) throw new ForbiddenError(undefined, "permission_denied");
  }

  async function portalRow(tx: Transaction, orgId: string) {
    const [row] = await tx
      .select()
      .from(schema.portals)
      .where(eq(schema.portals.organizationId, orgId));
    return row ?? null;
  }

  async function requirePortal(tx: Transaction, orgId: string) {
    const row = await portalRow(tx, orgId);
    if (!row) throw new NotFoundError("Portal not found.");
    return row;
  }

  async function identityRow(tx: Transaction, orgId: string, id: string) {
    if (!uuidInput.safeParse(id).success) throw new NotFoundError();
    const [row] = await tx
      .select()
      .from(schema.portalIdentities)
      .where(
        and(eq(schema.portalIdentities.organizationId, orgId), eq(schema.portalIdentities.id, id)),
      )
      .for("update");
    if (!row) throw new NotFoundError();
    return row;
  }

  async function userTypeRow(tx: Transaction, orgId: string, portalId: string, id: string) {
    if (!uuidInput.safeParse(id).success) throw new NotFoundError();
    const [row] = await tx
      .select()
      .from(schema.portalUserTypes)
      .where(
        and(
          eq(schema.portalUserTypes.organizationId, orgId),
          eq(schema.portalUserTypes.portalId, portalId),
          eq(schema.portalUserTypes.id, id),
        ),
      );
    if (!row) throw new NotFoundError();
    return row;
  }

  /** Resolves the sender before any write so a missing sender fails without side effects. */
  async function requireSender(orgId: string) {
    if (!deps.mailer) throw senderMissingError();
    const sender = await deps.mailer.resolveSender(orgId);
    if (!sender) throw senderMissingError();
    return sender;
  }

  async function sendAfterCommit(
    orgId: string,
    sender: NonNullable<Awaited<ReturnType<PortalMailer["resolveSender"]>>>,
    input: {
      kind: "invite" | "reset";
      portal: typeof schema.portals.$inferSelect;
      to: string;
      tokenId: string;
      token: string;
    },
  ) {
    if (!deps.mailer) throw senderMissingError();
    const mail = buildPortalMail({
      kind: input.kind,
      portalName: input.portal.name,
      link: portalLink(appUrl(), input.portal.slug, input.kind, input.token),
      language: input.portal.defaultLanguage,
    });
    await deps.mailer.deliver(orgId, {
      idempotencyKey: input.tokenId,
      kind: input.kind,
      from: sender,
      to: input.to,
      ...mail,
    });
  }

  async function userTypeView(
    tx: Transaction,
    orgId: string,
    row: typeof schema.portalUserTypes.$inferSelect,
  ): Promise<PortalUserType> {
    const ids = await tx
      .select({ id: schema.portalIdentities.id })
      .from(schema.portalIdentities)
      .where(
        and(
          eq(schema.portalIdentities.organizationId, orgId),
          eq(schema.portalIdentities.userTypeId, row.id),
        ),
      );
    return {
      id: row.id,
      portalId: row.portalId,
      name: row.name,
      primaryModule: "Contacts",
      modules: row.modules as PortalModules,
      settings: portalUserTypeSettingsSchema.parse(row.settings ?? {}),
      identityCount: ids.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  return {
    async getPortal(ctx: OrgContext): Promise<Portal | null> {
      await requireManager(ctx);
      return withOrg(ctx, async (tx) => {
        const row = await portalRow(tx, ctx.orgId);
        return row ? mapPortal(row) : null;
      });
    },

    async createPortal(ctx: OrgContext, input: unknown): Promise<Portal> {
      await requireManager(ctx);
      const data = parseInput(createPortalSchema, input);
      const now = clock();
      try {
        return await withOrg(ctx, async (tx) => {
          if (await portalRow(tx, ctx.orgId))
            throw new ConflictError("This organization already has a portal.");
          const [row] = await tx
            .insert(schema.portals)
            .values({
              organizationId: ctx.orgId,
              name: data.name,
              slug: data.slug,
              defaultLanguage: data.defaultLanguage,
              createdAt: now,
              createdBy: ctx.userId,
              updatedAt: now,
              updatedBy: ctx.userId,
            })
            .returning();
          if (!row) throw new Error("Portal insert failed");
          await tx.insert(schema.publicEndpointKeys).values({
            keyHash: hashPortalSlug(data.slug),
            organizationId: ctx.orgId,
            kind: "portal",
            targetId: row.id,
          });
          return mapPortal(row);
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ValidationError({ slug: ["This portal address is already taken."] });
        }
        throw error;
      }
    },

    /** Enable/disable/rename. Disabling revokes every portal session in the same transaction. */
    async updatePortal(ctx: OrgContext, input: unknown): Promise<Portal> {
      await requireManager(ctx);
      const data = parseInput(updatePortalSchema, input);
      const now = clock();
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const [row] = await tx
          .update(schema.portals)
          .set({ ...data, updatedAt: now, updatedBy: ctx.userId })
          .where(
            and(eq(schema.portals.organizationId, ctx.orgId), eq(schema.portals.id, portal.id)),
          )
          .returning();
        if (!row) throw new NotFoundError();
        if (data.status === "disabled" && portal.status !== "disabled") {
          const ids = await tx
            .select({ id: schema.portalIdentities.id })
            .from(schema.portalIdentities)
            .where(
              and(
                eq(schema.portalIdentities.organizationId, ctx.orgId),
                eq(schema.portalIdentities.portalId, portal.id),
              ),
            );
          await revokeIdentitySessions(
            tx,
            ctx.orgId,
            ids.map((i) => i.id),
            now,
          );
        }
        return mapPortal(row);
      });
    },

    /** Deletes the portal; identities, tokens and sessions go with it (cascade). */
    async deletePortal(ctx: OrgContext): Promise<void> {
      await requireManager(ctx);
      await withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        await tx
          .delete(schema.publicEndpointKeys)
          .where(
            and(
              eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
              eq(schema.publicEndpointKeys.kind, "portal"),
              eq(schema.publicEndpointKeys.targetId, portal.id),
            ),
          );
        await tx
          .delete(schema.portals)
          .where(
            and(eq(schema.portals.organizationId, ctx.orgId), eq(schema.portals.id, portal.id)),
          );
      });
    },

    async listUserTypes(ctx: OrgContext): Promise<PortalUserType[]> {
      await requireManager(ctx);
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const rows = await tx
          .select()
          .from(schema.portalUserTypes)
          .where(
            and(
              eq(schema.portalUserTypes.organizationId, ctx.orgId),
              eq(schema.portalUserTypes.portalId, portal.id),
            ),
          )
          .orderBy(asc(schema.portalUserTypes.createdAt));
        return Promise.all(rows.map((r) => userTypeView(tx, ctx.orgId, r)));
      });
    },

    async createUserType(ctx: OrgContext, input: unknown): Promise<PortalUserType> {
      await requireManager(ctx);
      const data = parseInput(userTypeInputSchema, input);
      const modules = validatePortalModules(data.modules ?? {});
      const settings = parseInput(portalUserTypeSettingsSchema, data.settings ?? {});
      const now = clock();
      try {
        return await withOrg(ctx, async (tx) => {
          const portal = await requirePortal(tx, ctx.orgId);
          const [row] = await tx
            .insert(schema.portalUserTypes)
            .values({
              organizationId: ctx.orgId,
              portalId: portal.id,
              name: data.name,
              modules,
              settings,
              createdAt: now,
              createdBy: ctx.userId,
              updatedAt: now,
              updatedBy: ctx.userId,
            })
            .returning();
          if (!row) throw new Error("User type insert failed");
          return userTypeView(tx, ctx.orgId, row);
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ValidationError({ name: ["A user type with this name already exists."] });
        throw error;
      }
    },

    async updateUserType(ctx: OrgContext, id: string, input: unknown): Promise<PortalUserType> {
      await requireManager(ctx);
      const data = parseInput(userTypeUpdateSchema, input);
      const modules = data.modules === undefined ? undefined : validatePortalModules(data.modules);
      const settings =
        data.settings === undefined
          ? undefined
          : parseInput(portalUserTypeSettingsSchema, data.settings);
      const now = clock();
      try {
        return await withOrg(ctx, async (tx) => {
          const portal = await requirePortal(tx, ctx.orgId);
          await userTypeRow(tx, ctx.orgId, portal.id, id);
          const [row] = await tx
            .update(schema.portalUserTypes)
            .set({
              ...(data.name === undefined ? {} : { name: data.name }),
              ...(modules === undefined ? {} : { modules }),
              ...(settings === undefined ? {} : { settings }),
              updatedAt: now,
              updatedBy: ctx.userId,
            })
            .where(
              and(
                eq(schema.portalUserTypes.organizationId, ctx.orgId),
                eq(schema.portalUserTypes.id, id),
              ),
            )
            .returning();
          if (!row) throw new NotFoundError();
          return userTypeView(tx, ctx.orgId, row);
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ValidationError({ name: ["A user type with this name already exists."] });
        throw error;
      }
    },

    /** A user type that still has portal users cannot be deleted. */
    async deleteUserType(ctx: OrgContext, id: string): Promise<void> {
      await requireManager(ctx);
      try {
        await withOrg(ctx, async (tx) => {
          const portal = await requirePortal(tx, ctx.orgId);
          await userTypeRow(tx, ctx.orgId, portal.id, id);
          await tx
            .delete(schema.portalUserTypes)
            .where(
              and(
                eq(schema.portalUserTypes.organizationId, ctx.orgId),
                eq(schema.portalUserTypes.id, id),
              ),
            );
        });
      } catch (error) {
        if (isFkViolation(error))
          throw new ConflictError("Move this user type's portal users to another type first.");
        throw error;
      }
    },

    async listIdentities(ctx: OrgContext): Promise<PortalIdentity[]> {
      await requireManager(ctx);
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const rows = await tx
          .select()
          .from(schema.portalIdentities)
          .where(
            and(
              eq(schema.portalIdentities.organizationId, ctx.orgId),
              eq(schema.portalIdentities.portalId, portal.id),
            ),
          )
          .orderBy(asc(schema.portalIdentities.createdAt));
        return rows.map(mapIdentity);
      });
    },

    async getIdentityForContact(
      ctx: OrgContext,
      contactId: string,
    ): Promise<PortalIdentity | null> {
      await requireManager(ctx);
      return withOrg(ctx, async (tx) => {
        const [row] = await tx
          .select()
          .from(schema.portalIdentities)
          .where(
            and(
              eq(schema.portalIdentities.organizationId, ctx.orgId),
              eq(schema.portalIdentities.recordModule, "Contacts"),
              eq(schema.portalIdentities.recordId, contactId),
            ),
          );
        return row ? mapIdentity(row) : null;
      });
    },

    /**
     * Invites a Contact (ADR 0019a §2.3): it must have an email and not be in the recycle bin;
     * one identity per Contact; the login email is the Contact's email at this moment.
     */
    async invite(ctx: OrgContext, input: unknown): Promise<PortalIdentity> {
      await requireManager(ctx);
      const data = parseInput(inviteSchema, input);
      const contact = await contacts(ctx.orgId, data.contactId);
      if (!contact) throw new NotFoundError("Contact not found.");
      if (!contact.email)
        throw new ValidationError({ contactId: ["The contact has no email address."] });
      const email = contact.email.toLowerCase();
      const sender = await requireSender(ctx.orgId);
      const now = clock();
      let result: { identity: PortalIdentity; mail: Parameters<typeof sendAfterCommit>[2] };
      try {
        result = await withOrg(ctx, async (tx) => {
          const portal = await requirePortal(tx, ctx.orgId);
          await userTypeRow(tx, ctx.orgId, portal.id, data.userTypeId);
          const [existing] = await tx
            .select({ id: schema.portalIdentities.id })
            .from(schema.portalIdentities)
            .where(
              and(
                eq(schema.portalIdentities.organizationId, ctx.orgId),
                eq(schema.portalIdentities.recordModule, "Contacts"),
                eq(schema.portalIdentities.recordId, contact.id),
              ),
            );
          if (existing) throw new ConflictError("This contact is already a portal user.");
          const [row] = await tx
            .insert(schema.portalIdentities)
            .values({
              organizationId: ctx.orgId,
              portalId: portal.id,
              userTypeId: data.userTypeId,
              email,
              displayName: contact.name,
              recordModule: "Contacts",
              recordId: contact.id,
              status: "invited",
              createdAt: now,
              createdBy: ctx.userId,
              updatedAt: now,
            })
            .returning();
          if (!row) throw new Error("Identity insert failed");
          const issued = await issueToken(tx, row, "invite", ctx.userId, now);
          await recordPortalEvent(tx, {
            orgId: ctx.orgId,
            portalId: portal.id,
            identityId: row.id,
            kind: "invited",
            at: now,
          });
          return {
            identity: mapIdentity(row),
            mail: { kind: "invite", portal, to: email, tokenId: issued.id, token: issued.token },
          };
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ConflictError("Another portal user already uses this email address.");
        throw error;
      }
      await sendAfterCommit(ctx.orgId, sender, result.mail);
      return result.identity;
    },

    /** Re-invite while `invited`: refreshes the login email from the Contact, supersedes links. */
    async reinvite(ctx: OrgContext, identityId: string): Promise<PortalIdentity> {
      await requireManager(ctx);
      const sender = await requireSender(ctx.orgId);
      const now = clock();
      let result: { identity: PortalIdentity; mail: Parameters<typeof sendAfterCommit>[2] };
      try {
        result = await withOrg(ctx, async (tx) => {
          const portal = await requirePortal(tx, ctx.orgId);
          const identity = await identityRow(tx, ctx.orgId, identityId);
          if (identity.status !== "invited")
            throw new ConflictError("Only invited users can be re-invited. Send a reset instead.");
          const contact = await contacts(ctx.orgId, identity.recordId);
          if (!contact) throw new NotFoundError("Contact not found.");
          if (!contact.email)
            throw new ValidationError({ contactId: ["The contact has no email address."] });
          const email = contact.email.toLowerCase();
          const [row] = await tx
            .update(schema.portalIdentities)
            .set({ email, displayName: contact.name, updatedAt: now })
            .where(
              and(
                eq(schema.portalIdentities.organizationId, ctx.orgId),
                eq(schema.portalIdentities.id, identity.id),
              ),
            )
            .returning();
          if (!row) throw new NotFoundError();
          const issued = await issueToken(tx, row, "invite", ctx.userId, now);
          await recordPortalEvent(tx, {
            orgId: ctx.orgId,
            portalId: portal.id,
            identityId: row.id,
            kind: "invited",
            at: now,
          });
          return {
            identity: mapIdentity(row),
            mail: { kind: "invite", portal, to: email, tokenId: issued.id, token: issued.token },
          };
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ConflictError("Another portal user already uses this email address.");
        throw error;
      }
      await sendAfterCommit(ctx.orgId, sender, result.mail);
      return result.identity;
    },

    /** Sends a reset link to an `active` identity. */
    async sendReset(ctx: OrgContext, identityId: string): Promise<void> {
      await requireManager(ctx);
      const sender = await requireSender(ctx.orgId);
      const now = clock();
      const mail = await withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const identity = await identityRow(tx, ctx.orgId, identityId);
        if (identity.status !== "active")
          throw new ConflictError("Only active portal users can get a reset link.");
        const issued = await issueToken(tx, identity, "reset", ctx.userId, now);
        await recordPortalEvent(tx, {
          orgId: ctx.orgId,
          portalId: portal.id,
          identityId: identity.id,
          kind: "reset_requested",
          at: now,
        });
        return {
          kind: "reset" as const,
          portal,
          to: identity.email,
          tokenId: issued.id,
          token: issued.token,
        };
      });
      await sendAfterCommit(ctx.orgId, sender, mail);
    },

    /** Disables an identity and revokes its sessions in the same transaction (§1.5). */
    async disable(ctx: OrgContext, identityId: string): Promise<PortalIdentity> {
      await requireManager(ctx);
      const now = clock();
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const identity = await identityRow(tx, ctx.orgId, identityId);
        const [row] = await tx
          .update(schema.portalIdentities)
          .set({ status: "disabled", updatedAt: now })
          .where(
            and(
              eq(schema.portalIdentities.organizationId, ctx.orgId),
              eq(schema.portalIdentities.id, identity.id),
            ),
          )
          .returning();
        if (!row) throw new NotFoundError();
        await revokeIdentitySessions(tx, ctx.orgId, [identity.id], now);
        // Open links die with the account.
        await tx
          .update(schema.portalTokens)
          .set({ usedAt: now })
          .where(
            and(
              eq(schema.portalTokens.organizationId, ctx.orgId),
              eq(schema.portalTokens.identityId, identity.id),
              isNull(schema.portalTokens.usedAt),
            ),
          );
        await recordPortalEvent(tx, {
          orgId: ctx.orgId,
          portalId: portal.id,
          identityId: identity.id,
          kind: "disabled",
          at: now,
        });
        return mapIdentity(row);
      });
    },

    /** Re-enables a disabled identity: `active` if it has a password, else `invited`. */
    async enable(ctx: OrgContext, identityId: string): Promise<PortalIdentity> {
      await requireManager(ctx);
      const now = clock();
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const identity = await identityRow(tx, ctx.orgId, identityId);
        if (identity.status !== "disabled") return mapIdentity(identity);
        const [row] = await tx
          .update(schema.portalIdentities)
          .set({ status: identity.passwordHash ? "active" : "invited", updatedAt: now })
          .where(
            and(
              eq(schema.portalIdentities.organizationId, ctx.orgId),
              eq(schema.portalIdentities.id, identity.id),
            ),
          )
          .returning();
        if (!row) throw new NotFoundError();
        await recordPortalEvent(tx, {
          orgId: ctx.orgId,
          portalId: portal.id,
          identityId: identity.id,
          kind: "enabled",
          at: now,
        });
        return mapIdentity(row);
      });
    },

    /** Changing the user type revokes the identity's sessions in the same transaction. */
    async changeUserType(
      ctx: OrgContext,
      identityId: string,
      input: unknown,
    ): Promise<PortalIdentity> {
      await requireManager(ctx);
      const data = parseInput(changeUserTypeSchema, input);
      const now = clock();
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const identity = await identityRow(tx, ctx.orgId, identityId);
        await userTypeRow(tx, ctx.orgId, portal.id, data.userTypeId);
        if (identity.userTypeId === data.userTypeId) return mapIdentity(identity);
        const [row] = await tx
          .update(schema.portalIdentities)
          .set({ userTypeId: data.userTypeId, updatedAt: now })
          .where(
            and(
              eq(schema.portalIdentities.organizationId, ctx.orgId),
              eq(schema.portalIdentities.id, identity.id),
            ),
          )
          .returning();
        if (!row) throw new NotFoundError();
        await revokeIdentitySessions(tx, ctx.orgId, [identity.id], now);
        return mapIdentity(row);
      });
    },

    async listAuthEvents(
      ctx: OrgContext,
      options: { limit?: number } = {},
    ): Promise<PortalAuthEvent[]> {
      await requireManager(ctx);
      const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
      return withOrg(ctx, async (tx) => {
        const portal = await requirePortal(tx, ctx.orgId);
        const rows = await tx
          .select()
          .from(schema.portalAuthEvents)
          .where(
            and(
              eq(schema.portalAuthEvents.organizationId, ctx.orgId),
              eq(schema.portalAuthEvents.portalId, portal.id),
            ),
          )
          .orderBy(desc(schema.portalAuthEvents.at), desc(schema.portalAuthEvents.id))
          .limit(limit);
        return rows.map((r) => ({
          id: r.id,
          identityId: r.identityId,
          kind: r.kind,
          at: r.at.toISOString(),
        }));
      });
    },
  };
}

export type PortalAdminService = ReturnType<typeof createPortalAdminService>;

/**
 * Revokes every session of the identities linked to these Contacts (ADR 0019a §1.5). Called
 * when Contacts move to the recycle bin; session validation also rejects a trashed Contact.
 */
export async function revokePortalSessionsForContacts(
  orgId: string,
  contactIds: readonly string[],
  now = new Date(),
): Promise<number> {
  if (contactIds.length === 0) return 0;
  return withOrg(systemOrgContext(orgId), async (tx) => {
    const ids = await tx
      .select({ id: schema.portalIdentities.id })
      .from(schema.portalIdentities)
      .where(
        and(
          eq(schema.portalIdentities.organizationId, orgId),
          eq(schema.portalIdentities.recordModule, "Contacts"),
          inArray(schema.portalIdentities.recordId, [...contactIds]),
        ),
      );
    return revokeIdentitySessions(
      tx,
      orgId,
      ids.map((i) => i.id),
      now,
    );
  });
}

/**
 * Record write observer that revokes portal sessions when Contacts go to the recycle bin
 * (ADR 0019a §1.5). It never fails the member's delete; session validation rejects a
 * trashed Contact on its own as well.
 */
export function portalContactDeleteObserver(ctx: { orgId: string }): RecordWriteObserver {
  return {
    async assertEditable() {},
    async afterWrite() {},
    async afterDelete(event) {
      if (event.module !== "Contacts") return;
      try {
        await revokePortalSessionsForContacts(ctx.orgId, event.ids);
      } catch (error) {
        console.error("Portal session revoke after Contact delete failed", error);
      }
    },
  };
}
