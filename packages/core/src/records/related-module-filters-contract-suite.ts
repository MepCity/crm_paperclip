import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { OrgContext } from "../tenancy/types";
import type { RecordInput, RecordService, RelatedModuleFilter } from "./contract";
import {
  casesRecordServiceContractModule,
  eventsRecordServiceContractModule,
} from "./contract-suite-module";

type Child = RelatedModuleFilter["module"];
const apiName: Record<Child, string> = {
  Calls: "Calls",
  Meetings: "Events",
  Notes: "Notes",
  Tasks: "Tasks",
};

export function describeRelatedModuleFiltersContract(
  name: string,
  makeRecords: (ctx: OrgContext) => RecordService | Promise<RecordService>,
): void {
  describe(`${name}: Cases related-module filters`, () => {
    let records: RecordService;
    let viewId: string;
    let hasChild: string;
    let noChild: string;
    const subjectFilter = { field: "Subject", comparator: "starts_with" as const, value: "RMC " };
    const ids = async (relatedModules: readonly RelatedModuleFilter[], filters = subjectFilter) =>
      (
        await records.list("Cases", { viewId, page: 1, perPage: 100, filters, relatedModules })
      ).records
        .map((r) => r.id)
        .sort();
    const childInput = (child: Child, caseId: string): RecordInput => {
      const parent = { module: "Cases", id: caseId };
      switch (child) {
        case "Calls":
          return {
            Call_Type: "Outbound",
            Call_Start_Time: "2026-01-15T10:00:00.000Z",
            Call_Duration: "05:00",
            Subject: "Child hit",
            What_Id: parent,
          };
        case "Meetings":
          return eventsRecordServiceContractModule.buildMinimalValidInput({
            Event_Title: "Child hit",
            What_Id: parent,
          });
        case "Notes":
          return { Parent_Id: parent, Note_Title: "Child hit", Note_Content: "body" };
        case "Tasks":
          return { Subject: "Child hit", What_Id: parent };
      }
    };
    const titleField: Record<Child, string> = {
      Calls: "Subject",
      Meetings: "Event_Title",
      Notes: "Note_Title",
      Tasks: "Subject",
    };
    beforeEach(async () => {
      records = await makeRecords({
        orgId: randomUUID(),
        orgSlug: "related-contract",
        orgName: "Synthetic",
        userId: "related-user",
        role: "admin",
      });
      viewId = (await records.listViews("Cases")).find((v) => v.isDefault)?.id ?? "";
      const base = casesRecordServiceContractModule.buildMinimalValidInput();
      hasChild = (await records.create("Cases", { ...base, Subject: "RMC has" })).id;
      noChild = (await records.create("Cases", { ...base, Subject: "RMC none" })).id;
    });

    for (const child of ["Calls", "Meetings", "Notes", "Tasks"] as const) {
      it(`${child}: with / without, criteria and field-filter combination`, async () => {
        await records.create(apiName[child], childInput(child, hasChild));
        const hit = { field: titleField[child], comparator: "equal" as const, value: "Child hit" };
        const miss = { field: titleField[child], comparator: "equal" as const, value: "Nope" };
        const row = (presence: "with" | "without", criteria = [] as (typeof hit)[]) => ({
          module: child,
          presence,
          criteria,
        });
        expect(await ids([row("with")])).toEqual([hasChild]);
        expect(await ids([row("without")])).toEqual([noChild]);
        expect(await ids([row("with", [hit])])).toEqual([hasChild]);
        expect(await ids([row("with", [miss])])).toEqual([]);
        expect(await ids([row("without", [hit])])).toEqual([noChild]);
        expect(await ids([row("without", [miss])])).toEqual([hasChild, noChild].sort());
        // AND with a field filter that excludes the matching parent
        expect(await ids([row("with")], { ...subjectFilter, value: "RMC none" })).toEqual([]);
        // multiple rows AND together
        expect(await ids([row("with"), row("without", [miss])])).toEqual([hasChild]);
      });
    }

    it("rejects the 4th row and the 6th criterion with a ValidationError", async () => {
      const row = { module: "Calls" as const, presence: "with" as const, criteria: [] };
      await expect(ids([row, row, row, row])).rejects.toBeInstanceOf(ValidationError);
      const c = { field: "Subject", comparator: "equal" as const, value: "x" };
      await expect(ids([{ ...row, criteria: [c, c, c, c, c, c] }])).rejects.toBeInstanceOf(
        ValidationError,
      );
    });
  });
}
