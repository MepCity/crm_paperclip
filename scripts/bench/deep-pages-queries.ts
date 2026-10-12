import type { ListParams, Query } from "./queries";
import { matrixQuery, ORDERS, type Order } from "./slots2-queries";

export const VARIANTS = ["S1", "S2", "S3", "B-1", "B-2"] as const;
export type Variant = (typeof VARIANTS)[number];
export function deepQuery(
  variant: Variant,
  order: Order,
  offset: number,
  p: ListParams,
  filtered: boolean,
): Query {
  const split = (order === "O3" || order === "O4") && variant !== "S3" && variant !== "B-2";
  const baseline = matrixQuery("A4b", order, offset, p, filtered, split);
  if (variant === "S1") return baseline;
  const typed = variant.startsWith("B");
  const table = typed
    ? "bench_b.leads"
    : variant === "S3"
      ? "bench_deep.records"
      : "bench_slot.records";
  const slot = typed ? "company" : "ix_text_1";
  const status = typed ? "lead_status" : "ix_text_3";
  const { direction, nulls } = ORDERS[order];
  let inner = baseline.text
    .replaceAll("bench_slot.records", table)
    .replaceAll("ix_text_1", slot)
    .replaceAll("ix_text_3", status);
  inner = inner
    .replaceAll("select r.*", `select r.id,r.${slot}`)
    .replace("select * from", `select id,${slot} from`);
  return {
    values: baseline.values,
    text: `with page as materialized (${inner})
    select r.* from page p cross join lateral (
      select * from ${table} where organization_id=$1::uuid and id=p.id offset 0
    ) r order by p.${slot} ${direction} nulls ${nulls},p.id ${direction}`,
  };
}
