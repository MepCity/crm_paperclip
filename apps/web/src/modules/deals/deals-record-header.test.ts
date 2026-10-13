import { createFixtureRecordService } from "@crm/core/records/fixture";
import { expect, test } from "vitest";
import { dealsRecordHeaderIdentity, formatDealHeaderAmount } from "./deals-record-header";
import { dealRecord } from "./test-metadata";

test("builds record header with Deal_Name and Amount (DD-90) using service home currency symbol", async () => {
  const service = createFixtureRecordService({
    orgId: "org-1",
    orgSlug: "test-org",
    orgName: "Test Org",
    userId: "u-1",
    role: "admin",
  });
  const homeCurrency = await service.getHomeCurrency();

  const result = dealsRecordHeaderIdentity(
    dealRecord({ Deal_Name: "Big Enterprise Deal", Amount: 50000 }),
    { currency: homeCurrency },
  );
  expect(result.title).toBe("Big Enterprise Deal");
  expect(result.subtitle).toBe(`${homeCurrency.symbol} 50,000.00`);
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

test("formats deal header amounts with currency formatting using currency symbol", () => {
  expect(formatDealHeaderAmount(12500)).toBe("TL 12,500.00");
  expect(formatDealHeaderAmount(12500, "$")).toBe("$ 12,500.00");
  expect(formatDealHeaderAmount(12500, { symbol: "EUR", prefixSymbol: false })).toBe(
    "12,500.00 EUR",
  );
  expect(formatDealHeaderAmount(null)).toBeUndefined();
  expect(formatDealHeaderAmount(undefined)).toBeUndefined();
  expect(formatDealHeaderAmount("")).toBeUndefined();
  expect(formatDealHeaderAmount("not-a-number")).toBeUndefined();
});
