import type { RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  type ActivityKind,
  buildParentActivityCategories,
  parentActivityCriteria,
} from "./parent-activities";

const rec = (id: string, fields: RecordData["fields"]): RecordData =>
  ({ id, fields }) as RecordData;
const now = new Date("2026-01-10T00:00:00Z");
const classify = (_k: ActivityKind, r: RecordData) =>
  r.fields.__closed === true ? "closed" : "open";
const base = {
  now,
  classify,
  recordPath: (k: ActivityKind, id: string) => `/${k}/${id}`,
  formatDate: (iso: string) => iso.slice(0, 10),
  formatDateTime: (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`,
  ownerName: (v: unknown) => (v && typeof v === "object" && "name" in v ? String(v.name) : null),
  fieldLabel: (_k: ActivityKind, a: string) => `L:${a}`,
};
const empty = { task: [], meeting: [], call: [] };

describe("parentActivityCriteria", () => {
  it("uses Who_Id for Leads and Contacts", () => {
    for (const m of ["Leads", "Contacts"]) {
      expect(parentActivityCriteria(m, "7")).toEqual({
        field: "Who_Id",
        comparator: "equal",
        value: { module: m, id: "7" },
      });
    }
  });
  it("uses What_Id for Accounts and Deals", () => {
    for (const m of ["Accounts", "Deals"]) {
      expect(parentActivityCriteria(m, "7")).toEqual({
        field: "What_Id",
        comparator: "equal",
        value: { module: m, id: "7" },
      });
    }
  });
  it.each(["Campaigns", "Cases"])("preserves What_Id links for %s after integration", (module) => {
    expect(parentActivityCriteria(module, "7")).toEqual({
      field: "What_Id",
      comparator: "equal",
      value: { module, id: "7" },
    });
  });
  it("returns null elsewhere", () => {
    expect(parentActivityCriteria("Tasks", "1")).toBeNull();
  });
});

describe("buildParentActivityCategories", () => {
  it("returns three empty categories for empty input", () => {
    const out = buildParentActivityCategories({ ...base, records: empty, variant: "open" });
    expect(out.map((c) => [c.kind, c.count, c.rows.length])).toEqual([
      ["task", 0, 0],
      ["meeting", 0, 0],
      ["call", 0, 0],
    ]);
  });

  it("maps task fields, splits open/closed, skips empty pairs", () => {
    const records = {
      ...empty,
      task: [
        rec("1", {
          Subject: "A",
          Due_Date: "2026-02-01",
          Status: "Not Started",
          Priority: "",
          Owner: { name: "Ayşe" },
        }),
        rec("2", {
          Subject: "B",
          Due_Date: "2026-01-01",
          Status: "Completed",
          Closed_Time: "2026-01-02T10:00:00Z",
          __closed: true,
        }),
      ],
    };
    const open = buildParentActivityCategories({ ...base, records, variant: "open" })[0];
    expect(open?.count).toBe(1);
    expect(open?.rows[0]).toEqual({
      id: "1",
      subject: "A",
      href: "/task/1",
      dateText: "2026-02-01",
      date: "2026-02-01",
      ownerName: "Ayşe",
      details: [{ label: "L:Status", value: "Not Started" }],
    });
    const closed = buildParentActivityCategories({ ...base, records, variant: "closed" })[0];
    expect(closed?.rows[0]?.details).toEqual([
      { label: "L:Closed_Time", value: "2026-01-02 10:00" },
    ]);
    expect(closed?.rows[0]?.ownerName).toBeNull();
  });

  it("sorts ascending (open) / descending (closed) with empty dates last", () => {
    const task = [
      rec("a", { Subject: "a" }),
      rec("b", { Subject: "b", Due_Date: "2026-03-01" }),
      rec("c", { Subject: "c", Due_Date: "2026-01-01" }),
    ];
    const ids = (v: "open" | "closed") =>
      buildParentActivityCategories({
        ...base,
        classify: () => v,
        records: { ...empty, task },
        variant: v,
      })[0]?.rows.map((r) => r.id);
    expect(ids("open")).toEqual(["c", "b", "a"]);
    expect(ids("closed")).toEqual(["b", "c", "a"]);
  });

  it("maps meeting title and ranges", () => {
    const meeting = [
      rec("m1", {
        Event_Title: "Sync",
        Start_DateTime: "2026-01-31T09:00:00Z",
        End_DateTime: "2026-01-31T10:00:00Z",
      }),
      rec("m2", {
        Event_Title: "Trip",
        Start_DateTime: "2026-02-01T00:00:00Z",
        End_DateTime: "2026-02-03T00:00:00Z",
        All_day: true,
      }),
      rec("m3", {
        Event_Title: "Day",
        Start_DateTime: "2026-02-05T00:00:00Z",
        End_DateTime: "2026-02-05T23:59:00Z",
        All_day: true,
      }),
      rec("m4", {
        Event_Title: "Long",
        Start_DateTime: "2026-02-06T09:00:00Z",
        End_DateTime: "2026-02-07T10:00:00Z",
      }),
    ];
    const rows =
      buildParentActivityCategories({
        ...base,
        records: { ...empty, meeting },
        variant: "open",
      })[1]?.rows ?? [];
    expect(rows.map((r) => [r.subject, r.dateText])).toEqual([
      ["Sync", "2026-01-31 09:00 – 10:00"],
      ["Trip", "2026-02-01 – 2026-02-03"],
      ["Day", "2026-02-05"],
      ["Long", "2026-02-06 09:00 – 2026-02-07 10:00"],
    ]);
    expect(rows[0]?.details).toEqual([]);
  });

  it("maps call fields", () => {
    const call = [
      rec("c1", {
        Subject: "Ring",
        Call_Start_Time: "2026-02-01T09:30:00Z",
        Call_Type: "Outbound",
      }),
    ];
    const row = buildParentActivityCategories({
      ...base,
      records: { ...empty, call },
      variant: "open",
    })[2]?.rows[0];
    expect(row).toMatchObject({ subject: "Ring", dateText: "2026-02-01 09:30", href: "/call/c1" });
    expect(row?.details).toEqual([{ label: "L:Call_Type", value: "Outbound" }]);
  });

  it("defaults label names by replacing underscores with spaces when fieldLabel is omitted", () => {
    const records = {
      ...empty,
      task: [
        rec("1", {
          Subject: "A",
          Status: "Open",
          Priority: "High",
        }),
        rec("2", {
          Subject: "B",
          Closed_Time: "2026-01-02T10:00:00Z",
          __closed: true,
        }),
      ],
      call: [
        rec("c1", {
          Subject: "C",
          Call_Type: "Inbound",
        }),
      ],
    };
    const { fieldLabel: _f, ...noLabelBase } = base;
    const openTask = buildParentActivityCategories({
      ...noLabelBase,
      records,
      variant: "open",
    })[0]?.rows[0];
    expect(openTask?.details).toEqual([
      { label: "Status", value: "Open" },
      { label: "Priority", value: "High" },
    ]);

    const closedTask = buildParentActivityCategories({
      ...noLabelBase,
      records,
      variant: "closed",
    })[0]?.rows[0];
    expect(closedTask?.details).toEqual([{ label: "Closed Time", value: "2026-01-02 10:00" }]);

    const callRow = buildParentActivityCategories({
      ...noLabelBase,
      records,
      variant: "open",
    })[2]?.rows[0];
    expect(callRow?.details).toEqual([{ label: "Call Type", value: "Inbound" }]);
  });

  it("handles missing end dates and empty start dates", () => {
    const meeting = [
      rec("m_no_end", {
        Event_Title: "No End",
        Start_DateTime: "2026-02-01T10:00:00Z",
      }),
      rec("m_allday_no_end", {
        Event_Title: "All Day No End",
        Start_DateTime: "2026-02-02T00:00:00Z",
        All_day: true,
      }),
      rec("m_no_start", {
        Event_Title: "No Start",
      }),
    ];
    const rows =
      buildParentActivityCategories({
        ...base,
        records: { ...empty, meeting },
        variant: "open",
      })[1]?.rows ?? [];
    expect(rows.map((r) => [r.subject, r.dateText])).toEqual([
      ["No End", "2026-02-01 10:00"],
      ["All Day No End", "2026-02-02"],
      ["No Start", null],
    ]);
  });
});
