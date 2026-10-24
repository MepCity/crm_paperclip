import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ForbiddenError, SchemaStaleError, ValidationError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import { fixtureMetadataBaselines } from "../records/fixture/metadata-projection";
import type { OrgContext } from "../tenancy/types";
import { type CustomizationCommand, customizationCommandSchema } from "./commands";
import { InMemorySchemaCoordinator, schemaRevision } from "./coordinator";
import { InMemoryCustomizationAdapter } from "./memory";
import { layoutSchema } from "./schema";
import { CustomizationService } from "./service";

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test value");
  return value;
}

const scalarField = {
  apiName: "Custom_Note",
  label: "Custom note",
  dataType: "text" as const,
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};
const allCommands = customizationCommandSchema.options.map((schema) => schema.shape.type.value);
function setup() {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "test",
    orgName: "Test",
    userId: "admin",
    role: "admin",
  };
  const metadata = new InMemoryCustomizationAdapter(fixtureMetadataBaselines());
  const coordinator = new InMemorySchemaCoordinator(metadata);
  const records = createFixtureRecordService(ctx, { schema: coordinator });
  const service = new CustomizationService(
    ctx,
    metadata,
    true,
    () => new Date("2026-01-01T00:00:00.000Z"),
  );
  const read = () => metadata.readEffectiveSync(ctx.orgId, "Leads");
  const revision = () => schemaRevision(read());
  const execute = (command: CustomizationCommand, viewId?: string) =>
    service.execute("Leads", { expectedRevision: revision(), command }, allCommands, viewId);
  const audit = () => metadata.auditEntries(ctx.orgId, "Leads");
  return { ctx, metadata, records, service, read, revision, execute, audit };
}

describe("admin customization commands", () => {
  it("denies members and disabled or uncoordinated services before decoding", async () => {
    const t = setup();
    for (const service of [
      new CustomizationService({ ...t.ctx, role: "member" }, t.metadata, true),
      new CustomizationService(t.ctx, t.metadata, false),
      new CustomizationService(
        t.ctx,
        new InMemoryCustomizationAdapter(fixtureMetadataBaselines()),
        true,
      ),
    ]) {
      expect(service.capabilities("Leads").fields).toBe(false);
      await expect(service.execute("Leads", {}, allCommands)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    }
    expect(t.audit()).toEqual([]);
    expect(t.read().revision).toBe(0);
  });

  it("publishes once with one value-free audit and keeps tenant projections separate", async () => {
    const t = setup();
    const other = { ...t.ctx, orgId: randomUUID() };
    const beforeOther = t.metadata.readEffectiveSync(other.orgId, "Leads");
    const result = await t.execute({ type: "field.create", field: scalarField });
    expect(result.revision).toBe(t.revision());
    expect(t.read().revision).toBe(1);
    expect(t.audit()).toEqual([
      {
        actorId: "admin",
        operation: "field.create",
        targetIds: [expect.any(String)],
        timestamp: "2026-01-01T00:00:00.000Z",
        revision: 1,
      },
    ]);
    expect(t.metadata.readEffectiveSync(other.orgId, "Leads")).toEqual(beforeOther);
    expect((await t.records.getModuleProjection("Leads")).revision).toBe(result.revision);
    expect(
      (await t.records.getModuleProjection("Leads")).fields.some(
        (field) => field.apiName === "Custom_Note",
      ),
    ).toBe(true);
    expect(Object.isFrozen(t.audit()[0])).toBe(true);
  });

  it("rejects stale commands without audit or metadata side effects", async () => {
    const t = setup();
    const token = t.revision();
    await t.execute({ type: "field.create", field: scalarField });
    const before = t.read();
    await expect(
      t.service.execute(
        "Leads",
        {
          expectedRevision: token,
          command: { type: "module.patch", properties: { pluralLabel: "Changed" } },
        },
        allCommands,
      ),
    ).rejects.toMatchObject({ code: "schema_stale", revision: t.revision() });
    expect(t.read()).toEqual(before);
    expect(t.audit()).toHaveLength(1);
  });

  it.each([
    { type: "field.create", field: { ...scalarField, dataType: "formula" } },
    { type: "field.create", field: { ...scalarField, lookup: { module: "Leads" } } },
    { type: "field.patch", fieldId: "missing", properties: { dataType: "text" } },
    { type: "field.patch", fieldId: "missing", properties: {} },
    {
      type: "field.patch",
      fieldId: "missing",
      properties: { views: { ...scalarField.views, extra: true } },
    },
    { type: "unknown" },
  ])("rejects unsupported payload %# with no publication", async (command) => {
    const t = setup();
    await expect(
      t.service.execute("Leads", { expectedRevision: t.revision(), command }, allCommands),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(t.read().revision).toBe(0);
    expect(t.audit()).toEqual([]);
  });

  it("rejects body organization keys and wrong route commands", async () => {
    const t = setup();
    const input = {
      expectedRevision: t.revision(),
      command: { type: "field.create", field: scalarField },
    };
    await expect(
      t.service.execute("Leads", { ...input, orgId: "other" }, allCommands),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(t.service.execute("Leads", input, ["module.patch"])).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("rejects invalid field/layout/default references and unreachable required fields", async () => {
    const t = setup();
    const layout = layoutSchema.parse(t.read().layouts[0]);
    const before = t.read();
    for (const command of [
      { type: "field.patch", fieldId: "missing", properties: { label: "Label" } },
      { type: "module.patch", properties: { defaultLayoutId: "missing" } },
      { type: "layout.patch", layout: { ...layout, id: "new-layout" } },
      { type: "layout.patch", layout: { ...layout, sections: [] } },
      { type: "field.create", field: { ...scalarField, required: true } },
    ] as CustomizationCommand[]) {
      await expect(t.execute(command)).rejects.toBeInstanceOf(ValidationError);
      expect(t.read()).toEqual(before);
      expect(t.audit()).toEqual([]);
    }
  });

  it("rejects required publication against existing/recoverable records even with valid placement", async () => {
    const t = setup();
    const layout = layoutSchema.parse(t.read().layouts[0]);
    required(layout.sections[0]).fields.push(scalarField.apiName);
    required(required(layout.sections[0]).columns[0]).push(scalarField.apiName);
    await expect(
      t.execute({ type: "field.create", field: { ...scalarField, required: true }, layout }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(t.read().revision).toBe(0);
    expect(t.audit()).toEqual([]);
  });

  it("publishes a required field and its generated placement in one snapshot when records are compatible", async () => {
    const ctx: OrgContext = {
      orgId: randomUUID(),
      orgSlug: "empty",
      orgName: "Empty",
      userId: "admin",
      role: "admin",
    };
    const metadata = new InMemoryCustomizationAdapter(fixtureMetadataBaselines());
    const coordinator = new InMemorySchemaCoordinator(metadata);
    coordinator.register(ctx.orgId, "Leads", {
      records: () => [],
      dependencies: () => ({ complete: true, fieldIds: [] }),
    });
    const service = new CustomizationService(ctx, metadata, true);
    const before = coordinator.read(ctx.orgId, "Leads");
    const layout = layoutSchema.parse(before.layouts[0]);
    required(layout.sections[0]).fields.push(scalarField.apiName);
    required(required(layout.sections[0]).columns[0]).push(scalarField.apiName);
    await service.execute(
      "Leads",
      {
        expectedRevision: schemaRevision(before),
        command: { type: "field.create", field: { ...scalarField, required: true }, layout },
      },
      ["field.create"],
    );
    const after = coordinator.read(ctx.orgId, "Leads");
    const field = required(after.fields.find((value) => value.apiName === scalarField.apiName));
    expect(after.revision).toBe(1);
    expect(after.layouts[0]?.sections[0]?.columns[0]).toContain(field.id);
    expect(after.layouts[0]?.sections[0]?.columns[0]).not.toContain(scalarField.apiName);
    expect(metadata.auditEntries(ctx.orgId, "Leads")).toHaveLength(1);
  });

  it("retains field values across retirement/restore, keeps names reserved and enforces dependencies", async () => {
    const t = setup();
    await t.execute({ type: "field.create", field: scalarField });
    const field = required(t.read().fields.find((field) => field.apiName === scalarField.apiName));
    const row = await t.records.create(
      "Leads",
      { Last_Name: "Synthetic", Company: "Example", Custom_Note: "retained" },
      { expectedRevision: t.revision() },
    );
    const layout = layoutSchema.parse(t.read().layouts[0]);
    required(layout.sections[0]).fields.push(field.id);
    required(required(layout.sections[0]).columns[0]).push(field.id);
    await t.execute({ type: "layout.patch", layout });
    const before = t.read();
    await expect(t.execute({ type: "field.retire", fieldId: field.id })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(t.read()).toEqual(before);
    const detached = structuredClone(layout);
    required(detached.sections[0]).fields = required(detached.sections[0]).fields.filter(
      (id) => id !== field.id,
    );
    required(detached.sections[0]).columns[0] = required(
      required(detached.sections[0]).columns[0],
    ).filter((id) => id !== field.id);
    await t.execute({ type: "field.retire", fieldId: field.id, layout: detached });
    expect((await t.records.get("Leads", row.id)).fields).not.toHaveProperty("Custom_Note");
    await expect(t.execute({ type: "field.create", field: scalarField })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await t.execute({ type: "field.restore", fieldId: field.id, layout });
    expect(t.read().fields.find((candidate) => candidate.id === field.id)?.apiName).toBe(
      "Custom_Note",
    );
    expect((await t.records.get("Leads", row.id)).fields.Custom_Note).toBe("retained");
    await expect(t.execute({ type: "field.restore", fieldId: field.id })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("updates module labels and the existing layout without changing layout identity", async () => {
    const t = setup();
    const layout = layoutSchema.parse(t.read().layouts[0]);
    await t.execute({
      type: "module.patch",
      properties: {
        singularLabel: "Prospect",
        pluralLabel: "Prospects",
        defaultLayoutId: layout.id,
      },
    });
    expect((await t.records.getModule("Leads")).pluralLabel).toBe("Prospects");
    await t.execute({ type: "layout.patch", layout: { ...layout, label: "Main" } });
    expect(t.read().layouts).toHaveLength(1);
    expect(t.read().layouts[0]).toMatchObject({ id: layout.id, isDefault: true, label: "Main" });
    expect(t.audit()).toHaveLength(2);
  });

  it("uses the existing view collection and protects system/default views and typed criteria", async () => {
    const t = setup();
    const view = {
      id: "shared-test",
      name: "Shared test",
      systemDefined: false as const,
      isDefault: false as const,
      columns: [required(t.read().fields[0]).id],
      criteria: null,
      sort: null,
    };
    await t.execute({ type: "view.create", view });
    expect((await t.records.getView("Leads", view.id)).name).toBe("Shared test");
    await t.execute({ type: "view.patch", view: { ...view, name: "Renamed" } }, view.id);
    await expect(t.execute({ type: "view.patch", view }, "all-leads")).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(t.execute({ type: "view.delete" }, "all-leads")).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      t.execute(
        {
          type: "view.patch",
          view: { ...view, criteria: { field: "missing", comparator: "equal", value: 1 } },
        },
        view.id,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await t.execute({ type: "view.delete" }, view.id);
    await expect(t.records.getView("Leads", view.id)).rejects.toMatchObject({ code: "not_found" });
    expect(t.audit()).toHaveLength(3);
  });

  it("invalid audit metadata rolls back a fully valid candidate", async () => {
    const t = setup();
    await expect(
      t.metadata.applyPatch(
        t.ctx.orgId,
        "Leads",
        0,
        { moduleProperties: { pluralLabel: "Changed" } },
        { actorId: "admin", operation: "module.patch", targetIds: ["Leads"], timestamp: "invalid" },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(t.read().pluralLabel).toBe("Leads");
    expect(t.read().revision).toBe(0);
    expect(t.audit()).toEqual([]);
  });

  it("serializes simultaneous commands: one publish, one stale rejection", async () => {
    const t = setup();
    const request = {
      expectedRevision: t.revision(),
      command: { type: "field.create", field: scalarField },
    };
    const results = await Promise.allSettled([
      t.service.execute("Leads", request, allCommands),
      t.service.execute("Leads", request, allCommands),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(
      (results.find((result) => result.status === "rejected") as PromiseRejectedResult).reason,
    ).toBeInstanceOf(SchemaStaleError);
    expect(t.audit()).toHaveLength(1);
  });
});
