import { ValidationError } from "../errors";
import type { RecordData, SystemFiltersValue } from "./contract";
import type { HistoryEventKind, RecordHistoryEvent } from "./history";

export interface SystemFilterContext {
  module: string;
  memberIds: readonly string[];
  relatedModules: readonly string[];
}
const keys = ["locked", "recordAction", "relatedRecordsAction", "touched", "untouched"];
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
function isInstant(value: unknown): value is string {
  if (typeof value !== "string" || !iso.test(value) || !Number.isFinite(Date.parse(value)))
    return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return month >= 1 && month <= 12 && day >= 1 && day <= days && Number(value.slice(11, 13)) < 24;
}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function validateSystemFilters(
  value: unknown,
  context?: SystemFilterContext,
): asserts value is SystemFiltersValue {
  const fail = (key: string): never => {
    throw new ValidationError({ [`systemFilters.${key}`]: ["Choose a valid system filter."] });
  };
  if (!object(value)) fail("filters");
  for (const [key, filter] of Object.entries(value as Record<string, unknown>)) {
    if (!keys.includes(key) || !object(filter)) fail(key);
    const entry = filter as Record<string, unknown>;
    const allowed =
      key === "locked"
        ? ["locked"]
        : [
            "actorIds",
            "period",
            ...(key === "recordAction" ? ["action"] : []),
            ...(key === "relatedRecordsAction" ? ["action", "module"] : []),
          ];
    if (Object.keys(entry).some((name) => !allowed.includes(name))) fail(key);
    if (key === "locked") {
      if (typeof entry.locked !== "boolean") fail(key);
      continue;
    }
    if (
      key === "recordAction" &&
      (!["created", "updated", "converted", "merged"].includes(String(entry.action)) ||
        typeof entry.action !== "string" ||
        (entry.action === "converted" && context && context.module !== "Leads"))
    )
      fail(key);
    if (
      key === "relatedRecordsAction" &&
      (typeof entry.action !== "string" ||
        !["added", "updated", "deleted"].includes(entry.action) ||
        typeof entry.module !== "string" ||
        !["Notes", "Attachments", "Tasks", "Events", "Calls"].includes(entry.module) ||
        (context && !context.relatedModules.includes(entry.module)))
    )
      fail(key);
    if (
      entry.actorIds !== undefined &&
      (!Array.isArray(entry.actorIds) ||
        entry.actorIds.length > 25 ||
        entry.actorIds.some(
          (id) => typeof id !== "string" || !id || (context && !context.memberIds.includes(id)),
        ))
    )
      fail(key);
    if (!object(entry.period)) fail(key);
    const period = entry.period as Record<string, unknown>;
    if (Object.keys(period).some((name) => !["from", "to"].includes(name))) fail(key);
    for (const bound of [period.from, period.to]) {
      if (!isInstant(bound)) fail(key);
    }
    const length = Date.parse(String(period.to)) - Date.parse(String(period.from));
    if (length <= 0 || length > 366 * 86_400_000) fail(key);
  }
}
const directKinds: Record<string, HistoryEventKind> = {
  created: "record_created",
  updated: "fields_updated",
  converted: "record_converted",
  merged: "records_merged",
};
const relatedKinds: Record<string, readonly HistoryEventKind[]> = {
  added: ["note_added", "attachment_added", "record_created", "related_record_added"],
  updated: ["fields_updated"],
  deleted: ["attachment_deleted", "record_deleted", "related_record_removed"],
};

/** Events supplied here must come exclusively from the caller's tenant store. */
export function matchesSystemFilters(
  module: string,
  record: RecordData,
  filters: SystemFiltersValue,
  events: readonly RecordHistoryEvent[],
): boolean {
  if (filters.locked && (record.fields.Locked__s === true) !== filters.locked.locked) return false;
  const stream = events.filter(
    (event) => event.stream.module === module && event.stream.recordId === record.id,
  );
  const inScope = (event: RecordHistoryEvent, filter: NonNullable<SystemFiltersValue["touched"]>) =>
    Date.parse(event.occurredAt) >= Date.parse(filter.period.from) &&
    Date.parse(event.occurredAt) < Date.parse(filter.period.to) &&
    (!filter.actorIds?.length || filter.actorIds.includes(event.actor.id));
  const direct = (event: RecordHistoryEvent) =>
    event.subject.module === module && event.subject.recordId === record.id;
  const { recordAction, relatedRecordsAction, touched, untouched } = filters;
  if (
    recordAction &&
    !stream.some(
      (event) =>
        direct(event) &&
        event.kind === directKinds[recordAction.action] &&
        inScope(event, recordAction),
    )
  )
    return false;
  if (
    relatedRecordsAction &&
    !stream.some(
      (event) =>
        !direct(event) &&
        event.subject.module === relatedRecordsAction.module &&
        relatedKinds[relatedRecordsAction.action]?.includes(event.kind) &&
        inScope(event, relatedRecordsAction),
    )
  )
    return false;
  if (touched && !stream.some((event) => inScope(event, touched))) return false;
  if (untouched && stream.some((event) => inScope(event, untouched))) return false;
  return true;
}
