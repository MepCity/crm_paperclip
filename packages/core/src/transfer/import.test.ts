import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { FieldDefinition } from "../records/contract";
import { createFixtureRecordService } from "../records/fixture";
import type { OrgContext } from "../tenancy/types";
import type { Upload } from "./history";
import { importRows, matchFields, normalizeHeader, validateMapping, writable } from "./import";
import type { ImportJob, ImportSettings, TransferDependencies } from "./types";

const ctx: OrgContext = {
  orgId: randomUUID(),
  orgSlug: "import-test",
  orgName: "Example",
  userId: "example-user",
  role: "admin",
};
const records = createFixtureRecordService(ctx);
const deps: TransferDependencies = {
  records: () => records,
  authorize: vi.fn(async () => {}),
  listActors: async () => [{ id: ctx.userId, name: "Example User" }],
};
const upload = (headers: string[], rows: string[][]): Upload => ({
  id: "u1",
  userId: ctx.userId,
  module: "Contacts",
  fileName: "example.csv",
  charset: "UTF-8",
  headers,
  rows,
  at: 0,
});
const settings = (overrides: Partial<ImportSettings> = {}): ImportSettings => ({
  mode: "add",
  ignoreEmptyOnUpdate: false,
  mapping: [
    { column: 0, field: "Last_Name" },
    { column: 1, field: "Email" },
  ],
  defaults: [],
  ...overrides,
});
const newJob = (): ImportJob => ({
  id: "j1",
  module: "Contacts",
  fileName: "example.csv",
  createdBy: { id: ctx.userId, name: "Example User" },
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "completed",
  counts: { created: 0, updated: 0, skipped: 0, errors: 0 },
  undoable: false,
  rows: [],
});

describe("normalizeHeader", () => {
  it("lowercases and strips whitespace and underscores", () => {
    expect(normalizeHeader("Last Name")).toBe("lastname");
    expect(normalizeHeader("Last_Name")).toBe("lastname");
    expect(normalizeHeader(" E mail\t")).toBe("email");
  });
});

describe("writable / matchFields", () => {
  it("excludes managed and read-only fields", async () => {
    const metadata = await records.getModule("Contacts");
    const find = (name: string) => metadata.fields.find((field) => field.apiName === name);
    const last = find("Last_Name") as FieldDefinition;
    expect(writable(last)).toBe(true);
    expect(writable({ ...last, readOnly: true })).toBe(false);
    const created = find("Created_Time");
    if (created) expect(writable(created)).toBe(false);
  });
  it("lists id first, then the module default match field", async () => {
    const metadata = await records.getModule("Contacts");
    const fields = matchFields(metadata, "Contacts");
    expect(fields[0]).toEqual({ field: "id", label: "Record Id" });
    expect(fields.map((item) => item.field)).toContain("Email");
  });
});

describe("validateMapping", () => {
  const header = ["Last Name", "Email"];
  it("returns the default match field for a valid mapping", async () => {
    const metadata = await records.getModule("Contacts");
    expect(validateMapping(metadata, "Contacts", upload(header, []), settings())).toBe("Email");
  });
  it("rejects an invalid mode", async () => {
    const metadata = await records.getModule("Contacts");
    expect(() =>
      validateMapping(metadata, "Contacts", upload(header, []), settings({ mode: "x" as never })),
    ).toThrowError();
  });
  it("rejects out-of-range and repeated source columns", async () => {
    const metadata = await records.getModule("Contacts");
    const bad = [
      [{ column: 5, field: "Last_Name" }],
      [
        { column: 0, field: "Last_Name" },
        { column: 0, field: "Email" },
      ],
    ];
    for (const mapping of bad)
      expect(() =>
        validateMapping(metadata, "Contacts", upload(header, []), settings({ mapping })),
      ).toThrowError();
  });
  it("rejects duplicate field mapping", async () => {
    const metadata = await records.getModule("Contacts");
    expect(() =>
      validateMapping(
        metadata,
        "Contacts",
        upload(header, []),
        settings({
          mapping: [
            { column: 0, field: "Last_Name" },
            { column: 1, field: "Last_Name" },
          ],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "mapping_duplicate_field" }));
  });
  it("rejects unwritable and unknown fields", async () => {
    const metadata = await records.getModule("Contacts");
    for (const field of ["Created_Time", "Not_A_Field"])
      expect(() =>
        validateMapping(
          metadata,
          "Contacts",
          upload(header, []),
          settings({
            mapping: [
              { column: 0, field: "Last_Name" },
              { column: 1, field: field },
            ],
          }),
        ),
      ).toThrowError(expect.objectContaining({ code: "mapping_system_field" }));
  });
  it("requires mapped or defaulted required fields unless updating", async () => {
    const metadata = await records.getModule("Contacts");
    const partial = settings({ mapping: [{ column: 1, field: "Email" }] });
    expect(() => validateMapping(metadata, "Contacts", upload(header, []), partial)).toThrowError(
      expect.objectContaining({ code: "mapping_missing_required" }),
    );
    expect(
      validateMapping(metadata, "Contacts", upload(header, []), {
        ...partial,
        defaults: [{ field: "Last_Name", value: "Example" }],
      }),
    ).toBe("Email");
    expect(
      validateMapping(metadata, "Contacts", upload(header, []), { ...partial, mode: "update" }),
    ).toBe("Email");
  });
  it("rejects disallowed match fields and an unmapped match field when updating", async () => {
    const metadata = await records.getModule("Contacts");
    expect(() =>
      validateMapping(
        metadata,
        "Contacts",
        upload(header, []),
        settings({ matchField: "Description" }),
      ),
    ).toThrowError(expect.objectContaining({ code: "invalid_match_field" }));
    expect(() =>
      validateMapping(
        metadata,
        "Contacts",
        upload(header, []),
        settings({ mode: "update", mapping: [{ column: 0, field: "Last_Name" }] }),
      ),
    ).toThrowError(expect.objectContaining({ code: "match_field_required" }));
  });
});

describe("importRows", () => {
  it("creates, updates, skips and reports row errors", async () => {
    const metadata = await records.getModule("Contacts");
    const run = async (rows: string[][], over: Partial<ImportSettings>) => {
      const job = newJob();
      const s = settings(over);
      const matchField = validateMapping(metadata, "Contacts", upload(["a", "b"], rows), s);
      await importRows(ctx, records, deps, upload(["a", "b"], rows), s, metadata, matchField, job);
      return job;
    };
    const added = await run(
      [
        ["One", "one@example.test"],
        ["Two", "two@example.test"],
        ["Dup", "ONE@example.test"],
        ["", "bad@example.test"],
      ],
      {},
    );
    expect(added.counts).toEqual({ created: 2, updated: 0, skipped: 1, errors: 1 });
    expect(added.status).toBe("completed_with_errors");
    expect(added.undoable).toBe(true);
    expect(added.rows).toEqual([
      { row: 4, outcome: "skipped", code: "duplicate_in_file", field: "Email" },
      { row: 5, outcome: "error", code: "required_missing", field: "Last_Name" },
    ]);
    const again = await run([["One", "one@example.test"]], {});
    expect(again.counts).toEqual({ created: 0, updated: 0, skipped: 1, errors: 0 });
    expect(again.rows[0]?.code).toBe("already_exists");
    expect(again.status).toBe("failed");
    const updated = await run([["Renamed", "one@example.test"]], { mode: "update" });
    expect(updated.counts.updated).toBe(1);
    expect(updated.status).toBe("completed");
    expect(updated.undoable).toBe(false);
    const missing = await run([["Ghost", "ghost@example.test"]], { mode: "update" });
    expect(missing.counts.errors).toBe(1);
    expect(missing.rows[0]).toMatchObject({ code: "not_found", field: "Email" });
  });
});
