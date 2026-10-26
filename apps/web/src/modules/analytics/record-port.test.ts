import { randomUUID } from "node:crypto";
import type { RecordInput } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it, vi } from "vitest";
import { createRecordAnalyticsPort } from "./record-port";

function setup(timeZone = "Europe/Istanbul", instant = "2026-03-15T12:00:00Z") {
  let clock = new Date(instant);
  const readable = new Set<string>();
  const ctx = {
    orgId: randomUUID(),
    orgSlug: "analytics-test",
    orgName: "Analytics test",
    userId: "rep-one",
    role: "admin" as const,
  };
  const service = createFixtureRecordService(ctx, {
    now: () => clock,
    listMemberIds: async () => ["rep-one", "rep-two"],
  });
  const scoped = createFixtureRecordService(ctx, {
    canReadRecord: (_module, id) => readable.has(id),
  });
  const port = createRecordAnalyticsPort(scoped, {
    now: () => new Date(instant),
    format: { locale: "en-US", timeZone },
    ownerNames: new Map([
      ["rep-one", "First Rep"],
      ["rep-two", "Second Rep"],
    ]),
  });
  async function create(module: string, input: RecordInput, at = instant, visible = true) {
    clock = new Date(at);
    const record = await service.create(
      module,
      module === "Leads" ? { Company: "Analytics example", ...input } : input,
    );
    if (visible) readable.add(record.id);
    return record;
  }
  const deal = (input: RecordInput = {}, visible = true) =>
    create(
      "Deals",
      {
        Deal_Name: "Analytics deal",
        Account_Name: { module: "Accounts", id: "500000000000000000" },
        Stage: "Closed Won",
        Closing_Date: "2026-03-01",
        Amount: 100,
        ...input,
      },
      instant,
      visible,
    );
  return { service, scoped, port, create, deal };
}

describe("record-backed Analytics", () => {
  it("returns empty cards without readable matching records and never invents targets", async () => {
    const { port } = setup();
    const data = await port.getDashboard();
    for (const [key, value] of Object.entries(data)) {
      if (key !== "overviewTitle" && key !== "scopeLabel")
        expect(value).toEqual({ state: "empty" });
    }
  });

  it("uses local calendar month boundaries, including the previous month across a year", async () => {
    const { create, port } = setup("Europe/Istanbul", "2026-01-15T12:00:00Z");
    await create("Leads", { Last_Name: "Previous" }, "2025-12-31T20:59:59Z");
    await create("Leads", { Last_Name: "First" }, "2025-12-31T21:00:00Z");
    await create("Leads", { Last_Name: "Last" }, "2026-01-31T20:59:59Z");
    await create("Leads", { Last_Name: "Next" }, "2026-01-31T21:00:00Z");
    await create("Accounts", { Account_Name: "Previous" }, "2025-12-31T20:59:59Z");
    await create("Accounts", { Account_Name: "First" }, "2025-12-31T21:00:00Z");
    await create("Accounts", { Account_Name: "Second" }, "2026-01-02T00:00:00Z");
    const data = await port.getDashboard();
    expect(data.leadsThisMonth).toEqual({ state: "value", value: 2 });
    expect(data.accountsThisMonth).toEqual({
      state: "value",
      value: 2,
      previousPeriodValue: 1,
      changePercentage: "100%",
      previousPeriodLabel: "Last Month Relative:",
    });
  });

  it("handles DST month boundaries using the configured org zone", async () => {
    const { create, port } = setup("America/New_York");
    for (const at of [
      "2026-03-01T04:59:59Z",
      "2026-03-01T05:00:00Z",
      "2026-04-01T03:59:59Z",
      "2026-04-01T04:00:00Z",
    ]) {
      await create("Leads", { Last_Name: "Boundary" }, at);
    }
    expect((await port.getDashboard()).leadsThisMonth.value).toBe(2);
  });

  it("groups readable leads, ranks owners and excludes all closed-lost stage variants", async () => {
    const { create, deal, port } = setup();
    await create("Leads", { Last_Name: "One", Lead_Source: "Advertisement" });
    await create("Leads", { Last_Name: "Two", Lead_Source: "Advertisement" });
    await create("Leads", { Last_Name: "Three" });
    await create("Leads", { Last_Name: "Hidden", Lead_Source: "Cold Call" }, undefined, false);
    await deal({ Amount: 0.1 });
    await deal({ Amount: 0.2 });
    await deal({ Owner: "rep-two", Amount: 200 });
    await deal({ Stage: "Qualification" });
    await deal({ Stage: "Closed Lost" });
    await deal({ Stage: "Closed Lost to Competition" });
    await deal({ Closing_Date: "2026-02-28", Amount: 10000 });
    await deal({ Closing_Date: "2026-04-01", Amount: 10000 });
    await deal({ Amount: 10000 }, false);
    const data = await port.getDashboard();
    expect(data.leadsThisMonth.value).toBe(3);
    expect(data.dealsInPipeline.value).toBe(1);
    expect(data.revenueThisMonth).toMatchObject({ state: "value", value: 200.3 });
    expect(data.revenueThisMonth.formatted).toContain("200.30");
    expect(data.leadsBySource.sources).toEqual([
      { label: "Advertisement", count: 2, percentage: (2 / 3) * 100, color: "#1f6be8" },
      { label: "Not Specified", count: 1, percentage: (1 / 3) * 100, color: "#10b981" },
    ]);
    expect(data.prolificReps.reps).toEqual([
      { rank: 1, name: "Second Rep", amount: expect.stringContaining("200.00") },
      { rank: 2, name: "First Rep", amount: expect.stringContaining("0.30") },
    ]);
    expect(data.leadTarget.state).toBe("empty");
    expect(data.revenueTarget.state).toBe("empty");
    expect(data.performanceMonitor.state).toBe("empty");
  });

  it("reports negative account change and leaves a zero baseline percentage undefined", async () => {
    const { create, port } = setup();
    await create("Accounts", { Account_Name: "Current" });
    await create("Accounts", { Account_Name: "Hidden current" }, undefined, false);
    await create("Accounts", { Account_Name: "Hidden previous" }, "2026-02-01T12:00:00Z", false);
    expect((await port.getDashboard()).accountsThisMonth).toEqual({
      state: "value",
      value: 1,
      previousPeriodValue: 0,
      previousPeriodLabel: "Last Month Relative:",
    });
    for (let i = 0; i < 3; i++)
      await create("Accounts", { Account_Name: `Previous ${i}` }, "2026-02-01T12:00:00Z");
    expect((await port.getDashboard()).accountsThisMonth.changePercentage).toBe("-66.7%");
  });

  it("includes records after the first list page and re-reads on refresh", async () => {
    const { service } = setup();
    const list = vi.spyOn(service, "list");
    const port = createRecordAnalyticsPort(service);
    const first = await port.getDashboard();
    const metadata = await service.getModule("Deals");
    const openStages = metadata.fields
      .find((field) => field.apiName === "Stage")
      ?.picklist?.filter((option) => option.stage?.category === "Open")
      .map((option) => option.storedValue);
    const allDeals = (
      await Promise.all(
        [1, 2, 3].map((page) =>
          service.list("Deals", {
            viewId: "all-deals",
            page,
            perPage: 100,
          }),
        ),
      )
    ).flatMap((result) => result.records);
    expect(allDeals.some((row) => row.fields.Locked__s === true)).toBe(true);
    expect(first.dealsInPipeline.value).toBe(
      allDeals.filter((row) => openStages?.includes(String(row.fields.Stage))).length,
    );
    expect(list.mock.calls.some(([module, query]) => module === "Deals" && query.page === 2)).toBe(
      true,
    );
    await service.create("Deals", {
      Deal_Name: "New pipeline",
      Stage: "Qualification",
      Closing_Date: "2026-03-01",
      Account_Name: { module: "Accounts", id: "500000000000000000" },
    });
    expect((await port.getDashboard()).dealsInPipeline.value).toBe(
      (first.dealsInPipeline.value ?? 0) + 1,
    );
  });
});
