import type { RecordData } from "@crm/core/records";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { ParentActivitiesCardBody } from "@/components/records/detail/parent-activities-card-body";
import { parentActivitiesBody } from "./parent-activity-cards";
import type { RelatedListDefinition } from "./types";

const dummyRecord: RecordData = {
  id: "rec-1",
  fields: { Name: "Acme Corp" },
} as RecordData;

const dummyRecordPath = (module: string, id: string) => `/crm/org/tab/${module}/${id}`;

const dummyDefinition: RelatedListDefinition = {
  id: "open-activities",
  title: "Open Activities",
  moduleKey: "M2",
  order: 1,
  targetId: "open-activities-card",
};

describe("parentActivitiesBody", () => {
  it("creates a renderer returning ParentActivitiesCardBody element with expected props for all supported parent modules", () => {
    const supportedModules = ["Leads", "Contacts", "Accounts", "Deals"] as const;
    const variants = ["open", "closed"] as const;

    for (const parentModule of supportedModules) {
      for (const variant of variants) {
        const renderBody = parentActivitiesBody(parentModule, variant);
        expect(typeof renderBody).toBe("function");

        const element = renderBody({
          record: dummyRecord,
          orgSlug: "test-org",
          recordPath: dummyRecordPath,
          definition: dummyDefinition,
        });
        expect(element).toBeDefined();
        expect(isValidElement(element)).toBe(true);
        if (isValidElement(element)) {
          expect(element.type).toBe(ParentActivitiesCardBody);
          expect(element.props).toEqual({
            parentModule,
            parentRecord: dummyRecord,
            variant,
            recordPath: dummyRecordPath,
          });
        }
      }
    }
  });

  it("returns undefined when record is missing or undefined (edge case: empty record)", () => {
    const renderBody = parentActivitiesBody("Leads", "open");
    const result = renderBody({
      record: undefined,
      orgSlug: "test-org",
      recordPath: dummyRecordPath,
      definition: dummyDefinition,
    });
    expect(result).toBeUndefined();

    const nullResult = renderBody({
      record: null as unknown as RecordData,
      orgSlug: "test-org",
      recordPath: dummyRecordPath,
      definition: dummyDefinition,
    });
    expect(nullResult).toBeUndefined();
  });

  it("handles unknown or non-standard module names without throwing", () => {
    const unknownModule = "UnknownModule" as unknown as "Leads";
    const renderBody = parentActivitiesBody(unknownModule, "open");
    expect(typeof renderBody).toBe("function");

    const element = renderBody({
      record: dummyRecord,
      orgSlug: "test-org",
      recordPath: dummyRecordPath,
      definition: dummyDefinition,
    });
    expect(isValidElement(element)).toBe(true);
    if (isValidElement(element)) {
      expect(element.type).toBe(ParentActivitiesCardBody);
      expect((element.props as Record<string, unknown>).parentModule).toBe("UnknownModule");
      expect((element.props as Record<string, unknown>).variant).toBe("open");
    }
  });
});
