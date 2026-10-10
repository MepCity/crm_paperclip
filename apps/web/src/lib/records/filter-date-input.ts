/** Parses a filter panel display date (`DD.MM.YYYY`) to strict `YYYY-MM-DD`, or null if invalid. */
export function displayDateToIso(input: string): string | null {
  const trimmed = input.trim();
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || year < 1 || year > 9999) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > lastDay) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return iso;
}

export function isValidDisplayDateRange(from: string, to: string): boolean {
  const fromIso = displayDateToIso(from);
  const toIso = displayDateToIso(to);
  if (!fromIso || !toIso) return false;
  return fromIso <= toIso;
}
