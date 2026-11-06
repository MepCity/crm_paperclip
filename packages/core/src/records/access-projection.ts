import type {
  Criteria,
  FieldDefinition,
  LayoutSection,
  ListView,
  ModuleMetadata,
} from "./contract";

/** What the viewer may not see or change in a module (ADR 0017 §8, per-field bullet). */
export interface FieldRestrictions {
  hidden: ReadonlySet<string>;
  readOnly: ReadonlySet<string>;
}

/** Drops criteria nodes on hidden fields; empty groups vanish, a lone child stays grouped. */
function pruneCriteria(node: Criteria | null, hidden: ReadonlySet<string>): Criteria | null {
  if (!node) return null;
  if (!("group" in node)) return hidden.has(node.field) ? null : node;
  const group = node.group.flatMap((child) => {
    const kept = pruneCriteria(child, hidden);
    return kept ? [kept] : [];
  });
  return group.length ? { ...node, group } : null;
}

/** Saved views never reference a field the viewer cannot see (dropped, not refused). */
export function projectViewForViewer<T extends ListView>(view: T, hidden: ReadonlySet<string>): T {
  if (hidden.size === 0) return view;
  return {
    ...view,
    columns: view.columns.filter((name) => !hidden.has(name)),
    criteria: pruneCriteria(view.criteria, hidden),
    sort: view.sort && hidden.has(view.sort.field) ? null : view.sort,
  };
}

/** Viewer-aware metadata: hidden fields are omitted, read-only fields are marked `readOnly`. */
export function projectMetadataForViewer<
  T extends ModuleMetadata & { fields: readonly FieldDefinition[] },
>(metadata: T, { hidden, readOnly }: FieldRestrictions): T {
  if (hidden.size === 0 && readOnly.size === 0) return metadata;
  const layout: LayoutSection[] = metadata.layout.map((section) => ({
    ...section,
    columns: section.columns.map((column) => column.filter((name) => !hidden.has(name))),
    fields: section.fields.filter((name) => !hidden.has(name)),
  }));
  return {
    ...metadata,
    businessCardFields: metadata.businessCardFields.filter((name) => !hidden.has(name)),
    fields: metadata.fields
      .filter((field) => !hidden.has(field.apiName))
      .map((field) => (readOnly.has(field.apiName) ? { ...field, readOnly: true } : field)),
    layout,
  };
}
