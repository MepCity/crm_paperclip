import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { InMemorySchemaCoordinator, schemaRevision } from "../../customization/coordinator";
import { InMemoryCustomizationAdapter } from "../../customization/memory";
import type { CustomizationField, ModuleBaseline } from "../../customization/types";
import { SchemaStaleError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import { exportFields } from "../../transfer/export";
import { importRows } from "../../transfer/import";
import type { ImportJob, TransferDependencies } from "../../transfer/types";
import { createFixtureRecordService } from "./index";
import { fixtureModules } from "./registry";

const custom: CustomizationField = {
  id: "custom-note",
  apiName: "Custom_Note",
  label: "Custom note",
  dataType: "text",
  lifecycle: "active",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};
function baseline(module: string): ModuleBaseline {
  const bundle = fixtureModules[module];
  if (!bundle) throw new Error("Unknown test module");
  return {
    apiName: module,
    version: "test-v1",
    singularLabel: module,
    pluralLabel: module,
    externalCriteriaFields: [],
    fields: bundle.metadata.fields.map((field) => ({
      ...field,
      id: field.apiName,
      lifecycle: "active",
      customizable: ["label", "required", "readOnly", "maxLength", "picklist", "views"],
      serverValue: true,
      systemRequired: field.required,
    })),
    layouts: [
      {
        id: "default",
        label: "Default",
        isDefault: true,
        sections: [
          {
            id: "main",
            label: "Main",
            columnCount: 1,
            columns: [bundle.metadata.fields.map((field) => field.apiName)],
            fields: bundle.metadata.fields.map((field) => field.apiName),
          },
        ],
      },
    ],
    views: [
      {
        id: "all",
        name: "All",
        systemDefined: true,
        isDefault: true,
        columns: [bundle.displayNameField],
        criteria: null,
        sort: null,
      },
    ],
    reservedApiNames: [],
    customFieldTypes: ["text", "integer", "picklist", "lookup"],
    supportedColumnCounts: [1],
    capabilities: {},
    engineCapabilities: {},
  };
}
function setup(extra: Parameters<typeof createFixtureRecordService>[1] = {}) {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "schema-test",
    orgName: "Schema test",
    userId: "actor",
    role: "admin",
  };
  const metadata = new InMemoryCustomizationAdapter(
    ["Leads", "Contacts", "Accounts", "Deals"].map(baseline),
  );
  const schema = new InMemorySchemaCoordinator(metadata);
  const records = createFixtureRecordService(ctx, { ...extra, schema });
  const revision = (module = "Leads") => ({
    expectedRevision: schemaRevision(schema.read(ctx.orgId, module)),
  });
  const add = (module = "Leads", field = custom) =>
    metadata.applyPatch(ctx.orgId, module, schema.read(ctx.orgId, module).revision, {
      addFields: [field],
    });
  const patch = (
    fieldPatches: Parameters<typeof metadata.applyPatch>[3]["fieldPatches"],
    module = "Leads",
  ) =>
    metadata.applyPatch(ctx.orgId, module, schema.read(ctx.orgId, module).revision, {
      fieldPatches,
    });
  return { ctx, metadata, schema, records, revision, add, patch };
}
const leadInput = { Last_Name: "Synthetic", Company: "Example" };

describe("schema coordinated fixture records", () => {
  it("requires a revision, rejects unknown/read-only values, and validates inline/mass edits", async () => {
    const t = setup();
    await t.add();
    await expect(t.records.create("Leads", leadInput)).rejects.toBeInstanceOf(ValidationError);
    const row = await t.records.create(
      "Leads",
      { ...leadInput, Custom_Note: "short" },
      t.revision(),
    );
    await t.patch({ "custom-note": { maxLength: 5 } });
    await expect(
      t.records.create("Leads", { ...leadInput, Custom_Note: "too long" }, t.revision()),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      t.records.update("Leads", row.id, { Custom_Note: 7 }, t.revision()),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      t.records.massUpdate("Leads", [row.id], { Custom_Note: "too long" }, t.revision()),
    ).rejects.toBeInstanceOf(ValidationError);
    await t.patch({ "custom-note": { readOnly: true } });
    await expect(
      t.records.update("Leads", row.id, { Custom_Note: "valid" }, t.revision()),
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await t.records.get("Leads", row.id)).fields.Custom_Note).toBe("short");
    // Opening a second service without the option cannot bypass the tenant's coordinator.
    await expect(
      createFixtureRecordService(t.ctx).create("Leads", leadInput),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("enforces the same constraints and expected revision during CSV import", async () => {
    const t = setup();
    await t.add();
    await t.patch({ "custom-note": { maxLength: 3 } });
    const metadata = await t.records.getModule("Leads");
    const settings = {
      mode: "add" as const,
      mapping: [
        { column: 0, field: "Last_Name" },
        { column: 1, field: "Custom_Note" },
      ],
      defaults: [{ field: "Company", value: "Example" }],
      ignoreEmptyOnUpdate: false,
      expectedRevision: t.revision().expectedRevision,
    };
    const upload = {
      id: "upload",
      userId: t.ctx.userId,
      module: "Leads" as const,
      fileName: "synthetic.csv",
      charset: "UTF-8" as const,
      headers: ["Last_Name", "Custom_Note"],
      rows: [
        ["Imported", "ok"],
        ["Invalid", "too long"],
      ],
      at: Date.now(),
    };
    const job: ImportJob = {
      id: "job",
      module: "Leads",
      fileName: upload.fileName,
      createdBy: { id: t.ctx.userId, name: "Actor" },
      createdAt: new Date().toISOString(),
      status: "failed",
      counts: { created: 0, updated: 0, skipped: 0, errors: 0 },
      undoable: false,
      rows: [],
    };
    const deps = {
      listActors: async () => [],
      authorize: async () => {},
    } as unknown as TransferDependencies;
    const ids = await importRows(t.ctx, t.records, deps, upload, settings, metadata, "id", job);
    expect(ids).toHaveLength(1);
    expect(job.counts).toMatchObject({ created: 1, errors: 1 });
    await t.patch({ "custom-note": { label: "New label" } });
    const staleJob = {
      ...job,
      counts: { created: 0, updated: 0, skipped: 0, errors: 0 },
      rows: [],
    };
    expect(
      await importRows(t.ctx, t.records, deps, upload, settings, metadata, "id", staleJob),
    ).toEqual([]);
    expect(staleJob.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "schema_stale" })]),
    );
  });

  it("aborts a stale write after an asynchronous owner check without a record/history side effect", async () => {
    let release: ((ids: readonly string[]) => void) | undefined;
    const t = setup({
      listMemberIds: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    const pending = t.records.create("Leads", { ...leadInput, Owner: t.ctx.userId }, t.revision());
    await t.add();
    release?.([t.ctx.userId]);
    await expect(pending).rejects.toBeInstanceOf(SchemaStaleError);
    expect(
      await t.records.count("Leads", {
        viewId: "all",
        filters: { field: "Last_Name", comparator: "equal", value: "Synthetic" },
      }),
    ).toBe(0);
    await expect(
      t.records.create("Leads", leadInput, { expectedRevision: "old" }),
    ).rejects.toMatchObject({ code: "schema_stale" });
  });

  it("rejects a target-schema change during conversion before any target or source is committed", async () => {
    let release: ((ids: readonly string[]) => void) | undefined;
    const t = setup({
      listMemberIds: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    const lead = await t.records.create("Leads", leadInput, t.revision());
    const pending = t.records.convertLead(
      lead.id,
      { contact: { create: { Last_Name: "Conversion race" } } },
      {
        expectedRevision: {
          Leads: t.revision().expectedRevision,
          Contacts: t.revision("Contacts").expectedRevision,
        },
      },
    );
    await t.add("Contacts");
    release?.([t.ctx.userId]);
    await expect(pending).rejects.toBeInstanceOf(SchemaStaleError);
    expect((await t.records.get("Leads", lead.id)).fields.Converted__s).not.toBe(true);
    expect(
      await t.records.count("Contacts", {
        viewId: "all",
        filters: { field: "Last_Name", comparator: "equal", value: "Conversion race" },
      }),
    ).toBe(0);
  });

  it("prevents attaching a coordinator after an uncoordinated service was opened", async () => {
    const t = setup();
    const ctx = { ...t.ctx, orgId: randomUUID() };
    createFixtureRecordService(ctx);
    expect(() => createFixtureRecordService(ctx, { schema: t.schema })).toThrow();
  });

  it("rejects incompatible required/length publication, including recoverable records", async () => {
    const t = setup();
    await t.add();
    const row = await t.records.create(
      "Leads",
      { ...leadInput, Custom_Note: "retained" },
      t.revision(),
    );
    await t.records.delete("Leads", [row.id], t.revision());
    const before = t.schema.read(t.ctx.orgId, "Leads");
    await expect(t.patch({ "custom-note": { maxLength: 2 } })).rejects.toBeInstanceOf(
      ValidationError,
    );
    const layout = before.layouts.map((entry) => ({
      ...entry,
      sections: entry.sections.map((section) => ({
        ...section,
        columns: section.columns.map((column, index) =>
          index === 0 ? [...column, "custom-note"] : [...column],
        ),
      })),
    }));
    await expect(
      t.metadata.applyPatch(t.ctx.orgId, "Leads", before.revision, {
        fieldPatches: { "custom-note": { required: true } },
        layouts: layout,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(t.schema.read(t.ctx.orgId, "Leads")).toEqual(before);
  });

  it("retains retired values, rejects retired queries/writes/export columns, and restores the same identity", async () => {
    const t = setup();
    await t.add();
    const row = await t.records.create(
      "Leads",
      { ...leadInput, Custom_Note: "hiddenneedle" },
      t.revision(),
    );
    await t.metadata.applyPatch(t.ctx.orgId, "Leads", 1, { retireFields: [custom.id] });
    expect((await t.records.get("Leads", row.id)).fields).not.toHaveProperty("Custom_Note");
    expect(
      (await t.records.getModule("Leads")).fields.some((f) => f.apiName === "Custom_Note"),
    ).toBe(false);
    expect(() =>
      exportFields(t.schema.read(t.ctx.orgId, "Leads").fields, {
        module: "Leads",
        fields: { include: ["Custom_Note"] },
      }),
    ).toThrow();
    await expect(
      t.records.update("Leads", row.id, { Custom_Note: "x" }, t.revision()),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      t.records.list("Leads", { viewId: "all", page: 1, perPage: 10, fields: ["Custom_Note"] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      t.records.count("Leads", {
        viewId: "all",
        filters: { field: "Custom_Note", comparator: "equal", value: "hiddenneedle" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      t.records.list("Leads", {
        viewId: "all",
        page: 1,
        perPage: 10,
        sort: { field: "Custom_Note", order: "asc" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await t.records.search({ text: "hiddenneedle", modules: ["Leads"] })).toEqual([]);
    await expect(t.add("Leads", { ...custom, id: "different" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await t.metadata.applyPatch(t.ctx.orgId, "Leads", 2, { restoreFields: [custom.id] });
    expect((await t.records.get("Leads", row.id)).fields.Custom_Note).toBe("hiddenneedle");
  });

  it("blocks retirement with layout/view dependencies and unknown external dependencies", async () => {
    const t = setup();
    await t.add();
    const current = t.schema.read(t.ctx.orgId, "Leads");
    await t.metadata.applyPatch(t.ctx.orgId, "Leads", 1, {
      views: [
        ...current.views,
        {
          id: "custom-view",
          name: "Custom",
          systemDefined: false,
          isDefault: false,
          columns: [custom.id],
          criteria: null,
          sort: null,
        },
      ],
    });
    await expect(
      t.metadata.applyPatch(t.ctx.orgId, "Leads", 2, { retireFields: [custom.id] }),
    ).rejects.toBeInstanceOf(ValidationError);
    const adapter = new InMemoryCustomizationAdapter([baseline("Leads")]);
    const coordinator = new InMemorySchemaCoordinator(adapter);
    coordinator.register("isolated", "Leads", {
      records: () => [],
      dependencies: () => ({ complete: false, fieldIds: [] }),
    });
    await adapter.applyPatch("isolated", "Leads", 0, { addFields: [custom] });
    await expect(
      adapter.applyPatch("isolated", "Leads", 1, { retireFields: [custom.id] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("validates conversion and merge through the effective constraints atomically", async () => {
    const t = setup();
    await t.add("Contacts");
    await t.patch({ "custom-note": { readOnly: true } }, "Contacts");
    const lead = await t.records.create("Leads", leadInput, t.revision());
    const options = {
      expectedRevision: Object.fromEntries(
        ["Leads", "Contacts"].map((m) => [m, t.revision(m).expectedRevision]),
      ),
    };
    await expect(
      t.records.convertLead(
        lead.id,
        { contact: { create: { Last_Name: "Converted", Custom_Note: "forbidden" } } },
        options,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await t.records.get("Leads", lead.id)).fields.Converted__s).not.toBe(true);
    await t.add();
    const other = await t.records.create(
      "Leads",
      { ...leadInput, Last_Name: "Other" },
      t.revision(),
    );
    await t.patch({ "custom-note": { maxLength: 3 } });
    await expect(
      t.records.merge(
        "Leads",
        { masterId: lead.id, duplicateIds: [other.id], values: { Custom_Note: "long" } },
        t.revision(),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await t.records.get("Leads", other.id)).id).toBe(other.id);
  });

  it("restores against current metadata and rolls back the entire batch on a unique conflict", async () => {
    const t = setup();
    await t.add("Leads", { ...custom, unique: true });
    const first = await t.records.create(
      "Leads",
      { ...leadInput, Custom_Note: "duplicate" },
      t.revision(),
    );
    const second = await t.records.create(
      "Leads",
      { ...leadInput, Last_Name: "Second", Custom_Note: "second" },
      t.revision(),
    );
    await t.records.delete("Leads", [first.id, second.id], t.revision());
    await t.records.create(
      "Leads",
      { ...leadInput, Last_Name: "Active", Custom_Note: "duplicate" },
      t.revision(),
    );
    const bin = await t.records.recycleBin.list({ module: "Leads" });
    const ids = bin.entries
      .filter((e) => [first.id, second.id].includes(e.recordId))
      .map((e) => e.id);
    await expect(t.records.recycleBin.restore(ids)).rejects.toMatchObject({
      fieldErrors: { Custom_Note: ["This value is already in use."] },
    });
    await expect(t.records.get("Leads", first.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(t.records.get("Leads", second.id)).rejects.toMatchObject({ code: "not_found" });
    expect((await t.records.recycleBin.list({ module: "Leads" })).total).toBe(bin.total);
  });

  it("keeps one tenant's metadata and record values isolated", async () => {
    const t = setup();
    await t.add();
    const otherCtx = { ...t.ctx, orgId: randomUUID(), orgSlug: "other" };
    const other = createFixtureRecordService(otherCtx, { schema: t.schema });
    expect((await other.getModule("Leads")).fields.some((f) => f.apiName === "Custom_Note")).toBe(
      false,
    );
    expect(t.schema.read(otherCtx.orgId, "Leads").revision).toBe(0);
    await expect(
      other.create(
        "Leads",
        { ...leadInput, Custom_Note: "foreign" },
        { expectedRevision: schemaRevision(t.schema.read(otherCtx.orgId, "Leads")) },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects non-scalar additions even if a baseline advertises their type", async () => {
    const t = setup();
    await expect(t.add("Leads", { ...custom, dataType: "lookup" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(t.schema.read(t.ctx.orgId, "Leads").revision).toBe(0);
  });

  it("rejects incompatible baseline upgrades without changing records or cached revisions", async () => {
    const t = setup();
    const row = await t.records.create("Leads", leadInput, t.revision());
    const before = t.schema.read(t.ctx.orgId, "Leads");
    const next = baseline("Leads");
    expect(() =>
      t.metadata.upgradeBaseline({
        ...next,
        version: "test-v2",
        fields: next.fields.map((field) =>
          field.apiName === "Last_Name" ? { ...field, maxLength: 1 } : field,
        ),
      }),
    ).toThrow(ValidationError);
    expect(t.schema.read(t.ctx.orgId, "Leads")).toEqual(before);
    expect((await t.records.get("Leads", row.id)).fields.Last_Name).toBe("Synthetic");
  });

  it("invalidates tokens on a baseline upgrade even for tenants without overlays", async () => {
    const t = setup();
    const old = t.revision();
    t.metadata.upgradeBaseline({ ...baseline("Leads"), version: "test-v2" });
    expect(t.revision()).not.toEqual(old);
    await expect(t.records.create("Leads", leadInput, old)).rejects.toBeInstanceOf(
      SchemaStaleError,
    );
    await expect(t.records.create("Leads", leadInput, t.revision())).resolves.toMatchObject({
      fields: leadInput,
    });
  });
});
