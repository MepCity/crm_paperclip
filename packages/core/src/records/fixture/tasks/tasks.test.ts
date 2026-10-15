import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import {
  type Criteria,
  type FieldValue,
  lookupTargetModules,
  type RecordInput,
} from "../../contract";
import { describeRecordServiceContract } from "../../contract-suite";
import { tasksRecordServiceContractModule } from "../../contract-suite-module";
import { createFixtureRecordService } from "../index";
import { matches, validateCriteria } from "../query";
import { resolveRecordReferences } from "../references";
import { tasksMetadata, tasksWhatTargets, tasksWhoTargets } from "./metadata";
import { generateFixtureTasks } from "./seed";
import { tasksDroppedColumns, tasksViewSource, tasksViews } from "./views";

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Missing fixture definition");
  return value;
}

const now = new Date("2026-01-15T23:59:00Z");
const make = () =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "task-tests",
      orgName: "Task Tests",
      userId: "task-member",
      role: "admin",
    },
    { now: () => now },
  );
const query = { viewId: "all-tasks", page: 1, perPage: 100 };
const fields = new Map(tasksMetadata.fields.map((field) => [field.apiName, field]));
const input = (extra: RecordInput = {}) => ({ Subject: "Example Task", ...extra });
describeRecordServiceContract(
  "fixture",
  createFixtureRecordService,
  tasksRecordServiceContractModule,
);

describe("Tasks activity foundation", () => {
  it("publishes target lists derived from related-list source rows", async () => {
    expect(tasksWhoTargets).toEqual(["Contacts", "Leads"]);
    expect(tasksWhatTargets).toEqual([
      "Accounts",
      "Campaigns",
      "Cases",
      "Deals",
      "Invoices",
      "Products",
      "Purchase_Orders",
      "Quotes",
      "Sales_Orders",
      "Vendors",
    ]);
    const metadata = await make().getModule("Tasks");
    expect(
      lookupTargetModules(required(metadata.fields.find((field) => field.apiName === "Who_Id"))),
    ).toEqual(tasksWhoTargets);
    expect(
      lookupTargetModules(required(metadata.fields.find((field) => field.apiName === "What_Id"))),
    ).toEqual(tasksWhatTargets);
    expect(metadata.fields).toHaveLength(20);
    expect(await make().count("Tasks", { viewId: "all-tasks" })).toBe(250);
  });
  it("projects only BEST_TIME out of exactly seven source views, retaining all other columns", async () => {
    expect(tasksDroppedColumns).toEqual(["BEST_TIME"]);
    const views = await make().listViews("Tasks");
    expect(views).toHaveLength(17);
    expect(
      tasksViewSource.filter((view) => view.columns.some((column) => column === "BEST_TIME")),
    ).toHaveLength(7);
    for (const [index, view] of views.entries()) {
      const source = required(tasksViewSource[index]);
      expect(view.columns).toEqual(source.columns.filter((column) => column !== "BEST_TIME"));
      expect(view.sort).toBeNull();
      if (view.criteria) validateCriteria(view.criteria, fields);
    }
    expect((await make().list("Tasks", query)).sort).toEqual({ field: "id", order: "desc" });
  });
  it.each(["Who_Id", "What_Id"])(
    "validates %s using field metadata on create and update",
    async (field) => {
      const service = make();
      const targetModule = field === "Who_Id" ? "Contacts" : "Accounts";
      const target = await service.get(
        targetModule,
        targetModule === "Contacts" ? "300000000000000000" : "500000000000000000",
      );
      const name = target.fields[targetModule === "Contacts" ? "Full_Name" : "Account_Name"];
      const valid = { module: targetModule, id: target.id, name: "Untrusted name" };
      const task = await service.create("Tasks", input({ [field]: valid }));
      expect(task.fields[field]).toEqual({ module: targetModule, id: target.id, name });
      for (const ref of [
        { module: "Tasks", id: target.id },
        { module: targetModule, id: "missing" },
      ]) {
        await expect(service.create("Tasks", input({ [field]: ref }))).rejects.toBeInstanceOf(
          ValidationError,
        );
        await expect(service.update("Tasks", task.id, { [field]: ref })).rejects.toBeInstanceOf(
          ValidationError,
        );
      }
      await service.delete(targetModule, [target.id]);
      await expect(service.get("Tasks", task.id)).rejects.toBeInstanceOf(NotFoundError);
      const listed = await service.list("Tasks", {
        ...query,
        filters: { field: "id", comparator: "equal", value: task.id },
      });
      expect(listed.records).toEqual([]);
    },
  );
  it("retains allowed unregistered target modules without existence or name resolution", async () => {
    const service = make();
    const ref = { module: "Vendors", id: "synthetic-vendor", name: "Synthetic Vendor" };
    const task = await service.create("Tasks", input({ What_Id: ref }));
    expect(task.fields.What_Id).toEqual(ref);
    expect((await service.update("Tasks", task.id, { What_Id: ref })).fields.What_Id).toEqual(ref);
  });
  it("uses the same reference resolver for another activity field definition", () => {
    const field = {
      ...required(tasksMetadata.fields.find((field) => field.apiName === "Who_Id")),
      apiName: "Participant",
    };
    const record = {
      id: "activity",
      fields: { Participant: { module: "Leads", id: "lead", name: "Spoof" } },
    };
    const modules = new Map([
      [
        "Leads",
        {
          displayNameField: "Full_Name",
          getRecord: () => ({ id: "lead", fields: { Full_Name: "Synthetic Lead" } }),
        },
      ],
    ]);
    expect(resolveRecordReferences(record, [field], modules).fields.Participant).toEqual({
      module: "Leads",
      id: "lead",
      name: "Synthetic Lead",
    });
  });
  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "lists and counts direct open/closed tasks for %s",
    async (module) => {
      const service = make();
      const field = module === "Leads" || module === "Contacts" ? "Who_Id" : "What_Id";
      const id = required(
        {
          Leads: "100000000000000000",
          Contacts: "300000000000000000",
          Accounts: "500000000000000000",
          Deals: "700000000000000000",
        }[module],
      );
      const filters: Criteria = { field, comparator: "equal", value: { module, id } };
      const noTaskTarget = (
        await service.list(module, { viewId: `all-${module.toLowerCase()}`, page: 1, perPage: 10 })
      ).records[0];
      if (!noTaskTarget) throw new Error("Missing unrelated target");
      expect(
        await service.count("Tasks", {
          viewId: "all-tasks",
          filters: { field, comparator: "equal", value: { module, id: noTaskTarget.id } },
        }),
      ).toBe(0);
      const list = await service.list("Tasks", { ...query, filters });
      const expected = generateFixtureTasks(68, now).filter((task) => {
        const ref = task.fields[field];
        return (
          typeof ref === "object" &&
          ref !== null &&
          "module" in ref &&
          ref.module === module &&
          ref.id === id
        );
      });
      expect(list.records.map((record) => record.id).sort()).toEqual(
        expected.map((record) => record.id).sort(),
      );
      expect(list.records.length).toBeGreaterThan(1);
      expect(await service.count("Tasks", { viewId: "all-tasks", filters })).toBe(expected.length);
      // Equal opaque IDs in different modules must not match.
      expect(
        await service.count("Tasks", {
          viewId: "all-tasks",
          filters: { field, comparator: "equal", value: { module, id: "no-task" } },
        }),
      ).toBe(0);
      let total = 0;
      for (const [viewId, comparator] of [
        ["open-tasks", "not_equal"],
        ["closed-tasks", "equal"],
      ] as const) {
        const count = await service.count("Tasks", { viewId, filters });
        const explicit: Criteria = {
          groupOperator: "and",
          group: [filters, { field: "Status", comparator, value: "Completed" }],
        };
        expect(await service.count("Tasks", { viewId: "all-tasks", filters: explicit })).toBe(
          count,
        );
        expect((await service.list("Tasks", { ...query, viewId, filters })).records).toHaveLength(
          count,
        );
        expect(count).toBeGreaterThan(0);
        total += count;
      }
      expect(total).toBe(expected.length);
      if (field === "Who_Id") {
        expect(
          await service.count("Tasks", {
            viewId: "all-tasks",
            filters: {
              field,
              comparator: "equal",
              value: { module: module === "Leads" ? "Contacts" : "Leads", id },
            },
          }),
        ).toBe(0);
      }
    },
  );
  it.each(["Remind_At", "Recurring_Activity"])(
    "stores %s as opaque JSON and isolates input/read mutations",
    async (field) => {
      const service = make();
      const value = {
        arbitrary: ["synthetic", 2, false, null, { nested: "value" }],
        module: "uninterpreted",
        id: "uninterpreted".repeat(40),
      };
      const expected = structuredClone(value);
      const created = await service.create("Tasks", input({ [field]: value }));
      expect(created.fields[field]).toEqual(expected);
      value.arbitrary.push("mutated");
      (created.fields[field] as { arbitrary: unknown[] }).arbitrary.push("read mutation");
      expect((await service.get("Tasks", created.id)).fields[field]).toEqual(expected);
      const replacement = { opaque: { more: [true, null, 3.25] } };
      expect(
        (await service.update("Tasks", created.id, { [field]: replacement })).fields[field],
      ).toEqual(replacement);
      expect(
        (
          await service.list("Tasks", {
            ...query,
            filters: { field: "id", comparator: "equal", value: created.id },
          })
        ).records[0]?.fields[field],
      ).toEqual(replacement);
      await service.update("Tasks", created.id, { [field]: null });
      expect((await service.get("Tasks", created.id)).fields[field]).toBeNull();
      for (const value of [
        "",
        "object",
        1,
        false,
        [],
        { nested: NaN },
        { nested: Infinity },
        { nested: undefined },
        new Date(),
        { nested: new Date() },
        { nested: () => "invalid" },
        { nested: 1n },
        { [Symbol("invalid")]: true },
        { nested: new Array(2) },
        { nested: Object.assign([1], { extra: true }) },
        Object.defineProperty({}, "hidden", { value: true }),
        {
          nested: new (class Example {
            value = 1;
          })(),
        },
      ]) {
        await expect(
          service.create("Tasks", input({ [field]: value as FieldValue })),
        ).rejects.toBeInstanceOf(ValidationError);
      }
      const cycle: Record<string, unknown> = {};
      cycle.self = cycle;
      await expect(
        service.create("Tasks", input({ [field]: cycle as FieldValue })),
      ).rejects.toBeInstanceOf(ValidationError);
      for (const comparator of ["equal", "is_empty", "is_not_empty"] as const) {
        await expect(
          service.count("Tasks", {
            viewId: "all-tasks",
            filters: { field, comparator, value: null },
          }),
        ).rejects.toBeInstanceOf(ValidationError);
      }
      await expect(
        service.list("Tasks", { ...query, sort: { field, order: "asc" } }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        service.create("Tasks", input({ Description: replacement })),
      ).rejects.toBeInstanceOf(ValidationError);
    },
  );
  it.each([
    ["next-7-days-overdue-tasks", [true, true, true, true, false]],
    ["today-overdue-tasks", [true, true, false, false, false]],
    ["overdue-tasks", [true, false, false, false, false]],
    ["today-s-tasks", [false, true, false, false, false]],
    ["tomorrow-s-tasks", [false, false, true, false, false]],
  ])("keeps %s calendar boundaries including overdue, today and +7", (viewId, expected) => {
    const criteria = required(tasksViews.find((view) => view.id === viewId)?.criteria);
    validateCriteria(criteria, fields);
    const dates = ["2026-01-14", "2026-01-15", "2026-01-16", "2026-01-22", "2026-01-23"];
    expect(
      dates.map((date) =>
        matches(
          { id: "1", fields: { Due_Date: date, Status: "Not Started" } },
          criteria,
          { now, userId: "task-member" },
          fields,
        ),
      ),
    ).toEqual(expected);
    expect(
      matches(
        { id: "1", fields: { Due_Date: null, Status: "Not Started" } },
        criteria,
        { now, userId: "task-member" },
        fields,
      ),
    ).toBe(false);
  });
});
