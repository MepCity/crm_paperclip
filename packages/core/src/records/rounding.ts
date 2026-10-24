export function roundMoneyTwoDecimals(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const rounded = Math.round((abs + Number.EPSILON * Math.max(1, abs)) * 100) / 100;
  return rounded === 0 ? 0 : sign * rounded;
}
