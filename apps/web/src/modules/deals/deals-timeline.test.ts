import { expect, test } from "vitest";
import { DEALS_TIMELINE_SUBTABS } from "./deals-timeline";

test("uses History-only timeline subtabs", () => {
  expect(DEALS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
});
