import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, RecordLockedError } from "../errors";
import { activityState } from "./activities";
import type { RecordInput } from "./contract";
import { createFixtureRecordService } from "./fixture";

// Calls is not shipped yet: exercise a registered package without defining its schema.
vi.mock("./fixture/registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("./fixture/registry")>();
  const task = original.fixtureModules.Tasks;
  if (!task) throw new Error("Missing task package");
  const fields = task.metadata.fields.map((field) =>
    ["Who_Id", "What_Id"].includes(field.apiName)
      ? {
          ...field,
          lookup: { module: "Leads", modules: ["Leads", "Contacts", "Accounts", "Deals"] },
        }
      : field,
  );
  const status = task.metadata.fields.find((field) => field.apiName === "Status");
  if (!status) throw new Error("Missing status field");
  const callFields = [
    ...fields,
    {
      ...status,
      apiName: "Outgoing_Call_Status",
      picklist: [
        { storedValue: "Scheduled", displayValue: "Scheduled" },
        { storedValue: "Completed", displayValue: "Completed" },
      ],
    },
  ];
  const modules = { ...original.fixtureModules };
  for (const module of ["Tasks", "Events", "Calls"]) {
    const base = modules[module] ?? task;
    modules[module] = {
      ...base,
      metadata: {
        ...base.metadata,
        apiName: module,
        fields:
          module === "Events"
            ? base.metadata.fields.map((field) =>
                ["Who_Id", "What_Id"].includes(field.apiName)
                  ? {
                      ...field,
                      lookup: {
                        module: "Leads",
                        modules: ["Leads", "Contacts", "Accounts", "Deals"],
                      },
                    }
                  : field,
              )
            : module === "Calls"
              ? callFields
              : fields,
      },
      generateSeed: () => [],
      afterWrite(record) {
        if (
          record.fields.Subject === "Synthetic locked activity" ||
          record.fields.Event_Title === "Synthetic locked activity"
        )
          record.fields = { ...record.fields, Locked__s: true };
      },
    };
  }
  return { ...original, fixtureModules: modules };
});

const make = () =>
  createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "cascade-contract",
      orgName: "Cascade Contract",
      userId: "contract-user",
      role: "admin",
    },
    { now: () => new Date("2026-10-14T12:00:00Z") },
  );
const parentInputs: Record<string, RecordInput> = {
  Leads: { Last_Name: "Synthetic Parent", Company: "Synthetic Company" },
  Contacts: { Last_Name: "Synthetic Parent" },
  Accounts: { Account_Name: "Synthetic Parent" },
  Deals: { Deal_Name: "Synthetic Parent", Stage: "Qualification", Closing_Date: "2026-10-30" },
};
const activityInput = (module: string, closed: boolean): RecordInput =>
  module === "Events"
    ? {
        Event_Title: "Synthetic meeting",
        Meeting_Venue__s: "In-office",
        Start_DateTime: "2026-10-13T10:00:00Z",
        End_DateTime: closed ? "2026-10-13T11:00:00Z" : "2026-10-15T11:00:00Z",
      }
    : {
        Subject: "Synthetic activity",
        Status: closed ? "Completed" : "Not Started",
        ...(module === "Calls" ? { Outgoing_Call_Status: closed ? "Completed" : "Scheduled" } : {}),
      };

describe.each(Object.entries(parentInputs))("%s activity deletion contract", (module, input) => {
  const createParent = async (service: ReturnType<typeof make>, extra: RecordInput = {}) => {
    const account =
      module === "Deals"
        ? await service.create("Accounts", parentInputs.Accounts ?? {})
        : undefined;
    return service.create(module, {
      ...input,
      ...(account ? { Account_Name: { module: "Accounts", id: account.id } } : {}),
      ...extra,
    });
  };
  it("deletes open, closed and locked children through either link, preserving unrelated records", async () => {
    const service = make();
    const parents = [await createParent(service), await createParent(service)];
    const other = await createParent(service);
    const removed: [string, string][] = [];
    const retained: [string, string][] = [];
    for (const activityModule of ["Tasks", "Events", "Calls"]) {
      for (const field of ["Who_Id", "What_Id"]) {
        for (const closed of [false, true]) {
          const parent = parents[closed ? 1 : 0];
          if (!parent) throw new Error("Missing parent");
          const child = await service.create(activityModule, {
            ...activityInput(activityModule, closed),
            [field]: { module, id: parent.id },
            [activityModule === "Events" ? "Event_Title" : "Subject"]: "Synthetic locked activity",
          });
          expect(child.fields.Locked__s).toBe(true);
          expect(activityState(activityModule, child, new Date("2026-10-14T12:00:00Z"))).toBe(
            closed ? "closed" : "open",
          );
          removed.push([activityModule, child.id]);
        }
        const child = await service.create(activityModule, {
          ...activityInput(activityModule, false),
          [field]: { module, id: other.id },
        });
        retained.push([activityModule, child.id]);
      }
    }
    const view = (await service.listViews(module)).find((view) => view.isDefault);
    if (!view) throw new Error("Missing view");
    const read = await service.list(module, {
      viewId: view.id,
      page: 1,
      perPage: 100,
      filters: { field: "id", comparator: "equal", value: other.id },
      includeActivitySummary: true,
    });
    expect(read.activitySummaries?.[other.id]).toBeDefined();
    await service.delete(
      module,
      parents.map((parent) => parent.id),
    );
    for (const [name, id] of removed)
      await expect(service.get(name, id)).rejects.toBeInstanceOf(NotFoundError);
    for (const [name, id] of retained) expect((await service.get(name, id)).id).toBe(id);
  });
  it("validates the entire batch before deleting any parent or child", async () => {
    const service = make();
    const parent = await createParent(service);
    const view = (await service.listViews(module)).find((view) => view.isDefault);
    if (!view) throw new Error("Missing view");
    const locked = (
      await service.list(module, {
        viewId: view.id,
        page: 1,
        perPage: 10,
        filters: { field: "Locked__s", comparator: "equal", value: true },
      })
    ).records[0];
    if (!locked) throw new Error("Missing locked seed");
    const task = await service.create("Tasks", {
      Subject: "Synthetic task",
      Who_Id: { module, id: parent.id },
    });
    await expect(service.delete(module, [parent.id, locked.id])).rejects.toBeInstanceOf(
      RecordLockedError,
    );
    await expect(service.delete(module, [parent.id, "missing"])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    for (const record of [parent, locked])
      expect((await service.get(module, record.id)).id).toBe(record.id);
    expect((await service.get("Tasks", task.id)).fields.Who_Id).toMatchObject({
      module,
      id: parent.id,
    });
  });
  it("preserves and reassigns duplicate activities during merge", async () => {
    const service = make();
    const master = await createParent(service);
    const duplicate = await createParent(service);
    const children: [string, string][] = [];
    for (const name of ["Tasks", "Events", "Calls"]) {
      const child = await service.create(name, {
        ...activityInput(name, false),
        Who_Id: { module, id: duplicate.id },
      });
      children.push([name, child.id]);
    }
    await service.merge(module, { masterId: master.id, duplicateIds: [duplicate.id], values: {} });
    for (const [name, id] of children)
      expect((await service.get(name, id)).fields.Who_Id).toMatchObject({ module, id: master.id });
  });
});

// Conversion has no service operation yet; converted fixture records remain on the update path.
it("preserves activities when an already converted Lead is updated", async () => {
  const service = make();
  const lead = (await service.list("Leads", { viewId: "converted-leads", page: 1, perPage: 10 }))
    .records[0];
  if (!lead) throw new Error("Missing converted seed");
  expect(lead.fields.Converted__s).toBe(true);
  const task = await service.create("Tasks", {
    Subject: "Synthetic activity",
    Who_Id: { module: "Leads", id: lead.id },
  });
  await service.update("Leads", lead.id, { Phone: "5550100" });
  expect((await service.get("Tasks", task.id)).fields.Who_Id).toMatchObject({
    module: "Leads",
    id: lead.id,
  });
});
