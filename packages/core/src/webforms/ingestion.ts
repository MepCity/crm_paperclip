import { createHash } from "node:crypto";
import { schema as dbSchema } from "@crm/db";
import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";
import { writeRecordAttribution } from "../ads/service";
import { matchesCondition } from "../approvals/criteria";
import type { ProcessCondition } from "../approvals/types";
import { getDb } from "../database";
import { ConflictError, ValidationError } from "../errors";
import type { JobQueue } from "../jobs/types";
import { createJourneysService } from "../journeys";
import type { ActorRef, RecordData } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import { fixtureModules } from "../records/fixture/registry";
import { isValidDateOnly } from "../records/fixture/validation";
import { OPEN_PICKLIST_FIELDS } from "../records/picklist-policy";
import { systemOrgContext, withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { checkRateLimit, consumeRenderToken, type RateLimitCheckResult } from "./rate-limit";
import { computeClientHash, verifyChallenge, verifyRenderToken } from "./tokens";
import type {
  Webform,
  WebformField,
  WebformLocation,
  WebformModule,
  WebformSettings,
  WebformVersion,
} from "./types";
import { isSameOrigin, normalizeOrigin, webformSettingsSchema } from "./validation";

export const WEBFORM_AUTO_RESPONSE_JOB_KIND = "webform.auto_response";
export const WEBFORM_AUTO_RESPONSE_JOB_VERSION = 1;

const STOCK_FIELD_TR_LABELS: Record<string, string> = {
  Last_Name: "Soyadı",
  Company: "Şirket",
  First_Name: "Adı",
  Email: "E-posta",
  Phone: "Telefon",
  Mobile: "Cep Telefonu",
  Subject: "Konu",
  Status: "Durum",
  Case_Origin: "Servis Dosyası Kaynağı",
  Priority: "Öncelik",
  Type: "Tür",
  Case_Reason: "Servis Dosyası Nedeni",
  Lead_Source: "Müşteri Adayı Kaynağı",
  Lead_Status: "Müşteri Adayı Durumu",
  Account_Name: "Firma Adı",
};

export function hashPublicKey(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("base64url");
}

function mapVersion(row: typeof dbSchema.webformVersions.$inferSelect): WebformVersion {
  return {
    id: row.id,
    organizationId: row.organizationId,
    formId: row.formId,
    number: row.number,
    state: row.state as WebformVersion["state"],
    fields: (row.fields as WebformField[]) ?? [],
    settings: (row.settings as WebformSettings) ?? webformSettingsSchema.parse({}),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    publishedBy: row.publishedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapForm(row: typeof dbSchema.webforms.$inferSelect): Webform {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    module: row.module as WebformModule,
    status: row.status as Webform["status"],
    draftVersionId: row.draftVersionId,
    publishedVersionId: row.publishedVersionId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

function mapLocation(row: typeof dbSchema.webformLocations.$inferSelect): WebformLocation {
  return {
    organizationId: row.organizationId,
    formId: row.formId,
    origin: row.origin,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ResolvedPublicForm {
  orgId: string;
  form: Webform;
  version: WebformVersion;
  locations: WebformLocation[];
}

export async function resolvePublicForm(publicKey: string): Promise<ResolvedPublicForm | null> {
  const keyHash = hashPublicKey(publicKey);

  // 1. Hash lookup in public_endpoint_keys (crm_auth boundary, no org id from client)
  const [keyRow] = await getDb()
    .select()
    .from(dbSchema.publicEndpointKeys)
    .where(
      and(
        eq(dbSchema.publicEndpointKeys.keyHash, keyHash),
        eq(dbSchema.publicEndpointKeys.kind, "webform"),
        isNull(dbSchema.publicEndpointKeys.revokedAt),
      ),
    );

  if (!keyRow) return null;

  // 2. Normal tenant-local crm_app transaction under RLS
  const ctx: OrgContext = {
    orgId: keyRow.organizationId,
    orgSlug: "public-access",
    orgName: "Public Webform Access",
    userId: "00000000-0000-0000-0000-000000000000",
    role: "member",
  };

  return withOrg(ctx, async (tx) => {
    const [formRow] = await tx
      .select()
      .from(dbSchema.webforms)
      .where(
        and(
          eq(dbSchema.webforms.organizationId, keyRow.organizationId),
          eq(dbSchema.webforms.id, keyRow.targetId),
        ),
      );

    // Inactive / never-published / draft -> null (form unavailable)
    if (formRow?.status !== "active" || !formRow.publishedVersionId) {
      return null;
    }

    const [versionRow] = await tx
      .select()
      .from(dbSchema.webformVersions)
      .where(
        and(
          eq(dbSchema.webformVersions.organizationId, keyRow.organizationId),
          eq(dbSchema.webformVersions.id, formRow.publishedVersionId),
        ),
      );

    if (!versionRow) return null;

    const locations = await tx
      .select()
      .from(dbSchema.webformLocations)
      .where(
        and(
          eq(dbSchema.webformLocations.organizationId, keyRow.organizationId),
          eq(dbSchema.webformLocations.formId, formRow.id),
        ),
      );

    return {
      orgId: keyRow.organizationId,
      form: mapForm(formRow),
      version: mapVersion(versionRow),
      locations: locations.map(mapLocation),
    };
  });
}

export async function recordVisit(
  orgId: string,
  formId: string,
  location: string,
  now = new Date(),
): Promise<void> {
  const day = now.toISOString().slice(0, 10);
  const ctx: OrgContext = {
    orgId,
    orgSlug: "public",
    orgName: "Public",
    userId: "00000000-0000-0000-0000-000000000000",
    role: "member",
  };

  await withOrg(ctx, async (tx) => {
    await tx
      .insert(dbSchema.webformDailyStats)
      .values({
        organizationId: orgId,
        formId,
        day,
        location,
        visits: 1,
      })
      .onConflictDoUpdate({
        target: [
          dbSchema.webformDailyStats.organizationId,
          dbSchema.webformDailyStats.formId,
          dbSchema.webformDailyStats.day,
          dbSchema.webformDailyStats.location,
        ],
        set: { visits: sql`${dbSchema.webformDailyStats.visits} + 1` },
      });
  });
}

export interface SubmissionInput {
  publicKey: string;
  data: Record<string, unknown>;
  origin?: string | null;
  referer?: string | null;
  isHostedRoute?: boolean;
  appOrigin?: string | null;
  ip: string;
  now?: Date;
  queue?: JobQueue;
}

export type SubmissionOutcome =
  | "accepted"
  | "invalid"
  | "spam"
  | "duplicate_pending_approval"
  | "pending_approval"
  | "pending_double_opt_in"
  | "rejected_location"
  | "rate_limited"
  | "unavailable";

export interface SubmissionResult {
  outcome: SubmissionOutcome;
  recordId?: string;
  acknowledgement?: WebformSettings["acknowledgement"];
  errors?: Record<string, string[]>;
  error?: string;
  rateLimit?: RateLimitCheckResult;
}

export function resolveLocation(params: {
  origin?: string | null;
  referer?: string | null;
  isHostedRoute?: boolean;
  restrictLocations: boolean;
  allowedLocations: WebformLocation[];
  appOrigin?: string | null;
}): { location: string; allowed: boolean; isAllowedOrigin: boolean } {
  let isHosted = Boolean(params.isHostedRoute);

  let effectiveAppOrigin: string | null = null;
  if (params.appOrigin) {
    try {
      effectiveAppOrigin = new URL(params.appOrigin).origin;
    } catch {
      effectiveAppOrigin = null;
    }
  } else if (process.env.APP_URL) {
    try {
      effectiveAppOrigin = new URL(process.env.APP_URL).origin;
    } catch {
      effectiveAppOrigin = null;
    }
  }

  // Origin header takes precedence: if Origin is present, it must match appOrigin to be considered hosted.
  if (isHosted && params.origin) {
    if (!effectiveAppOrigin || !isSameOrigin(params.origin, effectiveAppOrigin)) {
      isHosted = false;
    }
  }

  // If referer is present, its origin must also match appOrigin to be considered hosted.
  if (isHosted && params.referer) {
    if (!effectiveAppOrigin || !isSameOrigin(params.referer, effectiveAppOrigin)) {
      isHosted = false;
    }
  }

  if (isHosted) {
    return { location: "hosted", allowed: true, isAllowedOrigin: true };
  }

  let rawOrigin = params.origin;
  if (!rawOrigin && params.referer) {
    try {
      rawOrigin = new URL(params.referer).origin;
    } catch {
      rawOrigin = null;
    }
  }

  if (!rawOrigin) {
    if (params.restrictLocations) {
      return { location: "undefined", allowed: false, isAllowedOrigin: false };
    }
    return { location: "undefined", allowed: true, isAllowedOrigin: false };
  }

  let normalized: string;
  try {
    normalized = normalizeOrigin(rawOrigin);
  } catch {
    normalized = rawOrigin;
  }

  const isAllowedOrigin = params.allowedLocations.some(
    (l) => l.origin.toLowerCase() === normalized.toLowerCase(),
  );

  if (params.restrictLocations) {
    if (!isAllowedOrigin) {
      return { location: normalized, allowed: false, isAllowedOrigin: false };
    }
    return { location: normalized, allowed: true, isAllowedOrigin: true };
  }

  return {
    location: isAllowedOrigin ? normalized : "undefined",
    allowed: true,
    isAllowedOrigin,
  };
}

export async function submitWebform(input: SubmissionInput): Promise<SubmissionResult> {
  const now = input.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const clientHash = computeClientHash(input.ip);

  // 1. Tenant resolution (hash lookup in crm_auth boundary)
  const resolved = await resolvePublicForm(input.publicKey);
  if (!resolved) {
    return { outcome: "unavailable" };
  }

  const { orgId, form, version: publishedVersion, locations } = resolved;
  const ctx: OrgContext = {
    orgId,
    orgSlug: "public-submission",
    orgName: "Public Submission",
    userId: "00000000-0000-0000-0000-000000000000",
    role: "member",
  };

  return withOrg(ctx, async (tx) => {
    // Helper to increment daily stats
    const incrementStats = async (
      column: keyof typeof dbSchema.webformDailyStats.$inferSelect,
      loc: string,
    ) => {
      await tx
        .insert(dbSchema.webformDailyStats)
        .values({
          organizationId: orgId,
          formId: form.id,
          day,
          location: loc,
          [column]: 1,
        })
        .onConflictDoUpdate({
          target: [
            dbSchema.webformDailyStats.organizationId,
            dbSchema.webformDailyStats.formId,
            dbSchema.webformDailyStats.day,
            dbSchema.webformDailyStats.location,
          ],
          set: { [column]: sql`${dbSchema.webformDailyStats[column]} + 1` },
        });
    };

    // 2. Rate limit check (fixed window in public_rate_limits per ADR 0019 §3.5)
    const rateLimitCheck = await checkRateLimit(tx, {
      orgId,
      formId: form.id,
      clientHash,
      isRender: false,
      now,
    });

    if (!rateLimitCheck.allowed) {
      const loc = input.isHostedRoute ? "hosted" : "undefined";
      await incrementStats("rateLimited", loc);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: publishedVersion.id,
        location: loc,
        outcome: "rate_limited",
        clientHash,
        payload: null,
      });
      return { outcome: "rate_limited", rateLimit: rateLimitCheck };
    }

    // 3. Location check (§3.6)
    const locResult = resolveLocation({
      origin: input.origin,
      referer: input.referer,
      isHostedRoute: input.isHostedRoute,
      restrictLocations: publishedVersion.settings.restrictLocations,
      allowedLocations: locations,
      appOrigin: input.appOrigin,
    });

    if (!locResult.allowed) {
      await incrementStats("rejectedLocation", locResult.location);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: publishedVersion.id,
        location: locResult.location,
        outcome: "rejected_location",
        clientHash,
        payload: null,
      });
      return { outcome: "rejected_location" };
    }

    const submissionLocation = locResult.location;

    // 4. Token & Spam check (§3.4, §3.5)
    const rawToken = input.data._token;
    if (typeof rawToken !== "string" || !rawToken) {
      await incrementStats("invalid", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: publishedVersion.id,
        location: submissionLocation,
        outcome: "invalid",
        clientHash,
        payload: null,
      });
      return { outcome: "invalid", error: "Missing or invalid form token" };
    }

    const tokenRes = verifyRenderToken(rawToken);
    if (!tokenRes.ok || tokenRes.payload.orgId !== orgId || tokenRes.payload.formId !== form.id) {
      await incrementStats("invalid", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: publishedVersion.id,
        location: submissionLocation,
        outcome: "invalid",
        clientHash,
        payload: null,
      });
      return { outcome: "invalid", error: "Invalid form token" };
    }

    // Version in token check (§3.2):
    // Accepted if version is published or was superseded < 2 h ago
    let activeVersion = publishedVersion;
    if (tokenRes.payload.versionId !== publishedVersion.id) {
      const [vRow] = await tx
        .select()
        .from(dbSchema.webformVersions)
        .where(
          and(
            eq(dbSchema.webformVersions.organizationId, orgId),
            eq(dbSchema.webformVersions.id, tokenRes.payload.versionId),
          ),
        );

      if (vRow?.state !== "superseded") {
        await incrementStats("invalid", submissionLocation);
        return { outcome: "invalid", error: "Version expired or not found" };
      }

      // Check if superseded < 2 h ago (token lifetime)
      const supersededAge = now.getTime() - tokenRes.payload.issuedAt;
      if (supersededAge > 2 * 60 * 60 * 1000) {
        await incrementStats("invalid", submissionLocation);
        return { outcome: "invalid", error: "Superseded version token expired" };
      }

      activeVersion = mapVersion(vRow);
    }

    // Spam evaluation (§3.5):
    // Spam = honeypot filled, token older than 2 h or younger than 2 s, wrong challenge answer
    let isSpam = false;

    // Honeypot check
    const honeypotVal = input.data._hp;
    if (honeypotVal !== undefined && honeypotVal !== null && String(honeypotVal).trim() !== "") {
      isSpam = true;
    }

    // Token age check: 2 s – 2 h validity
    const tokenAgeMs = now.getTime() - tokenRes.payload.issuedAt;
    if (tokenAgeMs < 2000 || tokenAgeMs > 2 * 60 * 60 * 1000) {
      isSpam = true;
    }

    // Challenge check
    if (activeVersion.settings.challenge) {
      const challengeAnswer =
        typeof input.data._challenge === "string" ? input.data._challenge : "";
      if (!verifyChallenge(challengeAnswer, tokenRes.payload.challengeHash)) {
        isSpam = true;
      }
    }

    if (isSpam) {
      await incrementStats("spam", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "spam",
        clientHash,
        payload: null,
      });
      // Normal success response (no oracle)
      return { outcome: "spam", acknowledgement: activeVersion.settings.acknowledgement };
    }

    // 5. Input allowlist, hidden-field defaults and validation (§3.4)
    const visibleFields = activeVersion.fields.filter((f) => !f.hidden);
    const hiddenFields = activeVersion.fields.filter((f) => f.hidden);

    const allowedKeys = new Set<string>([
      ...activeVersion.fields.map((f) => f.fieldApiName),
      "_token",
      "_challenge",
      "_hp",
    ]);

    const fieldErrors: Record<string, string[]> = {};

    const ATTRIBUTION_KEYS = [
      "gclid",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ] as const;

    for (const k of ATTRIBUTION_KEYS) {
      allowedKeys.add(k);
    }

    if (activeVersion.settings.captureAttribution) {
      for (const k of ATTRIBUTION_KEYS) {
        const val = input.data[k];
        if (typeof val === "string" && val.length > 255) {
          fieldErrors[k] = [`${k} değeri çok uzun.`];
        }
      }
    }

    // Check for unexpected extra keys
    for (const key of Object.keys(input.data)) {
      if (!allowedKeys.has(key)) {
        await incrementStats("invalid", submissionLocation);
        await tx.insert(dbSchema.webformSubmissions).values({
          organizationId: orgId,
          formId: form.id,
          versionId: activeVersion.id,
          location: submissionLocation,
          outcome: "invalid",
          clientHash,
          payload: null,
        });
        return {
          outcome: "invalid",
          errors: { [key]: [`'${key}' beklenmeyen bir alan.`] },
        };
      }
    }

    // Prepare submitted values
    const sanitizedRecordInput: Record<string, unknown> = {};
    const bundle = fixtureModules[form.module];
    const fieldDefs = bundle?.metadata.fields ?? [];
    const fieldDefMap = new Map(fieldDefs.map((f) => [f.apiName, f]));

    // 1) Visible fields
    for (const field of visibleFields) {
      const fieldDef = fieldDefMap.get(field.fieldApiName);
      const isEnglishStock =
        field.label === field.fieldApiName || (fieldDef && field.label === fieldDef.label);
      const fieldLabel = isEnglishStock
        ? (STOCK_FIELD_TR_LABELS[field.fieldApiName] ?? field.label)
        : field.label;

      const val = input.data[field.fieldApiName];
      const stringVal = typeof val === "string" ? val.trim() : val;
      const isEmpty = stringVal === undefined || stringVal === null || stringVal === "";

      if (field.required && isEmpty) {
        fieldErrors[field.fieldApiName] = [`${fieldLabel} zorunludur.`];
      } else if (!isEmpty) {
        if (fieldDef?.picklist) {
          const isAllowed =
            OPEN_PICKLIST_FIELDS.has(field.fieldApiName) ||
            fieldDef.picklist.some(
              (opt) => opt.storedValue === stringVal || opt.displayValue === stringVal,
            );
          if (!isAllowed) {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} için geçerli bir seçenek seçin.`];
          } else {
            const match = fieldDef.picklist.find(
              (opt) => opt.storedValue === stringVal || opt.displayValue === stringVal,
            );
            sanitizedRecordInput[field.fieldApiName] = match?.storedValue ?? stringVal;
          }
        } else if (fieldDef?.dataType === "integer") {
          if (typeof val === "number" && Number.isSafeInteger(val)) {
            sanitizedRecordInput[field.fieldApiName] = val;
          } else if (typeof val === "string" && /^-?\d+$/.test(val.trim())) {
            sanitizedRecordInput[field.fieldApiName] = parseInt(val.trim(), 10);
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir tam sayı olmalı.`];
          }
        } else if (
          fieldDef?.dataType === "double" ||
          fieldDef?.dataType === "currency" ||
          fieldDef?.dataType === "bigint"
        ) {
          if (typeof val === "number" && Number.isFinite(val)) {
            sanitizedRecordInput[field.fieldApiName] = val;
          } else if (
            typeof val === "string" &&
            val.trim() !== "" &&
            !Number.isNaN(Number(val.trim()))
          ) {
            sanitizedRecordInput[field.fieldApiName] = Number(val.trim());
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir sayı olmalı.`];
          }
        } else if (fieldDef?.dataType === "date") {
          const dateStr = String(val).trim();
          if (isValidDateOnly(dateStr)) {
            sanitizedRecordInput[field.fieldApiName] = dateStr;
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir tarih olmalı.`];
          }
        } else if (fieldDef?.dataType === "datetime") {
          const dtStr = String(val).trim();
          if (
            /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(dtStr) &&
            Number.isFinite(Date.parse(dtStr))
          ) {
            sanitizedRecordInput[field.fieldApiName] = dtStr;
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir tarih ve saat olmalı.`];
          }
        } else if (fieldDef?.dataType === "email") {
          const emailStr = String(val).trim();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
            sanitizedRecordInput[field.fieldApiName] = emailStr;
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir e-posta olmalı.`];
          }
        } else if (fieldDef?.dataType === "boolean") {
          if (typeof val === "boolean") {
            sanitizedRecordInput[field.fieldApiName] = val;
          } else if (val === "true" || val === "on" || val === "1") {
            sanitizedRecordInput[field.fieldApiName] = true;
          } else if (val === "false" || val === "0" || val === "") {
            sanitizedRecordInput[field.fieldApiName] = false;
          } else {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} geçerli bir mantıksal değer olmalı.`];
          }
        } else {
          const str = typeof val === "string" ? val.trim() : String(val);
          if (fieldDef?.maxLength && str.length > fieldDef.maxLength) {
            fieldErrors[field.fieldApiName] = [`${fieldLabel} değeri çok uzun.`];
          } else {
            sanitizedRecordInput[field.fieldApiName] = str;
          }
        }
      }
    }

    // 2) Hidden fields: take server defaults, client values ignored
    for (const field of hiddenFields) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        sanitizedRecordInput[field.fieldApiName] = field.defaultValue;
      }
    }

    // Return 422 if required fields missing or typed validations failed
    if (Object.keys(fieldErrors).length > 0) {
      await incrementStats("invalid", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "invalid",
        clientHash,
        payload: null,
      });
      return { outcome: "invalid", errors: fieldErrors };
    }

    // A solved challenge token is single-use. It is consumed only once the input is valid, so a
    // visitor who fixes a validation error can resubmit with the same token; a replay is spam.
    if (
      activeVersion.settings.challenge &&
      tokenRes.payload.challengeHash &&
      !(await consumeRenderToken(tx, orgId, rawToken, tokenRes.payload.issuedAt))
    ) {
      await incrementStats("spam", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "spam",
        clientHash,
        payload: null,
      });
      return { outcome: "spam", acknowledgement: activeVersion.settings.acknowledgement };
    }

    // 6. Duplicate check (§3.7)
    // Run unique-field check before create
    let isDuplicate = false;

    if (bundle) {
      const uniqueFieldNames = new Set<string>(
        bundle.metadata.fields
          .filter((f: { unique?: boolean }) => Boolean(f.unique))
          .map((f: { apiName: string }) => f.apiName),
      );
      if (form.module === "Leads" || form.module === "Contacts") {
        uniqueFieldNames.add("Email");
      }

      if (uniqueFieldNames.size > 0) {
        // Query existing records in module for matching unique field
        const recordsService = createFixtureRecordService(ctx);
        const defaultViewId =
          bundle.views.find((v) => v.isDefault)?.id ??
          bundle.views[0]?.id ??
          `all-${form.module.toLowerCase()}`;

        for (const fieldName of uniqueFieldNames) {
          const submittedVal = sanitizedRecordInput[fieldName];
          if (submittedVal !== undefined && submittedVal !== null && submittedVal !== "") {
            const count = await recordsService.count(form.module, {
              viewId: defaultViewId,
              filters: {
                groupOperator: "and",
                group: [
                  {
                    field: fieldName,
                    comparator: "equal",
                    value: submittedVal as string,
                  },
                ],
              },
            });
            if (count > 0) {
              isDuplicate = true;
              break;
            }
          }
        }
      }
    }

    if (isDuplicate) {
      await incrementStats("duplicatePendingApproval", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "duplicate_pending_approval",
        clientHash,
        payload: sanitizedRecordInput,
      });
      // Duplicate receives the same acknowledgement
      return {
        outcome: "duplicate_pending_approval",
        acknowledgement: activeVersion.settings.acknowledgement,
      };
    }

    // 7. Approval & Double Opt-In Gate (§3.7)
    if (activeVersion.settings.approval === "all") {
      await incrementStats("pendingApproval", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "pending_approval",
        clientHash,
        payload: sanitizedRecordInput,
      });
      return {
        outcome: "pending_approval",
        acknowledgement: activeVersion.settings.acknowledgement,
      };
    }

    if (activeVersion.settings.doubleOptIn) {
      await incrementStats("pendingDoubleOptIn", submissionLocation);
      await tx.insert(dbSchema.webformSubmissions).values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "pending_double_opt_in",
        clientHash,
        payload: sanitizedRecordInput,
      });
      return {
        outcome: "pending_double_opt_in",
        acknowledgement: activeVersion.settings.acknowledgement,
      };
    }

    // 8. Create record via Bounded Principal ActorRef (§3.1, §3.8)
    // Resolve owner
    let ownerId = form.createdBy;
    if (activeVersion.settings.ownerKind === "user" && activeVersion.settings.ownerRef?.trim()) {
      const [memberRow] = await tx
        .select({ userId: dbSchema.memberships.userId })
        .from(dbSchema.memberships)
        .where(
          and(
            eq(dbSchema.memberships.organizationId, orgId),
            eq(dbSchema.memberships.userId, activeVersion.settings.ownerRef),
          ),
        );
      if (memberRow) ownerId = memberRow.userId;
    } else if (activeVersion.settings.ownerKind === "assignment_rule") {
      // Fallback creator if assignment rule cannot resolve user
      ownerId = form.createdBy;
    }

    const allVersionFields = new Set<string>([
      ...activeVersion.fields.map((f) => f.fieldApiName),
      "Owner",
    ]);

    const actor: ActorRef = {
      kind: "webform",
      formId: form.id,
      versionId: activeVersion.id,
      module: form.module,
      allowedFields: allVersionFields,
      formName: form.name,
    };

    const recordService = createFixtureRecordService(ctx, {
      actor,
      listMemberIds: async () => {
        const rows = await tx
          .select({ userId: dbSchema.memberships.userId })
          .from(dbSchema.memberships)
          .where(eq(dbSchema.memberships.organizationId, orgId));
        return rows.map((r) => r.userId);
      },
    });
    const createPayload = { ...sanitizedRecordInput, Owner: ownerId };

    let createdRecord: RecordData;
    try {
      createdRecord = await recordService.create(form.module, createPayload);
    } catch (err) {
      if (err instanceof ConflictError) {
        await incrementStats("duplicatePendingApproval", submissionLocation);
        await tx.insert(dbSchema.webformSubmissions).values({
          organizationId: orgId,
          formId: form.id,
          versionId: activeVersion.id,
          location: submissionLocation,
          outcome: "duplicate_pending_approval",
          clientHash,
          payload: sanitizedRecordInput,
        });
        return {
          outcome: "duplicate_pending_approval",
          acknowledgement: activeVersion.settings.acknowledgement,
        };
      }
      if (
        err instanceof ValidationError ||
        (typeof err === "object" && err !== null && "fieldErrors" in err)
      ) {
        await incrementStats("invalid", submissionLocation);
        await tx.insert(dbSchema.webformSubmissions).values({
          organizationId: orgId,
          formId: form.id,
          versionId: activeVersion.id,
          location: submissionLocation,
          outcome: "invalid",
          clientHash,
          payload: null,
        });
        const errs = (err as ValidationError).fieldErrors ?? {
          form: [(err as Error).message || "Doğrulama başarısız."],
        };
        return {
          outcome: "invalid",
          errors: errs,
        };
      }
      if (
        err instanceof Error &&
        (err.name === "ValidationError" || err.message.toLowerCase().includes("validation"))
      ) {
        await incrementStats("invalid", submissionLocation);
        await tx.insert(dbSchema.webformSubmissions).values({
          organizationId: orgId,
          formId: form.id,
          versionId: activeVersion.id,
          location: submissionLocation,
          outcome: "invalid",
          clientHash,
          payload: null,
        });
        return {
          outcome: "invalid",
          errors: { form: [err.message] },
        };
      }
      throw err;
    }

    // Write webform_submissions + webform_daily_stats
    await incrementStats("accepted", submissionLocation);
    const [submissionRow] = await tx
      .insert(dbSchema.webformSubmissions)
      .values({
        organizationId: orgId,
        formId: form.id,
        versionId: activeVersion.id,
        location: submissionLocation,
        outcome: "accepted",
        recordModule: form.module,
        recordId: createdRecord.id,
        payload: null,
        clientHash,
        notificationState: "none",
      })
      .returning();

    if (!submissionRow) {
      throw new Error("Failed to insert submission record");
    }

    // Write record_attributions if captureAttribution is enabled and attribution params are present
    if (activeVersion.settings.captureAttribution) {
      const gclid = typeof input.data.gclid === "string" ? input.data.gclid.trim() : null;
      const utmSource =
        typeof input.data.utm_source === "string" ? input.data.utm_source.trim() : null;
      const utmMedium =
        typeof input.data.utm_medium === "string" ? input.data.utm_medium.trim() : null;
      const utmCampaign =
        typeof input.data.utm_campaign === "string" ? input.data.utm_campaign.trim() : null;
      const utmTerm = typeof input.data.utm_term === "string" ? input.data.utm_term.trim() : null;
      const utmContent =
        typeof input.data.utm_content === "string" ? input.data.utm_content.trim() : null;

      const hasAttribution = Boolean(
        gclid || utmSource || utmMedium || utmCampaign || utmTerm || utmContent,
      );

      if (hasAttribution) {
        await writeRecordAttribution(tx, orgId, {
          recordModule: form.module,
          recordId: createdRecord.id,
          gclid: gclid || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmTerm: utmTerm || null,
          utmContent: utmContent || null,
          source: "webform",
        });
      }
    }

    // 9. After create (§3.8)
    let notificationState: "none" | "queued" | "sent" | "failed" = "none";
    try {
      // Owner notification
      if (activeVersion.settings.notifyOwner) {
        await tx.insert(dbSchema.notifications).values({
          organizationId: orgId,
          recipientUserId: ownerId,
          kind: "webform_submission",
          subject: {
            formId: form.id,
            formName: form.name,
            recordModule: form.module,
            recordId: createdRecord.id,
            submissionId: submissionRow.id,
          },
        });
        notificationState = "queued";
      }

      // Auto-response rules
      const autoRules = await tx
        .select()
        .from(dbSchema.webformAutoResponseRules)
        .where(
          and(
            eq(dbSchema.webformAutoResponseRules.organizationId, orgId),
            eq(dbSchema.webformAutoResponseRules.module, form.module),
            eq(dbSchema.webformAutoResponseRules.active, true),
          ),
        )
        .orderBy(asc(dbSchema.webformAutoResponseRules.position));

      // Extract submitted email address
      const submittedEmail =
        typeof sanitizedRecordInput.Email === "string" ? sanitizedRecordInput.Email.trim() : null;

      if (autoRules.length > 0 && submittedEmail) {
        // Frequency check: at most 1 per recipient per form per 24 h
        const limitBucket = `auto_resp:${form.id}:${submittedEmail.toLowerCase()}`;
        const dayMs = 24 * 60 * 60 * 1000;
        const windowStartDay = new Date(Math.floor(now.getTime() / dayMs) * dayMs);

        const [existingLimit] = await tx
          .select({ count: dbSchema.publicRateLimits.count })
          .from(dbSchema.publicRateLimits)
          .where(
            and(
              eq(dbSchema.publicRateLimits.organizationId, orgId),
              eq(dbSchema.publicRateLimits.bucket, limitBucket),
              eq(dbSchema.publicRateLimits.windowStart, windowStartDay),
            ),
          );

        if (!existingLimit) {
          // Find first matching active rule
          for (const rule of autoRules) {
            const matches = matchesCondition(
              createdRecord.fields,
              rule.criteria as ProcessCondition,
            );
            if (matches) {
              // Record frequency limit mark
              await tx.insert(dbSchema.publicRateLimits).values({
                organizationId: orgId,
                bucket: limitBucket,
                windowStart: windowStartDay,
                count: 1,
              });

              // Enqueue auto-response job
              if (input.queue) {
                await input.queue.enqueue(
                  { organizationId: orgId },
                  {
                    kind: WEBFORM_AUTO_RESPONSE_JOB_KIND,
                    payloadVersion: WEBFORM_AUTO_RESPONSE_JOB_VERSION,
                    payload: {
                      submissionId: submissionRow.id,
                      ruleId: rule.id,
                    },
                    idempotencyKey: submissionRow.id,
                  },
                );
              }
              notificationState = "queued";
              break;
            }
          }
        }
      }

      if (notificationState !== "none") {
        await tx
          .update(dbSchema.webformSubmissions)
          .set({ notificationState })
          .where(
            and(
              eq(dbSchema.webformSubmissions.organizationId, orgId),
              eq(dbSchema.webformSubmissions.id, submissionRow.id),
            ),
          );
      }

      // Journey trigger: webform_submitted
      try {
        const journeyService = createJourneysService();
        await journeyService.handleWebformSubmitted(systemOrgContext(orgId, ownerId), {
          formId: form.id,
          recordModule: form.module,
          recordId: createdRecord.id,
          record: createdRecord,
        });
      } catch (err) {
        console.error("Webform journey trigger failed", err);
      }
    } catch (err) {
      console.error("Webform after-create notification failed", err);
      // Failures set notification_state = failed; the record stays
      await tx
        .update(dbSchema.webformSubmissions)
        .set({ notificationState: "failed" })
        .where(
          and(
            eq(dbSchema.webformSubmissions.organizationId, orgId),
            eq(dbSchema.webformSubmissions.id, submissionRow.id),
          ),
        );
      notificationState = "failed";
    }

    return {
      outcome: "accepted",
      recordId: createdRecord.id,
      acknowledgement: activeVersion.settings.acknowledgement,
    };
  });
}

export async function purgeOldPendingWebformSubmissions(
  tx: Transaction,
  olderThanMs = 30 * 24 * 60 * 60 * 1000,
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const result = await tx
    .update(dbSchema.webformSubmissions)
    .set({ payload: null })
    .where(
      and(
        lt(dbSchema.webformSubmissions.createdAt, cutoff),
        sql`${dbSchema.webformSubmissions.payload} IS NOT NULL`,
      ),
    );
  return result.rowCount ?? 0;
}
