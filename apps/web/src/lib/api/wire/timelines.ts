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
