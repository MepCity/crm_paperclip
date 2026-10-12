import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, RecordLockedError, ValidationError } from "../errors";
import type { FieldDefinition, RecordData } from "./contract";
import { describeDiscoveryContract } from "./discovery-contract-suite";
import { createFixtureRecordService } from "./fixture";
import {
  automaticMaster,
  duplicateGroups,
  isDeferredMergeRejection,
  matchesGlobalSearch,
  searchableText,
} from "./fixture/discovery";
import { fixtureModules } from "./fixture/registry";

describeDiscoveryContract("fixture", createFixtureRecordService);

describe("discovery helpers", () => {
  it("rule 2: handles multi-selection, numeric/auto-number values and lookup display names", () => {
    expect(searchableText(["First", "Second"])).toBe("First Second");
    const field = (dataType: string): FieldDefinition => ({
      apiName: "Value",
      dataType: dataType as FieldDefinition["dataType"],
      label: "Value",
      required: false,
      readOnly: false,
      unique: false,
      massUpdate: false,
      views: { view: true, create: true, edit: true, quickCreate: false },
    });
    for (const type of [
      "text",
      "textarea",
      "phone",
      "email",
      "integer",
      "double",
      "currency",
      "bigint",
      "autonumber",
      "website",
      "multipicklist",
    ])
      expect(
        matchesGlobalSearch({ id: "test", fields: { Value: "Marker" } }, [field(type)], "marker"),
      ).toBe(true);
    for (const type of ["boolean", "datetime", "date", "profileimage"])
      expect(
        matchesGlobalSearch({ id: "test", fields: { Value: "Marker" } }, [field(type)], "marker"),
      ).toBe(false);
    expect(searchableText(12345)).toBe("12345");
    expect(searchableText({ module: "Contacts", id: "opaque", name: "Display" })).toBe("Display");
    expect(searchableText({ module: "Contacts", id: "opaque" })).toBe("");
  });
  it("rule 12: reports differing read-only business values but ignores system identity and attribution", () => {
    const bundle = fixtureModules.Contacts;
    if (!bundle) throw new Error("Missing Contacts bundle");
    const groups = duplicateGroups(
      [
        {
          id: "first",
          fields: {
            id: "first",
            Last_Name: "Marker",
            Created_Time: "2026-01-01",
            Unsubscribed_Mode: "A",
          },
        },
        {
          id: "second",
          fields: {
            id: "second",
            Last_Name: "marker",
            Created_Time: "2026-02-01",
            Unsubscribed_Mode: "B",
          },
        },
      ],
      ["Last_Name"],
      bundle.metadata.fields,
      bundle.managedFields,
    );
    expect(groups[0]?.conflictFields).toEqual(["Unsubscribed_Mode"]);
  });
  it("rule 12: treats the write lock as an access flag, never as a business conflict", () => {
    const bundle = fixtureModules.Contacts;
    if (!bundle) throw new Error("Missing Contacts bundle");
    const groups = duplicateGroups(
      [
        { id: "open", fields: { id: "open", Last_Name: "Locked Marker", Locked__s: false } },
        { id: "locked", fields: { id: "locked", Last_Name: "locked marker", Locked__s: true } },
      ],
      ["Last_Name"],
      bundle.metadata.fields,
      bundle.managedFields,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.conflictFields).toEqual([]);
  });
  it("rules 12–13: defers a group only for a lock or a unique collision", () => {
    expect(isDeferredMergeRejection(new RecordLockedError())).toBe(true);
    expect(isDeferredMergeRejection(new ConflictError("This value is already used."))).toBe(true);
    expect(isDeferredMergeRejection(new ValidationError({ Last_Name: ["Required."] }))).toBe(false);
    expect(isDeferredMergeRejection(new NotFoundError())).toBe(false);
    expect(isDeferredMergeRejection(new Error("Unexpected failure."))).toBe(false);
  });
  it("rule 13: prefers latest activity, then modification time for empty or tied activity", () => {
    const row = (id: string, activity: string | null, modified: string): RecordData => ({
      id,
      fields: { Last_Activity_Time: activity, Modified_Time: modified },
    });
    const oldActivity = row("1", "2026-01-01", "2026-03-01");
    const newActivity = row("2", "2026-02-01", "2026-01-01");
    expect(automaticMaster([oldActivity, newActivity]).id).toBe("2");
    expect(automaticMaster([row("1", null, "2026-01-01"), row("2", null, "2026-02-01")]).id).toBe(
      "2",
    );
    expect(
      automaticMaster([row("1", "2026-01-01", "2026-01-01"), row("2", "2026-01-01", "2026-02-01")])
        .id,
    ).toBe("2");
  });
});
