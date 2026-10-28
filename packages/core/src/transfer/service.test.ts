import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "../errors";
import type { RecordService } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import type { OrgContext } from "../tenancy/types";
import { parseCsv, serializeCsv } from "./csv";
import { createTransferService } from "./service";
import type {
  ExportRequest,
  ImportSettings,
  TransferDependencies,
  TransferLocale,
  TransferModule,
} from "./types";

function setup(options: Partial<TransferDependencies> = {}) {
  const ctx: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "transfer-test",
    orgName: "Example",
    userId: "example-user",
    role: "admin",
  };
  const records = createFixtureRecordService(ctx);
  const authorize = vi.fn(async () => {});
  const deps: TransferDependencies = {
    records: (context) =>
      context.orgId === ctx.orgId ? records : createFixtureRecordService(context),
    authorize,
    listActors: async (context) => [{ id: context.userId, name: "Example User" }],
    ...options,
  };
  const service = createTransferService(deps);
  const preview = (module: TransferModule, headers: string[], rows: string[][]) =>
    service.previewImport(ctx, module, {
      name: "example.csv",
      bytes: new TextEncoder().encode(serializeCsv(headers, rows)),
      charset: "UTF-8",
    });
  const run = async (
    module: TransferModule,
    values: Record<string, string>[],
    settings: Partial<ImportSettings> = {},
  ) => {
    const headers = Object.keys(values[0] ?? {});
    const upload = await preview(
      module,
      headers,
      values.map((value) => headers.map((header) => value[header] ?? "")),
    );
    return service.runImport(ctx, module, upload.uploadId, {
      mode: "add",
      ignoreEmptyOnUpdate: false,
      mapping: headers.map((field, column) => ({ field, column })),
      defaults: [],
      ...settings,
    });
  };
  return { ctx, records, service, authorize, deps, preview, run };
}
async function data(
  records: RecordService,
  module: TransferModule,
  key: string,
): Promise<Record<string, string>> {
  if (module === "Leads") return { Last_Name: "Example", Company: "Example", Email: key };
  if (module === "Contacts") return { Last_Name: "Example", Email: key };
  if (module === "Accounts") return { Account_Name: key };
  const account = await records.create("Accounts", { Account_Name: "Import Parent" });
  return {
    Deal_Name: key,
    Closing_Date: "2026-12-01",
    Stage: "Qualification",
    Account_Name: account.id,
  };
}
const modules = ["Leads", "Contacts", "Accounts", "Deals"] as const;
const match = { Leads: "Email", Contacts: "Email", Accounts: "Account_Name", Deals: "Deal_Name" };

describe("transfer record-service integration", () => {
  for (const module of modules) {
    it(`${module}: Add, Update and Both preserve writes and undo only additions`, async () => {
      const s = setup();
      const input = await data(s.records, module, `new-${module}@example.test`);
      const added = await s.run(module, [input]);
      expect(added.counts).toEqual({ created: 1, updated: 0, skipped: 0, errors: 0 });
      expect(added.rows).toEqual([]);
      const updated = await s.run(
        module,
        [{ [match[module]]: input[match[module]] ?? "", Description: "Changed" }],
        { mode: "update" },
      );
      expect(updated.counts.updated).toBe(1);
      const second = {
        ...input,
        [match[module]]: `second-${module}@example.test`,
        Description: "Mixed",
      };
      const both = await s.run(module, [{ ...input, Description: "Kept" }, second], {
        mode: "both",
      });
      expect(both.counts).toEqual({ created: 1, updated: 1, skipped: 0, errors: 0 });
      expect((await s.service.undoImport(s.ctx, both.id)).status).toBe("undone");
      await expect(s.service.undoImport(s.ctx, both.id)).rejects.toMatchObject({
        code: "not_undoable",
      });
      const original = (
        await s.records.list(module, {
          viewId: (await s.records.listViews(module)).find((view) => view.isDefault)?.id ?? "",
          page: 1,
          perPage: 100,
          filters: { field: match[module], comparator: "equal", value: input[match[module]] ?? "" },
        })
      ).records;
      expect(original[0]?.fields.Description).toBe("Kept");
      await expect(s.service.undoImport(s.ctx, updated.id)).rejects.toMatchObject({
        code: "not_undoable",
      });
    });
  }
  it("returns safe row errors and partial counts; first valid duplicate wins", async () => {
    const s = setup();
    const job = await s.run("Contacts", [
      { Last_Name: "", Email: "repeat@example.test", Lead_Source: "" },
      { Last_Name: "Valid", Email: "repeat@example.test", Lead_Source: "" },
      { Last_Name: "Duplicate", Email: "REPEAT@example.test", Lead_Source: "" },
      { Last_Name: "Bad option", Email: "bad@example.test", Lead_Source: "Not a listed option" },
    ]);
    expect(job.status).toBe("completed_with_errors");
    expect(job.counts).toEqual({ created: 2, updated: 0, skipped: 1, errors: 1, warnings: 1 });
    expect(job.rows).toEqual([
      { row: 2, outcome: "error", code: "required_missing", field: "Last_Name" },
      { row: 4, outcome: "skipped", code: "duplicate_in_file", field: "Email" },
      { row: 5, outcome: "warning", code: "value_cleared", field: "Lead_Source" },
    ]);
    expect(JSON.stringify(job.rows)).not.toContain("@example.test");
  });
  it("handles missing, multiple and existing matches without merging records", async () => {
    const s = setup();
    await s.records.create("Leads", {
      Last_Name: "One",
      Company: "Example",
      Email: "multiple@example.test",
    });
    await s.records.create("Leads", {
      Last_Name: "Two",
      Company: "Example",
      Email: "multiple@example.test",
    });
    expect(
      (await s.run("Leads", [{ Email: "multiple@example.test" }], { mode: "update" })).rows[0]
        ?.code,
    ).toBe("multiple_matches");
    expect(
      (await s.run("Leads", [{ Email: "missing@example.test" }], { mode: "update" })).rows[0]?.code,
    ).toBe("not_found");
    await s.run("Contacts", [{ Last_Name: "Example", Email: "exists@example.test" }]);
    expect(
      (await s.run("Contacts", [{ Last_Name: "Example", Email: "exists@example.test" }])).rows[0]
        ?.code,
    ).toBe("already_exists");
  });
  it("matches opaque IDs, ignores empty updates and applies replacements/defaults", async () => {
    const s = setup();
    const record = await s.records.create("Contacts", {
      Last_Name: "Original",
      Email: "original@example.test",
      Description: "Keep",
    });
    const update = vi.spyOn(s.records, "update");
    const job = await s.run("Contacts", [{ id: record.id, Last_Name: "", Description: "" }], {
      mode: "update",
      matchField: "id",
      ignoreEmptyOnUpdate: true,
    });
    expect(job.counts.updated).toBe(1);
    expect(update).toHaveBeenCalledWith("Contacts", record.id, {}, undefined);
    expect((await s.records.get("Contacts", record.id)).fields).toMatchObject({
      Last_Name: "Original",
      Description: "Keep",
    });
    const replaced = await s.run("Contacts", [{ Last_Name: "", Email: "replaced@example.test" }], {
      mapping: [
        { column: 0, field: "Last_Name", replaceEmptyWith: "Replacement" },
        { column: 1, field: "Email" },
      ],
      defaults: [{ field: "Description", value: "Default" }],
    });
    expect(replaced.counts.created).toBe(1);
  });
  it("resolves tenant-local owners and lookups and rejects ambiguous/missing names", async () => {
    const s = setup();
    await s.records.create("Accounts", { Account_Name: "Ambiguous" });
    await s.records.create("Accounts", { Account_Name: "Ambiguous" });
    const job = await s.run("Contacts", [
      { Last_Name: "Valid", Email: "lookup@example.test", Account_Name: "", Owner: "Example User" },
      {
        Last_Name: "Missing",
        Email: "missing@example.test",
        Account_Name: "Missing",
        Owner: "Example User",
      },
      {
        Last_Name: "Ambiguous",
        Email: "ambiguous@example.test",
        Account_Name: "Ambiguous",
        Owner: "Example User",
      },
      { Last_Name: "Owner", Email: "owner@example.test", Account_Name: "", Owner: "Other member" },
    ]);
    // Unresolved lookups are left empty and an unknown owner becomes the importing user.
    expect(job.counts).toMatchObject({ created: 4, errors: 0, warnings: 3 });
    expect(job.rows.map((row) => [row.outcome, row.code, row.field])).toEqual([
      ["warning", "not_found", "Account_Name"],
      ["warning", "multiple_matches", "Account_Name"],
      ["warning", "owner_defaulted", "Owner"],
    ]);
    expect((await contactByEmail(s.records, "owner@example.test")).Owner).toBe(s.ctx.userId);
  });
  it("converts numeric and boolean fields and leaves an unusable optional value empty", async () => {
    const s = setup();
    const job = await s.run("Leads", [
      {
        Last_Name: "Number",
        Company: "Example",
        Email: "number@example.test",
        No_of_Employees: "12",
        Email_Opt_Out: "true",
      },
      {
        Last_Name: "Bad",
        Company: "Example",
        Email: "bad@example.test",
        No_of_Employees: "1.5",
        Email_Opt_Out: "false",
      },
    ]);
    expect(job.counts).toMatchObject({ created: 2, errors: 0, warnings: 1 });
    expect(job.rows[0]).toMatchObject({
      outcome: "warning",
      field: "No_of_Employees",
      code: "value_cleared",
    });
  });
});

describe("transfer preflight and isolation", () => {
  it("suggests metadata labels/API names and excludes system fields", async () => {
    const s = setup();
    const preview = await s.preview(
      "Contacts",
      [" last NAME ", "EMAIL", "unknown", "Record Id"],
      [["Example", "example@example.test", "", ""]],
    );
    expect(preview.suggestedMapping.map((item) => item.field)).toEqual([
      "Last_Name",
      "Email",
      null,
      "id",
    ]);
    // Created By is system managed; the two timestamps can be carried over by an import.
    expect(preview.fields.some((field) => field.apiName === "Created_By")).toBe(false);
    expect(preview.fields.some((field) => field.apiName === "Created_Time")).toBe(true);
    expect(preview.matchFields.map((field) => field.field)).toEqual(["id", "Email"]);
  });
  it.each([
    [
      "mapping_duplicate_field",
      {
        mapping: [
          { column: 0, field: "Last_Name" },
          { column: 1, field: "Last_Name" },
        ],
      },
    ],
    ["mapping_missing_required", { mapping: [{ column: 0, field: "Email" }] }],
    ["mapping_system_field", { mapping: [{ column: 0, field: "Created_By" }] }],
    ["mapping_system_field", { defaults: [{ field: "Modified_By", value: "Example" }] }],
    ["match_field_required", { mode: "update", mapping: [{ column: 0, field: "Last_Name" }] }],
    ["invalid_match_field", { matchField: "Description" }],
  ] as const)("rejects %s before writes", async (code, overrides) => {
    const s = setup();
    const upload = await s.preview(
      "Contacts",
      ["Last_Name", "Email"],
      [["Example", "example@example.test"]],
    );
    const create = vi.spyOn(s.records, "create");
    await expect(
      s.service.runImport(s.ctx, "Contacts", upload.uploadId, {
        mode: "add",
        ignoreEmptyOnUpdate: false,
        mapping: [{ column: 0, field: "Last_Name" }],
        defaults: [],
        ...structuredClone(overrides),
      } as ImportSettings),
    ).rejects.toMatchObject({ code });
    expect(create).not.toHaveBeenCalled();
  });
  it("scopes uploads to user/module, consumes once and evicts the oldest org upload", async () => {
    const s = setup();
    const first = await s.preview("Contacts", ["Last_Name"], [["Example"]]);
    const settings: ImportSettings = {
      mode: "add",
      mapping: [{ column: 0, field: "Last_Name" }],
      defaults: [],
      ignoreEmptyOnUpdate: false,
    };
    await expect(
      s.service.runImport({ ...s.ctx, userId: "other" }, "Contacts", first.uploadId, settings),
    ).rejects.toMatchObject({ code: "upload_expired" });
    await expect(
      s.service.runImport(s.ctx, "Leads", first.uploadId, settings),
    ).rejects.toMatchObject({ code: "upload_expired" });
    for (let index = 0; index < 5; index++)
      await s.preview("Contacts", ["Last_Name"], [["Example"]]);
    await expect(
      s.service.runImport(s.ctx, "Contacts", first.uploadId, settings),
    ).rejects.toMatchObject({ code: "upload_expired" });
    const upload = await s.preview("Contacts", ["Last_Name"], [["Example"]]);
    const results = await Promise.allSettled([
      s.service.runImport(s.ctx, "Contacts", upload.uploadId, settings),
      s.service.runImport(s.ctx, "Contacts", upload.uploadId, settings),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  });
  it("isolates history, returns defensive copies and expires uploads/history exactly at TTL", async () => {
    let time = new Date("2026-10-01T00:00:00Z");
    const s = setup({ now: () => time });
    const upload = await s.preview("Contacts", ["Last_Name"], [["Example"]]);
    time = new Date(time.getTime() + 30 * 60 * 1000);
    await expect(
      s.service.runImport(s.ctx, "Contacts", upload.uploadId, {
        mode: "add",
        ignoreEmptyOnUpdate: false,
        mapping: [{ column: 0, field: "Last_Name" }],
        defaults: [],
      }),
    ).rejects.toMatchObject({ code: "upload_expired" });
    const job = await s.run("Contacts", [{ Last_Name: "Example" }]);
    const other = { ...s.ctx, orgId: randomUUID() };
    expect(await s.service.listImports(other)).toEqual([]);
    await expect(s.service.getImport(other, job.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(s.service.undoImport(other, job.id)).rejects.toMatchObject({ code: "not_found" });
    job.counts.created = 999;
    expect((await s.service.getImport(s.ctx, job.id)).counts.created).toBe(1);
    time = new Date(time.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(await s.service.listImports(s.ctx)).toEqual([]);
  });
  it("rejects permissions before writes and rechecks undo/download rights", async () => {
    const s = setup();
    const job = await s.run("Contacts", [{ Last_Name: "Example" }]);
    const exported = await s.service.runExport(s.ctx, {
      module: "Contacts",
      ids: [],
      fields: "all",
    });
    s.authorize.mockImplementation(async () => {
      throw new ForbiddenError();
    });
    await expect(s.run("Contacts", [{ Last_Name: "Example" }])).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(s.service.undoImport(s.ctx, job.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(s.service.downloadExport(s.ctx, exported.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      s.service.runExport(s.ctx, { module: "Contacts", fields: "all" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect((await s.service.getImport(s.ctx, job.id)).undoable).toBe(true);
  });
  it("rejects nonmembers from history and skips already removed additions on undo", async () => {
    const s = setup();
    const deleted: string[] = [];
    const create = s.records.create.bind(s.records);
    vi.spyOn(s.records, "create").mockImplementation(async (module, input) => {
      const record = await create(module, input);
      deleted.push(record.id);
      return record;
    });
    const job = await s.run("Contacts", [{ Last_Name: "Example" }]);
    await s.records.delete("Contacts", deleted);
    expect((await s.service.undoImport(s.ctx, job.id)).status).toBe("undone");
    const other = createTransferService({ ...s.deps, listActors: async () => [] });
    await expect(other.listImports(s.ctx)).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("CSV export", () => {
  it("supports include/exclude, view scope, safe text, exact IDs and filenames", async () => {
    const s = setup();
    const record = await s.records.create("Accounts", {
      Account_Name: "=FORMULA()",
      Description: 'line,quote"\nnext',
      Annual_Revenue: -20,
    });
    const job = await s.service.runExport(s.ctx, {
      module: "Accounts",
      ids: [record.id],
      fields: { include: ["Account_Name", "Description", "Annual_Revenue"] },
    });
    expect(job).toMatchObject({ rowCount: 1, status: "completed", scope: "Selected records" });
    expect(job.fileName).toMatch(/^Accounts_\d{4}_\d{2}_\d{2}\.csv$/);
    const downloaded = await s.service.downloadExport(s.ctx, job.id);
    const parsed = parseCsv(new TextEncoder().encode(downloaded.body), {
      charset: "UTF-8",
      maxColumns: 500,
      maxRows: 5000,
    });
    expect(parsed.headers[0]).toBe("Record Id");
    expect(parsed.rows[0]?.[0]).toBe(record.id);
    expect(parsed.rows[0]).toContain("'=FORMULA()");
    expect(parsed.rows[0]).toContain('line,quote"\nnext');
    const excluded = await s.service.runExport(s.ctx, {
      module: "Accounts",
      ids: [record.id],
      fields: { exclude: ["Description"] },
    });
    expect((await s.service.downloadExport(s.ctx, excluded.id)).body).not.toContain("Description");
    expect(
      (
        await s.service.runExport(s.ctx, {
          module: "Accounts",
          fields: { include: ["Account_Name"] },
        })
      ).scope,
    ).toBe("All Accounts");
  });
  it.each([
    "all",
    { include: ["id", "Account_Name"] },
    { exclude: ["id"] },
  ] as ExportRequest["fields"][])(
    "emits the record identifier exactly once for %j",
    async (fields) => {
      const s = setup();
      const record = await s.records.create("Accounts", { Account_Name: "Identifier Example" });
      const job = await s.service.runExport(s.ctx, {
        module: "Accounts",
        ids: [record.id],
        fields: structuredClone(fields),
      });
      const downloaded = await s.service.downloadExport(s.ctx, job.id);
      const parsed = parseCsv(new TextEncoder().encode(downloaded.body), {
        charset: "UTF-8",
        maxColumns: 500,
        maxRows: 1,
      });
      expect(parsed.headers.filter((header) => header === "Record Id")).toHaveLength(1);
      expect(parsed.rows[0]?.[0]).toBe(record.id);
    },
  );
  it("rejects hidden fields including exclusions and rechecks visibility at download", async () => {
    const s = setup();
    await expect(
      s.service.runExport(s.ctx, { module: "Leads", fields: { include: ["First_Name"] } }),
    ).rejects.toMatchObject({ code: "field_not_allowed" });
    await expect(
      s.service.runExport(s.ctx, { module: "Leads", fields: { exclude: ["First_Name"] } }),
    ).rejects.toMatchObject({ code: "field_not_allowed" });
    const job = await s.service.runExport(s.ctx, {
      module: "Accounts",
      ids: [],
      fields: { include: ["Account_Name"] },
    });
    const metadata = await s.records.getModule("Accounts");
    vi.spyOn(s.records, "getModule").mockResolvedValue({
      ...metadata,
      fields: metadata.fields.map((field) => ({
        ...field,
        views: { ...field.views, view: false },
      })),
    });
    await expect(s.service.downloadExport(s.ctx, job.id)).rejects.toMatchObject({
      code: "field_not_allowed",
    });
    const other = { ...s.ctx, orgId: randomUUID() };
    expect(await s.service.listExports(other)).toEqual([]);
    await expect(s.service.downloadExport(other, job.id)).rejects.toMatchObject({
      code: "not_found",
    });
  });
  it("pages through views and produces neutral samples for every module", async () => {
    const s = setup();
    const list = vi.spyOn(s.records, "list");
    const job = await s.service.runExport(s.ctx, { module: "Leads", fields: "all" });
    expect(job.rowCount).toBeGreaterThan(100);
    expect(list.mock.calls.length).toBeGreaterThan(1);
    for (const module of modules) {
      const sample = await s.service.sampleCsv(s.ctx, module);
      expect(sample.fileName).toBe(`${module}_Sample.csv`);
      expect(
        parseCsv(new TextEncoder().encode(sample.body), {
          charset: "UTF-8",
          maxColumns: 500,
          maxRows: 1,
        }).rows,
      ).toHaveLength(1);
    }
  });
});

describe("transfer budgets", () => {
  it("accepts exact input bytes/columns/rows and rejects one over before writes", async () => {
    const body = serializeCsv(["Last_Name", "Email"], [["Example", "example@example.test"]]);
    const s = setup({
      limits: { fileBytes: new TextEncoder().encode(body).length, columns: 2, importRows: 1 },
    });
    const file = {
      name: "example.csv",
      charset: "UTF-8" as const,
      bytes: new TextEncoder().encode(body),
    };
    expect((await s.service.previewImport(s.ctx, "Contacts", file)).rowCount).toBe(1);
    await expect(
      s.service.previewImport(s.ctx, "Contacts", {
        ...file,
        bytes: new TextEncoder().encode(`${body} `),
      }),
    ).rejects.toMatchObject({ code: "file_too_large" });
    const columns = setup({ limits: { columns: 2 } });
    await expect(
      columns.preview("Contacts", ["a", "b", "c"], [["a", "b", "c"]]),
    ).rejects.toMatchObject({ code: "too_many_columns" });
    const rows = setup({ limits: { importRows: 1 } });
    expect((await rows.preview("Contacts", ["a"], [["a"]])).rowCount).toBe(1);
    await expect(rows.preview("Contacts", ["a"], [["a"], ["b"]])).rejects.toMatchObject({
      code: "too_many_rows",
    });
  });
  it("persists failed oversized exports with no downloadable file at exact row/ID boundaries", async () => {
    const s = setup({ limits: { selectedIds: 1, exportRows: 1 } });
    const first = await s.records.create("Accounts", { Account_Name: "One" });
    const second = await s.records.create("Accounts", { Account_Name: "Two" });
    expect(
      (await s.service.runExport(s.ctx, { module: "Accounts", ids: [first.id], fields: "all" }))
        .status,
    ).toBe("completed");
    const oversizedIds = await s.service.runExport(s.ctx, {
      module: "Accounts",
      ids: [first.id, second.id],
      fields: "all",
    });
    expect(oversizedIds).toMatchObject({ status: "failed", code: "export_too_large" });
    const oversizedRows = await s.service.runExport(s.ctx, { module: "Accounts", fields: "all" });
    expect(oversizedRows).toMatchObject({
      status: "failed",
      code: "export_too_large",
      rowCount: 0,
    });
    await expect(s.service.downloadExport(s.ctx, oversizedRows.id)).rejects.toMatchObject({
      code: "not_found",
    });
    expect((await s.service.listExports(s.ctx))[0]?.id).toBe(oversizedRows.id);
  });
  it("accepts exactly the serialized byte budget and rejects one byte less", async () => {
    const s = setup();
    const record = await s.records.create("Accounts", { Account_Name: "Byte Example" });
    const request = {
      module: "Accounts" as const,
      ids: [record.id],
      fields: { include: ["Account_Name"] },
    };
    const reference = await s.service.runExport(s.ctx, request);
    const size = new TextEncoder().encode(
      (await s.service.downloadExport(s.ctx, reference.id)).body,
    ).length;
    const exact = createTransferService({ ...s.deps, limits: { exportBytes: size } });
    expect((await exact.runExport(s.ctx, request)).status).toBe("completed");
    const over = createTransferService({ ...s.deps, limits: { exportBytes: size - 1 } });
    expect(await over.runExport(s.ctx, request)).toMatchObject({
      status: "failed",
      code: "export_too_large",
    });
  });
  it("preserves parser error codes as AppError", async () => {
    const s = setup();
    for (const [body, code] of [
      ["", "empty_file"],
      ['a\n"unterminated', "malformed_csv"],
    ]) {
      await expect(
        s.service.previewImport(s.ctx, "Contacts", {
          name: "bad.csv",
          charset: "UTF-8",
          bytes: new TextEncoder().encode(body),
        }),
      ).rejects.toMatchObject({ code, name: "AppError" });
    }
  });
});

const activityInputs = {
  Tasks: { Subject: "Transfer task", Due_Date: "2026-12-01" },
  Events: {
    Event_Title: "Transfer meeting",
    Start_DateTime: "2026-12-01T12:00:00.000Z",
    End_DateTime: "2026-12-01T13:00:00.000Z",
    Meeting_Venue__s: "Client location",
  },
  Calls: {
    Subject: "Transfer call",
    Call_Type: "Outbound",
    Call_Start_Time: "2026-12-01T12:00:00.000Z",
    Call_Duration: "05:00",
  },
} satisfies Record<string, Record<string, string>>;

describe("activity transfers", () => {
  it.each(["Tasks", "Events", "Calls"] as const)(
    "%s imports, exports, updates by Record Id and undoes through generic delete",
    async (module) => {
      const s = setup();
      const parent = await s.records.create("Accounts", { Account_Name: "Transfer parent" });
      const person = await s.records.create("Contacts", { Last_Name: "Transfer person" });
      const input: Record<string, string> = {
        ...activityInputs[module],
        What_Id: parent.id,
        Who_Id: person.id,
        $se_module: "Accounts",
        ...(module === "Calls" ? {} : { Owner: s.ctx.userId }),
      };
      const preview = await s.preview(module, Object.keys(input), [Object.values(input)]);
      expect(preview.matchFields).toEqual([{ field: "id", label: "Record Id" }]);
      const job = await s.run(module, [input]);
      expect(job).toMatchObject({ module, status: "completed", counts: { created: 1, errors: 0 } });
      const exported = await s.service.runExport(s.ctx, { module, fields: "all" });
      const csv = parseCsv(
        new TextEncoder().encode((await s.service.downloadExport(s.ctx, exported.id)).body),
        {
          charset: "UTF-8",
          maxColumns: 500,
          maxRows: 5000,
        },
      );
      const metadata = await s.records.getModule(module);
      const title = module === "Events" ? "Event_Title" : "Subject";
      const label = metadata.fields.find((field) => field.apiName === title)?.label ?? "";
      const row = csv.rows.find((row) => row[csv.headers.indexOf(label)] === input[title]);
      expect(row).toBeDefined();
      const id = row?.[0] ?? "";
      for (const [key, value] of Object.entries(input)) {
        if (key === "$se_module") continue;
        const field = metadata.fields.find((field) => field.apiName === key);
        const reference = ["lookup", "ownerlookup", "multi_module_lookup"].includes(
          field?.dataType ?? "",
        );
        // References export a name column and a companion "<Field> Id" column.
        const header = reference ? `${field?.label} Id` : (field?.label ?? "");
        expect(row?.[csv.headers.indexOf(header)]).toBe(value);
      }
      const updated = await s.run(module, [{ id, [title]: "Updated transfer" }], {
        mode: "update",
      });
      expect(updated.counts.updated).toBe(1);
      expect((await s.records.get(module, id)).fields[title]).toBe("Updated transfer");
      expect(await s.service.listImports(s.ctx)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: job.id, module })]),
      );
      expect(await s.service.listExports(s.ctx)).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: exported.id, module })]),
      );
      const remove = vi.spyOn(s.records, "delete");
      expect((await s.service.undoImport(s.ctx, job.id)).status).toBe("undone");
      expect(remove).toHaveBeenCalledWith(module, [id]);
      await expect(s.records.get(module, id)).rejects.toMatchObject({ code: "not_found" });
    },
    15_000,
  );

  it.each(["Tasks", "Events", "Calls"] as const)(
    "%s enforces metadata required fields and rejects subject matching",
    async (module) => {
      const s = setup();
      const metadata = await s.records.getModule(module);
      const required = metadata.fields.find(
        (field) => field.required && field.views.create && !field.readOnly,
      );
      expect(required).toBeDefined();
      const input: Record<string, string> = { ...activityInputs[module] };
      delete input[required?.apiName ?? ""];
      await expect(s.run(module, [input])).rejects.toMatchObject({
        code: "mapping_missing_required",
      });
      await expect(
        s.run(module, [activityInputs[module]], {
          matchField: module === "Events" ? "Event_Title" : "Subject",
        }),
      ).rejects.toMatchObject({ code: "invalid_match_field" });
    },
  );

  it("keeps Call Owner outside writable import fields", async () => {
    const s = setup();
    await expect(
      s.run("Calls", [{ ...activityInputs.Calls, Owner: s.ctx.userId }]),
    ).rejects.toMatchObject({ code: "mapping_system_field" });
  });

  it.each(["Tasks", "Events", "Calls"] as const)(
    "%s rejects parent names, unknown and unreadable IDs with row errors",
    async (module) => {
      const s = setup();
      const parent = await s.records.create("Accounts", { Account_Name: "Named parent" });
      const get = s.records.get.bind(s.records);
      vi.spyOn(s.records, "get").mockImplementation(async (name, id) => {
        if (name === "Accounts" && id === parent.id) throw new ForbiddenError();
        return get(name, id);
      });
      for (const [value, code] of [
        ["Named parent", "not_found"],
        ["missing-id", "not_found"],
        [parent.id, "permission_denied"],
      ]) {
        const job = await s.run(module, [
          { ...activityInputs[module], What_Id: value ?? "", $se_module: "Accounts" },
        ]);
        expect(job.counts).toMatchObject({ created: 1, errors: 0, warnings: 1 });
        expect(job.rows).toEqual([{ row: 2, outcome: "warning", code, field: "What_Id" }]);
      }
      const person = await s.records.create("Contacts", { Last_Name: "Named person" });
      for (const [value, code] of [
        ["Named person", "not_found"],
        ["missing-person-id", "not_found"],
        [person.id, "permission_denied"],
      ]) {
        vi.mocked(s.records.get).mockImplementation(async (name, id) => {
          if (name === "Contacts" && id === person.id) throw new ForbiddenError();
          return get(name, id);
        });
        const job = await s.run(module, [{ ...activityInputs[module], Who_Id: value ?? "" }]);
        expect(job.rows).toEqual([{ row: 2, outcome: "warning", code, field: "Who_Id" }]);
      }
      const invalid = await s.run(module, [
        { ...activityInputs[module], What_Id: parent.id, $se_module: "Tasks" },
      ]);
      expect(invalid.rows).toEqual([
        { row: 2, outcome: "warning", code: "value_cleared", field: "What_Id" },
      ]);
    },
  );
});

describe.each(["Solutions", "Cases"] as const)("%s export-only transfer", (module) => {
  it("exports selected metadata fields and records, history and tenant isolation", async () => {
    const s = setup();
    const field = module === "Solutions" ? "Solution_Title" : "Subject";
    const record = await s.records.create(module, {
      [field]: "Synthetic export record",
      ...(module === "Cases" ? { Status: "New", Case_Origin: "Phone" } : {}),
    });
    const job = await s.service.runExport(s.ctx, {
      module,
      ids: [record.id],
      fields: { include: [field] },
    });
    expect(job).toMatchObject({
      module,
      status: "completed",
      rowCount: 1,
      scope: "Selected records",
    });
    const file = await s.service.downloadExport(s.ctx, job.id);
    const csv = parseCsv(new TextEncoder().encode(file.body), {
      charset: "UTF-8",
      maxColumns: 500,
      maxRows: 30000,
    });
    expect(csv.headers).toEqual([
      "Record Id",
      module === "Solutions" ? "Solution Title" : "Subject",
    ]);
    expect(csv.rows).toEqual([[record.id, "Synthetic export record"]]);
    expect(await s.service.listExports(s.ctx)).toContainEqual(job);
    await expect(
      s.service.downloadExport({ ...s.ctx, orgId: randomUUID() }, job.id),
    ).rejects.toMatchObject({ code: "not_found" });
    const all = await s.service.runExport(s.ctx, { module, fields: "all" });
    expect(all.status).toBe("completed");
    expect(all.rowCount).toBeGreaterThanOrEqual(1);
    expect(s.authorize).toHaveBeenCalledWith(s.ctx, module, "read");
  });
  it("keeps import preview, execution and samples unavailable", async () => {
    const s = setup();
    await expect(s.preview(module, ["Subject"], [["Example"]])).rejects.toMatchObject({
      code: "validation",
    });
    await expect(
      s.service.runImport(s.ctx, module, "missing", {
        mode: "add",
        ignoreEmptyOnUpdate: false,
        mapping: [],
        defaults: [],
      }),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(s.service.sampleCsv(s.ctx, module)).rejects.toMatchObject({
      code: "validation",
    });
  });
});

async function contactByEmail(records: RecordService, email: string) {
  const view = (await records.listViews("Contacts")).find((item) => item.isDefault);
  const found = await records.list("Contacts", {
    viewId: view?.id ?? "",
    page: 1,
    perPage: 10,
    filters: { field: "Email", comparator: "equal", value: email },
  });
  return found.records[0]?.fields ?? {};
}

describe("real-data import and export behaviour", () => {
  const turkish: TransferLocale = {
    language: "tr",
    fieldLabel: (_module, field) =>
      ({ Last_Name: "Soyadı", Email: "E-posta", Account_Name: "Firma Adı", Owner: "Kayıt Sahibi" })[
        field.apiName
      ] ?? field.label,
    fieldAliases: (_module, field) => (field.apiName === "Last_Name" ? ["Soyadı", "Soy Ad"] : []),
    optionLabels: () => [],
    recordIdLabel: "Kayıt Id",
    idColumnLabel: (label) => `${label} Id`,
  };

  it("previews a file that repeats a column name", async () => {
    const s = setup();
    const preview = await s.preview(
      "Contacts",
      ["Last_Name", "Email", "Email"],
      [["Örnek", "a@example.test", "b@example.test"]],
    );
    expect(preview.headers).toEqual(["Last_Name", "Email", "Email (2)"]);
    expect(preview.suggestedMapping.map((item) => item.field)).toEqual([
      "Last_Name",
      "Email",
      null,
    ]);
  });

  it("auto-maps Turkish headers and shows localized field labels", async () => {
    const s = setup({ locale: async () => turkish });
    const preview = await s.preview(
      "Contacts",
      ["Soyadı", "E-posta", "Kayıt Id", "Bilinmiyor"],
      [["Örnek", "a@example.test", "", "x"]],
    );
    expect(preview.suggestedMapping.map((item) => item.field)).toEqual([
      "Last_Name",
      "Email",
      "id",
      null,
    ]);
    expect(preview.fields.find((field) => field.apiName === "Last_Name")?.label).toBe("Soyadı");
    expect(preview.matchFields[0]).toEqual({ field: "id", label: "Kayıt Id" });
  });

  it("accepts picklist options by display label and ignores case and spacing", async () => {
    const s = setup();
    const job = await s.run("Contacts", [
      { Last_Name: "Örnek A", Email: "a@example.test", Lead_Source: "Online Store" },
      { Last_Name: "Örnek B", Email: "b@example.test", Lead_Source: "online-store" },
    ]);
    expect(job.counts).toMatchObject({ created: 2, errors: 0 });
    expect(job.counts.warnings).toBeUndefined();
    expect((await contactByEmail(s.records, "a@example.test")).Lead_Source).toBe("OnlineStore");
  });

  it("imports the row without an unusable optional value and records a warning", async () => {
    const s = setup();
    const job = await s.run("Contacts", [
      { Last_Name: "Örnek C", Email: "c@example.test", Lead_Source: "Nope" },
    ]);
    expect(job.status).toBe("completed_with_errors");
    expect(job.counts).toMatchObject({ created: 1, errors: 0, skipped: 0, warnings: 1 });
    expect(job.rows).toEqual([
      { row: 2, outcome: "warning", code: "value_cleared", field: "Lead_Source" },
    ]);
    expect((await contactByEmail(s.records, "c@example.test")).Lead_Source ?? "").toBe("");
  });

  it("resolves a lookup by name when the value is not an id", async () => {
    const s = setup();
    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma A" });
    const job = await s.run("Contacts", [
      { Last_Name: "Örnek D", Email: "d@example.test", Account_Name: "Örnek Firma A" },
    ]);
    expect(job.counts).toMatchObject({ created: 1, errors: 0 });
    expect((await contactByEmail(s.records, "d@example.test")).Account_Name).toMatchObject({
      id: account.id,
    });
  });

  it("exports owner and lookup names with a companion id column and localized headers", async () => {
    const s = setup({ locale: async () => turkish });
    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma B" });
    await s.records.create("Contacts", {
      Last_Name: "Örnek E",
      Email: "e@example.test",
      Account_Name: { module: "Accounts", id: account.id },
      Owner: s.ctx.userId,
    });
    const exported = await s.service.runExport(s.ctx, { module: "Contacts", fields: "all" });
    const csv = parseCsv(
      new TextEncoder().encode((await s.service.downloadExport(s.ctx, exported.id)).body),
      {
        charset: "UTF-8",
        maxColumns: 500,
        maxRows: 5000,
      },
    );
    expect(csv.headers[0]).toBe("Kayıt Id");
    const row = csv.rows.find((item) => item[csv.headers.indexOf("E-posta")] === "e@example.test");
    expect(row?.[csv.headers.indexOf("Firma Adı")]).toBe("Örnek Firma B");
    expect(row?.[csv.headers.indexOf("Firma Adı Id")]).toBe(account.id);
    expect(row?.[csv.headers.indexOf("Kayıt Sahibi")]).toBe("Example User");
    expect(row?.[csv.headers.indexOf("Kayıt Sahibi Id")]).toBe(s.ctx.userId);
  });

  it("re-imports an exported file; the name column wins over the id column", async () => {
    const s = setup();
    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma C" });
    await s.records.create("Contacts", {
      Last_Name: "Örnek F",
      Email: "f@example.test",
      Account_Name: { module: "Accounts", id: account.id },
    });
    const exported = await s.service.runExport(s.ctx, { module: "Contacts", fields: "all" });
    const body = (await s.service.downloadExport(s.ctx, exported.id)).body;
    const preview = await s.service.previewImport(s.ctx, "Contacts", {
      name: "again.csv",
      charset: "UTF-8",
      bytes: new TextEncoder().encode(body),
    });
    const mapped = preview.suggestedMapping.map((item) => item.field);
    expect(mapped.filter((field) => field === "Account_Name")).toHaveLength(1);
    const header = preview.headers[mapped.indexOf("Account_Name")];
    // The name column is mapped; the id column of the same field stays unmapped.
    expect(header).toBe("Account Name");
  });
});

describe("second round of real-data import behaviour", () => {
  it("keeps the source Created Time and Modified Time and rejects other formats with a warning", async () => {
    const s = setup();
    const job = await s.run("Contacts", [
      {
        Last_Name: "Örnek G",
        Email: "g@example.test",
        Created_Time: "04.03.2025 14:22",
        Modified_Time: "2025-03-05T08:00:00+03:00",
      },
      { Last_Name: "Örnek H", Email: "h@example.test", Created_Time: "not a date" },
    ]);
    expect(job.counts).toMatchObject({ created: 2, errors: 0, warnings: 1 });
    const kept = await contactByEmail(s.records, "g@example.test");
    expect(kept.Created_Time).toBe("2025-03-04T14:22:00.000Z");
    expect(kept.Modified_Time).toBe("2025-03-05T05:00:00.000Z");
    expect(job.rows).toEqual([
      { row: 3, outcome: "warning", code: "value_cleared", field: "Created_Time" },
    ]);
  });

  it("stores any text in a state or province field", async () => {
    const s = setup();
    const job = await s.run("Accounts", [
      { Account_Name: "Örnek Firma D", Billing_State: "Örnek İl / Bölge", Shipping_State: "Kuzey" },
    ]);
    expect(job.counts).toMatchObject({ created: 1, errors: 0 });
    expect(job.counts.warnings).toBeUndefined();
  });

  it("finds a contact by full name ignoring salutation, case and diacritics", async () => {
    const s = setup();
    const person = await s.records.create("Contacts", { First_Name: "Ayşe", Last_Name: "Örnek" });
    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma E" });
    const job = await s.run("Deals", [
      ...["Bayan Ayşe Örnek", "ayse ornek", "Ms. AYŞE  ÖRNEK"].map((name, index) => ({
        Deal_Name: `Fırsat ${index}`,
        Closing_Date: "2026-12-01",
        Stage: "Qualification",
        Account_Name: account.id,
        Contact_Name: name,
      })),
    ]);
    expect(job.counts).toMatchObject({ created: 3, errors: 0 });
    expect(job.counts.warnings).toBeUndefined();
    expect(person.id).toBeTruthy();
  });

  it("leaves an unknown contact empty with a warning on a deal", async () => {
    const s = setup();
    const account = await s.records.create("Accounts", { Account_Name: "Örnek Firma F" });
    const job = await s.run("Deals", [
      {
        Deal_Name: "Fırsat X",
        Account_Name: account.id,
        Closing_Date: "2026-12-01",
        Stage: "Qualification",
        Contact_Name: "Yok Kişi",
      },
    ]);
    expect(job.counts).toMatchObject({ created: 1, errors: 0, warnings: 1 });
    expect(job.rows).toEqual([
      { row: 2, outcome: "warning", code: "not_found", field: "Contact_Name" },
    ]);
  });

  it("imports with the id columns of a reference ignored when the name column exists", async () => {
    const s = setup();
    const preview = await s.preview(
      "Contacts",
      ["Last_Name", "Account Name", "Account Name.id", "Owner", "Owner.id"],
      [["Örnek", "", "ref-1", "Example User", "ref-2"]],
    );
    expect(preview.suggestedMapping.map((item) => item.field)).toEqual([
      "Last_Name",
      "Account_Name",
      null,
      "Owner",
      null,
    ]);
  });
});

describe("picklist round trip", () => {
  it("exports the display label and imports it back to the stored value", async () => {
    const s = setup();
    await s.run("Contacts", [
      { Last_Name: "Örnek I", Email: "i@example.test", Lead_Source: "OnlineStore" },
    ]);
    const exported = await s.service.runExport(s.ctx, { module: "Contacts", fields: "all" });
    const body = (await s.service.downloadExport(s.ctx, exported.id)).body;
    const csv = parseCsv(new TextEncoder().encode(body), {
      charset: "UTF-8",
      maxColumns: 500,
      maxRows: 5000,
    });
    const row = csv.rows.find((item) => item.includes("i@example.test"));
    expect(row?.[csv.headers.indexOf("Lead Source")]).toBe("Online Store");
    const again = await s.service.previewImport(s.ctx, "Contacts", {
      name: "again.csv",
      charset: "UTF-8",
      bytes: new TextEncoder().encode(body),
    });
    const mapped = again.suggestedMapping.map((item) => item.field);
    expect(mapped).toContain("Lead_Source");
    expect(mapped).toContain("Email");
  });
});
