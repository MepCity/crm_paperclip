import { describe, expect, it } from "vitest";
import { sortNotes } from "./note-sort";

const a = { id: "a", createdAt: "2026-10-01T10:00:00Z" };
const b = { id: "b", createdAt: "2026-10-02T10:00:00Z" };
const c = { id: "c", createdAt: "2026-10-03T10:00:00Z" };

describe("sortNotes", () => {
  it("puts the oldest first for recentLast", () => {
    expect(sortNotes([c, a, b], "recentLast").map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
  it("puts the newest first for recentFirst", () => {
    expect(sortNotes([a, c, b], "recentFirst").map((n) => n.id)).toEqual(["c", "b", "a"]);
  });
  it("keeps incoming order for equal times in both directions", () => {
    const x = { id: "x", createdAt: a.createdAt };
    expect(sortNotes([a, x], "recentLast").map((n) => n.id)).toEqual(["a", "x"]);
    expect(sortNotes([a, x], "recentFirst").map((n) => n.id)).toEqual(["a", "x"]);
  });
  it("does not mutate the input", () => {
    const input = [c, a];
    sortNotes(input, "recentLast");
    expect(input[0]).toBe(c);
  });
});
