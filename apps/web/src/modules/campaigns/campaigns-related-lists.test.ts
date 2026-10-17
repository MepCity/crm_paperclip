import { expect, test } from "vitest";
import { campaignsRelatedLists } from "./campaigns-related-lists";

test("rail keeps the metadata order and hides Locking Information and Checklists", () => {
  expect(campaignsRelatedLists.map((list) => list.title)).toEqual([
    "Connected Records",
    "Notes",
    "Child Campaigns",
    "Open Activities",
    "Attachments",
    "Closed Activities",
    "Leads",
    "Deals",
    "Contacts",
  ]);
  const orders = campaignsRelatedLists.map((list) => list.order);
  expect([...orders].sort((a, b) => a - b)).toEqual(orders);
});
