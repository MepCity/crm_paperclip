"use client";

import type {
  Comparator,
  Criteria,
  CriteriaValue,
  FieldDefinition,
  ListView,
} from "@crm/core/records";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  deletePrivateView,
  getPrivateViews,
  savePrivateView,
  sendViewCommand,
} from "./custom-view-api";
import "./custom-view-dialog.css";

const COMPARATOR_OPTIONS: { value: Comparator; label: string }[] = [
  { value: "equal", label: "is" },
  { value: "not_equal", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "doesn't contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
  { value: "less_than", label: "less than" },
  { value: "greater_than", label: "greater than" },
  { value: "less_equal", label: "less or equal" },
  { value: "greater_equal", label: "greater or equal" },
  { value: "between", label: "between" },
  { value: "not_between", label: "not between" },
];

export interface CriterionDraft {
  id: string;
  field: string; // API name
  comparator: Comparator;
  value: string;
  rawTypedValue?: unknown;
  leafIndex?: number;
}

export interface CustomViewDialogProps {
  open: boolean;
  mode: "create" | "edit";
  module: string;
  orgSlug: string;
  userId?: string;
  isAdmin: boolean;
  expectedRevision: string;
  initial?: Partial<ListView> & { sharedTo?: "only_me" | "everyone" };
  fields: readonly (FieldDefinition & { id?: string })[];
  onSave?: (savedView: ListView & { sharedTo?: "only_me" | "everyone" }) => void;
  onDelete?: (viewId: string) => void;
  onClose: () => void;
}

function parseSingleCriterion(
  leaf: { field: string; comparator: Comparator; value: unknown },
  apiNameById: Map<string, string>,
  leafIndex?: number,
): CriterionDraft {
  const fieldName = apiNameById.get(leaf.field) ?? leaf.field;
  let valueStr = "";
  if (leaf.value !== null && leaf.value !== undefined) {
    if (Array.isArray(leaf.value)) {
      valueStr = leaf.value.join(", ");
    } else if (typeof leaf.value === "object") {
      valueStr = JSON.stringify(leaf.value);
    } else {
      valueStr = String(leaf.value);
    }
  }
  return {
    id: `crit-${leafIndex ?? 0}-${fieldName}-${leaf.comparator}-${Math.random()}`,
    field: fieldName,
    comparator: leaf.comparator,
    value: valueStr,
    rawTypedValue: leaf.value,
    leafIndex,
  };
}

function parseCriteriaDrafts(
  criteria: Criteria | null | undefined,
  apiNameById: Map<string, string>,
): {
  rows: CriterionDraft[];
  groupOperator: "and" | "or";
} {
  if (!criteria) return { rows: [], groupOperator: "and" };

  let nextIndex = 0;
  function parseNode(node: Criteria): CriterionDraft[] {
    if ("group" in node) {
      return node.group.flatMap((child) => {
        if ("group" in child) {
          return parseNode(child);
        }
        return [parseSingleCriterion(child, apiNameById, nextIndex++)];
      });
    }
    return [parseSingleCriterion(node, apiNameById, nextIndex++)];
  }

  const rows = parseNode(criteria);
  const operator = "group" in criteria && criteria.groupOperator ? criteria.groupOperator : "and";
  return { rows, groupOperator: operator };
}

function buildTypedValue(
  row: CriterionDraft,
  def?: FieldDefinition & { id?: string },
): CriteriaValue {
  if (row.comparator === "is_empty" || row.comparator === "is_not_empty") {
    return null;
  }
  if (def?.dataType === "boolean") {
    const normalized = row.value.trim().toLowerCase();
    if (normalized === "false" || normalized === "0") {
      return false;
    }
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (typeof row.rawTypedValue === "boolean") {
      return row.rawTypedValue;
    }
    return row.value === "true" || row.value === "1";
  }
  if (def && ["integer", "double", "currency", "percent", "bigint"].includes(def.dataType)) {
    if (row.comparator === "between" || row.comparator === "not_between") {
      const clean = row.value.replace(/^\[\s*|\s*\]$/g, "").trim();
      const parts = clean.split(/,\s*/).map((item) => {
        const num = Number(item);
        return Number.isNaN(num) ? item : num;
      });
      if (parts.length === 2 && parts.every((p) => typeof p === "number")) {
        return parts as [number, number];
      }
      if (Array.isArray(row.rawTypedValue) && row.rawTypedValue.length === 2) {
        return row.rawTypedValue as CriteriaValue;
      }
      return parts as CriteriaValue;
    }
    const num = Number(row.value);
    if (!Number.isNaN(num) && row.value.trim() !== "") {
      return num;
    }
    return row.value;
  }
  if (row.comparator === "between" || row.comparator === "not_between") {
    const clean = row.value.replace(/^\[\s*|\s*\]$/g, "").trim();
    if (Array.isArray(row.rawTypedValue) && clean === row.rawTypedValue.join(", ")) {
      return row.rawTypedValue as CriteriaValue;
    }
    return clean.split(/,\s*/);
  }
  if (
    typeof row.rawTypedValue === "object" &&
    row.rawTypedValue !== null &&
    (JSON.stringify(row.rawTypedValue) === row.value || row.value === "")
  ) {
    return row.rawTypedValue as CriteriaValue;
  }
  return row.value;
}

function countLeaves(node: Criteria): number {
  if ("group" in node) {
    return node.group.reduce((acc, c) => acc + countLeaves(c), 0);
  }
  return 1;
}

function rebuildCriteriaAst(
  originalAst: Criteria | null | undefined,
  rows: CriterionDraft[],
  groupOperator: "and" | "or",
  idByApiName: Map<string, string> | null,
  fieldByApiName: Map<string, FieldDefinition & { id?: string }>,
): Criteria | null {
  if (rows.length === 0) return null;

  const originalLeafCount = originalAst ? countLeaves(originalAst) : 0;

  function resolveField(name: string): string {
    if (!idByApiName) {
      return name.startsWith("field:") ? name.slice(6) : name;
    }
    return idByApiName.get(name) ?? name;
  }

  // Preserve nested AST if rows count matches original leaves
  if (originalAst && rows.length === originalLeafCount) {
    let currentLeafIndex = 0;
    function updateAst(node: Criteria): Criteria {
      if ("group" in node) {
        return {
          groupOperator: node.groupOperator ?? "and",
          group: node.group.map(updateAst),
        };
      }
      const row = rows[currentLeafIndex++];
      if (!row) return node;
      return {
        field: resolveField(row.field),
        comparator: row.comparator,
        value: buildTypedValue(row, fieldByApiName.get(row.field)),
      };
    }
    const updated = updateAst(originalAst);
    if ("group" in updated && updated.groupOperator !== groupOperator) {
      return { ...updated, groupOperator };
    }
    return updated;
  }

  // Flat construction
  if (rows.length === 1 && rows[0]) {
    const row = rows[0];
    return {
      field: resolveField(row.field),
      comparator: row.comparator,
      value: buildTypedValue(row, fieldByApiName.get(row.field)),
    };
  }

  return {
    groupOperator,
    group: rows.map((row) => ({
      field: resolveField(row.field),
      comparator: row.comparator,
      value: buildTypedValue(row, fieldByApiName.get(row.field)),
    })),
  };
}

export function CustomViewDialog(props: CustomViewDialogProps) {
  if (!props.open) return null;
  return <CustomViewDialogContent {...props} />;
}

function CustomViewDialogContent({
  mode,
  module,
  orgSlug,
  userId,
  isAdmin,
  expectedRevision,
  initial,
  fields,
  onSave,
  onDelete,
  onClose,
}: CustomViewDialogProps) {
  const titleId = useId();
  const isProtected = Boolean(initial?.systemDefined || initial?.isDefault);
  const effectiveUserId = userId || "default-user";

  // Field lookups: apiName <-> id
  const idByApiName = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of fields) {
      map.set(f.apiName, f.id ?? f.apiName);
    }
    return map;
  }, [fields]);

  const apiNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of fields) {
      if (f.id) map.set(f.id, f.apiName);
      map.set(f.apiName, f.apiName);
    }
    return map;
  }, [fields]);

  const fieldByApiName = useMemo(() => {
    const map = new Map<string, FieldDefinition & { id?: string }>();
    for (const f of fields) {
      map.set(f.apiName, f);
    }
    return map;
  }, [fields]);

  const [name, setName] = useState(initial?.name ?? "");
  const [sharedTo, setSharedTo] = useState<"only_me" | "everyone">(
    initial?.sharedTo ?? (isAdmin ? "everyone" : "only_me"),
  );

  const initialColumns = useMemo(() => {
    if (initial?.columns && initial.columns.length > 0) {
      return initial.columns.map((c) => apiNameById.get(c) ?? c);
    }
    const visible = fields.filter((f) => f.views?.view !== false);
    return (visible.length > 0 ? visible : fields).slice(0, 5).map((f) => f.apiName);
  }, [initial?.columns, fields, apiNameById]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(initialColumns);
  const [columnSearch, setColumnSearch] = useState("");

  const parsedCriteria = useMemo(
    () => parseCriteriaDrafts(initial?.criteria, apiNameById),
    [initial?.criteria, apiNameById],
  );

  const [criteriaRows, setCriteriaRows] = useState<CriterionDraft[]>(parsedCriteria.rows);
  const [groupOperator, setGroupOperator] = useState<"and" | "or">(parsedCriteria.groupOperator);

  // Preserve existing sort configuration if present
  const [sort] = useState<{ field: string; order: "asc" | "desc" } | null>(initial?.sort ?? null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableColumns = useMemo(() => {
    const q = columnSearch.trim().toLowerCase();
    return fields.filter((f) => {
      if (selectedColumns.includes(f.apiName)) return false;
      if (!q) return true;
      return f.label.toLowerCase().includes(q) || f.apiName.toLowerCase().includes(q);
    });
  }, [fields, selectedColumns, columnSearch]);

  function addColumn(apiName: string) {
    if (!selectedColumns.includes(apiName)) {
      setSelectedColumns([...selectedColumns, apiName]);
    }
  }

  function removeColumn(apiName: string) {
    setSelectedColumns(selectedColumns.filter((c) => c !== apiName));
  }

  function moveColumn(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedColumns.length) return;
    const next = [...selectedColumns];
    const item = next[index];
    const other = next[targetIndex];
    if (item && other) {
      next[index] = other;
      next[targetIndex] = item;
      setSelectedColumns(next);
    }
  }

  function addCriterion() {
    const defaultField =
      fields.find(
        (f) =>
          f.apiName === "Full_Name" ||
          f.apiName === "Last_Name" ||
          f.apiName === "Account_Name" ||
          f.apiName === "Deal_Name" ||
          f.apiName === "Subject",
      )?.apiName ??
      fields.find((f) => f.dataType === "text")?.apiName ??
      fields[0]?.apiName ??
      "";
    setCriteriaRows([
      ...criteriaRows,
      {
        id: `crit-${Date.now()}-${criteriaRows.length}`,
        field: defaultField,
        comparator: "equal",
        value: "",
        leafIndex: criteriaRows.length,
      },
    ]);
  }

  function updateCriterion(index: number, patch: Partial<CriterionDraft>) {
    setCriteriaRows(criteriaRows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeCriterion(index: number) {
    setCriteriaRows(criteriaRows.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (isProtected) {
      setError("protected_view: system and default views are immutable.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a custom view name.");
      return;
    }
    if (selectedColumns.length === 0) {
      setError("Select at least one column.");
      return;
    }

    setPending(true);
    setError(null);

    const isShared = isAdmin && sharedTo === "everyone";

    // Build criteria with typed values and preserved AST structure
    // Server commands for shared views use stable field IDs; private views use field API names
    const criteria = rebuildCriteriaAst(
      initial?.criteria,
      criteriaRows,
      groupOperator,
      isShared ? idByApiName : null,
      fieldByApiName,
    );

    // Stable column field IDs
    const columnIds = selectedColumns.map((c) => idByApiName.get(c) ?? c);
    const viewId = initial?.id ?? `view-${Date.now()}`;

    // Preserve sort by translating field name to stable ID if sort is present
    let sortPayload: { field: string; order: "asc" | "desc" } | null = null;
    if (sort) {
      sortPayload = {
        field: idByApiName.get(sort.field) ?? sort.field,
        order: sort.order,
      };
    }

    if (isShared) {
      const commandPayload =
        mode === "create"
          ? {
              type: "view.create" as const,
              view: {
                id: viewId,
                name: trimmedName,
                systemDefined: false as const,
                isDefault: false as const,
                columns: columnIds,
                criteria,
                sort: sortPayload,
              },
            }
          : {
              type: "view.patch" as const,
              view: {
                id: viewId,
                name: trimmedName,
                systemDefined: false as const,
                isDefault: false as const,
                columns: columnIds,
                criteria,
                sort: sortPayload,
              },
            };

      const res = await sendViewCommand(
        orgSlug,
        module,
        mode === "create" ? "POST" : "PATCH",
        expectedRevision,
        commandPayload,
        mode === "edit" ? viewId : undefined,
      );

      setPending(false);

      if (res.ok) {
        deletePrivateView(orgSlug, effectiveUserId, module, viewId);
        const savedView: ListView = res.view ?? {
          id: viewId,
          name: trimmedName,
          systemDefined: false,
          isDefault: false,
          columns: selectedColumns,
          criteria,
          sort,
        };
        onSave?.({ ...savedView, sharedTo: "everyone" });
        onClose();
        return;
      }

      if (res.fieldErrors?.view_field && res.fieldErrors.view_field.length > 0) {
        setError(
          `View references an inactive or unknown field: ${res.fieldErrors.view_field.join(", ")}`,
        );
      } else if (res.fieldErrors?.view?.includes("protected_view")) {
        setError("protected_view: system and default views are immutable.");
      } else {
        setError(res.message);
      }
      return;
    }

    // Private view save (admin "Only me" OR standard member)
    const privateSavedView: ListView & { sharedTo: "only_me" } = {
      id: viewId,
      name: trimmedName,
      systemDefined: false,
      isDefault: false,
      columns: selectedColumns,
      criteria,
      sort,
      sharedTo: "only_me",
    };

    savePrivateView(orgSlug, effectiveUserId, module, privateSavedView);
    setPending(false);
    onSave?.(privateSavedView);
    onClose();
  }

  async function handleDelete() {
    if (isProtected) {
      setError("protected_view: system and default views are immutable.");
      return;
    }
    const viewId = initial?.id;
    if (!viewId) return;

    setPending(true);
    setError(null);

    const isPrivate =
      initial?.sharedTo === "only_me" ||
      getPrivateViews(orgSlug, effectiveUserId, module).some((v) => v.id === viewId);

    if (isPrivate) {
      deletePrivateView(orgSlug, effectiveUserId, module, viewId);
      setPending(false);
      onDelete?.(viewId);
      onClose();
      return;
    }

    const res = await sendViewCommand(
      orgSlug,
      module,
      "DELETE",
      expectedRevision,
      { type: "view.delete" },
      viewId,
    );
    setPending(false);
    if (res.ok) {
      onDelete?.(viewId);
      onClose();
      return;
    }
    if (res.fieldErrors?.view?.includes("protected_view")) {
      setError("protected_view: system and default views are immutable.");
    } else {
      setError(res.message);
    }
  }

  return (
    <TopAlignedModal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      aria-labelledby={titleId}
      panelClassName="custom-view-panel"
    >
      <div className="custom-view-content" data-mode={mode}>
        <header className="custom-view-header">
          <h2 id={titleId} className="text-xl font-semibold">
            {mode === "create" ? "New Custom View" : `Edit Custom View - ${initial?.name ?? ""}`}
          </h2>
          <Button variant="ghost" size="listIcon" aria-label="Close Modal" onPress={onClose}>
            <Icons.close aria-hidden className="h-4 w-4" />
          </Button>
        </header>

        <div className="custom-view-body">
          {isProtected ? (
            <div
              role="alert"
              className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
            >
              Protected view: System and default views cannot be edited or deleted.
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          {/* View Name */}
          <div className="custom-view-section">
            <TextField
              label="Enter Custom View Name"
              value={name}
              onChange={setName}
              autoFocus
              isRequired
              isDisabled={isProtected || pending}
              placeholder="Enter Custom View Name"
            />
          </div>

          {/* Specify Criteria */}
          <div className="custom-view-section">
            <div className="flex items-center justify-between">
              <span className="custom-view-section-title">Specify Criteria - "{module}"</span>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={isProtected || pending}
                onPress={addCriterion}
              >
                Add Criterion
              </Button>
            </div>

            {criteriaRows.length > 1 ? (
              <div className="flex items-center gap-2 my-2 text-xs">
                <span className="text-text-muted">Combine criteria using:</span>
                <RadioGroup
                  label="Combine criteria using"
                  orientation="horizontal"
                  value={groupOperator}
                  onChange={(val) => setGroupOperator(val as "and" | "or")}
                  isDisabled={isProtected || pending}
                  options={[
                    { value: "and", label: "Match all (AND)" },
                    { value: "or", label: "Match any (OR)" },
                  ]}
                />
              </div>
            ) : null}

            {criteriaRows.length === 0 ? (
              <p className="text-sm text-text-muted">No criteria specified.</p>
            ) : (
              <div className="custom-view-criteria-list">
                {criteriaRows.map((row, index) => {
                  const isValueHidden =
                    row.comparator === "is_empty" || row.comparator === "is_not_empty";
                  return (
                    <div
                      key={row.id}
                      className="custom-view-criteria-row"
                      data-testid={`criterion-row-${index}`}
                    >
                      <span className="text-xs font-semibold text-text-muted w-4">{index + 1}</span>
                      <Select
                        label="Criterion Field"
                        hideLabel
                        aria-label={`Criterion ${index + 1} Field`}
                        items={fields.map((f) => ({ value: f.apiName, label: f.label }))}
                        value={row.field}
                        isDisabled={isProtected || pending}
                        onChange={(val) => updateCriterion(index, { field: String(val) })}
                      >
                        {(item) => <SelectItem id={item.value}>{item.label}</SelectItem>}
                      </Select>

                      <Select
                        label="Comparator"
                        hideLabel
                        aria-label={`Criterion ${index + 1} Comparator`}
                        items={COMPARATOR_OPTIONS}
                        value={row.comparator}
                        isDisabled={isProtected || pending}
                        onChange={(val) =>
                          updateCriterion(index, { comparator: String(val) as Comparator })
                        }
                      >
                        {(item) => <SelectItem id={item.value}>{item.label}</SelectItem>}
                      </Select>

                      {!isValueHidden ? (
                        <TextField
                          label="Value"
                          hideLabel
                          aria-label={`Criterion ${index + 1} Value`}
                          value={row.value}
                          isDisabled={isProtected || pending}
                          onChange={(val) => updateCriterion(index, { value: val })}
                          placeholder="Type here"
                        />
                      ) : null}

                      <Button
                        variant="ghost"
                        size="listIcon"
                        aria-label={`Remove criterion ${index + 1}`}
                        isDisabled={isProtected || pending}
                        onPress={() => removeCriterion(index)}
                      >
                        <Icons.close aria-hidden className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Choose Columns */}
          <div className="custom-view-section">
            <span className="custom-view-section-title">Choose Column for Default List View</span>
            <div className="custom-view-columns-container">
              {/* Available */}
              <div className="custom-view-column-box">
                <div className="custom-view-column-header">
                  <span>Available</span>
                  <TextField
                    label="Search available columns"
                    hideLabel
                    value={columnSearch}
                    onChange={setColumnSearch}
                    placeholder="Search"
                    className="mt-1"
                  />
                </div>
                <ul className="custom-view-column-list" aria-label="Available columns">
                  {availableColumns.map((f) => (
                    <li key={f.apiName}>
                      <button
                        type="button"
                        className="custom-view-column-item w-full text-left"
                        disabled={isProtected || pending}
                        onClick={() => addColumn(f.apiName)}
                      >
                        <span>{f.label}</span>
                        <Icons.plus aria-hidden className="h-3 w-3 text-text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selected */}
              <div className="custom-view-column-box">
                <div className="custom-view-column-header">Selected ({selectedColumns.length})</div>
                <ul className="custom-view-column-list" aria-label="Selected columns">
                  {selectedColumns.map((apiName, index) => {
                    const f = fields.find((item) => item.apiName === apiName);
                    const label = f?.label ?? apiName;
                    return (
                      <li key={apiName} className="custom-view-column-item">
                        <span>{label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Move ${label} up`}
                            disabled={index === 0 || isProtected || pending}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveColumn(index, -1);
                            }}
                            className="p-1 hover:text-primary disabled:opacity-30"
                          >
                            <Icons.chevronUp aria-hidden className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${label} down`}
                            disabled={
                              index === selectedColumns.length - 1 || isProtected || pending
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              moveColumn(index, 1);
                            }}
                            className="p-1 hover:text-primary disabled:opacity-30"
                          >
                            <Icons.chevronDown aria-hidden className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove column ${label}`}
                            disabled={isProtected || pending}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeColumn(apiName);
                            }}
                            className="p-1 hover:text-danger disabled:opacity-30"
                          >
                            <Icons.close aria-hidden className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Share this with: ONLY shown for admin! */}
          {isAdmin ? (
            <div className="custom-view-section" data-testid="sharing-section">
              <span className="custom-view-section-title">Share this with:</span>
              <RadioGroup
                label="Share this with"
                orientation="horizontal"
                value={sharedTo}
                onChange={(val) => setSharedTo(val as "only_me" | "everyone")}
                isDisabled={isProtected || pending}
                options={[
                  { value: "only_me", label: "Only me" },
                  { value: "everyone", label: "Everyone" },
                  { value: "selected_users", label: "Selected users", isDisabled: true },
                ]}
              />
            </div>
          ) : null}
        </div>

        <footer className="custom-view-footer">
          <div>
            {mode === "edit" ? (
              <Button variant="danger" isDisabled={isProtected || pending} onPress={handleDelete}>
                Delete View
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onPress={onClose} isDisabled={pending}>
              Cancel
            </Button>
            <Button isDisabled={isProtected || pending} isPending={pending} onPress={handleSave}>
              Save
            </Button>
          </div>
        </footer>
      </div>
    </TopAlignedModal>
  );
}
