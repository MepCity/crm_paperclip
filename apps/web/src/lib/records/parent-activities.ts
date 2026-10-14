import type { Criteria, FieldValue, RecordData } from "@crm/core/records";

export type ActivityKind = "task" | "meeting" | "call";
export interface ParentActivityRow {
  id: string;
  subject: string;
  href: string;
  dateText: string | null;
  /** Raw ISO sort date (due date, start or call start); null when the activity has none. */
  date: string | null;
  ownerName: string | null;
  details: readonly { label: string; value: string }[];
}
export interface ParentActivityCategory {
  kind: ActivityKind;
  count: number;
  rows: readonly ParentActivityRow[];
}

export type ActivityVariant = "open" | "closed";

const KINDS: readonly ActivityKind[] = ["task", "meeting", "call"];

/** Leads and Contacts link through Who_Id; Accounts and Deals through What_Id. */
export function parentActivityCriteria(parentModule: string, parentId: string): Criteria | null {
  const field =
    parentModule === "Leads" || parentModule === "Contacts"
      ? "Who_Id"
      : parentModule === "Accounts" || parentModule === "Deals"
        ? "What_Id"
        : null;
  if (!field) return null;
  return {
    field,
    comparator: "equal",
    value: { module: parentModule, id: parentId },
  } as Criteria;
}

export interface BuildParentActivityCategoriesInput {
  records: Readonly<Record<ActivityKind, readonly RecordData[]>>;
  variant: ActivityVariant;
  now: Date;
  classify: (kind: ActivityKind, record: RecordData, now: Date) => ActivityVariant;
  recordPath: (kind: ActivityKind, id: string) => string;
  formatDate: (iso: string) => string;
  formatDateTime: (iso: string) => string;
  ownerName: (owner: FieldValue | undefined) => string | null;
  fieldLabel?: (kind: ActivityKind, apiName: string) => string;
}

function text(value: FieldValue | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name || null;
  }
  return null;
}

function sortDate(kind: ActivityKind, record: RecordData): string | null {
  const apiName =
    kind === "task" ? "Due_Date" : kind === "meeting" ? "Start_DateTime" : "Call_Start_Time";
  return text(record.fields[apiName]);
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function dateText(
  kind: ActivityKind,
  record: RecordData,
  input: BuildParentActivityCategoriesInput,
): string | null {
  const start = sortDate(kind, record);
  if (!start) return null;
  if (kind === "task") return input.formatDate(start);
  if (kind === "call") return input.formatDateTime(start);
  const end = text(record.fields.End_DateTime);
  if (record.fields.All_day === true) {
    const first = input.formatDate(start);
    if (!end || sameDay(start, end)) return first;
    return `${first} – ${input.formatDate(end)}`;
  }
  if (!end) return input.formatDateTime(start);
  if (sameDay(start, end)) {
    const startText = input.formatDateTime(start);
    const endText = input.formatDateTime(end);
    // Same day: the end side shows the time only (the part after the date).
    const endTime = endText.startsWith(input.formatDate(end))
      ? endText.slice(input.formatDate(end).length).trim()
      : endText;
    return `${startText} – ${endTime}`;
  }
  return `${input.formatDateTime(start)} – ${input.formatDateTime(end)}`;
}

function detailPairs(
  kind: ActivityKind,
  record: RecordData,
  variant: ActivityVariant,
  input: BuildParentActivityCategoriesInput,
): { label: string; value: string }[] {
  const label = (apiName: string) =>
    input.fieldLabel?.(kind, apiName) ?? apiName.replace(/_/g, " ");
  const pairs: [string, string | null][] = [];
  if (kind === "task") {
    if (variant === "open") {
      pairs.push([label("Status"), text(record.fields.Status)]);
      pairs.push([label("Priority"), text(record.fields.Priority)]);
    } else {
      const closed = text(record.fields.Closed_Time);
      pairs.push([label("Closed_Time"), closed ? input.formatDateTime(closed) : null]);
    }
  } else if (kind === "call") {
    pairs.push([label("Call_Type"), text(record.fields.Call_Type)]);
  }
  return pairs.flatMap(([l, v]) => (v ? [{ label: l, value: v }] : []));
}

export function buildParentActivityCategories(
  input: BuildParentActivityCategoriesInput,
): ParentActivityCategory[] {
  return KINDS.map((kind) => {
    const matching = (input.records[kind] ?? []).filter(
      (record) => input.classify(kind, record, input.now) === input.variant,
    );
    const dir = input.variant === "closed" ? -1 : 1;
    const sorted = matching
      .map((record, index) => ({ record, index, date: sortDate(kind, record) }))
      .sort((a, b) => {
        if (a.date === null && b.date === null) return a.index - b.index;
        if (a.date === null) return 1;
        if (b.date === null) return -1;
        const cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        return cmp * dir || a.index - b.index;
      });
    const subjectField = kind === "meeting" ? "Event_Title" : "Subject";
    const rows = sorted.map(
      ({ record }): ParentActivityRow => ({
        id: record.id,
        subject: text(record.fields[subjectField]) ?? "",
        href: input.recordPath(kind, record.id),
        dateText: dateText(kind, record, input),
        date: sortDate(kind, record),
        ownerName: input.ownerName(record.fields.Owner),
        details: detailPairs(kind, record, input.variant, input),
      }),
    );
    return { kind, count: rows.length, rows };
  });
}
