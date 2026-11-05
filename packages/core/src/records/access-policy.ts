import {
  type AccessLevel,
  type AccessSnapshot,
  can,
  fieldAccess,
  isCatalogueModule,
  levelAllows,
  type ModuleAction,
  type RecordOperation,
  recordLevel,
} from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import type { Criteria, FieldValue, SortSpec } from "./contract";

export type ModuleTool = "convert" | "findAndMerge" | "changeOwner" | "massUpdate" | "massDelete";

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
  /** Profile gate for a module action (ADR 0017 §4.1). */
  can(module: string, action: ModuleAction): boolean;
  /** Module-list tool permission (`tools.convert`, `tools.findAndMerge`, ...). */
  tool(name: ModuleTool, module: string): boolean;
  /** Hidden fields are refused; read-only fields only when the value changes (403 `field_forbidden`). */
  assertWrite(
    module: string,
    input: Readonly<Record<string, FieldValue>>,
    stored?: Readonly<Record<string, FieldValue>>,
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

/**
 * Resolves the level of a child record (Notes, Attachments) from its parent. `levelOf` is the
 * checker's own recursive level function; return `undefined` for modules that are not children.
 */
export type ChildLevelResolver = (
  module: string,
  fields: Readonly<Record<string, FieldValue>>,
  levelOf: (module: string, fields: Readonly<Record<string, FieldValue>>) => AccessLevel,
) => AccessLevel | undefined;

export function createRecordAccessChecker(
  snapshot: AccessSnapshot,
  resolveChild?: ChildLevelResolver,
): RecordAccessChecker {
  const hiddenCache = new Map<string, ReadonlySet<string>>();
  const readOnlyCache = new Map<string, ReadonlySet<string>>();
  const collect = (module: string, mode: "hidden" | "read_only") => {
    const found = new Set<string>();
    for (const field of snapshot.fieldAccess.get(module)?.keys() ?? [])
      if (fieldAccess(snapshot, module, field) === mode) found.add(field);
    return found;
  };
  const level: RecordAccessChecker["level"] = (module, fields) => {
    // Child modules (Notes, Attachments) follow their parent record (ADR 0017 §4.3 item 5).
    const child = resolveChild?.(module, fields, level);
    if (child) return child;
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
    can: (module, action) => can(snapshot, module, action),
    tool(name, module) {
      if (snapshot.profileKind === "administrator") return true;
      return (snapshot.permissions.tools[name] as readonly string[]).includes(module);
    },
    assertWrite(module, input, stored) {
      const hidden = checker.hiddenFields(module);
      const readOnly = checker.readOnlyFields(module);
      for (const [name, value] of Object.entries(input)) {
        if (hidden.has(name)) throw new ForbiddenError(undefined, "field_forbidden");
        if (
          readOnly.has(name) &&
          JSON.stringify(value ?? null) !== JSON.stringify(stored?.[name] ?? null)
        )
          throw new ForbiddenError(undefined, "field_forbidden");
      }
    },
    hiddenFields(module) {
      const cached = hiddenCache.get(module);
      if (cached) return cached;
      const set = collect(module, "hidden");
      hiddenCache.set(module, set);
      return set;
    },
    readOnlyFields(module) {
      const cached = readOnlyCache.get(module);
      if (cached) return cached;
      const set = collect(module, "read_only");
      readOnlyCache.set(module, set);
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
      const have = level(module, record.fields);
      const $access = have === "none" ? undefined : have;
      const fields =
        hidden.size === 0
          ? record.fields
          : Object.fromEntries(Object.entries(record.fields).filter(([name]) => !hidden.has(name)));
      return $access ? { ...record, fields, $access } : { ...record, fields };
    },
  };
  return checker;
}
