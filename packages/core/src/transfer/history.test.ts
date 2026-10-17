import { describe, expect, it } from "vitest";
import { NotFoundError } from "../errors";
import { createHistory, HISTORY_TTL, newest, stored, UPLOAD_TTL } from "./history";

describe("TTL constants", () => {
  it("uses 30 minutes for uploads and 7 days for history", () => {
    expect(UPLOAD_TTL).toBe(1_800_000);
    expect(HISTORY_TTL).toBe(604_800_000);
  });
});

describe("createHistory", () => {
  it("returns empty stores for a new org", () => {
    const history = createHistory()("org", 0);
    expect(history.uploads.size).toBe(0);
    expect(history.imports.size).toBe(0);
    expect(history.exports.size).toBe(0);
  });

  it("returns the same store for the same org and separate stores per org", () => {
    const get = createHistory();
    expect(get("a", 0)).toBe(get("a", 1));
    expect(get("a", 0)).not.toBe(get("b", 0));
  });
});

describe("stored", () => {
  it("returns an existing entry", () => {
    expect(stored(new Map([["x", 1]]), "x")).toBe(1);
  });

  it("throws NotFoundError with the default message for a missing id", () => {
    const run = () => stored(new Map<string, number>(), "nope");
    expect(run).toThrow(NotFoundError);
    expect(run).toThrow("Not found.");
  });
});

describe("newest", () => {
  const a = { createdAt: "2026-01-01T00:00:00.000Z", n: "a" };
  const b = { createdAt: "2026-01-02T00:00:00.000Z", n: "b" };
  const c = { createdAt: "2026-01-03T00:00:00.000Z", n: "c" };

  it("returns an empty array for empty input", () => {
    expect(newest([])).toEqual([]);
  });

  it("sorts by createdAt descending", () => {
    expect(newest([b, c, a]).map((j) => j.n)).toEqual(["c", "b", "a"]);
  });

  it("keeps reverse input order for equal timestamps", () => {
    const x = { createdAt: a.createdAt, n: "x" };
    const y = { createdAt: a.createdAt, n: "y" };
    expect(newest([x, y]).map((j) => j.n)).toEqual(["y", "x"]);
  });

  it("returns deep copies", () => {
    const [first] = newest([a]);
    expect(first).toEqual(a);
    expect(first).not.toBe(a);
  });

  it("does not mutate the input array", () => {
    const input = [a, b, c];
    newest(input);
    expect(input.map((j) => j.n)).toEqual(["a", "b", "c"]);
  });
});
