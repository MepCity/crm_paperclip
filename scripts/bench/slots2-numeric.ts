/** Exact decimal arithmetic for the benchmark compiler; no Number conversion. */
export const OPERATORS = ["=", "<>", "<", "<=", ">", ">="] as const;
export type Operator = (typeof OPERATORS)[number];
const MIN = -(1n << 63n);
const MAX = (1n << 63n) - 1n;

function decimal(text: string): { numerator: bigint; denominator: bigint } {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new Error("expected decimal text");
  const fraction = match[3] ?? "";
  const sign = match[1] ? -1n : 1n;
  return {
    numerator: sign * BigInt(`${match[2]}${fraction}`) * 100n,
    denominator: 10n ** BigInt(fraction.length),
  };
}

export function scaledWrite(text: string): string {
  const { numerator, denominator } = decimal(text);
  // Metadata declares two decimal places, even when extra places are zero.
  if ((text.split(".")[1]?.length ?? 0) > 2 || numerator % denominator !== 0n)
    throw new Error("value exceeds two decimal places");
  const value = numerator / denominator;
  if (value < MIN || value > MAX) throw new Error("scaled value exceeds bigint");
  return value.toString();
}

export function compiledThreshold(
  operator: Operator,
  text: string,
  column = "ix_num_1",
  parameter = "$1",
): { sql: string; value: string | null } {
  const { numerator: n, denominator: d } = decimal(text);
  const truncated = n / d;
  const remainder = n % d;
  const floor = truncated - (remainder < 0n ? 1n : 0n);
  const ceil = truncated + (remainder > 0n ? 1n : 0n);
  const all = { sql: `${column} is not null`, value: null };
  const empty = { sql: "false", value: null };
  if ((operator === "=" || operator === "<>") && remainder !== 0n)
    return operator === "=" ? empty : all;
  const bound = operator === ">=" || operator === "<" ? ceil : floor;
  if (bound < MIN) return [">", ">=", "<>"].includes(operator) ? all : empty;
  if (bound > MAX) return ["<", "<=", "<>"].includes(operator) ? all : empty;
  return { sql: `${column} ${operator} ${parameter}::bigint`, value: bound.toString() };
}

export function edgeDecimals(): string[] {
  const values = Array.from(
    { length: 2000 },
    (_, i) => `${1234567890123456n + BigInt(Math.floor(i / 2))}.${i % 2 === 0 ? "00" : "01"}`,
  );
  values.splice(
    -8,
    8,
    "0.00",
    "-0",
    "-1234567890123456.00",
    "-1234567890123456.01",
    "9999999999999999.99",
    "-9999999999999999.99",
    "0.01",
    "-0.01",
  );
  return values;
}
