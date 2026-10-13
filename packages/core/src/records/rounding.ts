export function roundMoneyTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;
}
