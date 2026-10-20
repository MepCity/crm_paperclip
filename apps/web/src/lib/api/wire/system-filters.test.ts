import { randomUUID } from "node:crypto";
import { ValidationError } from "@crm/core/errors";
import type { SystemFiltersValue } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { apiKeys } from "../client/query-keys";
import { decodeSystemFilters, encodeSystemFilters } from "./codec";
import { operations } from "./operations";

const period = { from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z" };
describe("system filter wire", () => {
  it("round trips every filter with snake_case fields", () => {
    const value: SystemFiltersValue = {
      locked: { locked: false },
      recordAction: { action: "updated", actorIds: ["user"], period },
      relatedRecordsAction: { module: "Notes", action: "added", actorIds: [], period },
      touched: { actorIds: ["user"], period },
      untouched: { period },
    };
    const wire = encodeSystemFilters(value);
    expect(wire).toMatchObject({
      record_action: { actor_ids: ["user"] },
      related_records_action: { actor_ids: [] },
    });
    expect(decodeSystemFilters(wire)).toEqual(value);
    expect(decodeSystemFilters({})).toEqual({});
  });
  it.each([
    null,
    [],
    { extra: {} },
    { recordAction: {} },
    { locked: { locked: true, extra: 1 } },
    { touched: { period, actorIds: [] } },
    { touched: { period, actor_ids: "user" } },
    { touched: { period: { ...period, extra: true } } },
    { locked: { locked: 1 } },
  ])("rejects unknown keys and wrong types: %j", (value) => {
    expect(() => decodeSystemFilters(value)).toThrow(ValidationError);
  });
  it("carries restrictions through list, count and summary", async () => {
    const records = createFixtureRecordService(
      {
        orgId: randomUUID(),
        orgSlug: "wire-system",
        orgName: "Synthetic",
        userId: "user",
        role: "admin",
      },
      { now: () => new Date(period.from) },
    );
    const lead = await records.create("Leads", { Last_Name: "Synthetic", Company: "Synthetic" });
    const deps = { records, members: async () => [] };
    const request = {
      params: { module: "Leads" },
      query: { cvid: "all-leads", per_page: "10", group_by: "Lead_Status" },
      body: { system_filters: { touched: { period } } },
    };
    expect(await operations.bulk.run(deps, request)).toMatchObject({
      status: 200,
      body: { data: [{ id: lead.id }] },
    });
    expect(await operations.count.run(deps, request)).toEqual({ status: 200, body: { count: 1 } });
    const summary = await operations.summarize.run(deps, request);
    expect(summary).toMatchObject({ status: 200 });
    expect(summary.body).toEqual({
      groups: await records.summarize("Leads", {
        viewId: "all-leads",
        groupBy: "Lead_Status",
        systemFilters: { touched: { period } },
      }),
    });
  });
  it("separates list, count and summary cache keys", () => {
    const a = { viewId: "all", page: 1, perPage: 10, groupBy: "Status" };
    const b = { ...a, systemFilters: { locked: { locked: true } } };
    expect(apiKeys.list("org", "Leads", a)).not.toEqual(apiKeys.list("org", "Leads", b));
    expect(apiKeys.count("org", "Leads", a)).not.toEqual(apiKeys.count("org", "Leads", b));
    expect(apiKeys.summarize("org", "Leads", a)).not.toEqual(apiKeys.summarize("org", "Leads", b));
  });
});
