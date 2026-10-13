import { type FormatOptions, formatCurrency } from "@crm/core/format";
import type { RecordData } from "@crm/core/records";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { DEALS_LIST_CURRENCY_CODE } from "./list-config";

/**
 * Formats deal header amount with currency prefix and locale options (DD-90).
 * Returns undefined when amount is empty, null, or undefined so no dash or amount is rendered.
 */
export function formatDealHeaderAmount(
  amount: unknown,
  currencyCode = DEALS_LIST_CURRENCY_CODE,
  format: FormatOptions = DEFAULT_FORMAT,
): string | undefined {
  if (amount === null || amount === undefined || amount === "") return undefined;
  const num =
    typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : NaN;
  if (Number.isNaN(num)) return undefined;
  return formatCurrency(num, currencyCode, format);
}

/**
 * Record header identity: Deal_Name title, optional Amount subtitle (DD-90).
 * No portrait / placeholder icon is used (DD-90).
 * No website or account link exists.
 * Previous / next record arrows are disabled in Deals (not painted in reference capture).
 */
export function dealsRecordHeaderIdentity(
  record: RecordData,
  _context?: { orgSlug?: string },
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  recordNavigation?: boolean;
} {
  const title =
    typeof record.fields.Deal_Name === "string" ? (record.fields.Deal_Name as string) : "";
  const subtitle = formatDealHeaderAmount(record.fields.Amount);

  return {
    title,
    ...(subtitle ? { subtitle } : {}),
    hasPortrait: false,
    recordNavigation: false,
  };
}
