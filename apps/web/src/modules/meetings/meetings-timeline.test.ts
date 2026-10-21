import { expect, test } from "vitest";
import {
  DEALS_TIMELINE_MODULE_OPTIONS,
  DEALS_TIMELINE_SOURCE_OPTIONS,
} from "../deals/deals-timeline";
import {
  MEETINGS_TIMELINE_MODULE_OPTIONS,
  MEETINGS_TIMELINE_SOURCE_OPTIONS,
  MEETINGS_TIMELINE_SUBTABS,
  normalizeMeetingsEventKind,
} from "./meetings-timeline";

test("uses History-only timeline subtabs with empty events and no Interactions tab", () => {
  expect(MEETINGS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
  expect(MEETINGS_TIMELINE_SUBTABS.some((tab) => tab.id === "interactions")).toBe(false);
});

test("uses filter option sets matching Deals with non-empty choices including meetings", () => {
  expect(MEETINGS_TIMELINE_MODULE_OPTIONS).toBe(DEALS_TIMELINE_MODULE_OPTIONS);
  expect(MEETINGS_TIMELINE_SOURCE_OPTIONS).toBe(DEALS_TIMELINE_SOURCE_OPTIONS);
  expect(MEETINGS_TIMELINE_MODULE_OPTIONS.length).toBeGreaterThan(0);
  expect(MEETINGS_TIMELINE_SOURCE_OPTIONS.length).toBeGreaterThan(0);
  expect(MEETINGS_TIMELINE_MODULE_OPTIONS.some((opt) => opt.id === "meetings")).toBe(true);
});

test("normalizes event kinds returning input kind", () => {
  expect(normalizeMeetingsEventKind("meeting_created")).toBe("meeting_created");
  expect(normalizeMeetingsEventKind("status_changed")).toBe("status_changed");
});
