import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
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
      expect(queue.count).toBe(
        await service.count(definition.module, {
          viewId: definition.view,
          filters: { field: "Owner", comparator: "equal", value: { token: "CURRENTUSER" } },
        }),
      );
    }
  });
});
