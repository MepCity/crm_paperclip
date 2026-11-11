import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./tenancy";

const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const adsSettings = pgTable(
  "ads_settings",
  {
    organizationId: uuid("organization_id").notNull(),
    status: text("status").notNull().default("disconnected"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId] }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
    }).onDelete("cascade"),
    check("ads_settings_status_check", sql`${table.status} = 'disconnected'`),
  ],
);

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
    }).onDelete("cascade"),
    uniqueIndex("ad_campaigns_org_lower_name_idx").on(
      table.organizationId,
      sql`lower(${table.name})`,
    ),
    check("ad_campaigns_status_check", sql`${table.status} in ('active', 'paused')`),
  ],
);

export const adGroups = pgTable(
  "ad_groups",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    campaignId: uuid("campaign_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.campaignId],
      foreignColumns: [adCampaigns.organizationId, adCampaigns.id],
    }).onDelete("cascade"),
    uniqueIndex("ad_groups_org_campaign_lower_name_idx").on(
      table.organizationId,
      table.campaignId,
      sql`lower(${table.name})`,
    ),
    check("ad_groups_status_check", sql`${table.status} in ('active', 'paused')`),
  ],
);

export const adKeywords = pgTable(
  "ad_keywords",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    campaignId: uuid("campaign_id").notNull(),
    adGroupId: uuid("ad_group_id").notNull(),
    name: text("name").notNull(),
    matchType: text("match_type").notNull().default("broad"),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.campaignId],
      foreignColumns: [adCampaigns.organizationId, adCampaigns.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.adGroupId],
      foreignColumns: [adGroups.organizationId, adGroups.id],
    }).onDelete("cascade"),
    uniqueIndex("ad_keywords_org_group_lower_name_idx").on(
      table.organizationId,
      table.adGroupId,
      sql`lower(${table.name})`,
    ),
    check("ad_keywords_match_type_check", sql`${table.matchType} in ('exact', 'phrase', 'broad')`),
    check("ad_keywords_status_check", sql`${table.status} in ('active', 'paused')`),
  ],
);

export const adItems = pgTable(
  "ad_items",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    campaignId: uuid("campaign_id").notNull(),
    adGroupId: uuid("ad_group_id").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.campaignId],
      foreignColumns: [adCampaigns.organizationId, adCampaigns.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.adGroupId],
      foreignColumns: [adGroups.organizationId, adGroups.id],
    }).onDelete("cascade"),
    uniqueIndex("ad_items_org_group_lower_name_idx").on(
      table.organizationId,
      table.adGroupId,
      sql`lower(${table.name})`,
    ),
    check("ad_items_status_check", sql`${table.status} in ('active', 'paused')`),
  ],
);

export const recordAttributions = pgTable(
  "record_attributions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    recordModule: text("record_module").notNull(),
    recordId: text("record_id").notNull(),
    gclid: text("gclid"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    campaignId: uuid("campaign_id"),
    adGroupId: uuid("ad_group_id"),
    keywordId: uuid("keyword_id"),
    adItemId: uuid("ad_item_id"),
    source: text("source").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.campaignId],
      foreignColumns: [adCampaigns.organizationId, adCampaigns.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId, table.adGroupId],
      foreignColumns: [adGroups.organizationId, adGroups.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId, table.keywordId],
      foreignColumns: [adKeywords.organizationId, adKeywords.id],
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId, table.adItemId],
      foreignColumns: [adItems.organizationId, adItems.id],
    }).onDelete("set null"),
    index("record_attributions_org_record_idx").on(
      table.organizationId,
      table.recordModule,
      table.recordId,
    ),
    index("record_attributions_org_campaign_idx").on(table.organizationId, table.campaignId),
    check(
      "record_attributions_module_check",
      sql`${table.recordModule} in ('Leads', 'Contacts', 'Deals', 'Accounts', 'Cases')`,
    ),
    check(
      "record_attributions_source_check",
      sql`${table.source} in ('webform', 'manual', 'conversion')`,
    ),
  ],
);
