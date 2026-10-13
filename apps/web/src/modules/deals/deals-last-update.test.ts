import { expect, test } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { formatDealsLastUpdateLabel } from "./deals-last-update";
import { dealRecord } from "./test-metadata";

test("formats Deals last update label using Modified_Time relative age", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const record = dealRecord({ Modified_Time: "2026-10-10T11:00:00Z" });
  expect(formatDealsLastUpdateLabel(record, now, DEFAULT_FORMAT)).toBe("Last Update : 1 hour ago");

  const unrecorded = dealRecord({});
  expect(formatDealsLastUpdateLabel(unrecorded, now, DEFAULT_FORMAT)).toBeNull();
});
