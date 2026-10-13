import { type FormatOptions, formatNumber } from "@crm/core/format";
import type { CurrencyDefinition, RecordData } from "@crm/core/records";
import { DEFAULT_FORMAT } from "@/lib/locale";

/**
 * Formats deal header amount with currency prefix and locale options (DD-90).
 * Uses the service's home currency symbol (default "TL"), matching the form prefix.
 * Returns undefined when amount is empty, null, or undefined so no dash or amount is rendered.
 */
export function formatDealHeaderAmount(
  amount: unknown,
  currency: string | CurrencyDefinition | { symbol?: string; prefixSymbol?: boolean } = "TL",
  format: FormatOptions = DEFAULT_FORMAT,
): string | undefined {
  if (amount === null || amount === undefined || amount === "") return undefined;
  const num =
    typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : NaN;
  if (Number.isNaN(num)) return undefined;
  const symbol = typeof currency === "string" ? currency : (currency.symbol ?? "TL");
  const prefix =
    typeof currency === "object" && currency.prefixSymbol !== undefined
      ? currency.prefixSymbol
      : true;
  const formatted = formatNumber(num, {
    ...format,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return prefix ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
}

/**
 * Record header identity: Deal_Name title, optional Amount subtitle (DD-90).
 * No portrait / placeholder icon is used (DD-90).
 * No website or account link exists.
 * Previous / next record arrows are disabled in Deals (not painted in reference capture).
 */
export function dealsRecordHeaderIdentity(
  record: RecordData,
  context?: {
    orgSlug?: string;
    currency?: CurrencyDefinition | { symbol?: string; prefixSymbol?: boolean } | string;
    currencySymbol?: string;
  },
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  recordNavigation?: boolean;
} {
  const title =
    typeof record.fields.Deal_Name === "string" ? (record.fields.Deal_Name as string) : "";
  const currency = context?.currency ?? context?.currencySymbol ?? "TL";
  const subtitle = formatDealHeaderAmount(record.fields.Amount, currency);

  return {
    title,
    ...(subtitle ? { subtitle } : {}),
    hasPortrait: false,
    recordNavigation: false,
  };
}
