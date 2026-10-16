import type {
  FieldDataType,
  HistoryEventKind,
  HistoryRef,
  JsonObject,
  RecordHistoryEvent,
  RecordHistoryPage,
} from "@crm/core/records";
import { invalid, object } from "./codec";

export type HistorySource = "manual" | "api" | "import";

export interface TimelineQuery {
  perPage: number;
  pageToken: string | null;
  modules?: string[];
  actorId?: string | null;
  from?: string | null;
  to?: string | null;
  sources?: HistorySource[];
}

export type TimelineTimePreset = "any" | "today" | "yesterday" | "last7" | "last30";

export interface TimelineSelection {
  modules: string[];
  userId: string | null;
  time: TimelineTimePreset;
  sources: HistorySource[];
}

const WIRE_TO_SOURCE: Record<string, HistorySource> = {
  crm_ui: "manual",
  crm_api: "api",
  import: "import",
};
const SOURCE_TO_WIRE: Record<HistorySource, string> = {
  manual: "crm_ui",
  api: "crm_api",
  import: "import",
};
const DEFAULT_PER_PAGE = 25;
const MAX_PER_PAGE = 200;
const OFFSET_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

function stringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || value.length === 0) return invalid(key);
  for (const item of value) if (typeof item !== "string" || item === "") invalid(key);
  return value as string[];
}

function timestamp(value: unknown, key: string): string {
  if (typeof value !== "string" || !OFFSET_ISO.test(value) || Number.isNaN(Date.parse(value)))
    return invalid(key, "Expected an ISO-8601 timestamp with offset.");
  return value;
}

function readLeaves(raw: unknown): Record<string, unknown>[] {
  const node = object(raw, "filters");
  if (node.group_operator === undefined && node.group === undefined) return [node];
  if (node.group_operator !== "AND" || !Array.isArray(node.group) || node.group.length === 0)
    return invalid("filters", "Only AND groups of leaves are supported.");
  const leaves = node.group.map((leaf) => object(leaf, "filters"));
  for (const leaf of leaves)
    if (leaf.group_operator !== undefined || leaf.group !== undefined)
      invalid("filters", "Nested groups are not supported.");
  return leaves;
}

function applyLeaf(query: TimelineQuery, leaf: Record<string, unknown>, seen: Set<string>) {
  const field = object(leaf.field, "filters");
  const name = field.api_name;
  if (typeof name !== "string") return invalid("filters");
  if (seen.has(name)) invalid("filters", "Duplicate filter field.");
  seen.add(name);
  const { comparator, value } = leaf;
  switch (name) {
    case "record.module.api_name": {
      if (comparator !== "in") invalid(name, "Unsupported comparator.");
      const modules = stringArray(value, name);
      if (modules.includes("Meetings"))
        invalid(name, "Wire module Meetings is not valid — modules are API names (Events).");
      query.modules = modules;
      return;
    }
    case "done_by.id": {
      if (comparator === "equal") {
        if (typeof value !== "string" || value === "") invalid(name);
        query.actorId = value as string;
      } else if (comparator === "in") {
        const ids = stringArray(value, name);
        if (ids.length !== 1) invalid(name, "Only a single user is supported.");
        query.actorId = ids[0] as string;
      } else invalid(name, "Unsupported comparator.");
      return;
    }
    case "audited_time": {
      if (comparator !== "between" || !Array.isArray(value) || value.length !== 2)
        return invalid(name, "Expected between with two timestamps.");
      const from = timestamp(value[0], name);
      const to = timestamp(value[1], name);
      if (Date.parse(from) >= Date.parse(to)) invalid(name, "Start must be before end.");
      query.from = from;
      query.to = to;
      return;
    }
    case "source": {
      if (comparator !== "in") invalid(name, "Unsupported comparator.");
      query.sources = stringArray(value, name).map((item) => {
        const mapped = WIRE_TO_SOURCE[item];
        if (!mapped) invalid(name, "Unknown source.");
        return mapped as HistorySource;
      });
      return;
    }
    default:
      invalid("filters", "Unknown filter field.");
  }
}

export function decodeTimelineQuery(params: URLSearchParams): TimelineQuery {
  let perPage = DEFAULT_PER_PAGE;
  const rawPerPage = params.get("per_page");
  if (rawPerPage !== null) {
    if (!/^\d+$/.test(rawPerPage)) invalid("per_page");
    perPage = Number(rawPerPage);
    if (perPage < 1 || perPage > MAX_PER_PAGE) invalid("per_page");
  }
  const pageToken = params.get("page_token") || null;
  const query: TimelineQuery = { perPage, pageToken };
  const rawFilters = params.get("filters");
  if (rawFilters === null || rawFilters === "") return query;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawFilters);
  } catch {
    return invalid("filters", "Malformed JSON.");
  }
  const seen = new Set<string>();
  for (const leaf of readLeaves(parsed)) applyLeaf(query, leaf, seen);
  return query;
}

function offsetMinutes(instant: number, timeZone: string): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(instant))
    .find((p) => p.type === "timeZoneName")?.value;
  const match = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(part ?? "");
  if (!match) throw new Error(`Cannot resolve offset for ${timeZone}`);
  if (!match[1]) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

function localDate(instant: number, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function formatOffset(minutes: number): string {
  const abs = Math.abs(minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${minutes < 0 ? "-" : "+"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Offset ISO string of the first instant of local calendar day (y, m, d + dayShift). */
function startOfDay(
  base: { y: number; m: number; d: number },
  dayShift: number,
  timeZone: string,
): string {
  const wall = Date.UTC(base.y, base.m - 1, base.d + dayShift);
  let instant = wall - offsetMinutes(wall, timeZone) * 60000;
  instant = wall - offsetMinutes(instant, timeZone) * 60000;
  const offset = offsetMinutes(instant, timeZone);
  const local = new Date(instant + offset * 60000).toISOString().slice(0, 19);
  return `${local}${formatOffset(offset)}`;
}

const WINDOW_DAYS: Record<Exclude<TimelineTimePreset, "any">, [number, number]> = {
  today: [0, 1],
  yesterday: [-1, 0],
  last7: [-6, 1],
  last30: [-29, 1],
};

export function encodeTimelineFilters(
  selection: TimelineSelection,
  now: Date,
  timeZone: string,
): string | null {
  const leaves: Record<string, unknown>[] = [];
  const leaf = (api_name: string, comparator: string, value: unknown) =>
    leaves.push({ field: { api_name }, comparator, value });
  if (selection.modules.length) {
    const modules = Array.from(
      new Set(selection.modules.map((m) => (m === "Meetings" || m === "meetings" ? "Events" : m))),
    );
    leaf("record.module.api_name", "in", modules);
  }
  if (selection.userId) leaf("done_by.id", "equal", selection.userId);
  if (selection.time !== "any") {
    const today = localDate(now.getTime(), timeZone);
    const [from, to] = WINDOW_DAYS[selection.time];
    leaf("audited_time", "between", [
      startOfDay(today, from, timeZone),
      startOfDay(today, to, timeZone),
    ]);
  }
  if (selection.sources.length)
    leaf(
      "source",
      "in",
      selection.sources.map((source) => SOURCE_TO_WIRE[source]),
    );
  if (leaves.length === 0) return null;
  if (leaves.length === 1) return JSON.stringify(leaves[0]);
  return JSON.stringify({ group_operator: "AND", group: leaves });
}

export type WireTimelineEvent = {
  id: string;
  audited_time: string;
  done_by: { id: string; name: string };
  record: { module: { api_name: string }; id: string; name: string | null };
  related_record: { module: { api_name: string }; id: string; name: string | null } | null;
  action: string;
  source: string;
  field_history: readonly {
    api_name: string;
    field_label: string;
    data_type: string;
    _value: { old: string | null; new: string | null };
  }[];
  automation: null;
  extension: null;
  type: null;
  event_kind: HistoryEventKind;
  event_details: JsonObject | null;
};
export type WireTimelineInfo = {
  count: number;
  more_records: boolean;
  page: number;
  per_page: number;
  next_page_token: string | null;
  previous_page_token: string | null;
};
export type WireTimelinesResponse = {
  timelines: readonly WireTimelineEvent[];
  info: WireTimelineInfo;
};

const ACTION_BY_KIND: Record<HistoryEventKind, string> = {
  record_created: "added",
  note_added: "added",
  attachment_added: "added",
  fields_updated: "updated",
  related_record_added: "relatedrecords_added",
  record_deleted: "deleted",
  related_record_removed: "deleted",
  attachment_deleted: "deleted",
  records_merged: "merged",
  record_converted: "converted",
  record_restored: "restored",
};
const KIND_BY_ACTION: Record<string, HistoryEventKind> = {
  added: "record_created",
  updated: "fields_updated",
  owner_assigned: "fields_updated",
  relatedrecords_added: "related_record_added",
  deleted: "record_deleted",
  merged: "records_merged",
  converted: "record_converted",
  restored: "record_restored",
};

function actionOf(event: RecordHistoryEvent): string {
  if (
    event.kind === "fields_updated" &&
    event.changes.length === 1 &&
    event.changes[0]?.apiName === "Owner"
  )
    return "owner_assigned";
  return ACTION_BY_KIND[event.kind];
}

const wireRef = (ref: HistoryRef) => ({
  module: { api_name: ref.module },
  id: ref.recordId,
  name: ref.name ?? null,
});

export function encodeTimelineEvent(event: RecordHistoryEvent): WireTimelineEvent {
  const sameRecord =
    event.stream.module === event.subject.module &&
    event.stream.recordId === event.subject.recordId;
  return {
    id: event.id,
    audited_time: event.occurredAt,
    done_by: { id: event.actor.id, name: event.actor.name },
    record: wireRef(event.subject),
    related_record: sameRecord ? null : wireRef(event.stream),
    action: actionOf(event),
    source: SOURCE_TO_WIRE[event.source],
    field_history: event.changes.map((change) => ({
      api_name: change.apiName,
      field_label: change.label,
      data_type: change.dataType,
      _value: { old: change.oldDisplay, new: change.newDisplay },
    })),
    automation: null,
    extension: null,
    type: null,
    event_kind: event.kind,
    event_details: event.payload,
  };
}

/** `null` (empty page) becomes a 204 response with no body. */
export function encodeTimelinesPage(
  page: RecordHistoryPage,
  query: Pick<TimelineQuery, "perPage" | "pageToken">,
): WireTimelinesResponse | null {
  if (page.events.length === 0) return null;
  return {
    timelines: page.events.map(encodeTimelineEvent),
    info: {
      count: page.events.length,
      more_records: page.moreRecords,
      page: 1,
      per_page: query.perPage,
      next_page_token: page.nextPageToken,
      previous_page_token: query.pageToken,
    },
  };
}

/** Wire to core. Display strings are all the wire carries for field values. */
export function decodeTimelinesPage(body: WireTimelinesResponse | null): RecordHistoryPage {
  if (!body) return { events: [], nextPageToken: null, moreRecords: false };
  return {
    events: body.timelines.map((item): RecordHistoryEvent => {
      const subject: HistoryRef = {
        module: item.record.module.api_name,
        recordId: item.record.id,
        name: item.record.name,
      };
      const stream: HistoryRef = item.related_record
        ? {
            module: item.related_record.module.api_name,
            recordId: item.related_record.id,
            name: item.related_record.name,
          }
        : subject;
      const source = (WIRE_TO_SOURCE[item.source] ?? "manual") as HistorySource;
      return {
        id: item.id,
        schemaVersion: 1,
        stream,
        subject,
        kind: item.event_kind ?? KIND_BY_ACTION[item.action] ?? "fields_updated",
        actor: { id: item.done_by.id, name: item.done_by.name },
        occurredAt: item.audited_time,
        sequence: 0,
        operationId: item.id,
        ordinal: 0,
        source,
        mechanism: null,
        changes: item.field_history.map((change) => ({
          apiName: change.api_name,
          label: change.field_label,
          dataType: change.data_type as FieldDataType,
          old: change._value.old,
          new: change._value.new,
          oldDisplay: change._value.old,
          newDisplay: change._value.new,
        })),
        payload: item.event_details,
      };
    }),
    nextPageToken: body.info.next_page_token,
    moreRecords: body.info.more_records,
  };
}

/** Core query to wire query parameters (explicit window, not a preset). */
export function encodeTimelineQuery(query: TimelineQuery): URLSearchParams {
  const params = new URLSearchParams({ per_page: String(query.perPage) });
  if (query.pageToken) params.set("page_token", query.pageToken);
  const leaves: Record<string, unknown>[] = [];
  const leaf = (api_name: string, comparator: string, value: unknown) =>
    leaves.push({ field: { api_name }, comparator, value });
  if (query.modules?.length) leaf("record.module.api_name", "in", query.modules);
  if (query.actorId) leaf("done_by.id", "equal", query.actorId);
  if (query.from && query.to) leaf("audited_time", "between", [query.from, query.to]);
  if (query.sources?.length)
    leaf(
      "source",
      "in",
      query.sources.map((source) => SOURCE_TO_WIRE[source]),
    );
  if (leaves.length === 1) params.set("filters", JSON.stringify(leaves[0]));
  else if (leaves.length > 1)
    params.set("filters", JSON.stringify({ group_operator: "AND", group: leaves }));
  return params;
}
