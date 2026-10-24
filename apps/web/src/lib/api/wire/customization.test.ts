import { randomUUID } from "node:crypto";
import {
  CustomizationService,
  InMemoryCustomizationAdapter,
  InMemorySchemaCoordinator,
  schemaRevision,
} from "@crm/core/customization";
import { SchemaStaleError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { fixtureMetadataBaselines } from "@crm/core/records/fixture/metadata-projection";
import { describe, expect, it } from "vitest";
import { operations } from "./operations";

function setup() {
  const ctx = {
    orgId: randomUUID(),
    orgSlug: "wire",
    orgName: "Wire",
    userId: "actor",
    role: "admin" as const,
  };
  const metadata = new InMemoryCustomizationAdapter(fixtureMetadataBaselines());
  const coordinator = new InMemorySchemaCoordinator(metadata);
  const records = createFixtureRecordService(ctx, { schema: coordinator });
  const customization = new CustomizationService(ctx, metadata, true);
  const deps = {
    records,
    members: async () => [{ userId: ctx.userId, name: "Actor", email: "actor@example.test" }],
    customization: () => customization,
  };
  const revision = () => schemaRevision(coordinator.read(ctx.orgId, "Leads"));
  return { deps, revision, customization };
}

describe("customization and record wire coordination", () => {
  it("accepts the same settings token for record writes and rejects stale writes without a new record", async () => {
    const t = setup();
    const input = { query: { module: "Leads" }, params: { module: "Leads" } };
    const token = t.revision();
    for (const operation of [
      operations.module,
      operations.fields,
      operations.layouts,
      operations.view,
    ]) {
      const response = await operation.run(t.deps, {
        ...input,
        params: { module: "Leads", viewId: "all-leads" },
      });
      expect(response.body).toMatchObject({ revision: token });
    }
    const views = await operations.views.run(t.deps, input);
    expect(views.body).toMatchObject({ info: { revision: token } });
    const body = {
      data: [{ Last_Name: "Synthetic", Company: "Example" }],
      expectedRevision: token,
    };
    const before = await t.deps.records.count("Leads", { viewId: "all-leads" });
    const created = await operations.create.run(t.deps, { ...input, body });
    expect(created.status).toBe(200);
    await t.customization.execute(
      "Leads",
      {
        expectedRevision: token,
        command: { type: "module.patch", properties: { pluralLabel: "Prospects" } },
      },
      ["module.patch"],
    );
    await expect(operations.create.run(t.deps, { ...input, body })).rejects.toBeInstanceOf(
      SchemaStaleError,
    );
    expect(await t.deps.records.count("Leads", { viewId: "all-leads" })).toBe(before + 1);
    await expect(
      operations.create.run(t.deps, { ...input, body: { data: body.data } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("forwards revision maps for conversion and tokens for delete/mass updates", async () => {
    const t = setup();
    const input = { query: {}, params: { module: "Leads" } };
    const options = () => ({ expectedRevision: t.revision() });
    const row = await t.deps.records.create(
      "Leads",
      { Last_Name: "Synthetic", Company: "Example" },
      options(),
    );
    await operations.massUpdate.run(t.deps, {
      ...input,
      body: { ids: [row.id], data: [{ Company: "Updated" }], ...options() },
    });
    expect((await t.deps.records.get("Leads", row.id)).fields.Company).toBe("Updated");
    const converted = await t.deps.records.create(
      "Leads",
      { Last_Name: "Convert", Company: "Example" },
      options(),
    );
    await operations.convertLead.run(t.deps, {
      ...input,
      params: { module: "Leads", recordId: converted.id },
      body: {
        contact: { create: { Last_Name: "Converted" } },
        expectedRevision: {
          Leads: t.revision(),
          Contacts: (await t.deps.records.getModuleProjection("Contacts")).revision,
        },
      },
    });
    expect((await t.deps.records.get("Leads", converted.id)).fields.Converted__s).toBe(true);
    await operations.delete.run(t.deps, {
      ...input,
      params: { module: "Leads", recordId: row.id },
      body: options(),
    });
    await expect(t.deps.records.get("Leads", row.id)).rejects.toMatchObject({ code: "not_found" });
  });
});
