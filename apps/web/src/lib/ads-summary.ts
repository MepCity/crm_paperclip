import { type AdsSummary, aggregateAdsSummary } from "@crm/core/ads";
import { ForbiddenError, NotFoundError, ValidationError } from "@crm/core/errors";
import type { OrgContext } from "@crm/core/records";
import { getAds, getAttribution } from "./ads";
import { getRecordService } from "./records";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** `from`/`to` are inclusive calendar days (`YYYY-MM-DD`, UTC); either may be empty. */
export function summaryRange(from?: string | null, to?: string | null) {
  const parse = (value: string | null | undefined, field: string, nextDay: boolean) => {
    if (!value) return null;
    const date = DAY.test(value) ? new Date(`${value}T00:00:00.000Z`) : new Date(Number.NaN);
    if (Number.isNaN(date.getTime())) throw new ValidationError({ [field]: ["Use YYYY-MM-DD."] });
    if (nextDay) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  };
  const range = { from: parse(from, "from", false), to: parse(to, "to", true) };
  if (range.from && range.to && range.from >= range.to)
    throw new ValidationError({ to: ["The end date must not be before the start date."] });
  return range;
}

function amountOf(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
    return Number(value);
  return 0;
}

/**
 * Ads summary: current attribution of every Lead/Contact/Deal the user can read,
 * per campaign → ad group → keyword, with the summed deal Amount.
 */
export async function loadAdsSummary(
  ctx: OrgContext,
  range: { from?: string | null; to?: string | null } = {},
): Promise<AdsSummary> {
  const window = summaryRange(range.from, range.to);
  const [rows, tree] = await Promise.all([
    getAttribution().listCurrent(ctx, window),
    getAds().getTree(ctx),
  ]);
  const records = getRecordService(ctx);
  const visible: typeof rows = [];
  const dealAmounts = new Map<string, number>();
  for (const row of rows) {
    try {
      // Record-level access: records the user cannot read (or deleted ones) are not counted.
      const record = await records.get(row.recordModule, row.recordId);
      if (row.recordModule === "Deals")
        dealAmounts.set(row.recordId, amountOf(record.fields.Amount));
      visible.push(row);
    } catch (error) {
      if (!(error instanceof NotFoundError || error instanceof ForbiddenError)) throw error;
    }
  }
  return aggregateAdsSummary(
    visible,
    {
      campaigns: new Map(tree.campaigns.map((c) => [c.id, c.name])),
      groups: new Map(tree.groups.map((g) => [g.id, g.name])),
      keywords: new Map(tree.keywords.map((k) => [k.id, k.name])),
    },
    dealAmounts,
  );
}
