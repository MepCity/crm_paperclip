import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it, vi } from "vitest";
import { loadQueues, queueDefinitions } from "./queues";

describe("workqueue read model", () => {
  it("uses matching counts and pages and keeps Tasks owned, open and due", async () => {
    const service = createFixtureRecordService(
      {
        orgId: randomUUID(),
        orgSlug: "queue-test",
        orgName: "Queue test",
        userId: "queue-user",
        role: "admin",
      },
      { listMemberIds: async () => ["queue-user", "other-user"] },
    );
    const due = "2000-01-01";
    const included = await service.create("Tasks", {
      Subject: "Queue due task",
      Due_Date: due,
      Status: "Not Started",
    });
    const completed = await service.create("Tasks", {
      Subject: "Queue completed task",
      Due_Date: due,
      Status: "Completed",
    });
    const future = await service.create("Tasks", {
      Subject: "Queue future task",
      Due_Date: "2099-01-01",
      Status: "Not Started",
    });
    const other = await service.create("Tasks", {
      Subject: "Another owner task",
      Due_Date: due,
      Status: "Not Started",
      Owner: "other-user",
    });
    const list = vi.spyOn(service, "list");
    const count = vi.spyOn(service, "count");
    const queues = await loadQueues(service, 1);
    const tasks = queues.find((queue) => queue.id === "tasks");
    expect(tasks?.columns.map((field) => field.apiName)).toEqual([
      "Subject",
      "Due_Date",
      "Status",
      "Priority",
      "What_Id",
      "Who_Id",
    ]);
    expect(tasks?.result.records.map((record) => record.id)).toContain(included.id);
    expect(tasks?.result.records.map((record) => record.id)).not.toContain(completed.id);
    expect(tasks?.result.records.map((record) => record.id)).not.toContain(future.id);
    expect(tasks?.result.records.map((record) => record.id)).not.toContain(other.id);
    for (const queue of queues) {
      expect(queue.count).toBeGreaterThanOrEqual(queue.result.records.length);
      expect(queue.result.page).toBe(1);
      const definition = queueDefinitions.find((definition) => definition.id === queue.id);
      if (!definition) throw new Error("Missing queue definition");
      const listCall = list.mock.calls.find(
        ([module, query]) => module === definition.module && query?.viewId === definition.view,
      );
      expect(count).toHaveBeenCalledWith(definition.module, listCall?.[1]);
    }
  });

  it.each(["Events", "Calls"] as const)(
    "limits %s pages and counts to owned, open activities starting today or earlier",
    async (module) => {
      const now = new Date("2026-10-24T12:00:00.000Z");
      const service = createFixtureRecordService(
        {
          orgId: randomUUID(),
          orgSlug: "activity-queue-test",
          orgName: "Activity queue test",
          userId: "queue-user",
          role: "admin",
        },
        { now: () => now, listMemberIds: async () => ["queue-user", "other-user"] },
      );
      const create = (start: string, extra = {}) =>
        module === "Events"
          ? service.create(module, {
              Event_Title: "Queue meeting",
              Meeting_Venue__s: "In-office",
              Start_DateTime: start,
              End_DateTime: "2026-10-25T12:00:00.000Z",
              ...extra,
            })
          : service.create(module, {
              Subject: "Queue call",
              Call_Type: "Outbound",
              Call_Start_Time: start,
              Outgoing_Call_Status: "Scheduled",
              ...extra,
            });
      const included = [];
      // More than one page, including yesterday, midnight, and later today.
      for (let index = 0; index < 11; index++) {
        included.push(await create("2026-10-23T23:59:59.999Z"));
      }
      included.push(await create("2026-10-24T00:00:00.000Z"));
      included.push(await create("2026-10-24T23:59:59.999Z"));
      if (module === "Calls") {
        included.push(
          await create("2026-10-23T09:00:00.000Z", { Outgoing_Call_Status: "Overdue" }),
        );
      }
      const excluded = [
        await create("2026-10-25T00:00:00.000Z"),
        await create("2026-10-23T09:00:00.000Z", { Owner: "other-user" }),
        await create("2026-10-24T18:00:00.000Z", { Owner: "other-user" }),
      ];
      if (module === "Events") {
        for (const end of ["2026-10-24T11:59:59.999Z", now.toISOString()]) {
          excluded.push(await create("2026-10-23T09:00:00.000Z", { End_DateTime: end }));
        }
      } else {
        for (const status of ["Completed", "Cancelled"]) {
          for (const start of ["2026-10-23T09:00:00.000Z", "2026-10-24T09:00:00.000Z"]) {
            excluded.push(
              await create(start, { Outgoing_Call_Status: status, Call_Duration: "05:00" }),
            );
          }
        }
      }
      const list = vi.spyOn(service, "list");
      const count = vi.spyOn(service, "count");
      const id = module === "Events" ? "meetings" : "calls";
      const first = (await loadQueues(service, 1)).find((queue) => queue.id === id);
      if (!first) throw new Error("Missing activity queue");
      expect(first.count).toBeGreaterThanOrEqual(included.length);
      expect(first.result.records).toHaveLength(10);
      const records = [...first.result.records];
      for (let page = 2; records.length < first.count; page++) {
        const next = (await loadQueues(service, page)).find((queue) => queue.id === id);
        if (!next) throw new Error("Missing activity queue");
        expect(next.count).toBe(first.count);
        expect(next.result.records.length).toBeGreaterThan(0);
        records.push(...next.result.records);
      }
      const ids = records.map((record) => record.id);
      expect(new Set(ids).size).toBe(first.count);
      for (const record of included) expect(ids).toContain(record.id);
      for (const record of excluded) expect(ids).not.toContain(record.id);
      for (const [requestedModule, query] of list.mock.calls) {
        expect(count).toHaveBeenCalledWith(requestedModule, query);
      }
    },
  );
});
