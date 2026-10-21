import { describe, expect, it } from "vitest";
import {
  createDealsRelatedLists,
  dealsRelatedListRail,
  dealsRelatedLists,
} from "./deals-related-lists";

describe("dealsRelatedLists smoke", () => {
  it("ensures dealsRelatedLists is not empty and keys are unique", () => {
    expect(dealsRelatedLists.length).toBeGreaterThan(0);
    const keys = dealsRelatedLists.map((item) => item.id);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ensures createDealsRelatedLists() returns the same number of lists without throwing", () => {
    expect(() => createDealsRelatedLists()).not.toThrow();
    const lists = createDealsRelatedLists();
    expect(lists).toHaveLength(dealsRelatedLists.length);
  });

  it("ensures dealsRelatedListRail labels are not empty", () => {
    expect(dealsRelatedListRail.organizeAriaLabel.trim().length).toBeGreaterThan(0);
  });
});
