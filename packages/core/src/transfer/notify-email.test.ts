import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { buildImportNotifyEmail } from "./notify-email";
import type { ImportJob } from "./types";

function job(over: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "j1",
    module: "leads",
    fileName: "leads.csv",
    createdBy: { id: "u1", name: "Ann" },
    createdAt: "2026-10-22T08:30:00.000Z",
    status: "completed",
    counts: { created: 5, updated: 3, skipped: 2, errors: 1 },
    undoable: true,
    rows: [],
    ...over,
  } as ImportJob;
}
const to = { address: "ann@example.com", name: "Ann" };
const links = { historyUrl: "/crm/acme/settings/import-history" };

describe("buildImportNotifyEmail", () => {
  it.each([
    ["completed", "Import completed: leads.csv"],
    ["completed_with_errors", "Import completed with errors: leads.csv"],
    ["failed", "Import failed: leads.csv"],
  ] as const)("subject for %s", (status, subject) => {
    expect(buildImportNotifyEmail(job({ status }), to, links).subject).toBe(subject);
  });

  it("calls a run with warnings but no failed row a success with warnings", () => {
    const counts = { created: 5, updated: 0, skipped: 0, errors: 0, warnings: 2 };
    expect(
      buildImportNotifyEmail(job({ status: "completed_with_errors", counts }), to, links).subject,
    ).toBe("Import completed with warnings: leads.csv");
    expect(
      buildImportNotifyEmail(
        job({ status: "completed_with_errors", counts: { ...counts, errors: 1 } }),
        to,
        links,
      ).subject,
    ).toBe("Import completed with errors: leads.csv");
  });

  it("throws for undone", () => {
    expect(() => buildImportNotifyEmail(job({ status: "undone" }), to, links)).toThrow(
      ValidationError,
    );
  });

  it("includes counts, link, module, start time and recipient", () => {
    const m = buildImportNotifyEmail(job(), to, links);
    expect(m.to).toEqual([to]);
    expect(m.text).toContain("Hello Ann,");
    expect(m.text).toContain("Module: leads");
    expect(m.text).toContain("Started: 2026-10-22T08:30:00.000Z");
    for (const l of ["Created: 5", "Updated: 3", "Skipped: 2", "Errors: 1"]) {
      expect(m.text.split("\n")).toContain(l);
    }
    expect(m.text).toContain("View import history: /crm/acme/settings/import-history");
  });

  it("handles a missing name", () => {
    const m = buildImportNotifyEmail(job(), { address: "a@b.c" }, links);
    expect(m.text.startsWith("Hello,\n")).toBe(true);
  });

  it("passes special characters in the file name through", () => {
    const fileName = 'Ünï "q" <b>&.csv';
    const m = buildImportNotifyEmail(job({ fileName }), to, links);
    expect(m.subject).toBe(`Import completed: ${fileName}`);
    expect(m.text).toContain(`File: ${fileName}`);
  });
});
