import {
  type AccessLevel,
  type AccessSnapshot,
  fieldAccess,
  isCatalogueModule,
  levelAllows,
  type RecordOperation,
  recordLevel,
} from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import type { Criteria, FieldValue, SortSpec } from "./contract";

/** Loads the viewer's access snapshot lazily (the fixture service is built synchronously). */
export type RecordAccessSource = () => Promise<AccessSnapshot>;

/** Per-request decisions of ADR 0017 §4 over one snapshot. */
export interface RecordAccessChecker {
  /** Access level the viewer has on a stored record (owner semantics of its module). */
  level(module: string, fields: Readonly<Record<string, FieldValue>>): AccessLevel;
  /** True when the record is at least readable. */
  visible(module: string, fields: Readonly<Record<string, FieldValue>>): boolean;
  /** 404 when invisible, 403 `permission_denied` when readable but too low for `operation`. */
  assert(
    module: string,
    fields: Readonly<Record<string, FieldValue>>,
    operation: RecordOperation,
  ): void;
  hiddenFields(module: string): ReadonlySet<string>;
  readOnlyFields(module: string): ReadonlySet<string>;
  /** Hidden fields in filters, sort or group-by are rejected (403 `field_forbidden`). */
  assertCriteria(module: string, criteria?: Criteria, sort?: SortSpec, groupBy?: string): void;
  /** Removes hidden fields from a payload copy. */
  project<T extends { fields: Record<string, FieldValue> }>(module: string, record: T): T;
}

function ownerOf(fields: Readonly<Record<string, FieldValue>>): string | null {
  const owner = fields.Owner;
  if (typeof owner === "string") return owner;
  if (owner && typeof owner === "object" && "id" in owner && typeof owner.id === "string")
    return owner.id;
  return null;
}

export function createRecordAccessChecker(snapshot: AccessSnapshot): RecordAccessChecker {
  const hiddenCache = new Map<string, ReadonlySet<string>>();
  const readOnlyCache = new Map<string, ReadonlySet<string>>();
  const collect = (module: string, mode: "hidden" | "read_only") => {
    const found = new Set<string>();
    for (const field of snapshot.fieldAccess.get(module)?.keys() ?? [])
      if (fieldAccess(snapshot, module, field) === mode) found.add(field);
    return found;
  };
  const level: RecordAccessChecker["level"] = (module, fields) => {
    // Child modules (Notes, Attachments, line items) follow their parent record; the parent
    // check happens where the parent is resolved, so they pass here.
    if (!isCatalogueModule(module)) return "read_write_delete";
    return recordLevel(snapshot, module, ownerOf(fields));
  };
  const checker: RecordAccessChecker = {
    level,
    visible: (module, fields) => level(module, fields) !== "none",
    assert(module, fields, operation) {
      const have = level(module, fields);
      if (have === "none") throw new NotFoundError("Record not found.");
      if (!levelAllows(have, operation)) throw new ForbiddenError(undefined, "permission_denied");
    },
    hiddenFields(module) {
      let set = hiddenCache.get(module);
      if (!set) hiddenCache.set(module, (set = collect(module, "hidden")));
      return set;
    },
    readOnlyFields(module) {
      let set = readOnlyCache.get(module);
      if (!set) readOnlyCache.set(module, (set = collect(module, "read_only")));
      return set;
    },
    assertCriteria(module, criteria, sort, groupBy) {
      const hidden = checker.hiddenFields(module);
      if (hidden.size === 0) return;
      const used: string[] = [];
      const walk = (node: Criteria | undefined) => {
        if (!node) return;
        if ("group" in node) for (const child of node.group) walk(child);
        else used.push(node.field);
      };
      walk(criteria);
      if (sort) used.push(sort.field);
      if (groupBy) used.push(groupBy);
      if (used.some((name) => hidden.has(name)))
        throw new ForbiddenError(undefined, "field_forbidden");
    },
    project(module, record) {
      const hidden = checker.hiddenFields(module);
      if (hidden.size === 0) return record;
      const fields = Object.fromEntries(
        Object.entries(record.fields).filter(([name]) => !hidden.has(name)),
      );
      return { ...record, fields };
    },
  };
  return checker;
}
