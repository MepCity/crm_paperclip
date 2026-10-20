import { expect, test } from "vitest";
import { casesRelatedListRail, casesRelatedLists } from "./cases-related-lists";

test("casesRelatedListRail defines rail labels and links group", () => {
  expect(casesRelatedListRail.organizeAriaLabel).toBe("Organize Cases Details");
  expect(casesRelatedListRail.linksGroup).toEqual({
    title: "Links",
    addLink: { id: "add-link", label: "Add Link", moduleKey: "M11" },
  });
});

test("casesRelatedLists follows metadata order and hides unobservable cards", () => {
  expect(casesRelatedLists.map((list) => list.title)).toEqual([
    "Connected Records",
    "Notes",
    "Attachments",
    "Open Activities",
    "Closed Activities",
    "Emails",
  ]);
  const orders = casesRelatedLists.map((list) => list.order);
  expect([...orders].sort((a, b) => a - b)).toEqual(orders);

  // Unobserved/counterpartless cards (Checklists, Locking Information, Mailing History, Review processes) stay hidden
  const ids = casesRelatedLists.map((list) => list.id);
  expect(ids).not.toContain("checklists");
  expect(ids).not.toContain("locking-information");
  expect(ids).not.toContain("mailing-history");
  expect(ids).not.toContain("solutions");
});
