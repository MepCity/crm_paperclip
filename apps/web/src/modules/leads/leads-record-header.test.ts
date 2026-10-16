import type { RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { leadsRecordHeaderIdentity } from "./leads-record-header";

function leadRecord(fields: Record<string, unknown> = {}): RecordData {
  return { id: "sample-lead", fields } as unknown as RecordData;
}

describe("leadsRecordHeaderIdentity", () => {
  it("builds title with first and last name and includes subtitle when company is present", () => {
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person", Company: "Sample Corp" })),
    ).toEqual({
      title: "Sample Person",
      subtitle: "Sample Corp",
    });
  });

  it("builds title with first and last name without subtitle when company is missing", () => {
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person" }))).toEqual({
      title: "Sample Person",
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

  it("builds title with only last name without subtitle when company is missing", () => {
    expect(leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Person" }))).toEqual({
      title: "Person",
    });
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

  it("omits subtitle when company is empty string, null, or undefined", () => {
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person", Company: "" })),
    ).toEqual({
      title: "Sample Person",
    });
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person", Company: null })),
    ).toEqual({
      title: "Sample Person",
    });
    expect(
      leadsRecordHeaderIdentity(leadRecord({ Full_Name: "Sample Person", Company: undefined })),
    ).toEqual({
      title: "Sample Person",
    });
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
