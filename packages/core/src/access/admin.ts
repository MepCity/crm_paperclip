import { schema } from "@crm/db";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  parseInput,
  ValidationError,
} from "../errors";
import { type OrgContext, withOrg } from "../tenancy";
import type { Transaction } from "../tenancy/types";
import {
  isCatalogueModule,
  MANAGED_SYSTEM_FIELDS,
  OWNED_MODULES,
  type ProfilePermissions,
  parseStoredPermissions,
  profilePermissionsWriteSchema,
  STANDARD_EDITABLE_SECTIONS,
} from "./catalogue";
import { getAccessSnapshot } from "./context";
import { assertGroupGraph, descendantRoleIds } from "./groups";
import { bumpAccessVersion } from "./seed";
import {
  DEFAULT_ACCESS_VALUES,
  type DefaultAccess,
  type GroupMemberKind,
  type ProfileKind,
  type SharingLevel,
  type StoredFieldAccess,
  type SubjectKind,
} from "./types";

export const MAX_RULES_PER_MODULE = 50;

const uuid = z.string().uuid();
const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500).default("");
const moduleInput = z.string().refine(isCatalogueModule, "Unknown module.");
const subjectKind = z.enum(["role", "role_and_subordinates", "group"]);

export type ProfileSummary = {
  id: string;
  name: string;
  description: string;
  kind: ProfileKind;
  memberCount: number;
  updatedAt: string;
  createdByName: string | null;
  modifiedByName: string | null;
};
export type ProfileDetail = ProfileSummary & { permissions: ProfilePermissions };
export type RoleNode = {
  id: string;
  name: string;
  description: string;
  parentRoleId: string | null;
  shareWithPeers: boolean;
  memberCount: number;
};
export type GroupMemberRef = { kind: GroupMemberKind; id: string };
export type GroupDetail = {
  id: string;
  name: string;
  description: string;
  members: GroupMemberRef[];
};
export type SharingRuleDetail = {
  id: string;
  module: string;
  name: string;
  sourceKind: SubjectKind;
  sourceId: string;
  targetKind: SubjectKind;
  targetId: string;
  level: SharingLevel;
};
export type MemberAccessRow = {
  userId: string;
  name: string;
  email: string;
  isOwner: boolean;
  profileId: string;
  roleId: string;
};
export type FieldPermissionRow = { field: string; access: StoredFieldAccess };

/** Required fields of a module, supplied by the layout metadata (cannot be hidden/read-only). */
export type RequiredFieldsLookup = (
  module: string,
) => Promise<readonly string[]> | readonly string[];

async function requireUserManagement(ctx: OrgContext): Promise<void> {
  const snapshot = await getAccessSnapshot(ctx);
  if (snapshot.profileKind === "administrator" || snapshot.permissions.admin.userManagement) return;
  throw new ForbiddenError(undefined, "permission_denied");
}

async function lockOrganization(tx: Transaction, orgId: string): Promise<void> {
  const [row] = await tx
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .for("no key update");
  if (!row) throw new NotFoundError();
}

/** Admin read: gate, then an organisation-scoped transaction. */
async function read<T>(ctx: OrgContext, work: (tx: Transaction) => Promise<T>): Promise<T> {
  await requireUserManagement(ctx);
  return withOrg(ctx, work);
}

/** Admin write: gate, lock the organisation, run, bump `access_versions` in the same transaction. */
async function write<T>(ctx: OrgContext, work: (tx: Transaction) => Promise<T>): Promise<T> {
  await requireUserManagement(ctx);
  return withOrg(ctx, async (tx) => {
    await lockOrganization(tx, ctx.orgId);
    const result = await work(tx);
    await bumpAccessVersion(tx, ctx.orgId);
    return result;
  });
}

function isUnique(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e.code === "23505" || e.cause?.code === "23505";
}

async function uniqueName<T>(field: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (isUnique(error)) throw new ValidationError({ [field]: ["This name is already in use."] });
    throw error;
  }
}

const audit = (ctx: OrgContext) => ({ modifiedBy: ctx.userId, updatedAt: new Date() });

// ---------------------------------------------------------------- profiles

async function profileCounts(tx: Transaction, orgId: string): Promise<Map<string, number>> {
  const rows = await tx
    .select({ id: schema.memberAccess.profileId, total: count() })
    .from(schema.memberAccess)
    .where(eq(schema.memberAccess.organizationId, orgId))
    .groupBy(schema.memberAccess.profileId);
  return new Map(rows.map((r) => [r.id, r.total]));
}

function toProfile(
  row: typeof schema.accessProfiles.$inferSelect,
  counts: Map<string, number>,
  names: Map<string, string> = new Map(),
): ProfileSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    kind: row.kind as ProfileKind,
    memberCount: counts.get(row.id) ?? 0,
    updatedAt: row.updatedAt.toISOString(),
    createdByName: row.createdBy ? (names.get(row.createdBy) ?? null) : null,
    modifiedByName: row.modifiedBy ? (names.get(row.modifiedBy) ?? null) : null,
  };
}

async function userNames(tx: Transaction, ids: (string | null)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(ids.filter((v): v is string => v !== null))];
  if (wanted.length === 0) return new Map();
  const rows = await tx
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(inArray(schema.users.id, wanted));
  return new Map(rows.map((r) => [r.id, r.name]));
}

async function loadProfile(tx: Transaction, orgId: string, id: string) {
  const [row] = await tx
    .select()
    .from(schema.accessProfiles)
    .where(and(eq(schema.accessProfiles.organizationId, orgId), eq(schema.accessProfiles.id, id)));
  if (!row) throw new NotFoundError();
  return row;
}

export async function listProfiles(ctx: OrgContext): Promise<ProfileSummary[]> {
  return read(ctx, async (tx) => {
    const counts = await profileCounts(tx, ctx.orgId);
    const rows = await tx
      .select()
      .from(schema.accessProfiles)
      .where(eq(schema.accessProfiles.organizationId, ctx.orgId))
      .orderBy(asc(schema.accessProfiles.createdAt), asc(schema.accessProfiles.id));
    const names = await userNames(
      tx,
      rows.flatMap((r) => [r.createdBy, r.modifiedBy]),
    );
    return rows.map((r) => toProfile(r, counts, names));
  });
}

export async function getProfile(ctx: OrgContext, id: string): Promise<ProfileDetail> {
  const profileId = parseInput(uuid, id);
  return read(ctx, async (tx) => {
    const row = await loadProfile(tx, ctx.orgId, profileId);
    return {
      ...toProfile(
        row,
        await profileCounts(tx, ctx.orgId),
        await userNames(tx, [row.createdBy, row.modifiedBy]),
      ),
      permissions: parseStoredPermissions(row.permissions),
    };
  });
}

const cloneInput = z.object({ sourceProfileId: uuid, name, description });

/** New profiles are always clones of an existing one (ADR 0017 §9, spec Q3). */
export async function cloneProfile(
  ctx: OrgContext,
  input: { sourceProfileId: string; name: string; description?: string },
): Promise<ProfileDetail> {
  const values = parseInput(cloneInput, input);
  return write(ctx, async (tx) => {
    const source = await loadProfile(tx, ctx.orgId, values.sourceProfileId);
    const [row] = await uniqueName("name", () =>
      tx
        .insert(schema.accessProfiles)
        .values({
          organizationId: ctx.orgId,
          name: values.name,
          description: values.description,
          kind: "custom",
          permissions: parseStoredPermissions(source.permissions),
          createdBy: ctx.userId,
          modifiedBy: ctx.userId,
        })
        .returning(),
    );
    if (!row) throw new Error("Profile insert returned no row");
    // A clone carries the field permissions of its source.
    const fields = await tx
      .select()
      .from(schema.accessFieldPermissions)
      .where(
        and(
          eq(schema.accessFieldPermissions.organizationId, ctx.orgId),
          eq(schema.accessFieldPermissions.profileId, source.id),
        ),
      );
    if (fields.length) {
      await tx
        .insert(schema.accessFieldPermissions)
        .values(fields.map((f) => ({ ...f, profileId: row.id })));
    }
    return { ...toProfile(row, new Map()), permissions: parseStoredPermissions(row.permissions) };
  });
}

const updateProfileInput = z.object({
  profileId: uuid,
  name: name.optional(),
  description: z.string().trim().max(500).optional(),
  permissions: z.unknown().optional(),
});

export async function updateProfile(
  ctx: OrgContext,
  input: { profileId: string; name?: string; description?: string; permissions?: unknown },
): Promise<ProfileDetail> {
  const values = parseInput(updateProfileInput, input);
  return write(ctx, async (tx) => {
    const row = await loadProfile(tx, ctx.orgId, values.profileId);
    if (row.kind === "administrator") {
      throw new ConflictError("The Administrator profile cannot be edited. Clone it instead.");
    }
    const patch: Partial<typeof schema.accessProfiles.$inferInsert> = audit(ctx);
    if (
      row.kind === "standard" &&
      (values.name !== undefined || values.description !== undefined)
    ) {
      throw new ConflictError("Only the module and feature permissions of Standard can be edited.");
    }
    if (values.name !== undefined) patch.name = values.name;
    if (values.description !== undefined) patch.description = values.description;
    if (values.permissions !== undefined) {
      const parsed = profilePermissionsWriteSchema.safeParse(values.permissions);
      if (!parsed.success) {
        throw new ValidationError({ permissions: ["The permissions are not valid."] });
      }
      if (row.kind === "standard") {
        const current = parseStoredPermissions(row.permissions) as Record<string, unknown>;
        const next = parsed.data as Record<string, unknown>;
        const editable = new Set<string>(STANDARD_EDITABLE_SECTIONS);
        for (const key of Object.keys(current)) {
          if (editable.has(key)) continue;
          if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) {
            throw new ConflictError(
              "Only the module and feature permissions of Standard can be edited.",
            );
          }
        }
      }
      patch.permissions = parsed.data;
    }
    const [updated] = await uniqueName("name", () =>
      tx
        .update(schema.accessProfiles)
        .set(patch)
        .where(
          and(
            eq(schema.accessProfiles.organizationId, ctx.orgId),
            eq(schema.accessProfiles.id, values.profileId),
          ),
        )
        .returning(),
    );
    if (!updated) throw new NotFoundError();
    return {
      ...toProfile(updated, await profileCounts(tx, ctx.orgId)),
      permissions: parseStoredPermissions(updated.permissions),
    };
  });
}

export async function deleteProfile(
  ctx: OrgContext,
  input: { profileId: string; replacementProfileId?: string },
): Promise<void> {
  const values = parseInput(
    z.object({ profileId: uuid, replacementProfileId: uuid.optional() }),
    input,
  );
  await write(ctx, async (tx) => {
    const row = await loadProfile(tx, ctx.orgId, values.profileId);
    if (row.kind !== "custom") throw new ConflictError("System profiles cannot be deleted.");
    const users = (await profileCounts(tx, ctx.orgId)).get(row.id) ?? 0;
    const [inviteRow] = await tx
      .select({ total: count() })
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.profileId, row.id),
        ),
      );
    const inUse = users > 0 || (inviteRow?.total ?? 0) > 0;
    if (inUse) {
      if (!values.replacementProfileId) {
        throw new ValidationError({ replacementProfileId: ["Choose a replacement profile."] });
      }
      if (values.replacementProfileId === row.id) {
        throw new ValidationError({ replacementProfileId: ["Choose a different profile."] });
      }
      const replacement = await loadProfile(tx, ctx.orgId, values.replacementProfileId);
      const legacy = replacement.kind === "administrator" ? "admin" : "member";
      await tx
        .update(schema.memberAccess)
        .set({ profileId: replacement.id })
        .where(
          and(
            eq(schema.memberAccess.organizationId, ctx.orgId),
            eq(schema.memberAccess.profileId, row.id),
          ),
        );
      await tx
        .update(schema.invitations)
        .set({ profileId: replacement.id, role: legacy })
        .where(
          and(
            eq(schema.invitations.organizationId, ctx.orgId),
            eq(schema.invitations.profileId, row.id),
          ),
        );
    }
    await tx
      .delete(schema.accessProfiles)
      .where(
        and(
          eq(schema.accessProfiles.organizationId, ctx.orgId),
          eq(schema.accessProfiles.id, row.id),
        ),
      );
  });
}

// ------------------------------------------------------- field permissions

export async function getFieldPermissions(
  ctx: OrgContext,
  input: { profileId: string; module: string },
): Promise<FieldPermissionRow[]> {
  const values = parseInput(z.object({ profileId: uuid, module: moduleInput }), input);
  return read(ctx, async (tx) => {
    await loadProfile(tx, ctx.orgId, values.profileId);
    const rows = await tx
      .select()
      .from(schema.accessFieldPermissions)
      .where(
        and(
          eq(schema.accessFieldPermissions.organizationId, ctx.orgId),
          eq(schema.accessFieldPermissions.profileId, values.profileId),
          eq(schema.accessFieldPermissions.module, values.module),
        ),
      )
      .orderBy(asc(schema.accessFieldPermissions.fieldApiName));
    return rows.map((r) => ({ field: r.fieldApiName, access: r.access as StoredFieldAccess }));
  });
}

const putFieldsInput = z.object({
  profileId: uuid,
  module: moduleInput,
  fields: z
    .array(
      z.object({
        field: z.string().trim().min(1).max(100),
        access: z.enum(["read_only", "hidden"]),
      }),
    )
    .max(500),
});

/**
 * Replaces the non-default field permissions of one profile x module. Absent field = read_write.
 * Required fields cannot be hidden or read-only; managed system fields cannot be hidden;
 * the Administrator profile is fixed (ADR 0017 §4.2, open question O3).
 */
export async function putFieldPermissions(
  ctx: OrgContext,
  input: { profileId: string; module: string; fields: FieldPermissionRow[] },
  requiredFields: RequiredFieldsLookup = () => [],
): Promise<FieldPermissionRow[]> {
  const values = parseInput(putFieldsInput, input);
  const required = new Set(await requiredFields(values.module));
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const f of values.fields) {
    if (seen.has(f.field)) errors.push(`${f.field} is listed twice.`);
    seen.add(f.field);
    if (required.has(f.field)) errors.push(`${f.field} is required and cannot be restricted.`);
    if (f.access === "hidden" && MANAGED_SYSTEM_FIELDS.includes(f.field)) {
      errors.push(`${f.field} is a system field and cannot be hidden.`);
    }
  }
  if (errors.length) throw new ValidationError({ fields: errors });
  return write(ctx, async (tx) => {
    const profile = await loadProfile(tx, ctx.orgId, values.profileId);
    if (profile.kind === "administrator") {
      throw new ConflictError("Field permissions of the Administrator profile cannot be changed.");
    }
    await tx
      .delete(schema.accessFieldPermissions)
      .where(
        and(
          eq(schema.accessFieldPermissions.organizationId, ctx.orgId),
          eq(schema.accessFieldPermissions.profileId, values.profileId),
          eq(schema.accessFieldPermissions.module, values.module),
        ),
      );
    if (values.fields.length) {
      await tx.insert(schema.accessFieldPermissions).values(
        values.fields.map((f) => ({
          organizationId: ctx.orgId,
          profileId: values.profileId,
          module: values.module,
          fieldApiName: f.field,
          access: f.access,
        })),
      );
    }
    return values.fields;
  });
}

/** Called when a custom field is deleted (ADR 0017 §2): its permission rows go with it. */
export async function deleteFieldPermissionsForField(
  tx: Transaction,
  orgId: string,
  module: string,
  field: string,
): Promise<void> {
  await tx
    .delete(schema.accessFieldPermissions)
    .where(
      and(
        eq(schema.accessFieldPermissions.organizationId, orgId),
        eq(schema.accessFieldPermissions.module, module),
        eq(schema.accessFieldPermissions.fieldApiName, field),
      ),
    );
  await bumpAccessVersion(tx, orgId);
}

// ------------------------------------------------------------------- roles

function toRole(
  row: typeof schema.accessRoles.$inferSelect,
  counts: Map<string, number>,
): RoleNode {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    parentRoleId: row.parentRoleId,
    shareWithPeers: row.shareWithPeers,
    memberCount: counts.get(row.id) ?? 0,
  };
}

async function roleCounts(tx: Transaction, orgId: string): Promise<Map<string, number>> {
  const rows = await tx
    .select({ id: schema.memberAccess.roleId, total: count() })
    .from(schema.memberAccess)
    .where(eq(schema.memberAccess.organizationId, orgId))
    .groupBy(schema.memberAccess.roleId);
  return new Map(rows.map((r) => [r.id, r.total]));
}

async function loadRole(tx: Transaction, orgId: string, id: string) {
  const [row] = await tx
    .select()
    .from(schema.accessRoles)
    .where(and(eq(schema.accessRoles.organizationId, orgId), eq(schema.accessRoles.id, id)));
  if (!row) throw new NotFoundError();
  return row;
}

/** Flat list of roles; the client builds the tree from `parentRoleId`. */
export async function listRoles(ctx: OrgContext): Promise<RoleNode[]> {
  return read(ctx, async (tx) => {
    const counts = await roleCounts(tx, ctx.orgId);
    const rows = await tx
      .select()
      .from(schema.accessRoles)
      .where(eq(schema.accessRoles.organizationId, ctx.orgId))
      .orderBy(asc(schema.accessRoles.createdAt), asc(schema.accessRoles.id));
    return rows.map((r) => toRole(r, counts));
  });
}

export async function getRole(ctx: OrgContext, id: string): Promise<RoleNode> {
  const roleId = parseInput(uuid, id);
  return read(ctx, async (tx) =>
    toRole(await loadRole(tx, ctx.orgId, roleId), await roleCounts(tx, ctx.orgId)),
  );
}

const createRoleInput = z.object({
  name,
  parentRoleId: uuid,
  shareWithPeers: z.boolean().default(false),
  description,
});

export async function createRole(
  ctx: OrgContext,
  input: { name: string; parentRoleId: string; shareWithPeers?: boolean; description?: string },
): Promise<RoleNode> {
  const values = parseInput(createRoleInput, input);
  return write(ctx, async (tx) => {
    await loadRole(tx, ctx.orgId, values.parentRoleId);
    const [row] = await uniqueName("name", () =>
      tx
        .insert(schema.accessRoles)
        .values({
          organizationId: ctx.orgId,
          name: values.name,
          parentRoleId: values.parentRoleId,
          shareWithPeers: values.shareWithPeers,
          description: values.description,
          createdBy: ctx.userId,
          modifiedBy: ctx.userId,
        })
        .returning(),
    );
    if (!row) throw new Error("Role insert returned no row");
    return toRole(row, new Map());
  });
}

const updateRoleInput = z.object({
  roleId: uuid,
  name: name.optional(),
  parentRoleId: uuid.optional(),
  shareWithPeers: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
});

async function allRoles(tx: Transaction, orgId: string) {
  const rows = await tx
    .select()
    .from(schema.accessRoles)
    .where(eq(schema.accessRoles.organizationId, orgId));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    parentRoleId: r.parentRoleId,
    shareWithPeers: r.shareWithPeers,
  }));
}

export async function updateRole(
  ctx: OrgContext,
  input: {
    roleId: string;
    name?: string;
    parentRoleId?: string;
    shareWithPeers?: boolean;
    description?: string;
  },
): Promise<RoleNode> {
  const values = parseInput(updateRoleInput, input);
  return write(ctx, async (tx) => {
    const row = await loadRole(tx, ctx.orgId, values.roleId);
    const patch: Partial<typeof schema.accessRoles.$inferInsert> = audit(ctx);
    if (values.name !== undefined) patch.name = values.name;
    if (values.description !== undefined) patch.description = values.description;
    if (values.shareWithPeers !== undefined) patch.shareWithPeers = values.shareWithPeers;
    if (values.parentRoleId !== undefined && values.parentRoleId !== row.parentRoleId) {
      if (row.parentRoleId === null) throw new ConflictError("The top role cannot be moved.");
      await loadRole(tx, ctx.orgId, values.parentRoleId);
      const descendants = descendantRoleIds(await allRoles(tx, ctx.orgId), row.id);
      if (values.parentRoleId === row.id || descendants.has(values.parentRoleId)) {
        throw new ValidationError({
          parentRoleId: ["A role cannot report to itself or its subordinates."],
        });
      }
      patch.parentRoleId = values.parentRoleId;
    }
    const [updated] = await uniqueName("name", () =>
      tx
        .update(schema.accessRoles)
        .set(patch)
        .where(
          and(eq(schema.accessRoles.organizationId, ctx.orgId), eq(schema.accessRoles.id, row.id)),
        )
        .returning(),
    );
    if (!updated) throw new NotFoundError();
    return toRole(updated, await roleCounts(tx, ctx.orgId));
  });
}

/**
 * Deletes a role. Its users, child roles and the group members / sharing-rule subjects that
 * pointed at it move to the transfer role (ADR 0017 §9). The top role cannot be deleted.
 */
export async function deleteRole(
  ctx: OrgContext,
  input: { roleId: string; transferRoleId: string },
): Promise<void> {
  const values = parseInput(z.object({ roleId: uuid, transferRoleId: uuid }), input);
  await write(ctx, async (tx) => {
    const row = await loadRole(tx, ctx.orgId, values.roleId);
    if (row.parentRoleId === null) throw new ConflictError("The top role cannot be deleted.");
    if (values.transferRoleId === row.id) {
      throw new ValidationError({ transferRoleId: ["Choose a different role."] });
    }
    await loadRole(tx, ctx.orgId, values.transferRoleId);
    if (descendantRoleIds(await allRoles(tx, ctx.orgId), row.id).has(values.transferRoleId)) {
      throw new ValidationError({ transferRoleId: ["Choose a role that is not a subordinate."] });
    }
    const org = { organizationId: ctx.orgId };
    await tx
      .update(schema.memberAccess)
      .set({ roleId: values.transferRoleId })
      .where(
        and(
          eq(schema.memberAccess.organizationId, org.organizationId),
          eq(schema.memberAccess.roleId, row.id),
        ),
      );
    await tx
      .update(schema.accessRoles)
      .set({ parentRoleId: values.transferRoleId })
      .where(
        and(
          eq(schema.accessRoles.organizationId, ctx.orgId),
          eq(schema.accessRoles.parentRoleId, row.id),
        ),
      );
    await tx
      .update(schema.invitations)
      .set({ roleId: values.transferRoleId })
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.roleId, row.id),
        ),
      );
    for (const kind of ["role", "role_and_subordinates"] as const) {
      // Re-point group members, dropping the ones that would duplicate an existing member.
      const old = await tx
        .select()
        .from(schema.accessGroupMembers)
        .where(
          and(
            eq(schema.accessGroupMembers.organizationId, ctx.orgId),
            eq(schema.accessGroupMembers.memberKind, kind),
            eq(schema.accessGroupMembers.memberId, row.id),
          ),
        );
      if (old.length) {
        await tx
          .delete(schema.accessGroupMembers)
          .where(
            and(
              eq(schema.accessGroupMembers.organizationId, ctx.orgId),
              eq(schema.accessGroupMembers.memberKind, kind),
              eq(schema.accessGroupMembers.memberId, row.id),
            ),
          );
        await tx
          .insert(schema.accessGroupMembers)
          .values(old.map((m) => ({ ...m, memberId: values.transferRoleId })))
          .onConflictDoNothing();
      }
      await tx
        .update(schema.accessSharingRules)
        .set({ sourceId: values.transferRoleId })
        .where(
          and(
            eq(schema.accessSharingRules.organizationId, ctx.orgId),
            eq(schema.accessSharingRules.sourceKind, kind),
            eq(schema.accessSharingRules.sourceId, row.id),
          ),
        );
      await tx
        .update(schema.accessSharingRules)
        .set({ targetId: values.transferRoleId })
        .where(
          and(
            eq(schema.accessSharingRules.organizationId, ctx.orgId),
            eq(schema.accessSharingRules.targetKind, kind),
            eq(schema.accessSharingRules.targetId, row.id),
          ),
        );
    }
    await tx
      .delete(schema.accessRoles)
      .where(
        and(eq(schema.accessRoles.organizationId, ctx.orgId), eq(schema.accessRoles.id, row.id)),
      );
  });
}

// ------------------------------------------------------------------ groups

const memberRef = z.object({
  kind: z.enum(["user", "role", "role_and_subordinates", "group"]),
  id: uuid,
});

async function assertMemberRefs(
  tx: Transaction,
  orgId: string,
  groupId: string,
  members: readonly GroupMemberRef[],
): Promise<void> {
  const ids = (kind: GroupMemberKind[]) =>
    members.filter((m) => kind.includes(m.kind)).map((m) => m.id);
  const users = ids(["user"]);
  const roles = ids(["role", "role_and_subordinates"]);
  const groups = ids(["group"]);
  if (groups.includes(groupId))
    throw new ValidationError({ members: ["A group cannot contain itself."] });
  const check = async (table: "user" | "role" | "group", list: string[]) => {
    if (!list.length) return;
    const unique = [...new Set(list)];
    const found =
      table === "user"
        ? await tx
            .select({ id: schema.memberAccess.userId })
            .from(schema.memberAccess)
            .where(
              and(
                eq(schema.memberAccess.organizationId, orgId),
                inArray(schema.memberAccess.userId, unique),
              ),
            )
        : table === "role"
          ? await tx
              .select({ id: schema.accessRoles.id })
              .from(schema.accessRoles)
              .where(
                and(
                  eq(schema.accessRoles.organizationId, orgId),
                  inArray(schema.accessRoles.id, unique),
                ),
              )
          : await tx
              .select({ id: schema.accessGroups.id })
              .from(schema.accessGroups)
              .where(
                and(
                  eq(schema.accessGroups.organizationId, orgId),
                  inArray(schema.accessGroups.id, unique),
                ),
              );
    if (found.length !== unique.length) {
      throw new ValidationError({ members: ["A selected member does not exist."] });
    }
  };
  await check("user", users);
  await check("role", roles);
  await check("group", groups);
}

async function groupMembersOf(
  tx: Transaction,
  orgId: string,
  groupId: string,
): Promise<GroupMemberRef[]> {
  const rows = await tx
    .select()
    .from(schema.accessGroupMembers)
    .where(
      and(
        eq(schema.accessGroupMembers.organizationId, orgId),
        eq(schema.accessGroupMembers.groupId, groupId),
      ),
    );
  return rows.map((r) => ({ kind: r.memberKind as GroupMemberKind, id: r.memberId }));
}

async function replaceGroupMembers(
  tx: Transaction,
  orgId: string,
  groupId: string,
  members: readonly GroupMemberRef[],
): Promise<void> {
  await assertMemberRefs(tx, orgId, groupId, members);
  await tx
    .delete(schema.accessGroupMembers)
    .where(
      and(
        eq(schema.accessGroupMembers.organizationId, orgId),
        eq(schema.accessGroupMembers.groupId, groupId),
      ),
    );
  const unique = new Map(members.map((m) => [`${m.kind}:${m.id}`, m]));
  if (unique.size) {
    await tx.insert(schema.accessGroupMembers).values(
      [...unique.values()].map((m) => ({
        organizationId: orgId,
        groupId,
        memberKind: m.kind,
        memberId: m.id,
      })),
    );
  }
  // Cycle and depth check over the whole graph after the change.
  const all = await tx
    .select()
    .from(schema.accessGroupMembers)
    .where(eq(schema.accessGroupMembers.organizationId, orgId));
  assertGroupGraph(
    all.map((g) => ({
      groupId: g.groupId,
      kind: g.memberKind as GroupMemberKind,
      memberId: g.memberId,
    })),
  );
}

export async function listGroups(ctx: OrgContext): Promise<GroupDetail[]> {
  return read(ctx, async (tx) => {
    const groups = await tx
      .select()
      .from(schema.accessGroups)
      .where(eq(schema.accessGroups.organizationId, ctx.orgId))
      .orderBy(asc(schema.accessGroups.name), asc(schema.accessGroups.id));
    const members = await tx
      .select()
      .from(schema.accessGroupMembers)
      .where(eq(schema.accessGroupMembers.organizationId, ctx.orgId));
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      members: members
        .filter((m) => m.groupId === g.id)
        .map((m) => ({ kind: m.memberKind as GroupMemberKind, id: m.memberId })),
    }));
  });
}

export async function getGroup(ctx: OrgContext, id: string): Promise<GroupDetail> {
  const groupId = parseInput(uuid, id);
  return read(ctx, async (tx) => {
    const [g] = await tx
      .select()
      .from(schema.accessGroups)
      .where(
        and(eq(schema.accessGroups.organizationId, ctx.orgId), eq(schema.accessGroups.id, groupId)),
      );
    if (!g) throw new NotFoundError();
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      members: await groupMembersOf(tx, ctx.orgId, g.id),
    };
  });
}

const createGroupInput = z.object({
  name,
  description,
  members: z.array(memberRef).max(500).default([]),
});

export async function createGroup(
  ctx: OrgContext,
  input: { name: string; description?: string; members?: GroupMemberRef[] },
): Promise<GroupDetail> {
  const values = parseInput(createGroupInput, input);
  return write(ctx, async (tx) => {
    const [g] = await uniqueName("name", () =>
      tx
        .insert(schema.accessGroups)
        .values({
          organizationId: ctx.orgId,
          name: values.name,
          description: values.description,
          createdBy: ctx.userId,
          modifiedBy: ctx.userId,
        })
        .returning(),
    );
    if (!g) throw new Error("Group insert returned no row");
    await replaceGroupMembers(tx, ctx.orgId, g.id, values.members);
    return { id: g.id, name: g.name, description: g.description, members: values.members };
  });
}

const updateGroupInput = z.object({
  groupId: uuid,
  name: name.optional(),
  description: z.string().trim().max(500).optional(),
  members: z.array(memberRef).max(500).optional(),
});

export async function updateGroup(
  ctx: OrgContext,
  input: { groupId: string; name?: string; description?: string; members?: GroupMemberRef[] },
): Promise<GroupDetail> {
  const values = parseInput(updateGroupInput, input);
  return write(ctx, async (tx) => {
    const patch: Partial<typeof schema.accessGroups.$inferInsert> = audit(ctx);
    if (values.name !== undefined) patch.name = values.name;
    if (values.description !== undefined) patch.description = values.description;
    const [g] = await uniqueName("name", () =>
      tx
        .update(schema.accessGroups)
        .set(patch)
        .where(
          and(
            eq(schema.accessGroups.organizationId, ctx.orgId),
            eq(schema.accessGroups.id, values.groupId),
          ),
        )
        .returning(),
    );
    if (!g) throw new NotFoundError();
    if (values.members) await replaceGroupMembers(tx, ctx.orgId, g.id, values.members);
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      members: await groupMembersOf(tx, ctx.orgId, g.id),
    };
  });
}

/** A group used by a sharing rule or nested in another group cannot be deleted. */
export async function deleteGroup(ctx: OrgContext, input: { groupId: string }): Promise<void> {
  const { groupId } = parseInput(z.object({ groupId: uuid }), input);
  await write(ctx, async (tx) => {
    const [g] = await tx
      .select({ id: schema.accessGroups.id })
      .from(schema.accessGroups)
      .where(
        and(eq(schema.accessGroups.organizationId, ctx.orgId), eq(schema.accessGroups.id, groupId)),
      );
    if (!g) throw new NotFoundError();
    const [rules] = await tx
      .select({ total: count() })
      .from(schema.accessSharingRules)
      .where(
        and(
          eq(schema.accessSharingRules.organizationId, ctx.orgId),
          sql`(${schema.accessSharingRules.sourceKind} = 'group' and ${schema.accessSharingRules.sourceId} = ${groupId})
            or (${schema.accessSharingRules.targetKind} = 'group' and ${schema.accessSharingRules.targetId} = ${groupId})`,
        ),
      );
    const [nested] = await tx
      .select({ total: count() })
      .from(schema.accessGroupMembers)
      .where(
        and(
          eq(schema.accessGroupMembers.organizationId, ctx.orgId),
          eq(schema.accessGroupMembers.memberKind, "group"),
          eq(schema.accessGroupMembers.memberId, groupId),
        ),
      );
    if ((rules?.total ?? 0) > 0 || (nested?.total ?? 0) > 0) {
      throw new ConflictError("This group is used by a sharing rule or another group.");
    }
    await tx
      .delete(schema.accessGroups)
      .where(
        and(eq(schema.accessGroups.organizationId, ctx.orgId), eq(schema.accessGroups.id, groupId)),
      );
  });
}

// ----------------------------------------------------------- module defaults

export async function getModuleDefaults(
  ctx: OrgContext,
): Promise<{ module: string; level: DefaultAccess }[]> {
  return read(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(schema.accessModuleDefaults)
      .where(eq(schema.accessModuleDefaults.organizationId, ctx.orgId));
    const byModule = new Map(rows.map((r) => [r.module, r.level as DefaultAccess]));
    return OWNED_MODULES.map((module) => ({ module, level: byModule.get(module) ?? "private" }));
  });
}

const putDefaultsInput = z.object({
  defaults: z
    .array(
      z.object({
        module: moduleInput,
        level: z.enum(DEFAULT_ACCESS_VALUES as [DefaultAccess, ...DefaultAccess[]]),
      }),
    )
    .min(1)
    .max(OWNED_MODULES.length),
});

export async function putModuleDefaults(
  ctx: OrgContext,
  input: { defaults: { module: string; level: DefaultAccess }[] },
): Promise<{ module: string; level: DefaultAccess }[]> {
  const values = parseInput(putDefaultsInput, input);
  await write(ctx, async (tx) => {
    for (const d of values.defaults) {
      await tx
        .insert(schema.accessModuleDefaults)
        .values({ organizationId: ctx.orgId, module: d.module, level: d.level })
        .onConflictDoUpdate({
          target: [schema.accessModuleDefaults.organizationId, schema.accessModuleDefaults.module],
          set: { level: d.level },
        });
    }
  });
  return getModuleDefaults(ctx);
}

// ------------------------------------------------------------ sharing rules

function toRule(r: typeof schema.accessSharingRules.$inferSelect): SharingRuleDetail {
  return {
    id: r.id,
    module: r.module,
    name: r.name,
    sourceKind: r.sourceKind as SubjectKind,
    sourceId: r.sourceId,
    targetKind: r.targetKind as SubjectKind,
    targetId: r.targetId,
    level: r.level as SharingLevel,
  };
}

const ruleBody = z.object({
  module: moduleInput,
  name,
  sourceKind: subjectKind,
  sourceId: uuid,
  targetKind: subjectKind,
  targetId: uuid,
  level: z.enum(["read", "read_write", "read_write_delete"]),
});
export type SharingRuleInput = z.input<typeof ruleBody>;

async function assertSubject(
  tx: Transaction,
  orgId: string,
  kind: SubjectKind,
  id: string,
  field: string,
): Promise<void> {
  const rows =
    kind === "group"
      ? await tx
          .select({ id: schema.accessGroups.id })
          .from(schema.accessGroups)
          .where(and(eq(schema.accessGroups.organizationId, orgId), eq(schema.accessGroups.id, id)))
      : await tx
          .select({ id: schema.accessRoles.id })
          .from(schema.accessRoles)
          .where(and(eq(schema.accessRoles.organizationId, orgId), eq(schema.accessRoles.id, id)));
  if (!rows.length) throw new ValidationError({ [field]: ["Choose an existing role or group."] });
}

export async function listSharingRules(
  ctx: OrgContext,
  module?: string,
): Promise<SharingRuleDetail[]> {
  const filter = module === undefined ? undefined : parseInput(moduleInput, module);
  return read(ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(schema.accessSharingRules)
      .where(
        filter
          ? and(
              eq(schema.accessSharingRules.organizationId, ctx.orgId),
              eq(schema.accessSharingRules.module, filter),
            )
          : eq(schema.accessSharingRules.organizationId, ctx.orgId),
      )
      .orderBy(asc(schema.accessSharingRules.module), asc(schema.accessSharingRules.createdAt));
    return rows.map(toRule);
  });
}

export async function createSharingRule(
  ctx: OrgContext,
  input: SharingRuleInput,
): Promise<SharingRuleDetail> {
  const values = parseInput(ruleBody, input);
  return write(ctx, async (tx) => {
    const [existing] = await tx
      .select({ total: count() })
      .from(schema.accessSharingRules)
      .where(
        and(
          eq(schema.accessSharingRules.organizationId, ctx.orgId),
          eq(schema.accessSharingRules.module, values.module),
        ),
      );
    if ((existing?.total ?? 0) >= MAX_RULES_PER_MODULE) {
      throw new ValidationError(
        { module: [`A module can have at most ${MAX_RULES_PER_MODULE} sharing rules.`] },
        undefined,
        "limit",
      );
    }
    await assertSubject(tx, ctx.orgId, values.sourceKind, values.sourceId, "sourceId");
    await assertSubject(tx, ctx.orgId, values.targetKind, values.targetId, "targetId");
    const [row] = await tx
      .insert(schema.accessSharingRules)
      .values({
        organizationId: ctx.orgId,
        ...values,
        createdBy: ctx.userId,
        modifiedBy: ctx.userId,
      })
      .returning();
    if (!row) throw new Error("Rule insert returned no row");
    return toRule(row);
  });
}

export async function updateSharingRule(
  ctx: OrgContext,
  ruleId: string,
  input: SharingRuleInput,
): Promise<SharingRuleDetail> {
  const id = parseInput(uuid, ruleId);
  const values = parseInput(ruleBody, input);
  return write(ctx, async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.accessSharingRules)
      .where(
        and(
          eq(schema.accessSharingRules.organizationId, ctx.orgId),
          eq(schema.accessSharingRules.id, id),
        ),
      );
    if (!current) throw new NotFoundError();
    if (current.module !== values.module) {
      throw new ValidationError({ module: ["The module of a sharing rule cannot be changed."] });
    }
    await assertSubject(tx, ctx.orgId, values.sourceKind, values.sourceId, "sourceId");
    await assertSubject(tx, ctx.orgId, values.targetKind, values.targetId, "targetId");
    const [row] = await tx
      .update(schema.accessSharingRules)
      .set({ ...values, ...audit(ctx) })
      .where(
        and(
          eq(schema.accessSharingRules.organizationId, ctx.orgId),
          eq(schema.accessSharingRules.id, id),
        ),
      )
      .returning();
    if (!row) throw new NotFoundError();
    return toRule(row);
  });
}

export async function deleteSharingRule(ctx: OrgContext, ruleId: string): Promise<void> {
  const id = parseInput(uuid, ruleId);
  await write(ctx, async (tx) => {
    const removed = await tx
      .delete(schema.accessSharingRules)
      .where(
        and(
          eq(schema.accessSharingRules.organizationId, ctx.orgId),
          eq(schema.accessSharingRules.id, id),
        ),
      )
      .returning({ id: schema.accessSharingRules.id });
    if (!removed.length) throw new NotFoundError();
  });
}

// --------------------------------------------------------- member assignment

export async function listMemberAccess(ctx: OrgContext): Promise<MemberAccessRow[]> {
  return read(ctx, async (tx) => {
    const [org] = await tx
      .select({ owner: schema.organizations.ownerUserId })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, ctx.orgId));
    const rows = await tx
      .select({
        userId: schema.memberAccess.userId,
        name: schema.users.name,
        email: schema.users.email,
        profileId: schema.memberAccess.profileId,
        roleId: schema.memberAccess.roleId,
      })
      .from(schema.memberAccess)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberAccess.userId))
      .where(eq(schema.memberAccess.organizationId, ctx.orgId))
      .orderBy(asc(schema.users.name), asc(schema.users.id));
    return rows.map((r) => ({ ...r, isOwner: r.userId === org?.owner }));
  });
}

const assignInput = z.object({ userId: uuid, profileId: uuid.optional(), roleId: uuid.optional() });

/**
 * Sets a member's profile and/or role. The organisation owner is immutable; a change that
 * would leave no Administrator is rejected (lockout guard).
 */
export async function setMemberAccess(
  ctx: OrgContext,
  input: { userId: string; profileId?: string; roleId?: string },
): Promise<MemberAccessRow> {
  const values = parseInput(assignInput, input);
  await write(ctx, async (tx) => {
    const [org] = await tx
      .select({ owner: schema.organizations.ownerUserId })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, ctx.orgId));
    if (org?.owner === values.userId) {
      throw new ConflictError("The organization owner cannot be changed.");
    }
    const [current] = await tx
      .select()
      .from(schema.memberAccess)
      .where(
        and(
          eq(schema.memberAccess.organizationId, ctx.orgId),
          eq(schema.memberAccess.userId, values.userId),
        ),
      );
    if (!current) throw new NotFoundError();
    const patch: { profileId?: string; roleId?: string } = {};
    let legacy: "admin" | "member" | undefined;
    if (values.profileId && values.profileId !== current.profileId) {
      const profile = await loadProfile(tx, ctx.orgId, values.profileId);
      patch.profileId = profile.id;
      legacy = profile.kind === "administrator" ? "admin" : "member";
    }
    if (values.roleId && values.roleId !== current.roleId) {
      await loadRole(tx, ctx.orgId, values.roleId);
      patch.roleId = values.roleId;
    }
    if (Object.keys(patch).length === 0) return;
    await tx
      .update(schema.memberAccess)
      .set(patch)
      .where(
        and(
          eq(schema.memberAccess.organizationId, ctx.orgId),
          eq(schema.memberAccess.userId, values.userId),
        ),
      );
    if (legacy) {
      await tx
        .update(schema.memberships)
        .set({ role: legacy })
        .where(
          and(
            eq(schema.memberships.organizationId, ctx.orgId),
            eq(schema.memberships.userId, values.userId),
          ),
        );
      const [admins] = await tx
        .select({ total: count() })
        .from(schema.memberAccess)
        .innerJoin(
          schema.accessProfiles,
          and(
            eq(schema.accessProfiles.organizationId, schema.memberAccess.organizationId),
            eq(schema.accessProfiles.id, schema.memberAccess.profileId),
          ),
        )
        .where(
          and(
            eq(schema.memberAccess.organizationId, ctx.orgId),
            eq(schema.accessProfiles.kind, "administrator"),
          ),
        );
      if ((admins?.total ?? 0) < 1) {
        throw new ConflictError("An organization must have an Administrator.");
      }
    }
  });
  const rows = await listMemberAccess(ctx);
  const row = rows.find((r) => r.userId === values.userId);
  if (!row) throw new NotFoundError();
  return row;
}
