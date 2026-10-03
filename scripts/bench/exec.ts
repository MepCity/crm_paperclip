import type pg from "pg";
import {
  countQuery,
  type FullRecord,
  fullQuery,
  type ListKind,
  type ListParams,
  type ListRow,
  listQuery,
  mapFullA,
  mapFullB,
  mapFullC,
  mapListRow,
  mapReportRow,
  type Option,
  type ReportRow,
  reportQuery,
} from "./queries";

type Row = Record<string, unknown>;

export async function executeList(
  client: pg.Client,
  option: Option,
  kind: ListKind,
  params: ListParams,
): Promise<ListRow[]> {
  const query = listQuery(option, kind, params);
  const result = await client.query(query.text, query.values);
  return result.rows.map((row) => mapListRow(row as Row));
}

export async function executeCount(
  client: pg.Client,
  option: Option,
  kind: "s2" | "s4",
  params: ListParams,
  capped: boolean,
): Promise<number> {
  const query = countQuery(option, kind, params, capped);
  const result = await client.query<{ n: number }>(query.text, query.values);
  return result.rows[0]?.n ?? 0;
}

export async function executeReport(
  client: pg.Client,
  option: Option,
  byOwner: boolean,
  params: ListParams,
): Promise<ReportRow[]> {
  const query = reportQuery(option, byOwner, params);
  const result = await client.query(query.text, query.values);
  return result.rows.map((row) => mapReportRow(row as Row));
}

export async function executeFull(
  client: pg.Client,
  option: Option,
  id: string,
): Promise<FullRecord> {
  const query = fullQuery(option, id);
  const result = await client.query(query.text, query.values);
  const rows = result.rows as Row[];
  if (rows.length === 0) throw new Error(`missing record ${id} in option ${option}`);
  if (option === "A") {
    const row = rows[0];
    if (!row) throw new Error("missing row");
    return mapFullA(row);
  }
  if (option === "B") {
    const row = rows[0];
    if (!row) throw new Error("missing row");
    return mapFullB(row);
  }
  return mapFullC(rows);
}

export function assertSame(label: string, left: unknown, right: unknown): void {
  const a = JSON.stringify(left);
  const b = JSON.stringify(right);
  if (a !== b) {
    throw new Error(`${label} mismatch\n${a.slice(0, 500)}\n${b.slice(0, 500)}`);
  }
}
