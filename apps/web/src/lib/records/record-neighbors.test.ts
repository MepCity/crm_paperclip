import { describe, expect, it } from "vitest";
import { recordNeighborsOnPage } from "./record-neighbors";

describe("recordNeighborsOnPage", () => {
  const ids = ["a", "b", "c"];

  it("returns both neighbors in the middle", () => {
    expect(recordNeighborsOnPage(ids, "b")).toEqual({ previousId: "a", nextId: "c" });
  });

  it("disables previous at the start", () => {
    expect(recordNeighborsOnPage(ids, "a")).toEqual({ previousId: null, nextId: "b" });
  });

  it("disables next at the end", () => {
    expect(recordNeighborsOnPage(ids, "c")).toEqual({ previousId: "b", nextId: null });
  });

  it("returns null neighbors when the id is missing", () => {
    expect(recordNeighborsOnPage(ids, "missing")).toEqual({ previousId: null, nextId: null });
  });

  it("handles an empty page", () => {
    expect(recordNeighborsOnPage([], "a")).toEqual({ previousId: null, nextId: null });
  });
});
