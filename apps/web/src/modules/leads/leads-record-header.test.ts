import type { RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { leadsRecordHeaderIdentity } from "./leads-record-header";

function leadRecord(fields: Record<string, unknown> = {}): RecordData {
  return { id: "sample-lead", fields } as unknown as RecordData;
}

describe("leadsRecordHeaderIdentity", () => {
  it("uses Full_Name as title and Company as subtitle when both are present", () => {
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person", Company: "Sample Corp" })),
    ).toEqual({
      title: "Sample Person",
      subtitle: "Sample Corp",
    });
  });

  it("builds title with only last name and includes subtitle when company is present", () => {
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Person", Company: "Sample Corp" })),
    ).toEqual({
      title: "Person",
      subtitle: "Sample Corp",
    });
  });

  it("omits the subtitle key when Company is empty, null, or missing", () => {
    const cases: Record<string, unknown>[] = [
      { Full_Name: "Sample Person", Company: "" },
      { Full_Name: "Sample Person", Company: null },
      { Full_Name: "Sample Person", Company: undefined },
      { Full_Name: "Sample Person" },
      { Full_Name: "Person" },
    ];
    for (const fields of cases) {
      const identity = leadsRecordHeaderIdentity(leadRecord(fields));
      expect(identity).toEqual({ title: String(fields.Full_Name) });
      expect("subtitle" in identity).toBe(false);
    }
  });

  it("handles company present with empty, null, or undefined name fields", () => {
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "", Company: "Sample Corp" })),
    ).toEqual({
      title: "",
      subtitle: "Sample Corp",
    });
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: null, Company: "Sample Corp" })),
    ).toEqual({
      title: "",
      subtitle: "Sample Corp",
    });
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: undefined, Company: "Sample Corp" })),
    ).toEqual({
      title: "",
      subtitle: "Sample Corp",
    });
    expect(leadsRecordHeaderIdentity(leadRecord({ Company: "Sample Corp" }))).toEqual({
      title: "",
      subtitle: "Sample Corp",
    });
  });

  it("returns an empty title when Full_Name is null, empty or missing", () => {
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: null })).title).toBe("");
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: "" })).title).toBe("");
    expect(leadsRecordHeaderIdentity(leadRecord({})).title).toBe("");
  });

  it("handles empty record with default empty title", () => {
    expect(leadsRecordHeaderIdentity(leadRecord({}))).toEqual({
      title: "",
    });
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: "", Company: "" }))).toEqual({
      title: "",
    });
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: null, Company: null }))).toEqual({
      title: "",
    });
  });

  it("coerces non-string field values to strings", () => {
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: 12345, Company: 67890 }))).toEqual({
      title: "12345",
      subtitle: "67890",
    });
  });
});
