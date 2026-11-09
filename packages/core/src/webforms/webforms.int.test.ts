import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ForbiddenError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import { createTestOrganization } from "../testing";
import { createRenderToken, generateChallenge, resolvePublicForm, submitWebform } from "./index";
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

  it("enforces bounded principal ActorRef { kind: 'webform', formId, versionId } (§3.1)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createWebformService();

    const form = await service.createForm(ctx, { name: "Lead Capture", module: "Leads" });
    const fields: WebformField[] = [
      { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
      { fieldApiName: "Company", label: "Company", required: true, hidden: false },
      { fieldApiName: "Email", label: "Email", required: false, hidden: false },
    ];
    await service.updateDraft(ctx, form.id, { fields });
    const published = await service.publish(ctx, form.id);
    const versionId = published.publishedVersion?.id ?? "";

    // Create record service with webform actor
    const actor = {
      kind: "webform" as const,
      formId: form.id,
      versionId,
      module: "Leads",
      allowedFields: new Set(["Last_Name", "Company", "Email", "Owner"]),
      formName: "Lead Capture",
    };
    const recordService = createFixtureRecordService(ctx, { actor });

    // 1. Reads/updates/deletes are strictly forbidden
    await expect(recordService.get("Leads", "non-existent")).rejects.toThrow(ForbiddenError);
    await expect(recordService.list("Leads", { viewId: "", page: 1, perPage: 20 })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(recordService.update("Leads", "any-id", { Last_Name: "Hacked" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(recordService.delete("Leads", ["any-id"])).rejects.toThrow(ForbiddenError);
    await expect(
      recordService.convertLead("any-id", {
        account: { create: { Account_Name: "Acme" } },
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      recordService.merge("Leads", { masterId: "id1", duplicateIds: ["id2"], values: {} }),
    ).rejects.toThrow(ForbiddenError);

    // 2. Creating in a different module is forbidden
    await expect(recordService.create("Contacts", { Last_Name: "Doe" })).rejects.toThrow(
      ForbiddenError,
    );

    // 3. Creating with extra unallowed fields is forbidden
    await expect(
      recordService.create("Leads", {
        Last_Name: "Doe",
        Company: "Acme",
        Annual_Revenue: 500000,
      }),
    ).rejects.toThrow(ForbiddenError);

    // 4. Creating with only version's allowed fields succeeds
    const created = await recordService.create("Leads", {
      Last_Name: "Doe",
      Company: "Acme",
      Email: "doe@example.com",
    });
    expect(created.id).toBeDefined();

    // Verify history commit shows form name as creator and source as webform
    const normalRecordService = createFixtureRecordService(ctx);
    const history = await normalRecordService.history.list("Leads", created.id, {
      perPage: 10,
    });
    expect(history.events.length).toBeGreaterThan(0);
    const creationEntry = history.events[history.events.length - 1];
    expect(creationEntry?.source).toBe("webform");
    expect(creationEntry?.actor.name).toBe("Lead Capture");
  });

  it("enforces tenant isolation for public keys and ingestion", async () => {
    const org1 = await createTestOrganization();
    const org2 = await createTestOrganization();
    const service = createWebformService();

    const form1 = await service.createForm(org1.ctx, { name: "Org 1 Form", module: "Leads" });
    const fields: WebformField[] = [
      { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
      { fieldApiName: "Company", label: "Company", required: true, hidden: false },
    ];
    await service.updateDraft(org1.ctx, form1.id, { fields });
    const pub1 = await service.publish(org1.ctx, form1.id);
    const { publicKey: key1 } = await service.regeneratePublicKey(org1.ctx, form1.id);

    // Resolving org1 key returns org1 details
    const resolved = await resolvePublicForm(key1);
    expect(resolved).not.toBeNull();
    expect(resolved?.orgId).toBe(org1.ctx.orgId);
    expect(resolved?.form.name).toBe("Org 1 Form");

    // Submitting with org1 key creates a record ONLY in org1, not in org2
    const versionId1 = pub1.publishedVersion?.id ?? "";
    const token = createRenderToken({
      orgId: org1.ctx.orgId,
      formId: form1.id,
      versionId: versionId1,
      issuedAt: Date.now() - 5000,
    });

    const subResult = await submitWebform({
      publicKey: key1,
      data: {
        _token: token,
        _hp: "",
        Last_Name: "TenantTest",
        Company: "Org1Company",
      },
      isHostedRoute: true,
      ip: "10.0.0.1",
    });

    expect(subResult.outcome).toBe("accepted");
    expect(subResult.recordId).toBeDefined();

    // Verify record exists in org1
    const subRecordId = subResult.recordId ?? "";
    const records1 = createFixtureRecordService(org1.ctx);
    const recordInOrg1 = await records1.get("Leads", subRecordId);
    expect(recordInOrg1.fields.Last_Name).toBe("TenantTest");

    // Verify record does NOT exist in org2
    const records2 = createFixtureRecordService(org2.ctx);
    await expect(records2.get("Leads", subRecordId)).rejects.toThrow();
  });

  it("processes all submission outcomes and rules (§3.4–§3.7)", async () => {
    const { ctx } = await createTestOrganization();
    const service = createWebformService();

    const form = await service.createForm(ctx, { name: "Pipeline Form", module: "Leads" });
    const fields: WebformField[] = [
      { fieldApiName: "Last_Name", label: "Last Name", required: true, hidden: false },
      { fieldApiName: "Company", label: "Company", required: true, hidden: false },
      { fieldApiName: "Email", label: "Email", required: false, hidden: false },
      {
        fieldApiName: "Description",
        label: "Description",
        required: false,
        hidden: true,
        defaultValue: "Web Ingestion",
      },
    ];
    await service.updateDraft(ctx, form.id, {
      fields,
      settings: {
        buttonLabel: "Submit Now",
        ownerKind: "user",
        ownerRef: "",
        notifyOwner: false,
        challenge: true,
        restrictLocations: true,
        captureAttribution: true,
        approval: "none",
        doubleOptIn: false,
        acknowledgement: { kind: "message", text: "We will contact you shortly." },
      },
    });
    await service.addLocation(ctx, form.id, {
      origin: "https://trusted-site.com",
      label: "Trusted site",
    });

    const pub = await service.publish(ctx, form.id);
    const { publicKey } = await service.regeneratePublicKey(ctx, form.id);
    const versionId = pub.publishedVersion?.id ?? "";

    // Helper to generate a valid token
    const makeToken = (issuedAt = Date.now() - 5000, challengeHash?: string) =>
      createRenderToken({
        orgId: ctx.orgId,
        formId: form.id,
        versionId,
        issuedAt,
        challengeHash,
      });

    // 1. Rejected location: foreign origin with restrictLocations: true
    const locResult = await submitWebform({
      publicKey,
      data: { _token: makeToken(), Last_Name: "Smith", Company: "Acme" },
      origin: "https://evil-site.com",
      ip: "10.0.0.2",
    });
    expect(locResult.outcome).toBe("rejected_location");

    // 1b. Rejected location: foreign origin with fake hosted referer
    const fakeHostedResult = await submitWebform({
      publicKey,
      data: { _token: makeToken(), Last_Name: "Smith", Company: "Acme" },
      origin: "https://evil-site.com",
      referer: "http://127.0.0.1:3000/f/testkey",
      isHostedRoute: true,
      appOrigin: "http://127.0.0.1:3000",
      ip: "10.0.0.2",
    });
    expect(fakeHostedResult.outcome).toBe("rejected_location");

    // 1c. Rejected location: fake hosted referer on evil domain without origin
    const evilRefererResult = await submitWebform({
      publicKey,
      data: { _token: makeToken(), Last_Name: "Smith", Company: "Acme" },
      referer: "https://evil-site.com/f/testkey",
      isHostedRoute: true,
      appOrigin: "http://127.0.0.1:3000",
      ip: "10.0.0.2",
    });
    expect(evilRefererResult.outcome).toBe("rejected_location");

    // 2. Spam: Honeypot filled -> returns normal success acknowledgement, no record created
    const hpResult = await submitWebform({
      publicKey,
      data: { _token: makeToken(), _hp: "bot-payload", Last_Name: "Bot", Company: "BotInc" },
      origin: "https://trusted-site.com",
      ip: "10.0.0.3",
    });
    expect(hpResult.outcome).toBe("spam");
    expect(
      hpResult.acknowledgement?.kind === "message" ? hpResult.acknowledgement.text : null,
    ).toBe("We will contact you shortly.");
    expect(hpResult.recordId).toBeUndefined();

    // 3. Spam: Token too young (< 2 seconds) -> returns normal success acknowledgement
    const youngToken = makeToken(Date.now() - 500); // 500ms old
    const youngResult = await submitWebform({
      publicKey,
      data: { _token: youngToken, _hp: "", Last_Name: "TooFast", Company: "SpeedInc" },
      origin: "https://trusted-site.com",
      ip: "10.0.0.4",
    });
    expect(youngResult.outcome).toBe("spam");
    expect(
      youngResult.acknowledgement?.kind === "message" ? youngResult.acknowledgement.text : null,
    ).toBe("We will contact you shortly.");

    // 4. Spam: Token too old (> 2 hours) -> returns normal success acknowledgement
    const oldToken = makeToken(Date.now() - 3 * 3600 * 1000); // 3 hours old
    const oldResult = await submitWebform({
      publicKey,
      data: { _token: oldToken, _hp: "", Last_Name: "TooOld", Company: "AncientInc" },
      origin: "https://trusted-site.com",
      ip: "10.0.0.5",
    });
    expect(oldResult.outcome).toBe("spam");

    // 5. Spam: Wrong challenge answer when challenge is enabled
    const ch = generateChallenge();
    const chToken = makeToken(Date.now() - 5000, ch.challengeHash);
    const wrongChResult = await submitWebform({
      publicKey,
      data: {
        _token: chToken,
        _challenge: "WRONG",
        _hp: "",
        Last_Name: "WrongCode",
        Company: "CodeInc",
      },
      origin: "https://trusted-site.com",
      ip: "10.0.0.6",
    });
    expect(wrongChResult.outcome).toBe("spam");

    // 6. Invalid: Missing required field
    const invalidResult = await submitWebform({
      publicKey,
      data: {
        _token: chToken,
        _challenge: ch.code,
        _hp: "",
        Company: "Acme", // missing Last_Name
      },
      origin: "https://trusted-site.com",
      ip: "10.0.0.7",
    });
    expect(invalidResult.outcome).toBe("invalid");
    expect(invalidResult.errors?.Last_Name).toBeDefined();

    // 7. Invalid: Unexpected extra key not in version or attribution
    const extraKeyResult = await submitWebform({
      publicKey,
      data: {
        _token: chToken,
        _challenge: ch.code,
        _hp: "",
        Last_Name: "Valid",
        Company: "Acme",
        maliciousField: "injection",
      },
      origin: "https://trusted-site.com",
      ip: "10.0.0.8",
    });
    expect(extraKeyResult.outcome).toBe("invalid");
    expect(extraKeyResult.errors?.maliciousField).toBeDefined();

    // 8. Accepted submission with correct challenge, attribution, and server default for hidden field
    const acceptedResult = await submitWebform({
      publicKey,
      data: {
        _token: chToken,
        _challenge: ch.code,
        _hp: "",
        Last_Name: "Taylor",
        Company: "Taylor Co",
        Email: "taylor@example.com",
        utm_source: "google",
        utm_medium: "cpc",
        Description: "TamperedValue", // Hidden field: client value should be ignored
      },
      origin: "https://trusted-site.com",
      ip: "10.0.0.9",
    });
    expect(acceptedResult.outcome).toBe("accepted");
    expect(acceptedResult.recordId).toBeDefined();

    // Verify record has server-default for hidden field and correct values
    const records = createFixtureRecordService(ctx);
    const rec = await records.get("Leads", acceptedResult.recordId ?? "");
    expect(rec.fields.Last_Name).toBe("Taylor");
    expect(rec.fields.Company).toBe("Taylor Co");
    expect(rec.fields.Email).toBe("taylor@example.com");
    expect(rec.fields.Description).toBe("Web Ingestion"); // server default!

    // 9. Duplicate: submitting same unique Email results in duplicate_pending_approval
    const ch2 = generateChallenge();
    const chToken2 = makeToken(Date.now() - 5000, ch2.challengeHash);
    const dupResult = await submitWebform({
      publicKey,
      data: {
        _token: chToken2,
        _challenge: ch2.code,
        _hp: "",
        Last_Name: "Taylor Again",
        Company: "Taylor Co 2",
        Email: "taylor@example.com", // existing email!
      },
      origin: "https://trusted-site.com",
      ip: "10.0.0.10",
    });
    expect(dupResult.outcome).toBe("duplicate_pending_approval");
    // Normal acknowledgement returned — duplicate presence never disclosed (§3.7)
    expect(
      dupResult.acknowledgement?.kind === "message" ? dupResult.acknowledgement.text : null,
    ).toBe("We will contact you shortly.");
    expect(dupResult.recordId).toBeUndefined();

    // 10. Rate limiting: exceeding 5 submissions per minute from same client
    const ipForRateLimit = "10.0.0.99";
    for (let i = 0; i < 5; i++) {
      const chN = generateChallenge();
      const tokN = makeToken(Date.now() - 5000, chN.challengeHash);
      await submitWebform({
        publicKey,
        data: {
          _token: tokN,
          _challenge: chN.code,
          _hp: "",
          Last_Name: `Rate${i}`,
          Company: "Acme",
        },
        origin: "https://trusted-site.com",
        ip: ipForRateLimit,
      });
    }

    // 6th submission hits rate limit!
    const ch6 = generateChallenge();
    const tok6 = makeToken(Date.now() - 5000, ch6.challengeHash);
    const rlResult = await submitWebform({
      publicKey,
      data: {
        _token: tok6,
        _challenge: ch6.code,
        _hp: "",
        Last_Name: "Rate6",
        Company: "Acme",
      },
      origin: "https://trusted-site.com",
      ip: ipForRateLimit,
    });
    expect(rlResult.outcome).toBe("rate_limited");
  });
});
