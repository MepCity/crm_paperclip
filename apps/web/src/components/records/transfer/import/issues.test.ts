import { expect, test } from "vitest";
import { translator } from "@/i18n/catalogs";
import { displayStatus, issueRows, issuesCsv, issuesFileName } from "./issues";
import type { ImportJob } from "./types";

const job = (over: Partial<ImportJob>): ImportJob => ({
  id: "j",
  module: "Leads",
  fileName: "a.csv",
  createdBy: { id: "u", name: "U" },
  createdAt: "2026-01-01T00:00:00Z",
  status: "completed",
  counts: { created: 1, updated: 0, skipped: 0, errors: 0 },
  undoable: true,
  rows: [],
  ...over,
});

test("only a run with a failed row is shown as completed with errors", () => {
  const counts = { created: 1, updated: 0, skipped: 0 };
  expect(displayStatus({ status: "completed", counts: { ...counts, errors: 0 } })).toBe(
    "completed",
  );
  expect(
    displayStatus({
      status: "completed_with_errors",
      counts: { ...counts, errors: 0, warnings: 2 },
    }),
  ).toBe("completed_with_warnings");
  expect(
    displayStatus({
      status: "completed_with_errors",
      counts: { ...counts, errors: 1, warnings: 2 },
    }),
  ).toBe("completed_with_errors");
  expect(displayStatus({ status: "failed", counts: { ...counts, errors: 0, warnings: 2 } })).toBe(
    "failed",
  );
});

test("the issues CSV carries row, type, field and message only, in the interface language", () => {
  const rows: ImportJob["rows"] = [
    { row: 7, outcome: "warning", code: "owner_defaulted", field: "Owner" },
    { row: 8, outcome: "error", code: "invalid_value", field: "=cmd" },
  ];
  const csv = issuesCsv(job({ rows }), translator("tr"));
  expect(csv.startsWith("\uFEFF")).toBe(true);
  const lines = csv.slice(1).trim().split("\r\n");
  expect(lines[0]).toBe("Satır,Tür,Alan,Neden");
  expect(lines[1]).toMatch(/^7,Uyarı,Owner,"?Kayıt sahibi bulunamadı/);
  // A field name that would be read as a formula is neutralised.
  expect(lines[2]).toMatch(/^8,Hata,'=cmd,/);
  expect(Object.keys(rows[0] ?? {})).toEqual(["row", "outcome", "code", "field"]);
});

test("issue rows keep file order and skip successful rows", () => {
  const rows: ImportJob["rows"] = [
    { row: 2, outcome: "created" },
    { row: 3, outcome: "warning", code: "x" },
    { row: 4, outcome: "error", code: "y" },
  ];
  expect(issueRows(job({ rows })).map((row) => row.row)).toEqual([3, 4]);
  expect(issuesFileName(job({ fileName: "Müşteriler: 2026.csv" }))).toBe(
    "Müşteriler_ 2026-issues.csv",
  );
});
