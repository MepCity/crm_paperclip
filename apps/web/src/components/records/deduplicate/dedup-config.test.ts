import type { FieldDefinition, ModuleApiName } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  DEDUP_MAX_FIELDS,
  dedupConflictIntro,
  dedupFieldPanelMessage,
  dedupResultSummaryMessage,
  defaultDedupSelection,
  isDedupConflictGroup,
  isDedupFieldEligible,
  resolveDedupFields,
  toggleDedupSelection,
} from "./dedup-config";

function field(
  apiName: string,
  dataType: FieldDefinition["dataType"],
  overrides: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    apiName,
    label: apiName,
    dataType,
    required: false,
    readOnly: false,
    unique: false,
    ...overrides,
  };
}

const LEADS_FIELDS = [
  field("id", "text"),
  field("Company", "text"),
  field("First_Name", "text"),
  field("Full_Name", "text"),
  field("Email", "email"),
  field("Phone", "phone"),
  field("Lead_Source", "picklist"),
  field("Mobile", "phone"),
  field("Created_Time", "datetime"),
  field("Annual_Revenue", "currency"),
];

const CONTACTS_FIELDS = [
  field("First_Name", "text"),
  field("Last_Name", "text"),
  field("Email", "email", { unique: true }),
  field("Account_Name", "lookup"),
  field("Phone", "phone"),
  field("Mobile", "phone"),
];

describe("dedup field panel", () => {
  it("offers only text, email and phone fields", () => {
    expect(isDedupFieldEligible(field("Lead_Source", "picklist"))).toBe(false);
    expect(isDedupFieldEligible(field("Email", "email"))).toBe(true);
    expect(isDedupFieldEligible(field("Mobile", "phone"))).toBe(true);
    expect(isDedupFieldEligible(field("id", "text"))).toBe(false);
    const panel = resolveDedupFields("Leads", LEADS_FIELDS).map((item) => item.apiName);
    expect(panel).not.toContain("id");
    expect(panel).not.toContain("Lead_Source");
    expect(panel).not.toContain("Created_Time");
    expect(panel).not.toContain("Annual_Revenue");
  });

  it("keeps the documented panel order for Leads", () => {
    expect(resolveDedupFields("Leads", LEADS_FIELDS).map((item) => item.apiName)).toEqual([
      "Email",
      "Company",
      "Phone",
      "Mobile",
      "First_Name",
      "Full_Name",
    ]);
  });

  it("leads with the unique fields and skips metadata-absent rows", () => {
    const panel = resolveDedupFields("Contacts", CONTACTS_FIELDS);
    expect(panel.map((item) => item.apiName)).toEqual([
      "Email",
      "Phone",
      "Mobile",
      "First_Name",
      "Last_Name",
    ]);
    expect(panel.some((item) => item.apiName === "Account_Name")).toBe(false);
  });

  it("selects the interim default field set", () => {
    const module: ModuleApiName = "Leads";
    expect(defaultDedupSelection(module, resolveDedupFields(module, LEADS_FIELDS))).toEqual([
      "Email",
    ]);
    const contacts: ModuleApiName = "Contacts";
    expect(defaultDedupSelection(contacts, resolveDedupFields(contacts, CONTACTS_FIELDS))).toEqual([
      "Email",
    ]);
  });

  it("drops the default when the module does not offer it", () => {
    const fields = [field("Title", "text"), field("Industry", "picklist")];
    expect(defaultDedupSelection("Leads", resolveDedupFields("Leads", fields))).toEqual([]);
  });
});

describe("dedup selection limit", () => {
  it("allows three fields and refuses a fourth", () => {
    let selected: string[] = [];
    for (const apiName of ["Email", "Company", "Phone"]) {
      const next = toggleDedupSelection(selected, apiName);
      expect(next).not.toBeNull();
      selected = next ?? selected;
    }
    expect(selected).toHaveLength(DEDUP_MAX_FIELDS);
    expect(toggleDedupSelection(selected, "Mobile")).toBeNull();
  });

  it("keeps a refusal unchanged and still allows deselecting", () => {
    const selected = ["Email", "Company", "Phone"];
    expect(toggleDedupSelection(selected, "Company")).toEqual(["Email", "Phone"]);
    expect(toggleDedupSelection(["Email"], "Email")).toEqual([]);
  });
});

describe("dedup conflict groups", () => {
  it("treats differing values and oversized groups as conflicts", () => {
    expect(isDedupConflictGroup({ records: [1, 2], conflictFields: ["Phone"] })).toBe(true);
    expect(isDedupConflictGroup({ records: [1, 2, 3, 4], conflictFields: [] })).toBe(true);
    expect(isDedupConflictGroup({ records: [1, 2, 3], conflictFields: [] })).toBe(false);
  });
});

describe("dedup copy", () => {
  it("names the module and the three-field limit in the panel message", () => {
    expect(dedupFieldPanelMessage("Leads")).toBe(
      "Select the fields you want to identify duplicate Leads with.",
    );
  });

  it("lists merged groups and removed records", () => {
    expect(dedupResultSummaryMessage(2, 5)).toBe(
      "2 duplicate groups merged and 5 records removed.",
    );
    expect(dedupResultSummaryMessage(1, 1)).toBe("1 duplicate group merged and 1 record removed.");
  });

  it("joins the selected fields in the conflict intro", () => {
    expect(dedupConflictIntro(["Email", "Company", "Mobile"])).toBe(
      "Duplicates with conflicts based on the field Email, Company and Mobile are listed below. View and merge them manually.",
    );
    expect(dedupConflictIntro(["Email"])).toBe(
      "Duplicates with conflicts based on the field Email are listed below. View and merge them manually.",
    );
  });
});
