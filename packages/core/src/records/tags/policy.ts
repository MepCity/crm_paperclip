import { ValidationError } from "../../errors";

// T1: interim, pending MEP-629. Trim names; NFC + lowercase defines uniqueness.
export const TAG_NAME_MAX_LENGTH = 50;
export function tagName(value: string): string {
  const name = typeof value === "string" ? value.trim().normalize("NFC") : "";
  if (!name || [...name].length > TAG_NAME_MAX_LENGTH)
    throw new ValidationError({ name: ["Enter a tag name of 1 to 50 characters."] });
  return name;
}
export const tagNameKey = (name: string): string => name.normalize("NFC").toLowerCase();
// T2 / R1: interim, pending MEP-629. Per-module catalogue capacity; no per-record cap.
export const TAG_CATALOGUE_CAPACITY = 100;
// T3: interim, pending MEP-629. No palette; optional RGB colour defaults to null.
export function tagColor(value: string | null = null): string | null {
  if (value !== null && (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)))
    throw new ValidationError({ color: ["Choose null or a #RRGGBB colour."] });
  return value;
}
// T6: interim, pending MEP-629. Set membership makes repeated additions idempotent.
export const tagMembership = (ids: readonly string[]): Set<string> => new Set(ids);
// T7: interim, pending MEP-629. Auth has no manage capability; use module-write checks.
export const TAG_MANAGEMENT_POLICY = "module_write";
// T4/T5: interim, pending MEP-629. Resolve stable IDs; name order; empty jsonarray is null.
export const compareTags = (a: { name: string; id: string }, b: { name: string; id: string }) =>
  a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
