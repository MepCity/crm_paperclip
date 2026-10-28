/**
 * Pure helpers shared by the server preview and the browser "Auto Mapping" button.
 * No imports from the rest of the package: the web bundle loads this file directly.
 */

export interface MappableField {
  apiName: string;
  label: string;
  type: string;
  /** Other accepted names, such as the labels of the other interface language. */
  aliases?: readonly string[];
}

export interface SuggestedMapping {
  column: number;
  field: string | null;
}

const REFERENCE_TYPES = new Set(["lookup", "ownerlookup", "multi_module_lookup"]);

/** Lower-case, diacritic-insensitive key; only letters and digits survive. */
export function normalizeKey(value: string): string {
  return value
    .replace(/İ/g, "I")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Headers of the "<Field> Id" companion columns that exports write for references. */
export const isReferenceType = (type: string) => REFERENCE_TYPES.has(type);

/**
 * Maps each column to at most one field. Matches the API name, the label and any alias.
 * An ambiguous or unknown header stays unmapped. A reference field that has both a name
 * column and an "<Field> Id" column is mapped to the id column.
 */
export function suggestMapping(
  headers: readonly string[],
  fields: readonly MappableField[],
  recordIdLabels: readonly string[] = ["Record Id"],
): SuggestedMapping[] {
  const idKeys = new Set(["id", "recordid", ...recordIdLabels.map(normalizeKey)]);
  const primary = new Map<string, Set<string>>();
  const secondary = new Map<string, Set<string>>();
  const idColumn = new Map<string, Set<string>>();
  const add = (index: Map<string, Set<string>>, key: string, field: string) => {
    if (!key) return;
    const set = index.get(key) ?? new Set<string>();
    set.add(field);
    index.set(key, set);
  };
  for (const field of fields) {
    const own = [field.apiName, field.label];
    for (const name of own) add(primary, normalizeKey(name), field.apiName);
    for (const name of field.aliases ?? []) add(secondary, normalizeKey(name), field.apiName);
    if (isReferenceType(field.type))
      for (const name of [...own, ...(field.aliases ?? [])])
        add(idColumn, `${normalizeKey(name)}id`, field.apiName);
  }
  const pick = (index: Map<string, Set<string>>, key: string) => {
    const hit = index.get(key);
    return hit && hit.size === 1 ? ([...hit][0] ?? null) : null;
  };

  const result: SuggestedMapping[] = [];
  const byField = new Map<string, { column: number; id: boolean }[]>();
  let recordIdTaken = false;
  for (const [column, header] of headers.entries()) {
    const key = normalizeKey(header);
    let field: string | null = null;
    let id = false;
    if (idKeys.has(key) && !recordIdTaken) {
      recordIdTaken = true;
      result.push({ column, field: "id" });
      continue;
    }
    if (idKeys.has(key)) {
      result.push({ column, field: null });
      continue;
    }
    if (primary.has(key)) field = pick(primary, key);
    else if (secondary.has(key)) field = pick(secondary, key);
    else if (idColumn.has(key)) {
      field = pick(idColumn, key);
      id = field !== null;
    }
    result.push({ column, field });
    if (field) byField.set(field, [...(byField.get(field) ?? []), { column, id }]);
  }
  for (const columns of byField.values()) {
    if (columns.length < 2) continue;
    const keep = columns.find((item) => item.id) ?? columns[0];
    for (const item of columns)
      if (item !== keep) {
        const entry = result[item.column];
        if (entry) entry.field = null;
      }
  }
  return result;
}

export interface PicklistChoice {
  displayValue: string;
  storedValue: string;
}

/**
 * Finds the option a raw cell refers to. Exact stored value wins; otherwise the key is
 * compared case-, space-, punctuation- and diacritic-insensitively against the stored
 * value, the display value and any extra labels. An ambiguous key matches nothing.
 */
export function matchPicklistOption<T extends PicklistChoice>(
  options: readonly T[],
  raw: string,
  extraLabels: (option: T) => readonly string[] = () => [],
): T | undefined {
  const exact = options.find((option) => option.storedValue === raw);
  if (exact) return exact;
  const key = normalizeKey(raw);
  if (!key) return undefined;
  const hits = options.filter((option) =>
    [option.storedValue, option.displayValue, ...extraLabels(option)].some(
      (label) => normalizeKey(label) === key,
    ),
  );
  return hits.length === 1 ? hits[0] : undefined;
}
