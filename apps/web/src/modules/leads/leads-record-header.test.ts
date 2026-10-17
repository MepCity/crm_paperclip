import { describe, expect, it } from "vitest";
import { leadsRecordHeaderIdentity } from "./leads-record-header";

const record = (fields: Record<string, string | null>) => ({ id: "lead-1", fields });

describe("leadsRecordHeaderIdentity", () => {
  it("uses Full_Name as title and Company as subtitle", () => {
    expect(leadsRecordHeaderIdentity(record({ Full_Name: "Ada Test", Company: "Acme" }))).toEqual({
      title: "Ada Test",
      subtitle: "Acme",
    });
  });

  it("omits the subtitle key when Company is empty, null or missing", () => {
    const cases: Record<string, string | null>[] = [
      { Full_Name: "Ada Test", Company: "" },
      { Full_Name: "Ada Test", Company: null },
      { Full_Name: "Ada Test" },
    ];
    for (const fields of cases) {
      const identity = leadsRecordHeaderIdentity(record(fields));
      expect(identity).toEqual({ title: "Ada Test" });
      expect("subtitle" in identity).toBe(false);
    }
  });

  it("returns an empty title when Full_Name is null or missing", () => {
    expect(leadsRecordHeaderIdentity(record({ Full_Name: null })).title).toBe("");
    expect(leadsRecordHeaderIdentity(record({})).title).toBe("");
  });
});
