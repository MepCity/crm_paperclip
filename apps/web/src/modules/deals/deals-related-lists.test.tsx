import { expect, test } from "vitest";
import { createDealsRelatedLists } from "./deals-related-lists";

test("defines 15 related lists in reference rail order", () => {
  const lists = createDealsRelatedLists();
  expect(lists).toHaveLength(15);
  expect(lists.map((entry) => entry.title)).toEqual([
    "Notes",
    "Connected Records",
    "Attachments",
    "Stage History",
    "Competitors",
    "Cadences",
    "Open Activities",
    "Closed Activities",
    "Products",
    "Quotes",
    "Sales Orders",
    "Contact Roles",
    "Emails",
    "Cases",
    "Invoices",
  ]);
});

test("draws Stage History badge from supplied count only when positive", () => {
  expect(
    createDealsRelatedLists({ badges: { stageHistory: 0 } }).find((c) => c.id === "stage-history")
      ?.countBadge,
  ).toBeUndefined();
  expect(
    createDealsRelatedLists({ badges: { stageHistory: 2 } }).find((c) => c.id === "stage-history")
      ?.countBadge,
  ).toBe(2);
  expect(
    createDealsRelatedLists().find((c) => c.id === "contact-roles")?.countBadge,
  ).toBeUndefined();
});
