/**
 * HD13 Open Activities preview (research/specs/home-workqueue.md, R2, slice H-F2). Documented
 * fields and the four documented Home periods only; Appointments are excluded. Rows are synthetic.
 * Home periods are kept separate from any Workqueue option list.
 */
export type HomePeriod = "today" | "this-week" | "next-week" | "next-7-days";
export type ActivityType = "Tasks" | "Meetings" | "Calls";

export const homePeriods: readonly { id: HomePeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this-week", label: "This Week" },
  { id: "next-week", label: "Next Week" },
  { id: "next-7-days", label: "Next 7 Days" },
];

export const activityFields: Record<ActivityType, readonly string[]> = {
  Tasks: ["Due Date", "Subject", "Related To", "Contact Name"],
  Meetings: ["Title", "From", "To", "Related To", "Contact Name"],
  Calls: ["Subject", "Related To", "Call Start time"],
};

export type ActivityRow = {
  id: string;
  type: ActivityType;
  /** ISO instant used for period filtering (the due date / meeting start / call start). */
  at: string;
  /** Display cells in the order of `activityFields[type]`. */
  cells: readonly string[];
};

export const activityRows: readonly ActivityRow[] = [
  {
    id: "t1",
    type: "Tasks",
    at: "2026-10-21T10:00:00Z",
    cells: ["Oct 21, 2026", "Send revised proposal", "Acme Deal", "Ada Lovelace"],
  },
  {
    id: "t2",
    type: "Tasks",
    at: "2026-10-24T10:00:00Z",
    cells: ["Oct 24, 2026", "Schedule onboarding call", "Globex Deal", "Alan Turing"],
  },
  {
    id: "t3",
    type: "Tasks",
    at: "2026-10-29T10:00:00Z",
    cells: ["Oct 29, 2026", "Review contract draft", "Acme Deal", "Ada Lovelace"],
  },
  {
    id: "m1",
    type: "Meetings",
    at: "2026-10-24T14:00:00Z",
    cells: ["Kickoff", "Oct 24, 14:00", "Oct 24, 15:00", "Acme Deal", "Ada Lovelace"],
  },
  {
    id: "m2",
    type: "Meetings",
    at: "2026-10-28T09:00:00Z",
    cells: ["Quarterly review", "Oct 28, 09:00", "Oct 28, 10:00", "Globex Deal", "Alan Turing"],
  },
  {
    id: "c1",
    type: "Calls",
    at: "2026-10-24T11:00:00Z",
    cells: ["Follow-up call", "Acme Deal", "Oct 24, 11:00"],
  },
  {
    id: "c2",
    type: "Calls",
    at: "2026-11-02T11:00:00Z",
    cells: ["Renewal call", "Globex Deal", "Nov 2, 11:00"],
  },
];

/** Fixed clock for the preview so today/overdue are deterministic (tests use the same value). */
export const fixtureNow = "2026-10-24T08:00:00Z";
export const fixtureTimeZone = "UTC";

function dayStart(now: Date, tz: string): number {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Date.parse(`${p}T00:00:00Z`);
}

const DAY = 86_400_000;

/** Week starts on Monday. Returns [start, end) in day-start ms (tz-local days as UTC midnights). */
export function periodRange(period: HomePeriod, now: Date, tz: string): [number, number] {
  const today = dayStart(now, tz);
  const dow = (new Date(today).getUTCDay() + 6) % 7;
  const weekStart = today - dow * DAY;
  switch (period) {
    case "today":
      return [today, today + DAY];
    case "this-week":
      return [weekStart, weekStart + 7 * DAY];
    case "next-week":
      return [weekStart + 7 * DAY, weekStart + 14 * DAY];
    case "next-7-days":
      return [today, today + 7 * DAY];
  }
}

export function isOverdue(at: string, now: Date, tz: string): boolean {
  return dayStart(new Date(at), tz) < dayStart(now, tz);
}

export function filterActivities(
  rows: readonly ActivityRow[],
  period: HomePeriod,
  now: Date,
  tz: string,
): { overdue: ActivityRow[]; inPeriod: ActivityRow[] } {
  const [start, end] = periodRange(period, now, tz);
  const overdue: ActivityRow[] = [];
  const inPeriod: ActivityRow[] = [];
  for (const r of rows) {
    const d = dayStart(new Date(r.at), tz);
    if (isOverdue(r.at, now, tz)) overdue.push(r);
    else if (d >= start && d < end) inPeriod.push(r);
  }
  return { overdue, inPeriod };
}
