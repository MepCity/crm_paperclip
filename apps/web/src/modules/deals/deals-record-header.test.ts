import { expect, test } from "vitest";
import { dealsRecordHeaderIdentity, formatDealHeaderAmount } from "./deals-record-header";
import { dealRecord } from "./test-metadata";

test("builds record header with Deal_Name and Amount (DD-90) without portrait or navigation", () => {
  const result = dealsRecordHeaderIdentity(
    dealRecord({ Deal_Name: "Big Enterprise Deal", Amount: 50000 }),
  );
  expect(result.title).toBe("Big Enterprise Deal");
  expect(result.subtitle).toBeDefined();
  expect(result.subtitle).toContain("50,000.00");
  expect(result.hasPortrait).toBe(false);
  expect(result.recordNavigation).toBe(false);
});

test("omits subtitle when Amount is empty, null, or undefined so no dash is rendered", () => {
  expect(dealsRecordHeaderIdentity(dealRecord({ Deal_Name: "Sample Deal", Amount: null }))).toEqual(
    {
      title: "Sample Deal",
      hasPortrait: false,
      recordNavigation: false,
    },
  );

  expect(dealsRecordHeaderIdentity(dealRecord({ Deal_Name: "Sample Deal" }))).toEqual({
    title: "Sample Deal",
    hasPortrait: false,
    recordNavigation: false,
  });

  expect(dealsRecordHeaderIdentity(dealRecord({ Deal_Name: "Sample Deal", Amount: "" }))).toEqual({
    title: "Sample Deal",
    hasPortrait: false,
    recordNavigation: false,
  });
});

test("formats deal header amounts with currency formatting", () => {
  expect(formatDealHeaderAmount(12500)).toContain("12,500.00");
  expect(formatDealHeaderAmount(null)).toBeUndefined();
  expect(formatDealHeaderAmount(undefined)).toBeUndefined();
  expect(formatDealHeaderAmount("")).toBeUndefined();
  expect(formatDealHeaderAmount("not-a-number")).toBeUndefined();
});
