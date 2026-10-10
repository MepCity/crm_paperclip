import type { FieldDefinition } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  buildLeadStatusStages,
  buildLeadStatusTerminalGroups,
  readLeadStatusValue,
} from "./leads-status-ribbon";

const statusField: FieldDefinition = {
  apiName: "Lead_Status",
  label: "Lead Status",
  dataType: "picklist",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: false },
  picklist: [
    { displayValue: "-None-", storedValue: "-None-" },
    { displayValue: "Contacted", storedValue: "Contacted" },
    { displayValue: "Junk Lead", storedValue: "Junk Lead" },
    { displayValue: "Not Qualified", storedValue: "Not Qualified" },
  ],
};

describe("leads-status-ribbon helpers", () => {
  it("normalizes stored lead status values", () => {
    expect(readLeadStatusValue(null)).toBeNull();
    expect(readLeadStatusValue("-None-")).toBeNull();
    expect(readLeadStatusValue("Contacted")).toBe("Contacted");
  });

  it("builds ribbon stages in metadata order with a null option", () => {
    expect(buildLeadStatusStages(statusField).map((stage) => stage.label)).toEqual([
      "-None-",
      "Contacted",
      "Junk Lead",
      "Not Qualified",
    ]);
  });

  it("builds terminal groups from interim category mapping", () => {
    const stages = buildLeadStatusStages(statusField);
    expect(buildLeadStatusTerminalGroups(stages)).toEqual([
      { label: "Junk", options: [{ value: "Junk Lead", label: "Junk Lead" }] },
      {
        label: "Not Qualified",
        options: [{ value: "Not Qualified", label: "Not Qualified" }],
      },
    ]);
  });
});
