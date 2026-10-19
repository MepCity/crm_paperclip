import type { FieldValue } from "../contract";
import type { FixtureModuleStore } from "./hooks";

/** Interim export fallback: independent, unprefixed decimal sequences per module. */
export function seedAutoNumbers(store: FixtureModuleStore, field: string): void {
  const rows = [...store.records.values()].sort(
    (a, b) =>
      String(a.fields.Created_Time ?? "").localeCompare(String(b.fields.Created_Time ?? "")) ||
      a.id.localeCompare(b.id),
  );
  store.nextAutoNumber = 1n;
  for (const row of rows) assignAutoNumber(store, field, row.fields);
}

/** Call only inside the record transaction so a failed publication consumes nothing. */
export function assignAutoNumber(
  store: FixtureModuleStore,
  field: string,
  fields: Record<string, FieldValue>,
): void {
  fields[field] = String(store.nextAutoNumber ?? 1n);
  store.nextAutoNumber = (store.nextAutoNumber ?? 1n) + 1n;
}
