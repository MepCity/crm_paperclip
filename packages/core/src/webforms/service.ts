import { createHash, randomBytes } from "node:crypto";
import { schema } from "@crm/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { fixtureModules } from "../records/fixture/registry";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import type {
  EligibleField,
  Webform,
  WebformAutoResponseRule,
  WebformDetail,
  WebformField,
  WebformLocation,
  WebformModule,
  WebformSettings,
  WebformVersion,
} from "./types";
import {
  isFieldEligible,
  MAX_LOCATIONS_PER_FORM,
  normalizeOrigin,
  validateForPublish,
  webformSettingsSchema,
} from "./validation";

export function getEligibleFieldsForModule(module: WebformModule): EligibleField[] {
  const bundle = fixtureModules[module];
  if (!bundle) return [];
  return bundle.metadata.fields.filter(isFieldEligible).map((f) => ({
    apiName: f.apiName,
    label: f.label,
    dataType: f.dataType,
    required: Boolean(f.required),
    readOnly: Boolean(f.readOnly),
    picklistOptions: f.picklist,
  }));
}

function hashPublicKey(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("base64url");
}

function generateRawPublicKey(): string {
  // 128-bit random base64url string
  return randomBytes(16).toString("base64url");
}

function mapVersion(row: typeof schema.webformVersions.$inferSelect): WebformVersion {
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

function mapForm(row: typeof schema.webforms.$inferSelect): Webform {
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

function mapLocation(row: typeof schema.webformLocations.$inferSelect): WebformLocation {
  return {
    organizationId: row.organizationId,
    formId: row.formId,
    origin: row.origin,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAutoResponseRule(
  row: typeof schema.webformAutoResponseRules.$inferSelect,
): WebformAutoResponseRule {
  return {
    id: row.id,
    organizationId: row.organizationId,
    module: row.module as WebformModule,
    name: row.name,
    criteria: row.criteria as WebformAutoResponseRule["criteria"],
    templateId: row.templateId,
    position: row.position,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

export function createWebformService() {
  return {
    getEligibleFields(module: WebformModule): EligibleField[] {
      return getEligibleFieldsForModule(module);
    },

    async listForms(ctx: OrgContext): Promise<Webform[]> {
      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select()
          .from(schema.webforms)
          .where(eq(schema.webforms.organizationId, ctx.orgId))
          .orderBy(desc(schema.webforms.createdAt));
        return rows.map(mapForm);
      });
    },

    async getForm(ctx: OrgContext, formId: string): Promise<WebformDetail> {
      return withOrg(ctx, async (tx) => {
        const [formRow] = await tx
          .select()
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!formRow) throw new NotFoundError("Webform not found");

        const versions = await tx
          .select()
          .from(schema.webformVersions)
          .where(
            and(
              eq(schema.webformVersions.organizationId, ctx.orgId),
              eq(schema.webformVersions.formId, formId),
            ),
          );

        const draftVersionRow = formRow.draftVersionId
          ? versions.find((v) => v.id === formRow.draftVersionId)
          : null;
        const publishedVersionRow = formRow.publishedVersionId
          ? versions.find((v) => v.id === formRow.publishedVersionId)
          : null;

        const locations = await tx
          .select()
          .from(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
            ),
          );

        const [keyRow] = await tx
          .select()
          .from(schema.publicEndpointKeys)
          .where(
            and(
              eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
              eq(schema.publicEndpointKeys.kind, "webform"),
              eq(schema.publicEndpointKeys.targetId, formId),
              isNull(schema.publicEndpointKeys.revokedAt),
            ),
          );

        return {
          ...mapForm(formRow),
          draftVersion: draftVersionRow ? mapVersion(draftVersionRow) : null,
          publishedVersion: publishedVersionRow ? mapVersion(publishedVersionRow) : null,
          locations: locations.map(mapLocation),
          hasActivePublicKey: Boolean(keyRow),
        };
      });
    },

    async createForm(
      ctx: OrgContext,
      input: { name: string; module: WebformModule },
    ): Promise<WebformDetail> {
      return withOrg(ctx, async (tx) => {
        // Check uniqueness of name (case-insensitive)
        const [existing] = await tx
          .select({ id: schema.webforms.id })
          .from(schema.webforms)
          .where(
            and(
              eq(schema.webforms.organizationId, ctx.orgId),
              sql`lower(${schema.webforms.name}) = lower(${input.name})`,
            ),
          );
        if (existing) {
          throw new ConflictError("A webform with this name already exists.");
        }

        // Prepare default fields from layout-required fields
        const eligible = getEligibleFieldsForModule(input.module);
        const requiredFields = eligible.filter((f) => f.required);
        const initialFields: WebformField[] = requiredFields.map((f) => ({
          fieldApiName: f.apiName,
          label: f.label,
          required: true,
          hidden: false,
          defaultValue: "",
          helpText: "",
        }));

        // Insert webform
        const [formRow] = await tx
          .insert(schema.webforms)
          .values({
            organizationId: ctx.orgId,
            name: input.name,
            module: input.module,
            status: "draft",
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          })
          .returning();
        if (!formRow) throw new Error("Failed to create webform");

        // Insert initial draft version
        const [versionRow] = await tx
          .insert(schema.webformVersions)
          .values({
            organizationId: ctx.orgId,
            formId: formRow.id,
            number: 1,
            state: "draft",
            fields: initialFields,
            settings: webformSettingsSchema.parse({
              ownerRef: ctx.userId,
            }),
          })
          .returning();
        if (!versionRow) throw new Error("Failed to create initial draft version");

        // Point webform.draft_version_id to versionRow.id
        await tx
          .update(schema.webforms)
          .set({ draftVersionId: versionRow.id })
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formRow.id)),
          );

        // Generate initial public key
        const rawKey = generateRawPublicKey();
        const keyHash = hashPublicKey(rawKey);
        await tx.insert(schema.publicEndpointKeys).values({
          keyHash,
          organizationId: ctx.orgId,
          kind: "webform",
          targetId: formRow.id,
          revokedAt: null,
        });

        return {
          ...mapForm(formRow),
          draftVersionId: versionRow.id,
          draftVersion: mapVersion(versionRow),
          publishedVersion: null,
          locations: [],
          hasActivePublicKey: true,
        };
      });
    },

    async updateDraft(
      ctx: OrgContext,
      formId: string,
      input: {
        name?: string;
        fields?: WebformField[];
        settings?: WebformSettings;
      },
    ): Promise<WebformDetail> {
      return withOrg(ctx, async (tx) => {
        const [formRow] = await tx
          .select()
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!formRow) throw new NotFoundError("Webform not found");

        // If name changed, check uniqueness
        if (input.name && input.name.toLowerCase() !== formRow.name.toLowerCase()) {
          const [existing] = await tx
            .select({ id: schema.webforms.id })
            .from(schema.webforms)
            .where(
              and(
                eq(schema.webforms.organizationId, ctx.orgId),
                sql`lower(${schema.webforms.name}) = lower(${input.name})`,
              ),
            );
          if (existing) {
            throw new ConflictError("A webform with this name already exists.");
          }
        }

        let draftId = formRow.draftVersionId;
        const now = new Date();

        if (draftId) {
          // Verify that this draft is actually in 'draft' state before updating
          // Published/superseded rows are NEVER updated
          const [draftRow] = await tx
            .select()
            .from(schema.webformVersions)
            .where(
              and(
                eq(schema.webformVersions.organizationId, ctx.orgId),
                eq(schema.webformVersions.id, draftId),
                eq(schema.webformVersions.state, "draft"),
              ),
            );
          if (!draftRow) throw new Error("Draft version not in draft state");

          const updates: { fields?: WebformField[]; settings?: WebformSettings } = {};
          if (input.fields !== undefined) updates.fields = input.fields;
          if (input.settings !== undefined) updates.settings = input.settings;

          if (Object.keys(updates).length > 0) {
            await tx
              .update(schema.webformVersions)
              .set(updates)
              .where(
                and(
                  eq(schema.webformVersions.organizationId, ctx.orgId),
                  eq(schema.webformVersions.id, draftId),
                  eq(schema.webformVersions.state, "draft"),
                ),
              );
          }
        } else {
          // No active draft: editing after publish opens a new draft!
          if (!formRow.publishedVersionId) {
            throw new Error("Form has neither draft nor published version");
          }
          const [publishedRow] = await tx
            .select()
            .from(schema.webformVersions)
            .where(
              and(
                eq(schema.webformVersions.organizationId, ctx.orgId),
                eq(schema.webformVersions.id, formRow.publishedVersionId),
              ),
            );
          if (!publishedRow) throw new NotFoundError("Published version not found");

          const nextNumber = publishedRow.number + 1;
          const [newDraft] = await tx
            .insert(schema.webformVersions)
            .values({
              organizationId: ctx.orgId,
              formId: formRow.id,
              number: nextNumber,
              state: "draft",
              fields: input.fields ?? (publishedRow.fields as WebformField[]),
              settings: input.settings ?? (publishedRow.settings as WebformSettings),
            })
            .returning();

          if (!newDraft) throw new Error("Failed to create draft version");

          draftId = newDraft.id;
          await tx
            .update(schema.webforms)
            .set({
              draftVersionId: newDraft.id,
              name: input.name ?? formRow.name,
              updatedAt: now,
              updatedBy: ctx.userId,
            })
            .where(
              and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
            );
        }

        if (input.name && input.name !== formRow.name) {
          await tx
            .update(schema.webforms)
            .set({
              name: input.name,
              updatedAt: now,
              updatedBy: ctx.userId,
            })
            .where(
              and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
            );
        }

        // Return updated form detail
        const [updatedForm] = await tx
          .select()
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!updatedForm) throw new NotFoundError("Webform not found");
        const versions = await tx
          .select()
          .from(schema.webformVersions)
          .where(
            and(
              eq(schema.webformVersions.organizationId, ctx.orgId),
              eq(schema.webformVersions.formId, formId),
            ),
          );
        const locations = await tx
          .select()
          .from(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
            ),
          );

        const draftRow = draftId ? versions.find((v) => v.id === draftId) : undefined;
        const publishedRow = updatedForm.publishedVersionId
          ? versions.find((v) => v.id === updatedForm.publishedVersionId)
          : undefined;

        return {
          ...mapForm(updatedForm),
          draftVersion: draftRow ? mapVersion(draftRow) : null,
          publishedVersion: publishedRow ? mapVersion(publishedRow) : null,
          locations: locations.map(mapLocation),
          hasActivePublicKey: true,
        };
      });
    },

    async publish(ctx: OrgContext, formId: string): Promise<WebformDetail> {
      return withOrg(ctx, async (tx) => {
        const [formRow] = await tx
          .select()
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!formRow) throw new NotFoundError("Webform not found");
        if (!formRow.draftVersionId) throw new NotFoundError("No draft version to publish");

        const [draftRow] = await tx
          .select()
          .from(schema.webformVersions)
          .where(
            and(
              eq(schema.webformVersions.organizationId, ctx.orgId),
              eq(schema.webformVersions.id, formRow.draftVersionId),
              eq(schema.webformVersions.state, "draft"),
            ),
          );
        if (!draftRow) throw new NotFoundError("Draft version not found");

        const locations = await tx
          .select()
          .from(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
            ),
          );

        const eligibleFields = getEligibleFieldsForModule(formRow.module as WebformModule);

        // Validate draft before publish
        validateForPublish({
          fields: draftRow.fields as WebformField[],
          settings: draftRow.settings as WebformSettings,
          locations,
          eligibleFields,
        });

        const now = new Date();

        // Atomically: mark old published version superseded
        if (formRow.publishedVersionId) {
          await tx
            .update(schema.webformVersions)
            .set({ state: "superseded" })
            .where(
              and(
                eq(schema.webformVersions.organizationId, ctx.orgId),
                eq(schema.webformVersions.id, formRow.publishedVersionId),
                eq(schema.webformVersions.state, "published"),
              ),
            );
        }

        // Mark draft version published
        await tx
          .update(schema.webformVersions)
          .set({
            state: "published",
            publishedAt: now,
            publishedBy: ctx.userId,
          })
          .where(
            and(
              eq(schema.webformVersions.organizationId, ctx.orgId),
              eq(schema.webformVersions.id, draftRow.id),
              eq(schema.webformVersions.state, "draft"),
            ),
          );

        // Update webforms
        const [updatedForm] = await tx
          .update(schema.webforms)
          .set({
            publishedVersionId: draftRow.id,
            draftVersionId: null,
            status: "active",
            updatedAt: now,
            updatedBy: ctx.userId,
          })
          .where(and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)))
          .returning();

        const [publishedVersion] = await tx
          .select()
          .from(schema.webformVersions)
          .where(
            and(
              eq(schema.webformVersions.organizationId, ctx.orgId),
              eq(schema.webformVersions.id, draftRow.id),
            ),
          );

        if (!updatedForm || !publishedVersion) {
          throw new Error("Failed to publish webform");
        }

        return {
          ...mapForm(updatedForm),
          draftVersion: null,
          publishedVersion: mapVersion(publishedVersion),
          locations: locations.map(mapLocation),
          hasActivePublicKey: true,
        };
      });
    },

    async activate(ctx: OrgContext, formId: string): Promise<Webform> {
      return withOrg(ctx, async (tx) => {
        const [formRow] = await tx
          .select()
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!formRow) throw new NotFoundError("Webform not found");
        if (!formRow.publishedVersionId) {
          throw new ValidationError(
            { form: ["Cannot activate a form without a published version."] },
            "Cannot activate a form without a published version.",
          );
        }

        const [updated] = await tx
          .update(schema.webforms)
          .set({ status: "active", updatedAt: new Date(), updatedBy: ctx.userId })
          .where(and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)))
          .returning();

        if (!updated) throw new NotFoundError("Webform not found");
        return mapForm(updated);
      });
    },

    async deactivate(ctx: OrgContext, formId: string): Promise<Webform> {
      return withOrg(ctx, async (tx) => {
        const [updated] = await tx
          .update(schema.webforms)
          .set({ status: "inactive", updatedAt: new Date(), updatedBy: ctx.userId })
          .where(and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)))
          .returning();
        if (!updated) throw new NotFoundError("Webform not found");
        return mapForm(updated);
      });
    },

    async deleteForm(ctx: OrgContext, formId: string): Promise<void> {
      return withOrg(ctx, async (tx) => {
        // Cascade handles versions, locations, stats
        const res = await tx
          .delete(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (res.rowCount === 0) throw new NotFoundError("Webform not found");

        // Revoke any active keys
        await tx
          .update(schema.publicEndpointKeys)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
              eq(schema.publicEndpointKeys.kind, "webform"),
              eq(schema.publicEndpointKeys.targetId, formId),
              isNull(schema.publicEndpointKeys.revokedAt),
            ),
          );
      });
    },

    async regeneratePublicKey(
      ctx: OrgContext,
      formId: string,
    ): Promise<{ publicKey: string; keyHash: string }> {
      return withOrg(ctx, async (tx) => {
        const [formRow] = await tx
          .select({ id: schema.webforms.id })
          .from(schema.webforms)
          .where(
            and(eq(schema.webforms.organizationId, ctx.orgId), eq(schema.webforms.id, formId)),
          );
        if (!formRow) throw new NotFoundError("Webform not found");

        const rawKey = generateRawPublicKey();
        const keyHash = hashPublicKey(rawKey);
        const now = new Date();

        // Revoke old active keys
        await tx
          .update(schema.publicEndpointKeys)
          .set({ revokedAt: now })
          .where(
            and(
              eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
              eq(schema.publicEndpointKeys.kind, "webform"),
              eq(schema.publicEndpointKeys.targetId, formId),
              isNull(schema.publicEndpointKeys.revokedAt),
            ),
          );

        // Insert new active key
        await tx.insert(schema.publicEndpointKeys).values({
          keyHash,
          organizationId: ctx.orgId,
          kind: "webform",
          targetId: formId,
          revokedAt: null,
          createdAt: now,
        });

        return { publicKey: rawKey, keyHash };
      });
    },

    // Locations
    async listLocations(ctx: OrgContext, formId: string): Promise<WebformLocation[]> {
      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select()
          .from(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
            ),
          )
          .orderBy(asc(schema.webformLocations.createdAt));
        return rows.map(mapLocation);
      });
    },

    async addLocation(
      ctx: OrgContext,
      formId: string,
      input: { origin: string; label?: string },
    ): Promise<WebformLocation> {
      return withOrg(ctx, async (tx) => {
        const normalized = normalizeOrigin(input.origin);

        const existing = await tx
          .select()
          .from(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
            ),
          );

        if (existing.length >= MAX_LOCATIONS_PER_FORM) {
          throw new ValidationError(
            {
              origin: [`A webform can have at most ${MAX_LOCATIONS_PER_FORM} allowed locations.`],
            },
            `A webform can have at most ${MAX_LOCATIONS_PER_FORM} allowed locations.`,
            "limit",
          );
        }

        if (existing.some((l) => l.origin.toLowerCase() === normalized.toLowerCase())) {
          throw new ConflictError("This location origin is already in the allowlist.");
        }

        const [created] = await tx
          .insert(schema.webformLocations)
          .values({
            organizationId: ctx.orgId,
            formId,
            origin: normalized,
            label: input.label ?? "",
          })
          .returning();

        if (!created) throw new Error("Failed to add location");
        return mapLocation(created);
      });
    },

    async removeLocation(ctx: OrgContext, formId: string, origin: string): Promise<void> {
      return withOrg(ctx, async (tx) => {
        const normalized = normalizeOrigin(origin);
        const res = await tx
          .delete(schema.webformLocations)
          .where(
            and(
              eq(schema.webformLocations.organizationId, ctx.orgId),
              eq(schema.webformLocations.formId, formId),
              eq(schema.webformLocations.origin, normalized),
            ),
          );
        if (res.rowCount === 0) throw new NotFoundError("Location not found");
      });
    },

    // Auto-response rules
    async listAutoResponseRules(
      ctx: OrgContext,
      module?: WebformModule,
    ): Promise<WebformAutoResponseRule[]> {
      return withOrg(ctx, async (tx) => {
        const condition = module
          ? and(
              eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
              eq(schema.webformAutoResponseRules.module, module),
            )
          : eq(schema.webformAutoResponseRules.organizationId, ctx.orgId);

        const rows = await tx
          .select()
          .from(schema.webformAutoResponseRules)
          .where(condition)
          .orderBy(asc(schema.webformAutoResponseRules.position));

        return rows.map(mapAutoResponseRule);
      });
    },

    async getAutoResponseRule(ctx: OrgContext, id: string): Promise<WebformAutoResponseRule> {
      return withOrg(ctx, async (tx) => {
        const [row] = await tx
          .select()
          .from(schema.webformAutoResponseRules)
          .where(
            and(
              eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
              eq(schema.webformAutoResponseRules.id, id),
            ),
          );
        if (!row) throw new NotFoundError("Auto-response rule not found");
        return mapAutoResponseRule(row);
      });
    },

    async createAutoResponseRule(
      ctx: OrgContext,
      input: {
        module: WebformModule;
        name: string;
        criteria?: WebformAutoResponseRule["criteria"];
        templateId?: string | null;
        position?: number;
        active?: boolean;
      },
    ): Promise<WebformAutoResponseRule> {
      return withOrg(ctx, async (tx) => {
        // If position not supplied, put at the end
        let pos = input.position;
        if (pos === undefined) {
          const [maxRow] = await tx
            .select({
              maxPos: sql<number>`coalesce(max(${schema.webformAutoResponseRules.position}), -1)`,
            })
            .from(schema.webformAutoResponseRules)
            .where(
              and(
                eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
                eq(schema.webformAutoResponseRules.module, input.module),
              ),
            );
          pos = (maxRow?.maxPos ?? -1) + 1;
        }

        const [created] = await tx
          .insert(schema.webformAutoResponseRules)
          .values({
            organizationId: ctx.orgId,
            module: input.module,
            name: input.name,
            criteria: input.criteria ?? { kind: "all_records" },
            templateId: input.templateId ?? null,
            position: pos,
            active: input.active ?? true,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          })
          .returning();

        if (!created) throw new Error("Failed to create rule");
        return mapAutoResponseRule(created);
      });
    },

    async updateAutoResponseRule(
      ctx: OrgContext,
      id: string,
      input: {
        name?: string;
        criteria?: WebformAutoResponseRule["criteria"];
        templateId?: string | null;
        position?: number;
        active?: boolean;
      },
    ): Promise<WebformAutoResponseRule> {
      return withOrg(ctx, async (tx) => {
        const updates: Partial<typeof schema.webformAutoResponseRules.$inferInsert> = {
          updatedAt: new Date(),
          updatedBy: ctx.userId,
        };
        if (input.name !== undefined) updates.name = input.name;
        if (input.criteria !== undefined) updates.criteria = input.criteria;
        if (input.templateId !== undefined) updates.templateId = input.templateId;
        if (input.position !== undefined) updates.position = input.position;
        if (input.active !== undefined) updates.active = input.active;

        const [updated] = await tx
          .update(schema.webformAutoResponseRules)
          .set(updates)
          .where(
            and(
              eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
              eq(schema.webformAutoResponseRules.id, id),
            ),
          )
          .returning();
        if (!updated) throw new NotFoundError("Auto-response rule not found");
        return mapAutoResponseRule(updated);
      });
    },

    async deleteAutoResponseRule(ctx: OrgContext, id: string): Promise<void> {
      return withOrg(ctx, async (tx) => {
        const res = await tx
          .delete(schema.webformAutoResponseRules)
          .where(
            and(
              eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
              eq(schema.webformAutoResponseRules.id, id),
            ),
          );
        if (res.rowCount === 0) throw new NotFoundError("Auto-response rule not found");
      });
    },

    async reorderAutoResponseRules(
      ctx: OrgContext,
      module: WebformModule,
      ruleIds: string[],
    ): Promise<WebformAutoResponseRule[]> {
      return withOrg(ctx, async (tx) => {
        for (let i = 0; i < ruleIds.length; i++) {
          const ruleId = ruleIds[i];
          if (!ruleId) continue;
          await tx
            .update(schema.webformAutoResponseRules)
            .set({ position: i })
            .where(
              and(
                eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
                eq(schema.webformAutoResponseRules.module, module),
                eq(schema.webformAutoResponseRules.id, ruleId),
              ),
            );
        }

        const rows = await tx
          .select()
          .from(schema.webformAutoResponseRules)
          .where(
            and(
              eq(schema.webformAutoResponseRules.organizationId, ctx.orgId),
              eq(schema.webformAutoResponseRules.module, module),
            ),
          )
          .orderBy(asc(schema.webformAutoResponseRules.position));

        return rows.map(mapAutoResponseRule);
      });
    },
  };
}

export type WebformService = ReturnType<typeof createWebformService>;
