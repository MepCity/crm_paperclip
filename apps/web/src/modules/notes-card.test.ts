import type { RecordData } from "@crm/core/records";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { NotesCardBody } from "@/components/records/notes/notes-card-body";
import { notesCardBody } from "./notes-card";
import type { RelatedListDefinition } from "./types";

const dummyRecord: RecordData = {
  id: "rec-1",
  fields: { Name: "Test Lead" },
} as RecordData;

const dummyRecordPath = (module: string, id: string) => `/crm/org/tab/${module}/${id}`;

const dummyDefinition: RelatedListDefinition = {
  id: "notes",
  title: "Notes",
  moduleKey: "M2",
  order: 1,
  targetId: "notes-card",
};

describe("notesCardBody", () => {
  it("returns undefined when record is not provided", () => {
    const renderBody = notesCardBody("Leads");
    expect(typeof renderBody).toBe("function");

    const result = renderBody({
      record: undefined,
      orgSlug: "test-org",
      recordPath: dummyRecordPath,
      definition: dummyDefinition,
    });
    expect(result).toBeUndefined();
  });

  it("returns a NotesCardBody element with correct props when record is provided", () => {
    const renderBody = notesCardBody("Leads");

    const element = renderBody({
      record: dummyRecord,
      orgSlug: "test-org",
      recordPath: dummyRecordPath,
      definition: dummyDefinition,
    });

    expect(element).toBeDefined();
    expect(isValidElement(element)).toBe(true);
    if (isValidElement(element)) {
      expect(element.type).toBe(NotesCardBody);
      expect(element.props).toEqual({
        parentModule: "Leads",
        parentRecord: dummyRecord,
        recordPath: dummyRecordPath,
      });
    }
  });

  it("passes parentModule through for all seven supported parent modules", () => {
    const supportedModules = [
      "Leads",
      "Contacts",
      "Accounts",
      "Deals",
      "Campaigns",
      "Cases",
      "Solutions",
    ] as const;

    for (const parentModule of supportedModules) {
      const renderBody = notesCardBody(parentModule);
      const element = renderBody({
        record: dummyRecord,
        orgSlug: "test-org",
        recordPath: dummyRecordPath,
        definition: dummyDefinition,
      });

      expect(isValidElement(element)).toBe(true);
      if (isValidElement(element)) {
        expect(element.type).toBe(NotesCardBody);
        expect((element.props as Record<string, unknown>).parentModule).toBe(parentModule);
        expect((element.props as Record<string, unknown>).parentRecord).toBe(dummyRecord);
        expect((element.props as Record<string, unknown>).recordPath).toBe(dummyRecordPath);
      }
    }
  });
});
