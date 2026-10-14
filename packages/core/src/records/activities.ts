import { ValidationError } from "../errors";
import type {
  ActivityFilterValue,
  ActivityKind,
  ActivitySummary,
  ModuleApiName,
  RecordData,
} from "./contract";
import { isJsonArray } from "./json";

export const activityRules: Readonly<Record<string, { kind: ActivityKind; dateField: string }>> = {
  Tasks: { kind: "task", dateField: "Due_Date" },
  Events: { kind: "meeting", dateField: "Start_DateTime" },
  Calls: { kind: "call", dateField: "Call_Start_Time" },
};
export const activityParentModules = new Set(["Leads", "Contacts", "Accounts", "Deals"]);

/** Shared parent identity matching for activity reads and cascading deletion. */
export function activityParentIds(module: ModuleApiName, record: RecordData): string[] {
  if (!activityParentModules.has(module)) return [];
  const ids = new Set<string>();
  for (const field of ["Who_Id", "What_Id"]) {
    const ref = record.fields[field];
    if (
      ref &&
      typeof ref === "object" &&
      !isJsonArray(ref) &&
      ref.module === module &&
      typeof ref.id === "string"
    )
      ids.add(ref.id);
  }
  return [...ids];
}

export function activityState(
  module: ModuleApiName,
  record: RecordData,
  now: Date,
): "open" | "closed" {
  if (module === "Tasks") return record.fields.Status === "Completed" ? "closed" : "open";
  if (module === "Events") {
    const end = record.fields.End_DateTime;
    return typeof end === "string" && Date.parse(end) > now.getTime() ? "open" : "closed";
  }
  if (module === "Calls") {
    return ["Scheduled", "Overdue"].includes(String(record.fields.Outgoing_Call_Status ?? ""))
      ? "open"
      : "closed";
  }
  return "closed";
}
export function activityDate(module: ModuleApiName, record: RecordData): string | null {
  const rule = activityRules[module];
  const value = rule ? record.fields[rule.dateField] : null;
  return typeof value === "string" && value !== "" ? value : null;
}
export function validateActivityFilter(value: unknown): asserts value is ActivityFilterValue {
  const fail = (): never => {
    throw new ValidationError({ activityFilter: ["Choose a valid activity filter."] });
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const filter = value as Record<string, unknown>;
  if (filter.choice === "activity_due") {
    if (
      Object.keys(filter).length !== 2 ||
      typeof filter.range !== "string" ||
      !["today", "tomorrow", "next_7_days", "today_overdue"].includes(String(filter.range))
    )
      fail();
  } else if (
    Object.keys(filter).length !== 1 ||
    typeof filter.choice !== "string" ||
    !["without_open_activity", "overdue", "without_any_activity", "activity_done"].includes(
      String(filter.choice),
    )
  )
    fail();
}
export interface LinkedActivity extends ActivitySummary {
  state: "open" | "closed";
}
export function matchesActivityFilter(
  activities: readonly LinkedActivity[],
  filter: ActivityFilterValue,
  now: Date,
): boolean {
  if (filter.choice === "without_any_activity") return activities.length === 0;
  if (filter.choice === "without_open_activity")
    return !activities.some((activity) => activity.state === "open");
  if (filter.choice === "activity_done")
    return activities.some((activity) => activity.state === "closed");
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = 86_400_000;
  return activities.some((activity) => {
    if (activity.state !== "open" || activity.date === null) return false;
    const date = Date.parse(activity.date);
    if (filter.choice === "overdue") return date < today;
    if (filter.choice !== "activity_due") return false;
    switch (filter.range) {
      case "today":
        return date >= today && date < today + day;
      case "tomorrow":
        return date >= today + day && date < today + 2 * day;
      case "next_7_days":
        return date >= today + day && date < today + 8 * day;
      case "today_overdue":
        return date < today + day;
      default:
        return false;
    }
  });
}
export function selectActivitySummary(
  activities: readonly LinkedActivity[],
): ActivitySummary | undefined {
  const priority = { task: 0, meeting: 1, call: 2 };
  const time = (activity: LinkedActivity) =>
    activity.date === null ? Number.POSITIVE_INFINITY : Date.parse(activity.date);
  const selected = activities
    .filter((activity) => activity.state === "open")
    .sort((a, b) => {
      const left = time(a),
        right = time(b);
      return (left === right ? 0 : left < right ? -1 : 1) || priority[a.kind] - priority[b.kind];
    })[0];
  return selected
    ? { kind: selected.kind, activityId: selected.activityId, date: selected.date }
    : undefined;
}
