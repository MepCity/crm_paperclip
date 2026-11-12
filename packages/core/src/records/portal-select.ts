import { NotFoundError, ValidationError } from "../errors";
import type { Criteria, FieldDefinition, FieldValue, RecordData, SortSpec } from "./contract";
import { isJsonObject } from "./json";

/**
 * Portal reads (ADR 0019a §3–§4). The portal query builder (`packages/core/src/portals/`)
 * describes a read as a `PortalSelectQuery`; the record adapter evaluates it in ONE
 * candidate-selection pass over the organisation's live records: the relationship proof,
 * the id or list filter, the related-list parent filter, filters and search are tested
 * together, and only the projected columns are ever read into the result. Records in the
 * recycle bin are not part of the live rows, so they never match.
 *
 * The records adapter is an in-memory store (no SQL); "the same SQL statement" of the ADR is
 * this single evaluation: no record is fetched first and checked afterwards.
 */

/** `contact` = the identity's linked Contact `C`; `contactAccount` = `A`, its Account. */
export type PortalRef = "contact" | "contactAccount";

export type PortalPredicate =
  | { readonly op: "eq"; readonly field: string; readonly ref: PortalRef }
  | { readonly op: "or"; readonly terms: readonly PortalPredicate[] };

export interface PortalSelectQuery {
  readonly module: string;
  readonly proof: PortalPredicate;
  /** Detail read: the only candidate id. */
  readonly id?: string;
  /** Related list: `field` of the row must point at this parent (proved separately). */
  readonly parent?: { readonly field: string; readonly module: string; readonly id: string };
  /** Projected field API names (the select list). `id` is always returned. */
  readonly columns: readonly string[];
  readonly filters?: Criteria;
  readonly search?: { readonly text: string; readonly fields: readonly string[] };
  readonly sort: SortSpec;
  readonly page: number;
  readonly perPage: number;
  /** Proof of every module a lookup may link to; a missing module renders name-only. */
  readonly linkProofs: Readonly<Partial<Record<string, PortalPredicate>>>;
}

export interface PortalLookupValue {
  readonly name: string;
  /** Present only when the target passes its own proof. */
  readonly module?: string;
  readonly id?: string;
}

export type PortalFieldValue = FieldValue | PortalLookupValue;

export interface PortalSelectRow {
  readonly id: string;
  readonly fields: Readonly<Record<string, PortalFieldValue>>;
}

export interface PortalSelectResult {
  readonly records: readonly PortalSelectRow[];
  readonly page: number;
  readonly perPage: number;
  readonly moreRecords: boolean;
}

export const PORTAL_MAX_PER_PAGE = 50;

/** The only modules a portal may read (ADR 0019a §3); the portal matrix mirrors this list. */
export const PORTAL_READ_MODULES: ReadonlySet<string> = new Set([
  "Contacts",
  "Accounts",
  "Deals",
  "Cases",
  "Quotes",
  "Invoices",
]);

/** Store access the evaluation needs; live rows only (never the recycle bin). */
export interface PortalSelectSource {
  rows(module: string): Iterable<RecordData>;
  get(module: string, id: string): RecordData | undefined;
  displayName(module: string, record: RecordData): string;
  fields(module: string): ReadonlyMap<string, FieldDefinition>;
  matches(
    record: RecordData,
    criteria: Criteria,
    fields: ReadonlyMap<string, FieldDefinition>,
  ): boolean;
  sort(
    records: RecordData[],
    sort: SortSpec,
    fields: ReadonlyMap<string, FieldDefinition>,
  ): RecordData[];
}

function refId(value: FieldValue | undefined): string | null {
  if (isJsonObject(value) && typeof value.id === "string" && value.id) return value.id;
  return null;
}

interface Bindings {
  readonly contact: string;
  readonly contactAccount: string | null;
}

/** `A` is read from `C`'s current row inside the same evaluation, never from the session. */
function bind(source: PortalSelectSource, contactId: string): Bindings {
  const contact = source.get("Contacts", contactId);
  return {
    contact: contactId,
    contactAccount: contact ? refId(contact.fields.Account_Name) : null,
  };
}

function holds(predicate: PortalPredicate, record: RecordData, bindings: Bindings): boolean {
  if (predicate.op === "or") return predicate.terms.some((t) => holds(t, record, bindings));
  const expected = bindings[predicate.ref];
  // A null binding (Contact without Account) matches nothing, like `= NULL` in SQL.
  if (expected === null) return false;
  const actual = predicate.field === "id" ? record.id : refId(record.fields[predicate.field]);
  return actual !== null && actual === expected;
}

function lookupValue(
  source: PortalSelectSource,
  query: PortalSelectQuery,
  bindings: Bindings,
  value: FieldValue,
): PortalLookupValue | null {
  if (!isJsonObject(value) || typeof value.module !== "string" || typeof value.id !== "string")
    return null;
  const target = source.get(value.module, value.id);
  if (!target) return null;
  const name = source.displayName(value.module, target);
  const proof = query.linkProofs[value.module];
  return proof && holds(proof, target, bindings)
    ? { name, module: value.module, id: value.id }
    : { name };
}

/** Lookups nested in line items lose their ids unless the target passes its own proof. */
function sanitize(
  source: PortalSelectSource,
  query: PortalSelectQuery,
  bindings: Bindings,
  value: FieldValue,
): PortalFieldValue {
  if (Array.isArray(value))
    return value.map((item) => sanitize(source, query, bindings, item) as FieldValue);
  if (isJsonObject(value)) {
    if (typeof value.module === "string" && typeof value.id === "string")
      return lookupValue(source, query, bindings, value);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitize(source, query, bindings, item as FieldValue),
      ]),
    ) as FieldValue;
  }
  return value;
}

/** Copies only projected columns; lookups resolve to the display name for filter/sort. */
function filterView(
  source: PortalSelectSource,
  record: RecordData,
  columns: readonly string[],
): RecordData {
  const fields: Record<string, FieldValue> = { id: record.id };
  for (const column of columns) {
    const value = record.fields[column] ?? null;
    if (isJsonObject(value) && typeof value.module === "string" && typeof value.id === "string") {
      const target = source.get(value.module, value.id);
      fields[column] = target
        ? { module: value.module, id: value.id, name: source.displayName(value.module, target) }
        : null;
    } else fields[column] = value;
  }
  return { id: record.id, fields };
}

export function evaluatePortalSelect(
  source: PortalSelectSource,
  contactId: string,
  query: PortalSelectQuery,
): PortalSelectResult {
  if (
    !Number.isSafeInteger(query.page) ||
    query.page < 1 ||
    !Number.isSafeInteger(query.perPage) ||
    query.perPage < 1 ||
    query.perPage > PORTAL_MAX_PER_PAGE
  )
    throw new ValidationError({ perPage: [`Choose 1 to ${PORTAL_MAX_PER_PAGE} records.`] });
  const bindings = bind(source, contactId);
  const fieldMap = source.fields(query.module);
  const projected = new Map(
    query.columns.flatMap((name) => {
      const def = fieldMap.get(name);
      return def ? [[name, def] as const] : [];
    }),
  );
  const parent = query.parent;
  const needle = query.search?.text.trim().toLowerCase();
  const selected: RecordData[] = [];
  for (const record of source.rows(query.module)) {
    if (query.id !== undefined && record.id !== query.id) continue;
    if (!holds(query.proof, record, bindings)) continue;
    if (parent) {
      const pointer = record.fields[parent.field];
      if (
        !isJsonObject(pointer) ||
        pointer.module !== parent.module ||
        refId(pointer) !== parent.id
      )
        continue;
    }
    const view = filterView(source, record, [...projected.keys()]);
    if (query.filters && !source.matches(view, query.filters, projected)) continue;
    if (needle) {
      const hit = (query.search?.fields ?? []).some((name) => {
        const value = view.fields[name];
        const text = isJsonObject(value) ? value.name : value;
        return typeof text === "string" && text.toLowerCase().includes(needle);
      });
      if (!hit) continue;
    }
    selected.push(view);
  }
  if (query.id !== undefined && selected.length === 0) throw new NotFoundError("Not found.");
  const sorted = source.sort(selected, query.sort, projected);
  const start = (query.page - 1) * query.perPage;
  const page = sorted.slice(start, start + query.perPage);
  return {
    records: page.map((view) => {
      const record = source.get(query.module, view.id) as RecordData;
      const fields: Record<string, PortalFieldValue> = {};
      for (const [name] of projected)
        fields[name] = sanitize(source, query, bindings, record.fields[name] ?? null);
      return { id: view.id, fields };
    }),
    page: query.page,
    perPage: query.perPage,
    moreRecords: start + query.perPage < sorted.length,
  };
}
