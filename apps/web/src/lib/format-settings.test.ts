import { DOTTED_DAY_FIRST_FORMAT, formatCurrency, formatDate } from "@crm/core/format";
import { expect, it } from "vitest";
import { fixtureCompanyDetailsPort } from "@/modules/settings-company/fixture-port";
import { loadOrganizationFormat } from "./format-settings";
import { DEFAULT_FORMAT, numberInputLocale } from "./locale";

const port = fixtureCompanyDetailsPort;

it("formats money and dates with the fixture organization format", async () => {
  const format = await loadOrganizationFormat(port);
  expect(formatCurrency(250000, "TRY", format)).toBe("TL 250.000,00");
  expect(formatDate("2026-06-30T10:00:00Z", format)).toBe("30.06.2026");
});

it("falls back to the default format when the setting is missing or unreadable", async () => {
  expect(await loadOrganizationFormat({ ...port, readOrganizationFormat: async () => null })).toBe(
    DEFAULT_FORMAT,
  );
  const broken = {
    ...port,
    readOrganizationFormat: async () => ({ ...DOTTED_DAY_FIRST_FORMAT, datePattern: "nope" }),
  };
  expect(await loadOrganizationFormat(broken)).toBe(DEFAULT_FORMAT);
});

it("parses typed numbers with the organization separators", () => {
  const locale = numberInputLocale({ ...DOTTED_DAY_FIRST_FORMAT });
  const parsed = new Intl.NumberFormat(locale).formatToParts(1234.56);
  expect(parsed.find((p) => p.type === "decimal")?.value).toBe(",");
  expect(numberInputLocale(DEFAULT_FORMAT)).toBe("en-US");
});
