import { expect, test } from "vitest";
import { formatContactsLastUpdateLabel } from "./contacts-last-update";
import { contactRecord } from "./test-metadata";

test("uses the shared last-update format and omits absent timestamps", () => {
  const now = new Date("2026-01-02T12:00:00Z");
  expect(
    formatContactsLastUpdateLabel(contactRecord(), now, { locale: "en-US", timeZone: "UTC" }),
  ).toBeNull();
  expect(
    formatContactsLastUpdateLabel(contactRecord({ Modified_Time: "2026-01-01T12:00:00Z" }), now, {
      locale: "en-US",
      timeZone: "UTC",
    }),
  ).toMatch(/^Last Update : /);
});
