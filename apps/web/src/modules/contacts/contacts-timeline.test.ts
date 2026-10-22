import { expect, test } from "vitest";
import {
  CONTACTS_TIMELINE_MODULE_OPTIONS,
  CONTACTS_TIMELINE_SOURCE_OPTIONS,
  CONTACTS_TIMELINE_SUBTABS,
  normalizeContactsEventKind,
} from "./contacts-timeline";

test("defines observed subtabs and interim shared filter options", () => {
  expect(CONTACTS_TIMELINE_SUBTABS).toEqual([
    { id: "history", label: "History" },
    { id: "interactions", label: "Interactions" },
  ]);
  expect(CONTACTS_TIMELINE_MODULE_OPTIONS.map((item) => item.label)).toEqual([
    "Notes",
    "Attachments",
    "Tasks",
    "Calls",
    "Meetings",
    "Emails",
  ]);
  expect(CONTACTS_TIMELINE_SOURCE_OPTIONS.map((item) => item.label)).toEqual([
    "Workflow Rules",
    "Manual",
    "Import",
  ]);
  expect(normalizeContactsEventKind("contact_image_upload")).toBe("image_upload");
  expect(normalizeContactsEventKind("contact_created")).toBe("contact_created");
});
