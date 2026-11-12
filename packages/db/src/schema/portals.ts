import { sql } from "drizzle-orm";
import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Query-side mapping of `0015_portals.sql` (ADR 0019a). Constraints, RLS and grants live in SQL.
const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const portals = pgTable(
  "portals",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    defaultLanguage: text("default_language").notNull().default("en"),
    createdAt: ts("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);

export const portalUserTypes = pgTable(
  "portal_user_types",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    portalId: uuid("portal_id").notNull(),
    name: text("name").notNull(),
    primaryModule: text("primary_module").notNull().default("Contacts"),
    modules: jsonb("modules").notNull().default(sql`'{}'::jsonb`),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    createdAt: ts("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);

export const portalIdentities = pgTable(
  "portal_identities",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    portalId: uuid("portal_id").notNull(),
    userTypeId: uuid("user_type_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    passwordHash: text("password_hash"),
    recordModule: text("record_module").notNull().default("Contacts"),
    recordId: text("record_id").notNull(),
    status: text("status").notNull().default("invited"),
    lockedUntil: ts("locked_until"),
    lastLoginAt: ts("last_login_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);

export const portalTokens = pgTable(
  "portal_tokens",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    identityId: uuid("identity_id").notNull(),
    kind: text("kind").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdBy: uuid("created_by"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);

export const portalSessions = pgTable(
  "portal_sessions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    identityId: uuid("identity_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
    lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
    clientHash: text("client_hash").notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);

export const portalAuthEvents = pgTable(
  "portal_auth_events",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    portalId: uuid("portal_id").notNull(),
    identityId: uuid("identity_id"),
    kind: text("kind").notNull(),
    clientHash: text("client_hash").notNull().default(""),
    at: ts("at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.id] })],
);
