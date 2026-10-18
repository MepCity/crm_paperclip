import { ValidationError } from "@crm/core/errors";
import type { RecycleBinEntry, RecycleBinQuery, Tag } from "@crm/core/records";

export function invalid(field: string, message = "Invalid value."): never {
  throw new ValidationError({ [field]: [message] });
}

export async function objectBody(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return invalid("body", "Send valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid("body", "Send a JSON object.");
  return value as Record<string, unknown>;
}

export function exactKeys(body: Record<string, unknown>, keys: string[]): void {
  if (Object.keys(body).some((key) => !keys.includes(key))) invalid("body", "Unknown field.");
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) return invalid(field);
  return value;
}

export function ids(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 500)
    throw new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit");
  return value.map((id) => requiredString(id, "ids"));
}

export function paging(query: Record<string, string>) {
  const positive = (key: string, fallback: number) => {
    if (query[key] === undefined) return fallback;
    const value = Number(query[key]);
    if (!/^\d+$/.test(query[key] ?? "") || !Number.isSafeInteger(value) || value < 1)
      return invalid(key, "Choose a positive integer.");
    return value;
  };
  const page = positive("page", 1);
  const perPage = positive("per_page", 30);
  if (!Number.isSafeInteger(page * perPage)) invalid("page");
  return { page, perPage };
}

export function collection(
  key: string,
  rows: readonly unknown[],
  page: number,
  perPage: number,
  more: boolean,
) {
  return rows.length
    ? {
        [key]: rows,
        info: { page, per_page: perPage, count: rows.length, more_records: more },
      }
    : null;
}

export function tagRow(tag: Tag) {
  return {
    id: tag.id,
    module: tag.module,
    name: tag.name,
    color: tag.color,
    Created_By: { id: tag.createdBy },
    Created_Time: tag.createdAt,
    Modified_By: { id: tag.modifiedBy },
    Modified_Time: tag.modifiedAt,
  };
}

export function binRow(entry: RecycleBinEntry) {
  return {
    id: entry.id,
    record_id: entry.recordId,
    Name: entry.name,
    Type: entry.module,
    Deleted_By: { id: entry.deletedBy },
    Deleted_Time: entry.deletedAt,
    expires_at: entry.expiresAt,
  };
}

export function binQuery(query: Record<string, string>): RecycleBinQuery {
  const result: RecycleBinQuery = paging(query);
  for (const [wire, port] of [
    ["module", "module"],
    ["name", "name"],
    ["deleted_by", "deletedBy"],
    ["deleted_by_contains", "deletedByContains"],
  ] as const) {
    if (query[wire] !== undefined) result[port] = requiredString(query[wire], wire);
  }
  if (query.deleted_time !== undefined && query.deleted_date === undefined) invalid("deleted_date");
  if (query.deleted_date !== undefined) {
    result.deletedOn = { date: requiredString(query.deleted_date, "deleted_date") };
    if (query.deleted_time !== undefined)
      result.deletedOn.time = requiredString(query.deleted_time, "deleted_time");
  }
  // These are recognizable but unsupported criteria, not ignorable extension hints.
  for (const key of ["criteria", "filters", "search", "operator"]) {
    if (query[key] !== undefined) invalid(key, "Unsupported search criteria.");
  }
  return result;
}

export const success = (values: readonly string[], message: string) => ({
  data: values.map((id) => ({ code: "SUCCESS", details: { id }, message, status: "success" })),
});
