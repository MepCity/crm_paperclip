import { expect, test } from "vitest";
import { DEALS_TIMELINE_EMPTY_EVENTS, DEALS_TIMELINE_SUBTABS } from "./deals-timeline";

test("uses History-only timeline subtabs with empty events", () => {
  expect(DEALS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
  expect(DEALS_TIMELINE_EMPTY_EVENTS).toEqual([]);
});
