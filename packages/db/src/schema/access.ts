import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { memberships, organizations } from "./tenancy";

const orgId = () =>
  uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" });
const id = () => uuid("id").notNull().default(sql`uuidv7()`);
const stamps = () => ({
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  modifiedBy: uuid("modified_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accessProfiles = pgTable(
  "access_profiles",
  {
    organizationId: orgId(),
    id: id(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull(),
    permissions: jsonb("permissions").notNull(),
    ...stamps(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.id] }),
    uniqueIndex("access_profiles_name_unique").on(t.organizationId, sql`lower(${t.name})`),
    uniqueIndex("access_profiles_system_kind_unique")
      .on(t.organizationId, t.kind)
      .where(sql`${t.kind} <> 'custom'`),
    check("access_profiles_kind_check", sql`${t.kind} in ('administrator','standard','custom')`),
  ],
);

export const accessFieldPermissions = pgTable(
  "access_field_permissions",
  {
    organizationId: uuid("organization_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    module: text("module").notNull(),
    fieldApiName: text("field_api_name").notNull(),
    access: text("access").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.profileId, t.module, t.fieldApiName] }),
    foreignKey({
      columns: [t.organizationId, t.profileId],
      foreignColumns: [accessProfiles.organizationId, accessProfiles.id],
    }).onDelete("cascade"),
    check("access_field_permissions_access_check", sql`${t.access} in ('read_only','hidden')`),
  ],
);

export const accessRoles = pgTable(
  "access_roles",
  {
    organizationId: orgId(),
    id: id(),
    name: text("name").notNull(),
    parentRoleId: uuid("parent_role_id"),
    shareWithPeers: boolean("share_with_peers").notNull().default(false),
    description: text("description").notNull().default(""),
    ...stamps(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.id] }),
    foreignKey({
      columns: [t.organizationId, t.parentRoleId],
      foreignColumns: [t.organizationId, t.id],
    }).onDelete("restrict"),
    uniqueIndex("access_roles_single_root")
      .on(t.organizationId)
      .where(sql`${t.parentRoleId} is null`),
    uniqueIndex("access_roles_name_unique").on(t.organizationId, sql`lower(${t.name})`),
  ],
);

export const accessGroups = pgTable(
  "access_groups",
  {
    organizationId: orgId(),
    id: id(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    ...stamps(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.id] }),
    uniqueIndex("access_groups_name_unique").on(t.organizationId, sql`lower(${t.name})`),
  ],
);

export const accessGroupMembers = pgTable(
  "access_group_members",
  {
    organizationId: uuid("organization_id").notNull(),
    groupId: uuid("group_id").notNull(),
    memberKind: text("member_kind").notNull(),
    memberId: uuid("member_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.groupId, t.memberKind, t.memberId] }),
    foreignKey({
      columns: [t.organizationId, t.groupId],
      foreignColumns: [accessGroups.organizationId, accessGroups.id],
    }).onDelete("cascade"),
  ],
);

export const accessModuleDefaults = pgTable(
  "access_module_defaults",
  {
    organizationId: orgId(),
    module: text("module").notNull(),
    level: text("level").notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.module] })],
);

export const accessSharingRules = pgTable(
  "access_sharing_rules",
  {
    organizationId: orgId(),
    id: id(),
    module: text("module").notNull(),
    name: text("name").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceId: uuid("source_id").notNull(),
    targetKind: text("target_kind").notNull(),
    targetId: uuid("target_id").notNull(),
    level: text("level").notNull(),
    ...stamps(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.id] }),
    index("access_sharing_rules_module_idx").on(t.organizationId, t.module),
  ],
);

export const memberAccess = pgTable(
  "member_access",
  {
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    roleId: uuid("role_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.userId] }),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.organizationId, t.profileId],
      foreignColumns: [accessProfiles.organizationId, accessProfiles.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.organizationId, t.roleId],
      foreignColumns: [accessRoles.organizationId, accessRoles.id],
    }).onDelete("restrict"),
  ],
);

export const accessVersions = pgTable("access_versions", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  version: bigint("version", { mode: "number" }).notNull().default(1),
});
