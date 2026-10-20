import { expect, test } from "vitest";
import { ACTIVITY_PARENT_MODULES } from "./record-call-context";

test("only the four activity parent modules enable the Phone Call control", () => {
  expect([...ACTIVITY_PARENT_MODULES].sort()).toEqual(["Accounts", "Contacts", "Deals", "Leads"]);
  expect(ACTIVITY_PARENT_MODULES.includes("Cases")).toBe(false);
});
