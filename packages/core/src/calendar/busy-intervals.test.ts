import { describe, expect, it } from "vitest";
import { findConflicts, mergeBusyIntervals } from "./busy-intervals";

describe("mergeBusyIntervals", () => {
  it("returns empty for empty input", () => {
    expect(mergeBusyIntervals([])).toEqual([]);
  });
  it("sorts and merges unsorted input", () => {
    expect(
      mergeBusyIntervals([
        { start: 20, end: 30 },
        { start: 0, end: 5 },
        { start: 4, end: 10 },
      ]),
    ).toEqual([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]);
  });
  it("absorbs nested intervals", () => {
    expect(
      mergeBusyIntervals([
        { start: 0, end: 100 },
        { start: 10, end: 20 },
      ]),
    ).toEqual([{ start: 0, end: 100 }]);
  });
  it("merges touching ends", () => {
    expect(
      mergeBusyIntervals([
        { start: 0, end: 5 },
        { start: 5, end: 8 },
      ]),
    ).toEqual([{ start: 0, end: 8 }]);
  });
  it("does not mutate input", () => {
    const input = [
      { id: "a", start: 5, end: 9 },
      { id: "b", start: 0, end: 6 },
    ];
    const copy = structuredClone(input);
    mergeBusyIntervals(input);
    expect(input).toEqual(copy);
  });
  it("throws on invalid items", () => {
    expect(() => mergeBusyIntervals([{ start: 5, end: 5 }])).toThrow(RangeError);
    expect(() => mergeBusyIntervals([{ start: 0, end: Number.NaN }])).toThrow(RangeError);
    expect(() => mergeBusyIntervals([{ start: 0, end: Number.POSITIVE_INFINITY }])).toThrow(
      RangeError,
    );
  });
});

describe("findConflicts", () => {
  const items = [
    { id: "c", start: 20, end: 30 },
    { id: "a", start: 0, end: 10 },
    { id: "b", start: 8, end: 22 },
  ];
  it("returns overlaps in start order", () => {
    expect(findConflicts({ start: 9, end: 25 }, items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
  it("does not count touching ends", () => {
    expect(
      findConflicts({ start: 10, end: 20 }, [
        { id: "x", start: 0, end: 10 },
        { id: "y", start: 20, end: 30 },
      ]),
    ).toEqual([]);
  });
  it("skips ignoreId", () => {
    expect(findConflicts({ start: 9, end: 25 }, items, { ignoreId: "b" }).map((i) => i.id)).toEqual(
      ["a", "c"],
    );
  });
  it("handles empty items", () => {
    expect(findConflicts({ start: 0, end: 1 }, [])).toEqual([]);
  });
  it("throws on invalid candidate or item", () => {
    expect(() => findConflicts({ start: 3, end: 2 }, [])).toThrow(RangeError);
    expect(() => findConflicts({ start: 0, end: 1 }, [{ start: 4, end: 1 }])).toThrow(RangeError);
    expect(() => findConflicts({ start: Number.NaN, end: 1 }, [])).toThrow(RangeError);
  });
  it("does not mutate input", () => {
    const copy = structuredClone(items);
    findConflicts({ start: 0, end: 100 }, items);
    expect(items).toEqual(copy);
  });
});
