import { randomUUID } from "node:crypto";
import type { RecordInput } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { EMAIL_REPORT_HEADINGS } from "./fixture-port";
import { createRecordReportsPort, MEETING_REPORT_HEADINGS, REPORT_CONFIGS } from "./record-port";

function setup(timeZone = "Europe/Istanbul", instant = "2026-03-15T12:00:00Z") {
  let clock = new Date(instant);
  const readable = new Set<string>();
  const ctx = {
    orgId: randomUUID(),
    orgSlug: "reports-test",
    orgName: "Reports test",
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
  const port = createRecordReportsPort(scoped, {
    now: () => new Date(instant),
    format: { locale: "en-US", timeZone },
    ownerNames: new Map([
      ["rep-one", "First Rep"],
      ["rep-two", "Second Rep"],
    ]),
  });

  async function create(module: string, input: RecordInput, at = instant, visible = true) {
    clock = new Date(at);
    const record = await service.create(module, input);
    if (visible) readable.add(record.id);
    return record;
  }

  const campaign = (input: RecordInput = {}, visible = true) =>
    create(
      "Campaigns",
      {
        Campaign_Name: "Sample Campaign",
        Num_sent: "100",
        Expected_Response: "5",
        Budgeted_Cost: 50,
        Actual_Cost: 2,
        ...input,
      },
      instant,
      visible,
    );

  const meeting = (input: RecordInput = {}, visible = true) =>
    create(
      "Events",
      {
        Event_Title: "Quarterly Review",
        Meeting_Venue__s: "In-office",
        Owner: "rep-one",
        Start_DateTime: "2026-03-15T14:00:00Z",
        End_DateTime: "2026-03-15T15:00:00Z",
        Venue: "Conference Room A",
        ...input,
      },
      instant,
      visible,
    );

  return { service, scoped, port, create, campaign, meeting };
}

describe("record-backed ReportsPort", () => {
  it("exposes all 13 report definitions with matching metadata", async () => {
    const { port } = setup();
    const reports = await port.listReports();
    expect(reports).toHaveLength(13);
    expect(reports.map((r) => r.id)).toEqual(REPORT_CONFIGS.map((r) => r.id));
    expect(reports[0]?.name).toBe("Weekly outreach overview");
    expect(reports[0]?.folder).toBe("Outreach Reports");
    expect(reports[2]?.lastAccessedDate).toBe("2026-10-01");
    expect(reports[12]?.createdBy).toBe("Demo Analyst");
    expect(reports[12]?.description).toBeNull();
  });

  it("returns null for unknown report id", async () => {
    const { port } = setup();
    expect(await port.getReport("non-existent")).toBeNull();
  });

  it("handles empty module returning preserved headings and empty rows", async () => {
    const { port } = setup();
    const outreach = await port.getReport("sample-report-1");
    expect(outreach).not.toBeNull();
    expect(outreach?.headings).toEqual([...EMAIL_REPORT_HEADINGS]);
    expect(outreach?.rows).toEqual([]);

    const meetings = await port.getReport("sample-report-8");
    expect(meetings).not.toBeNull();
    expect(meetings?.headings).toEqual([...MEETING_REPORT_HEADINGS]);
    expect(meetings?.rows).toEqual([]);
  });

  it("enforces tenant and permission scoping so unreadable records never appear", async () => {
    const { campaign, meeting, port } = setup();
    await campaign({ Campaign_Name: "Visible Campaign" }, true);
    await campaign({ Campaign_Name: "Hidden Campaign" }, false);
    await meeting({ Event_Title: "Visible Meeting" }, true);
    await meeting({ Event_Title: "Hidden Meeting" }, false);

    const outreach = await port.getReport("sample-report-1");
    expect(outreach?.rows).toHaveLength(1);
    expect(outreach?.rows[0]?.[0]).toBe("Visible Campaign");

    const meetings = await port.getReport("sample-report-8");
    expect(meetings?.rows).toHaveLength(1);
    expect(meetings?.rows[0]?.[0]).toBe("Visible Meeting");
  });

  it("pages over more than 100 records and aggregates all into report rows", async () => {
    const { campaign, port } = setup();
    for (let i = 1; i <= 105; i++) {
      await campaign({ Campaign_Name: `Campaign ${i}`, Num_sent: String(i) }, true);
    }
    const report = await port.getReport("sample-report-1");
    expect(report?.rows).toHaveLength(105);
    expect(report?.rows.map((row) => row[0])).toContain("Campaign 1");
    expect(report?.rows.map((row) => row[0])).toContain("Campaign 105");
  });

  it("formats dates, numbers, lookups and handles missing values using FormatOptions", async () => {
    const { meeting, scoped } = setup("UTC", "2026-03-15T12:00:00Z");
    const port = createRecordReportsPort(scoped, {
      now: () => new Date("2026-03-15T12:00:00Z"),
      format: {
        locale: "de-DE",
        timeZone: "UTC",
        datePattern: "dd.MM.yyyy",
      },
      ownerNames: new Map([["rep-one", "Max Mustermann"]]),
    });

    await meeting({
      Event_Title: "Berlin Sync",
      Owner: "rep-one",
      Start_DateTime: "2026-03-15T14:30:00Z",
      End_DateTime: "2026-03-15T15:45:00Z",
      Venue: null,
    });

    const report = await port.getReport("sample-report-8");
    expect(report?.rows).toHaveLength(1);
    const row = report?.rows[0];
    expect(row?.[0]).toBe("Berlin Sync");
    expect(row?.[1]).toBe("Max Mustermann");
    expect(row?.[2]).toContain("15.03.2026");
    expect(row?.[3]).toContain("15.03.2026");
    expect(row?.[4]).toBe("In-office");
  });

  it("filters criteria for upcoming and completed meetings", async () => {
    const { meeting, port } = setup("Europe/Istanbul", "2026-03-15T12:00:00Z");
    // Completed meeting
    await meeting({
      Event_Title: "Past Meeting",
      Start_DateTime: "2026-03-10T10:00:00Z",
      End_DateTime: "2026-03-10T11:00:00Z",
    });
    // Upcoming meeting
    await meeting({
      Event_Title: "Future Meeting",
      Start_DateTime: "2026-03-20T10:00:00Z",
      End_DateTime: "2026-03-20T11:00:00Z",
    });

    const upcoming = await port.getReport("sample-report-9");
    expect(upcoming?.rows).toHaveLength(1);
    expect(upcoming?.rows[0]?.[0]).toBe("Future Meeting");

    const completed = await port.getReport("sample-report-11");
    expect(completed?.rows).toHaveLength(1);
    expect(completed?.rows[0]?.[0]).toBe("Past Meeting");
  });

  it("filters criteria for lead and account meetings", async () => {
    const { create, meeting, port } = setup();
    const lead = await create("Leads", { Last_Name: "Test Lead", Company: "Test Co" });
    const account = await create("Accounts", { Account_Name: "Test Account" });

    await meeting({
      Event_Title: "Lead Meeting",
      Who_Id: { module: "Leads", id: lead.id },
    });
    await meeting({
      Event_Title: "Account Meeting",
      What_Id: { module: "Accounts", id: account.id },
    });

    const leadReport = await port.getReport("sample-report-12");
    expect(leadReport?.rows).toHaveLength(1);
    expect(leadReport?.rows[0]?.[0]).toBe("Lead Meeting");

    const accountReport = await port.getReport("sample-report-13");
    expect(accountReport?.rows).toHaveLength(1);
    expect(accountReport?.rows[0]?.[0]).toBe("Account Meeting");
  });
});
