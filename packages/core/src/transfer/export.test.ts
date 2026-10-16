import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, ValidationError } from "../errors";
import type { FieldDefinition, FieldValue } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import { neutralizeCell, parseCsv, serializeCsv } from "./csv";
import { exportFields, exportRecords } from "./export";
import type { ExportRequest, TransferLimits } from "./types";

const limits: TransferLimits = {
  fileBytes: 100_000,
  columns: 500,
  importRows: 5000,
  exportRows: 5000,
  exportBytes: 1_000_000,
  selectedIds: 500,
};
const request: ExportRequest = { module: "Accounts", fields: "all" };
const bytes = (body: string) => new TextEncoder().encode(body).byteLength;
const parse = (body: string) =>
  parseCsv(new TextEncoder().encode(body), {
    charset: "UTF-8",
    maxColumns: limits.columns,
    maxRows: limits.exportRows,
  });

async function setup() {
  const records = createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "export-test",
    orgName: "Example",
    userId: "example-user",
    role: "admin",
  });
  const metadata = await records.getModule("Accounts");
  const fields = exportFields(metadata.fields, {
    ...request,
    fields: { include: ["Account_Name"] },
  });
  const field = fields[0];
  if (!field) throw new Error("Account name metadata is required.");
  const view = (await records.listViews("Accounts")).find(
    (candidate) => candidate.name === "All Accounts",
  );
  if (!view) throw new Error("All Accounts fixture view is required.");
  const record = await records.create("Accounts", { Account_Name: "Export Example" });
  return { records, metadata, fields, field, record, view };
}

afterEach(() => vi.restoreAllMocks());

describe("exportFields", () => {
  it("keeps metadata order for all visible fields and omits the identifier", async () => {
    const { metadata } = await setup();
    const fields = exportFields(metadata.fields, request);
    expect(fields.length).toBeGreaterThan(1);
    expect(fields).toEqual(
      metadata.fields.filter((field) => field.apiName !== "id" && field.views.view),
    );
    expect(fields.some((field) => field.apiName === "id" || !field.views.view)).toBe(false);
  });

  it.each([{ include: ["Description", "id", "Account_Name"] }, { exclude: ["id", "Description"] }])(
    "selects fields in metadata order for %j",
    async (selection) => {
      const { metadata } = await setup();
      const allowed = metadata.fields.filter((field) => field.apiName !== "id" && field.views.view);
      const expected = allowed.filter((field) =>
        selection.include
          ? selection.include.includes(field.apiName)
          : !selection.exclude.includes(field.apiName),
      );
      expect(exportFields(metadata.fields, { ...request, fields: selection })).toEqual(expected);
      expect(expected.length).toBeGreaterThan(0);
    },
  );

  it("accepts an identifier-only inclusion without returning a metadata column", async () => {
    const { metadata } = await setup();
    expect(exportFields(metadata.fields, { ...request, fields: { include: ["id"] } })).toEqual([]);
  });

  it.each(["include", "exclude"] as const)(
    "rejects unknown and hidden names in %s with field_not_allowed",
    async (mode) => {
      const { metadata, field } = await setup();
      const hidden: FieldDefinition = {
        ...field,
        apiName: "Hidden_Field",
        views: { ...field.views, view: false },
      };
      const definitions = [...metadata.fields, hidden];
      expect(exportFields(definitions, request)).not.toContainEqual(hidden);
      for (const name of ["Unknown_Field", hidden.apiName]) {
        const selection = mode === "include" ? { include: [name] } : { exclude: [name] };
        const run = () => exportFields(definitions, { ...request, fields: selection });
        expect(run).toThrow(AppError);
        expect(run).toThrow(expect.objectContaining({ code: "field_not_allowed" }));
      }
    },
  );
});

describe("exportRecords", () => {
  it("rejects simultaneous selected IDs and view scope before reading records", async () => {
    const { records, fields, record } = await setup();
    const get = vi.spyOn(records, "get");
    const getView = vi.spyOn(records, "getView");
    const result = exportRecords(
      records,
      { ...request, ids: [record.id], viewId: "conflicting-view" },
      fields,
      limits,
    );
    await expect(result).rejects.toBeInstanceOf(ValidationError);
    await expect(result).rejects.toMatchObject({
      code: "validation",
      fieldErrors: { scope: [expect.any(String)] },
    });
    expect(get).not.toHaveBeenCalled();
    expect(getView).not.toHaveBeenCalled();
  });

  it("rejects IDs above the selection budget, including duplicate IDs", async () => {
    const { records, fields, record } = await setup();
    const get = vi.spyOn(records, "get");
    await expect(
      exportRecords(records, { ...request, ids: [record.id, record.id] }, fields, {
        ...limits,
        selectedIds: 1,
      }),
    ).rejects.toMatchObject({ code: "export_too_large" });
    expect(get).not.toHaveBeenCalled();
  });

  it.each(["=Formula", "+Formula", "-Formula", "@Formula", "\tFormula"])(
    "puts Record Id before field labels and neutralizes the label %j",
    async (label) => {
      const { records, field, record } = await setup();
      const definitions = [
        { ...field, label },
        { ...field, label: "Plain label" },
      ];
      const result = await exportRecords(
        records,
        { ...request, ids: [record.id] },
        definitions,
        limits,
      );
      expect(result.body.split("\r\n")[0]).toBe(
        serializeCsv(["Record Id", neutralizeCell(label), "Plain label"], []).trimEnd(),
      );
      expect(parse(result.body).headers).toEqual([
        "Record Id",
        neutralizeCell(label),
        "Plain label",
      ]);
    },
  );

  it("serializes empty, lookup, JSON, numeric and boolean values", async () => {
    const { records, field, record } = await setup();
    const object = { note: 'comma, quote" and\nnewline', nested: { active: true } };
    const values: Record<string, FieldValue> = {
      Null: null,
      Lookup: { id: "example-parent", module: "Accounts", name: "Ignored display name" },
      Object: object,
      Array: ["example", 2],
      Zero: 0,
      Negative: -20,
      Decimal: 1.5,
      True: true,
      False: false,
    };
    // Opaque JSON is not an Accounts input; isolate serialization at the read boundary.
    vi.spyOn(records, "get").mockResolvedValue({ ...record, fields: values });
    const definitions = [...Object.keys(values), "Missing"].map((apiName) => ({
      ...field,
      apiName,
      label: apiName,
    }));
    const result = await exportRecords(
      records,
      { ...request, ids: [record.id] },
      definitions,
      limits,
    );
    expect(parse(result.body).rows).toEqual([
      [
        record.id,
        "",
        "example-parent",
        JSON.stringify(object),
        JSON.stringify(values.Array),
        "0",
        "-20",
        "1.5",
        "true",
        "false",
        "",
      ],
    ]);
  });

  it("counts unique selected records and accepts the exact row and ID budgets", async () => {
    const { records, fields, record } = await setup();
    const second = await records.create("Accounts", { Account_Name: "Second Example" });
    const result = await exportRecords(
      records,
      { ...request, ids: [record.id, second.id, record.id] },
      fields,
      { ...limits, selectedIds: 3, exportRows: 2 },
    );
    expect(result).toMatchObject({ rowCount: 2, scope: "Selected records" });
    expect(parse(result.body).rows.map((row) => row[0])).toEqual([record.id, second.id]);
  });

  it.each(["selected", "view", "all"] as const)(
    "enforces the row budget for %s scope",
    async (scope) => {
      const { records, fields, record, view } = await setup();
      const scoped = {
        ...request,
        ...(scope === "selected"
          ? { ids: [record.id] }
          : scope === "view"
            ? { viewId: view.id }
            : {}),
      };
      await expect(
        exportRecords(records, scoped, fields, { ...limits, exportRows: 0 }),
      ).rejects.toMatchObject({ code: "export_too_large" });
    },
  );

  it.each(["view", "all"] as const)(
    "returns the matching scope and all rows across pages for %s",
    async (scope) => {
      const { records, fields, view } = await setup();
      const count = await records.count("Accounts", { viewId: view.id });
      expect(count).toBeGreaterThan(100);
      const result = await exportRecords(
        records,
        { ...request, ...(scope === "view" ? { viewId: view.id } : {}) },
        fields,
        { ...limits, exportRows: count },
      );
      expect(result).toMatchObject({ rowCount: count, scope: view.name });
      expect(parse(result.body).rows).toHaveLength(count);
      expect(new Set(parse(result.body).rows.map((row) => row[0])).size).toBe(count);
      await expect(
        exportRecords(
          records,
          { ...request, ...(scope === "view" ? { viewId: view.id } : {}) },
          fields,
          { ...limits, exportRows: count - 1 },
        ),
      ).rejects.toMatchObject({ code: "export_too_large" });
    },
  );

  it("uses the requested filtered view rather than the all-records view", async () => {
    const { records, fields, record } = await setup();
    const view = (await records.listViews("Accounts")).find(
      (candidate) => candidate.name === "All Locked Accounts",
    );
    if (!view) throw new Error("Locked Accounts fixture view is required.");
    const expected = await records.list("Accounts", { viewId: view.id, page: 1, perPage: 100 });
    expect(expected.records.length).toBeGreaterThan(0);
    expect(expected.moreRecords).toBe(false);
    const result = await exportRecords(records, { ...request, viewId: view.id }, fields, limits);
    expect(result).toMatchObject({ rowCount: expected.records.length, scope: view.name });
    const ids = parse(result.body).rows.map((row) => row[0]);
    expect(ids).toEqual(expected.records.map((row) => row.id));
    expect(ids).not.toContain(record.id);
  });

  it("enforces the UTF-8 byte budget at the exact serialized row boundary", async () => {
    const { records, fields, field } = await setup();
    const record = await records.create("Accounts", { Account_Name: 'Örnek, "例"' });
    const scoped = { ...request, ids: [record.id] };
    const body = serializeCsv(["Record Id", field.label], [[record.id, 'Örnek, "例"']]);
    expect(bytes(body)).toBeGreaterThan(body.length);
    const result = await exportRecords(records, scoped, fields, {
      ...limits,
      exportBytes: bytes(body),
    });
    expect(result).toEqual({ body, rowCount: 1, scope: "Selected records" });
    await expect(
      exportRecords(records, scoped, fields, { ...limits, exportBytes: bytes(body) - 1 }),
    ).rejects.toMatchObject({ code: "export_too_large" });
  });

  it("counts the header against the byte budget even without records", async () => {
    const { records, fields } = await setup();
    const scoped = { ...request, ids: [] };
    const body = serializeCsv(["Record Id", ...fields.map((field) => field.label)], []);
    await expect(
      exportRecords(records, scoped, fields, { ...limits, exportBytes: bytes(body) - 1 }),
    ).rejects.toMatchObject({ code: "export_too_large" });
    await expect(
      exportRecords(records, scoped, fields, {
        ...limits,
        exportBytes: bytes(body),
        exportRows: 0,
      }),
    ).resolves.toEqual({ body, rowCount: 0, scope: "Selected records" });
  });
});
