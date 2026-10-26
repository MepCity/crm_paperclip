import { randomUUID } from "node:crypto";
import { ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import {
  decodeActivityFilter,
  decodeActivitySummaries,
  encodeActivityFilter,
  encodeActivitySummaries,
} from "./codec";
import { operations } from "./operations";

describe("additive activity wire contract", () => {
  it.each([
    { choice: "overdue", range: "today" },
    { choice: "activity_due" },
    { choice: "activity_due", range: "invalid" },
    { choice: "unknown" },
    { choice: ["overdue"] },
    { choice: "activity_due", range: ["today"] },
    { choice: "activity_due", range: "today", extra: true },
    null,
  ])("rejects malformed filter %j", (value) => {
    expect(() => decodeActivityFilter(value)).toThrow(ValidationError);
  });
  it("round trips filter and summary DTOs", () => {
    const filter = { choice: "activity_due", range: "next_7_days" } as const;
    expect(decodeActivityFilter(encodeActivityFilter(filter))).toEqual(filter);
    const summaries = {
      synthetic: { kind: "meeting", activityId: "activity", date: null },
    } as const;
    expect(encodeActivitySummaries(summaries)).toEqual({
      synthetic: { kind: "meeting", activity_id: "activity", date: null },
    });
    expect(decodeActivitySummaries(encodeActivitySummaries(summaries))).toEqual(summaries);
  });
  it("carries restrictions and summaries through bulk, count and grouped routes", async () => {
    const records = createFixtureRecordService(
      {
        orgId: randomUUID(),
        orgSlug: "activity-wire",
        orgName: "Synthetic",
        userId: "user",
        role: "admin",
      },
      { now: () => new Date("2026-10-14T12:00:00Z") },
    );
    const lead = await records.create("Leads", {
      Last_Name: "Wire Activity",
      Company: "Wire Company",
    });
    const task = await records.create("Tasks", {
      Subject: "Wire Task",
      Due_Date: "2026-10-14",
      Who_Id: { module: "Leads", id: lead.id },
    });
    const deps = { records, members: async () => [] };
    const request = {
      params: { module: "Leads" },
      query: {
        cvid: "all-leads",
        per_page: "10",
        sort_by: "id",
        sort_order: "desc",
        group_by: "Lead_Status",
      },
      body: {
        activity_filter: { choice: "activity_due", range: "today" },
        include_activity_summary: true,
      },
    };
    const result = await operations.bulk.run(deps, request);
    expect(result).toMatchObject({
      status: 200,
      body: {
        activity_summaries: {
          [lead.id]: { kind: "task", activity_id: task.id, date: "2026-10-14" },
        },
      },
    });
    const count = await records.count("Leads", {
      viewId: "all-leads",
      activityFilter: { choice: "activity_due", range: "today" },
    });
    expect(await operations.count.run(deps, request)).toEqual({ status: 200, body: { count } });
    expect(await operations.summarize.run(deps, request)).toEqual({
      status: 200,
      body: {
        groups: await records.summarize("Leads", {
          viewId: "all-leads",
          groupBy: "Lead_Status",
          activityFilter: { choice: "activity_due", range: "today" },
        }),
      },
    });
    const empty = { ...request, body: { ...request.body, search: "No matching synthetic record" } };
    expect(await operations.bulk.run(deps, empty)).toMatchObject({
      status: 200,
      body: { data: [], activity_summaries: {} },
    });
    await expect(
      operations.bulk.run(deps, { ...request, body: { include_activity_summary: "true" } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
