import { describe, expect, it } from "vitest";
import type { RecordHistoryEvent } from "../records/history";
import {
  compareFeedItems,
  decodeCursor,
  encodeCursor,
  pageFeedItems,
  visibleEventChanges,
} from "./union";

const item = (id: string, at: string) => ({ id, at });
const change = (apiName: string) => ({
  apiName,
  label: apiName,
  dataType: "text" as const,
  old: "a",
  new: "b",
  oldDisplay: "a",
  newDisplay: "b",
});
const event = (kind: string, apiNames: string[]): RecordHistoryEvent =>
  ({
    id: "e1",
    kind,
    stream: { module: "Deals", recordId: "1" },
    changes: apiNames.map(change),
  }) as unknown as RecordHistoryEvent;

describe("feed union ordering and cursor", () => {
  it("orders newest first with id tie break", () => {
    const items = [
      item("a", "2026-01-01T00:00:00.000Z"),
      item("c", "2026-01-02T00:00:00.000Z"),
      item("b", "2026-01-02T00:00:00.000Z"),
    ];
    expect(items.sort(compareFeedItems).map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("pages with a keyset cursor without gaps or repeats", () => {
    const all = Array.from({ length: 7 }, (_, i) =>
      item(`id${i}`, new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(i / 2))).toISOString()),
    );
    const seen: string[] = [];
    let cursor = null as ReturnType<typeof decodeCursor>;
    for (let guard = 0; guard < 10; guard++) {
      const { page, nextCursor } = pageFeedItems(all, cursor, 3);
      seen.push(...page.map((p) => p.id));
      if (!nextCursor) break;
      cursor = decodeCursor(nextCursor);
    }
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect(seen).toEqual([...all].sort(compareFeedItems).map((i) => i.id));
  });

  it("returns no next cursor on the last page and rejects garbage", () => {
    expect(pageFeedItems([item("a", "2026-01-01T00:00:00.000Z")], null, 5).nextCursor).toBeNull();
    expect(decodeCursor("%%%")).toBeNull();
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(encodeCursor({ at: "2026-01-01T00:00:00.000Z", id: "x" }))).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      id: "x",
    });
  });
});

describe("visibleEventChanges", () => {
  const all = () => true;
  it("drops system fields and events with nothing left", () => {
    expect(visibleEventChanges(event("fields_updated", ["Modified_Time"]), all)).toBeNull();
    const kept = visibleEventChanges(event("fields_updated", ["Modified_Time", "Stage"]), all);
    expect(kept?.map((c) => c.apiName)).toEqual(["Stage"]);
  });

  it("drops hidden fields and the event when all are hidden", () => {
    const hide = (_m: string, f: string) => f !== "Amount";
    expect(visibleEventChanges(event("fields_updated", ["Amount"]), hide)).toBeNull();
    expect(
      visibleEventChanges(event("fields_updated", ["Amount", "Stage"]), hide)?.map(
        (c) => c.apiName,
      ),
    ).toEqual(["Stage"]);
  });

  it("ignores event kinds the feed does not list", () => {
    expect(visibleEventChanges(event("record_deleted", []), all)).toBeNull();
    expect(visibleEventChanges(event("record_created", []), all)).toEqual([]);
  });
});
