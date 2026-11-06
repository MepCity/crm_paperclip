import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { createTestOrganization } from "../testing";
import { createWebformService } from "./service";
import type { WebformField } from "./types";

describe("webforms backend integration", () => {
  it("manages lifecycle, publish/supersede immutability, and public key regeneration", async () => {
    const { ctx } = await createTestOrganization();
    const service = createWebformService();
    const db = getDb();

    // 1. Create a Lead form
    const form = await service.createForm(ctx, {
      name: "Contact Us",
      module: "Leads",
    });

    expect(form.name).toBe("Contact Us");
    expect(form.module).toBe("Leads");
    expect(form.status).toBe("draft");
    expect(form.draftVersion).not.toBeNull();
    expect(form.draftVersion?.number).toBe(1);
    expect(form.draftVersion?.state).toBe("draft");
    expect(form.publishedVersion).toBeNull();
    expect(form.hasActivePublicKey).toBe(true);

    // Initial public key was inserted into public_endpoint_keys with revoked_at is null
    const initialKeyRows = await db
      .select()
      .from(schema.publicEndpointKeys)
      .where(
        and(
          eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
          eq(schema.publicEndpointKeys.kind, "webform"),
          eq(schema.publicEndpointKeys.targetId, form.id),
        ),
      );
    expect(initialKeyRows).toHaveLength(1);
    const initialKey = initialKeyRows[0];
    if (!initialKey) throw new Error("Expected initialKey");
    const initialKeyHash = initialKey.keyHash;
    expect(initialKey.revokedAt).toBeNull();

    // 2. Add an allowed location
    const location = await service.addLocation(ctx, form.id, {
      origin: "https://LandingPage.example.COM:8443/form",
      label: "Main Landing Page",
    });
    expect(location.origin).toBe("https://landingpage.example.com:8443");

    // 3. Update draft version fields
    const customFields: WebformField[] = [
      { fieldApiName: "Last_Name", label: "Surname", required: true, hidden: false },
      { fieldApiName: "Company", label: "Organisation", required: true, hidden: false },
      { fieldApiName: "Email", label: "Email Address", required: true, hidden: false },
    ];
    await service.updateDraft(ctx, form.id, {
      fields: customFields,
      settings: {
        buttonLabel: "Send Inquiry",
        ownerKind: "user",
        ownerRef: ctx.userId,
        notifyOwner: true,
        acknowledgement: {
          kind: "redirect",
          url: "https://landingpage.example.com:8443/thank-you",
        },
        challenge: false,
        restrictLocations: true,
        captureAttribution: true,
        approval: "none",
        doubleOptIn: false,
      },
    });

    // 4. Publish the form
    const publishedForm = await service.publish(ctx, form.id);
    expect(publishedForm.status).toBe("active");
    expect(publishedForm.draftVersion).toBeNull();
    expect(publishedForm.publishedVersion).not.toBeNull();
    expect(publishedForm.publishedVersion?.number).toBe(1);
    expect(publishedForm.publishedVersion?.state).toBe("published");
    expect(publishedForm.publishedVersion?.publishedBy).toBe(ctx.userId);

    const v1 = publishedForm.publishedVersion;
    expect(v1).not.toBeNull();
    if (!v1) throw new Error("Expected publishedVersion");
    const v1Id = v1.id;

    // Verify in database: v1 is published
    const [v1Row] = await db
      .select()
      .from(schema.webformVersions)
      .where(
        and(
          eq(schema.webformVersions.organizationId, ctx.orgId),
          eq(schema.webformVersions.id, v1Id),
        ),
      );
    expect(v1Row).toBeDefined();
    if (!v1Row) throw new Error("Expected v1Row");
    expect(v1Row.state).toBe("published");
    const v1OriginalFields = v1Row.fields;

    // 5. Immutability: Editing after publish opens a NEW draft (version 2)
    // The published version row (v1) is NEVER updated
    const draft2Form = await service.updateDraft(ctx, form.id, {
      fields: [
        ...customFields,
        { fieldApiName: "Phone", label: "Phone Number", required: false, hidden: false },
      ],
    });

    expect(draft2Form.draftVersion).not.toBeNull();
    expect(draft2Form.draftVersion?.number).toBe(2);
    expect(draft2Form.draftVersion?.state).toBe("draft");
    expect(draft2Form.publishedVersion?.id).toBe(v1Id);

    // Assert v1 row in DB was NOT changed
    const [v1RowAfterDraft2] = await db
      .select()
      .from(schema.webformVersions)
      .where(
        and(
          eq(schema.webformVersions.organizationId, ctx.orgId),
          eq(schema.webformVersions.id, v1Id),
        ),
      );
    expect(v1RowAfterDraft2).toBeDefined();
    if (!v1RowAfterDraft2) throw new Error("Expected v1RowAfterDraft2");
    expect(v1RowAfterDraft2.state).toBe("published");
    expect(v1RowAfterDraft2.fields).toEqual(v1OriginalFields);

    // 6. Publish version 2:
    // v1 is atomically marked superseded; v2 becomes published; neither is updated afterwards.
    const republishedForm = await service.publish(ctx, form.id);
    expect(republishedForm.draftVersion).toBeNull();
    expect(republishedForm.publishedVersion?.number).toBe(2);
    expect(republishedForm.publishedVersion?.state).toBe("published");

    const [v1RowAfterPublish2] = await db
      .select()
      .from(schema.webformVersions)
      .where(
        and(
          eq(schema.webformVersions.organizationId, ctx.orgId),
          eq(schema.webformVersions.id, v1Id),
        ),
      );
    expect(v1RowAfterPublish2).toBeDefined();
    if (!v1RowAfterPublish2) throw new Error("Expected v1RowAfterPublish2");
    expect(v1RowAfterPublish2.state).toBe("superseded");
    expect(v1RowAfterPublish2.fields).toEqual(v1OriginalFields);

    // 7. Key regeneration: old hash revoked, new active key created
    const { publicKey: newKey, keyHash: newHash } = await service.regeneratePublicKey(ctx, form.id);
    expect(newKey).toBeDefined();
    expect(newHash).not.toBe(initialKeyHash);

    // Assert in public_endpoint_keys:
    // Old key row has revoked_at IS NOT NULL
    const [oldKeyRecord] = await db
      .select()
      .from(schema.publicEndpointKeys)
      .where(
        and(
          eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
          eq(schema.publicEndpointKeys.keyHash, initialKeyHash),
        ),
      );
    expect(oldKeyRecord).toBeDefined();
    if (!oldKeyRecord) throw new Error("Expected oldKeyRecord");
    expect(oldKeyRecord.revokedAt).not.toBeNull();

    // New key row has revoked_at IS NULL
    const [newKeyRecord] = await db
      .select()
      .from(schema.publicEndpointKeys)
      .where(
        and(
          eq(schema.publicEndpointKeys.organizationId, ctx.orgId),
          eq(schema.publicEndpointKeys.keyHash, newHash),
        ),
      );
    expect(newKeyRecord).toBeDefined();
    if (!newKeyRecord) throw new Error("Expected newKeyRecord");
    expect(newKeyRecord.revokedAt).toBeNull();
  });

  it("handles auto-response rules ordering and CRUD", async () => {
    const { ctx } = await createTestOrganization();
    const service = createWebformService();

    const rule1 = await service.createAutoResponseRule(ctx, {
      module: "Leads",
      name: "Default Welcome",
      criteria: { kind: "all_records" },
    });
    expect(rule1.position).toBe(0);

    const rule2 = await service.createAutoResponseRule(ctx, {
      module: "Leads",
      name: "VIP Welcome",
      criteria: {
        kind: "criteria",
        criteria: {
          field: "Annual_Revenue",
          comparator: "greater_than",
          value: 100000,
        },
      },
    });
    expect(rule2.position).toBe(1);

    // Reorder: put VIP first
    const reordered = await service.reorderAutoResponseRules(ctx, "Leads", [rule2.id, rule1.id]);
    expect(reordered[0]?.id).toBe(rule2.id);
    expect(reordered[0]?.position).toBe(0);
    expect(reordered[1]?.id).toBe(rule1.id);
    expect(reordered[1]?.position).toBe(1);

    // Delete rule
    await service.deleteAutoResponseRule(ctx, rule1.id);
    const list = await service.listAutoResponseRules(ctx, "Leads");
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(rule2.id);
  });
});
