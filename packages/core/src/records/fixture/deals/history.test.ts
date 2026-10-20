import { describe, expect, it } from "vitest";
import type { RecordData } from "../../contract";
import { calendarDays, historyMetadata, historyRow, historyViews } from "./history";

const deal: RecordData = {
  id: "d1",
  fields: {
    Stage: "Proposal/Price Quote",
    Amount: 1000,
    Probability: 50,
    Expected_Revenue: 500,
    Closing_Date: "2026-12-01",
    Modified_Time: "2026-10-01T10:00:00.000Z",
    Modified_By: { id: "u1", name: "Owner" },
    Unrelated: "x",
  },
};

describe("historyRow", () => {
  it("copies the stage history fields from the deal", () => {
    const row = historyRow(deal, "h1");
    expect(row.id).toBe("h1");
    expect(row.fields).toMatchObject({
      Stage: "Proposal/Price Quote",
      Amount: 1000,
      Probability: 50,
      Expected_Revenue: 500,
      Closing_Date: "2026-12-01",
      Modified_Time: "2026-10-01T10:00:00.000Z",
      Modified_By: { id: "u1", name: "Owner" },
    });
    expect(row.fields.Unrelated).toBeUndefined();
  });

  it("sets its own id and links back to the deal", () => {
    const row = historyRow(deal, "h1");
    expect(row.fields.id).toBe("h1");
    expect(row.fields.Potential_Name).toEqual({ module: "Deals", id: "d1" });
  });

  it("starts without a move target, duration or last activity", () => {
    const { fields } = historyRow(deal, "h1");
    expect(fields.Moved_To__s).toBeNull();
    expect(fields.Stage_Duration_Calendar_Days).toBeNull();
    expect(fields.Last_Activity_Time).toBeNull();
  });

  it("fills missing deal fields with null", () => {
    const { fields } = historyRow({ id: "d2", fields: {} }, "h2");
    expect(fields.Stage).toBeNull();
    expect(fields.Amount).toBeNull();
  });
});

describe("calendarDays", () => {
  it("is 0 on the same day regardless of time", () => {
    expect(calendarDays("2026-10-01T01:00:00Z", "2026-10-01T23:00:00Z")).toBe(0);
  });
  it("counts consecutive days", () => {
    expect(calendarDays("2026-10-01T23:59:00Z", "2026-10-02T00:01:00Z")).toBe(1);
    expect(calendarDays("2026-10-01", "2026-10-11")).toBe(10);
  });
  it("crosses month and year boundaries", () => {
    expect(calendarDays("2026-01-31", "2026-02-01")).toBe(1);
    expect(calendarDays("2026-12-31", "2027-01-01")).toBe(1);
    expect(calendarDays("2026-12-25", "2027-01-05")).toBe(11);
  });
  it("is negative for reversed order", () => {
    expect(calendarDays("2026-10-05", "2026-10-02")).toBe(-3);
  });
});

describe("history metadata and views", () => {
  it("describes the read-only Stage History module", () => {
    expect(historyMetadata.apiName).toBe("DealHistory");
    const names = historyMetadata.fields.map((f) => f.apiName);
    expect(names).toContain("Moved_To__s");
    expect(historyMetadata.layout[0]?.fields).toEqual(names);
    for (const f of historyMetadata.fields) {
      expect(f.views).toEqual({ view: true, create: false, edit: false, quickCreate: false });
    }
    expect(historyMetadata.fields.find((f) => f.apiName === "Stage")?.picklist).toBeDefined();
    expect(historyMetadata.fields.find((f) => f.apiName === "Potential_Name")?.lookup).toEqual({
      module: "Deals",
    });
  });

  it("has one default system view sorted by Modified_Time desc", () => {
    expect(historyViews).toHaveLength(1);
    const [view] = historyViews;
    expect(view).toMatchObject({
      systemDefined: true,
      isDefault: true,
      sort: { field: "Modified_Time", order: "desc" },
    });
    expect(view?.columns).toEqual(historyMetadata.fields.map((f) => f.apiName));
  });
});
