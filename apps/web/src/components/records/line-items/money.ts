const formatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ADR 0016 §5: single currency, Turkish separators; the unit sits in the column header. */
export function formatMoney(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : formatter.format(value);
}
