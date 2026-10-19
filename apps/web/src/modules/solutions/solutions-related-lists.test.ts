import { expect, test } from "vitest";
import { solutionsRelatedListRail, solutionsRelatedLists } from "./solutions-related-lists";

test("solutionsRelatedListRail defines rail labels and links group", () => {
  expect(solutionsRelatedListRail.organizeAriaLabel).toBe("Organize Solutions Details");
  expect(solutionsRelatedListRail.linksGroup).toEqual({
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  });
});

test("solutionsRelatedLists follows metadata order and hides unobservable cards", () => {
  expect(solutionsRelatedLists.map((list) => list.title)).toEqual([
    "Connected Records",
    "Notes",
    "Attachments",
  ]);
  const orders = solutionsRelatedLists.map((list) => list.order);
  expect([...orders].sort((a, b) => a - b)).toEqual(orders);

  // Unobserved/counterpartless cards (Checklists, Locking Information, Review processes) stay hidden
  const ids = solutionsRelatedLists.map((list) => list.id);
  expect(ids).not.toContain("checklists");
  expect(ids).not.toContain("locking-information");
  expect(ids).not.toContain("open-activities");
  expect(ids).not.toContain("closed-activities");
  expect(ids).not.toContain("emails");
  expect(ids).not.toContain("cases");
});
