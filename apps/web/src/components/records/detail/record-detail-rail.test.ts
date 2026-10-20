import { expect, it } from "vitest";
import { RECORD_DETAIL_RAIL_VISIBLE_KEY } from "./record-detail-rail";

it("keeps the persisted rail visibility key stable", () => {
  expect(RECORD_DETAIL_RAIL_VISIBLE_KEY).toBe("record-detail.rail-visible");
});
