import type { HistoryChange, RecordHistoryEvent } from "../records/history";
import type { FeedItem } from "./types";

/** System bookkeeping fields never shown as a change in the feed. */
const SYSTEM_FIELDS: ReadonlySet<string> = new Set(["Modified_Time", "Modified_By"]);

/** Event kinds listed in the feed (ADR 0018 §3). */
export const FEED_EVENT_KINDS: ReadonlySet<string> = new Set([
  "record_created",
  "fields_updated",
  "note_added",
  "record_converted",
]);

export interface FeedCursor {
  at: string;
  id: string;
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify([cursor.at, cursor.id])).toString("base64url");
}

export function decodeCursor(raw: string | null | undefined): FeedCursor | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      Array.isArray(parsed) &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string" &&
      !Number.isNaN(Date.parse(parsed[0]))
    ) {
      return { at: new Date(parsed[0]).toISOString(), id: parsed[1] };
    }
  } catch {
    // Fall through to the invalid result.
  }
  return null;
}

/** True when `item` sorts strictly after `cursor` in the newest-first order. */
export function isAfterCursor(item: Pick<FeedItem, "at" | "id">, cursor: FeedCursor | null) {
  if (!cursor) return true;
  const a = Date.parse(item.at);
  const b = Date.parse(cursor.at);
  if (a !== b) return a < b;
  return item.id < cursor.id;
}

/** Newest first; ties broken by id descending, matching the keyset cursor. */
export function compareFeedItems(a: Pick<FeedItem, "at" | "id">, b: Pick<FeedItem, "at" | "id">) {
  const diff = Date.parse(b.at) - Date.parse(a.at);
  if (diff !== 0) return diff;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/**
 * Merges already-built items, applies the cursor and cuts one page.
 * Returns the page and the cursor of its last item when more remain.
 */
export function pageFeedItems<T extends Pick<FeedItem, "at" | "id">>(
  items: readonly T[],
  cursor: FeedCursor | null,
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const sorted = items.filter((item) => isAfterCursor(item, cursor)).sort(compareFeedItems);
  const page = sorted.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor =
    sorted.length > limit && last ? encodeCursor({ at: last.at, id: last.id }) : null;
  return { page, nextCursor };
}

/**
 * Drops system fields and fields the viewer may not see. An update event with
 * no remaining change is dropped (returns null).
 */
export function visibleEventChanges(
  event: RecordHistoryEvent,
  canSeeField: (module: string, apiName: string) => boolean,
): readonly HistoryChange[] | null {
  if (!FEED_EVENT_KINDS.has(event.kind)) return null;
  if (event.kind !== "fields_updated") return event.changes;
  const changes = event.changes.filter(
    (change) =>
      !SYSTEM_FIELDS.has(change.apiName) && canSeeField(event.stream.module, change.apiName),
  );
  return changes.length > 0 ? changes : null;
}
