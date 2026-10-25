"use client";

import type {
  Comparator,
  Criteria,
  CriteriaValue,
  FieldDefinition,
  ListView,
} from "@crm/core/records";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { sendViewCommand } from "./custom-view-api";
import "./custom-view-dialog.css";

export interface CriterionDraft {
  id: string;
  leafKey?: string;
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
  isLoadingRevision?: boolean;
  revisionError?: string | null;
  initial?: Partial<ListView>;
  fields: readonly (FieldDefinition & { id?: string })[];
  onSave?: (savedView: ListView) => void;
  onDelete?: (viewId: string) => void;
  onClose: () => void;
}

function parseSingleCriterion(
  leaf: { field: string; comparator: Comparator; value: unknown },
  apiNameById: Map<string, string>,
  path: string,
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
    id: `crit-${path}-${fieldName}-${leaf.comparator}-${leafIndex ?? 0}`,
    leafKey: path,
    field: fieldName,
    comparator: leaf.comparator,
    value: valueStr,
    rawTypedValue: leaf.value,
    leafIndex,
  };
}

export function parseCriteriaDrafts(
  criteria: Criteria | null | undefined,
  apiNameById: Map<string, string>,
): {
  rows: CriterionDraft[];
  groupOperator: "and" | "or";
} {
  if (!criteria) return { rows: [], groupOperator: "and" };

  let nextIndex = 0;
  function parseNode(node: Criteria, path: string): CriterionDraft[] {
    if ("group" in node) {
      return node.group.flatMap((child, index) => parseNode(child, `${path}_${index}`));
    }
    return [parseSingleCriterion(node, apiNameById, path, nextIndex++)];
  }

  const rows = parseNode(criteria, "0");
  const operator = "group" in criteria && criteria.groupOperator ? criteria.groupOperator : "and";
  return { rows, groupOperator: operator };
}

export function buildTypedValue(
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
    return false;
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

export function rebuildCriteriaAst(
  originalAst: Criteria | null | undefined,
  rows: CriterionDraft[],
  groupOperator: "and" | "or",
  idByApiName: Map<string, string> | null,
  fieldByApiName: Map<string, FieldDefinition & { id?: string }>,
): Criteria | null {
  if (rows.length === 0) return null;

  function resolveField(name: string): string {
    if (!idByApiName) {
      return name.startsWith("field:") ? name.slice(6) : name;
    }
    return idByApiName.get(name) ?? name;
  }

  function rowToLeaf(row: CriterionDraft): Criteria {
    return {
      field: resolveField(row.field),
      comparator: row.comparator,
      value: buildTypedValue(row, fieldByApiName.get(row.field)),
    };
  }

  // If no original AST:
  if (!originalAst) {
    if (rows.length === 1 && rows[0]) return rowToLeaf(rows[0]);
    return {
      groupOperator,
      group: rows.map(rowToLeaf),
    };
  }

  const rowByLeafKey = new Map<string, CriterionDraft>();
  const newRows: CriterionDraft[] = [];
  for (const r of rows) {
    if (r.leafKey) {
      rowByLeafKey.set(r.leafKey, r);
    } else {
      newRows.push(r);
    }
  }

  function updateNode(node: Criteria, path: string): Criteria | null {
    if ("group" in node) {
      const remaining: Criteria[] = [];
      for (let i = 0; i < node.group.length; i++) {
        const child = node.group[i];
        if (!child) continue;
        const updated = updateNode(child, `${path}_${i}`);
        if (updated) {
          remaining.push(updated);
        }
      }
      if (remaining.length === 0) return null;
      if (remaining.length === 1 && remaining[0]) {
        return remaining[0];
      }
      return {
        groupOperator: node.groupOperator ?? "and",
        group: remaining,
      };
    }

    const row = rowByLeafKey.get(path);
    if (!row) return null;
    return rowToLeaf(row);
  }

  const updatedTree = updateNode(originalAst, "0");
  const newLeaves = newRows.map(rowToLeaf);

  if (!updatedTree) {
    if (newLeaves.length === 0) return null;
    if (newLeaves.length === 1 && newLeaves[0]) return newLeaves[0];
    return { groupOperator, group: newLeaves };
  }

  const originalRootOp =
    originalAst && "group" in originalAst ? (originalAst.groupOperator ?? "and") : null;
  const operatorChangedByUser = originalRootOp !== null && groupOperator !== originalRootOp;

  if (newLeaves.length === 0) {
    if ("group" in updatedTree && operatorChangedByUser) {
      return { ...updatedTree, groupOperator };
    }
    return updatedTree;
  }

  if ("group" in updatedTree && updatedTree.groupOperator === groupOperator) {
    return {
      groupOperator,
      group: [...updatedTree.group, ...newLeaves],
    };
  }

  return {
    groupOperator,
    group: [updatedTree, ...newLeaves],
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
  isAdmin,
  expectedRevision,
  isLoadingRevision,
  revisionError,
  initial,
  fields,
  onSave,
  onDelete,
  onClose,
}: CustomViewDialogProps) {
  const titleId = useId();
  const isProtected = Boolean(initial?.systemDefined || initial?.isDefault);

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
  const [sharedTo, setSharedTo] = useState<"everyone" | "only_me">("everyone");

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

  const t = useUiTranslations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comparatorOptions = useMemo(
    () => [
      { value: "equal" as const, label: t("common.customViews.comparators.equal") },
      { value: "not_equal" as const, label: t("common.customViews.comparators.notEqual") },
      { value: "contains" as const, label: t("common.customViews.comparators.contains") },
      { value: "not_contains" as const, label: t("common.customViews.comparators.notContains") },
      { value: "starts_with" as const, label: t("common.customViews.comparators.startsWith") },
      { value: "ends_with" as const, label: t("common.customViews.comparators.endsWith") },
      { value: "is_empty" as const, label: t("common.customViews.comparators.isEmpty") },
      { value: "is_not_empty" as const, label: t("common.customViews.comparators.isNotEmpty") },
      { value: "less_than" as const, label: t("common.customViews.comparators.lessThan") },
      { value: "greater_than" as const, label: t("common.customViews.comparators.greaterThan") },
      { value: "less_equal" as const, label: t("common.customViews.comparators.lessEqual") },
      { value: "greater_equal" as const, label: t("common.customViews.comparators.greaterEqual") },
      { value: "between" as const, label: t("common.customViews.comparators.between") },
      { value: "not_between" as const, label: t("common.customViews.comparators.notBetween") },
    ],
    [t],
  );

  const sharingOptions = useMemo(
    () => [
      { value: "everyone", label: t("common.customViews.everyone") },
      { value: "only_me", label: t("common.customViews.onlyMe"), isDisabled: true },
      { value: "selected_users", label: t("common.customViews.selectedUsers"), isDisabled: true },
    ],
    [t],
  );

  const groupOperatorOptions = useMemo(
    () => [
      { value: "and", label: t("common.customViews.matchAllAnd") },
      { value: "or", label: t("common.customViews.matchAnyOr") },
    ],
    [t],
  );

  const isActionDisabled =
    isProtected ||
    pending ||
    Boolean(isLoadingRevision) ||
    !expectedRevision ||
    Boolean(revisionError);

  const hasFieldIds = useMemo(() => fields.some((f) => Boolean(f.id)), [fields]);
  const hasSyncedInitial = useRef(false);

  useEffect(() => {
    if (hasFieldIds && !hasSyncedInitial.current) {
      hasSyncedInitial.current = true;
      if (initial?.columns && initial.columns.length > 0) {
        setSelectedColumns(initial.columns.map((c) => apiNameById.get(c) ?? c));
      }
      if (initial?.criteria) {
        const parsed = parseCriteriaDrafts(initial.criteria, apiNameById);
        setCriteriaRows(parsed.rows);
        setGroupOperator(parsed.groupOperator);
      }
    }
  }, [hasFieldIds, initial, apiNameById]);

  useEffect(() => {
    if (mode === "create" && selectedColumns.length === 0 && fields.length > 0) {
      const visible = fields.filter((f) => f.views?.view !== false);
      setSelectedColumns((visible.length > 0 ? visible : fields).slice(0, 5).map((f) => f.apiName));
    }
  }, [mode, selectedColumns.length, fields]);

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
    if (isLoadingRevision || !expectedRevision) {
      return;
    }
    if (revisionError) {
      setError(t("common.customViews.errors.metadataFailed", { error: revisionError }));
      return;
    }
    if (isProtected) {
      setError(t("common.customViews.errors.protectedView"));
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("common.customViews.errors.enterName"));
      return;
    }
    if (selectedColumns.length === 0) {
      setError(t("common.customViews.errors.selectColumn"));
      return;
    }

    if (sharedTo === "only_me") {
      setError(t("common.customViews.errors.privateUnsupported"));
      return;
    }

    setPending(true);
    setError(null);

    // Build criteria with typed values and preserved AST structure using stable field IDs
    const criteria = rebuildCriteriaAst(
      initial?.criteria,
      criteriaRows,
      groupOperator,
      idByApiName,
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
      const savedView: ListView = res.view ?? {
        id: viewId,
        name: trimmedName,
        systemDefined: false,
        isDefault: false,
        columns: selectedColumns,
        criteria,
        sort,
      };
      onSave?.(savedView);
      onClose();
      return;
    }

    if (res.fieldErrors?.view_field && res.fieldErrors.view_field.length > 0) {
      setError(
        t("common.customViews.errors.inactiveField", {
          fields: res.fieldErrors.view_field.join(", "),
        }),
      );
    } else if (res.fieldErrors?.view?.includes("protected_view")) {
      setError(t("common.customViews.errors.protectedView"));
    } else {
      setError(res.message);
    }
  }

  async function handleDelete() {
    if (isLoadingRevision || !expectedRevision) {
      return;
    }
    if (revisionError) {
      setError(t("common.customViews.errors.metadataFailed", { error: revisionError }));
      return;
    }
    if (isProtected) {
      setError(t("common.customViews.errors.protectedView"));
      return;
    }
    const viewId = initial?.id;
    if (!viewId) return;

    setPending(true);
    setError(null);

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
      setError(t("common.customViews.errors.protectedView"));
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
            {mode === "create"
              ? t("common.customViews.newView")
              : t("common.customViews.editView", { name: initial?.name ?? "" })}
          </h2>
          <Button
            variant="ghost"
            size="listIcon"
            aria-label={t("common.customViews.closeModal")}
            onPress={onClose}
          >
            <Icons.close aria-hidden className="h-4 w-4" />
          </Button>
        </header>

        <div className="custom-view-body">
          {isProtected ? (
            <div
              role="alert"
              className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
            >
              {t("common.customViews.protectedViewWarning")}
            </div>
          ) : null}

          {revisionError ? (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            >
              {t("common.customViews.loadMetadataError")} {revisionError}
            </div>
          ) : null}

          {error && !revisionError ? (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          {isLoadingRevision && !revisionError ? (
            <div
              role="status"
              className="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-text-muted"
            >
              {t("common.customViews.loadingMetadata")}
            </div>
          ) : null}

          {/* View Name */}
          <div className="custom-view-section">
            <TextField
              label={t("common.customViews.viewNameLabel")}
              value={name}
              onChange={setName}
              autoFocus
              isRequired
              isDisabled={isProtected || pending}
              placeholder={t("common.customViews.viewNamePlaceholder")}
            />
          </div>

          {/* Specify Criteria */}
          <div className="custom-view-section">
            <div className="flex items-center justify-between">
              <span className="custom-view-section-title">
                {t("common.customViews.specifyCriteria")} - "{module}"
              </span>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={isProtected || pending}
                onPress={addCriterion}
              >
                {t("common.customViews.addCriterion")}
              </Button>
            </div>

            {criteriaRows.length > 1 ? (
              <div className="flex items-center gap-2 my-2 text-xs">
                <span className="text-text-muted">
                  {t("common.customViews.combineCriteriaPrompt")}
                </span>
                <RadioGroup
                  label={t("common.customViews.combineCriteriaLabel")}
                  orientation="horizontal"
                  value={groupOperator}
                  onChange={(val) => setGroupOperator(val as "and" | "or")}
                  isDisabled={isProtected || pending}
                  options={groupOperatorOptions}
                />
              </div>
            ) : null}

            {criteriaRows.length === 0 ? (
              <p className="text-sm text-text-muted">{t("common.customViews.noCriteria")}</p>
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
                        label={t("common.customViews.criterionField")}
                        hideLabel
                        aria-label={t("common.customViews.criterionFieldAria", {
                          index: index + 1,
                        })}
                        items={fields.map((f) => ({ value: f.apiName, label: f.label }))}
                        value={row.field}
                        isDisabled={isProtected || pending}
                        onChange={(val) => updateCriterion(index, { field: String(val) })}
                      >
                        {(item) => <SelectItem id={item.value}>{item.label}</SelectItem>}
                      </Select>

                      <Select
                        label={t("common.customViews.comparator")}
                        hideLabel
                        aria-label={t("common.customViews.criterionComparatorAria", {
                          index: index + 1,
                        })}
                        items={comparatorOptions}
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
                          label={t("common.customViews.value")}
                          hideLabel
                          aria-label={t("common.customViews.criterionValueAria", {
                            index: index + 1,
                          })}
                          value={row.value}
                          isDisabled={isProtected || pending}
                          onChange={(val) => updateCriterion(index, { value: val })}
                          placeholder={t("common.customViews.typeHere")}
                        />
                      ) : null}

                      <Button
                        variant="ghost"
                        size="listIcon"
                        aria-label={t("common.customViews.removeCriterionAria", {
                          index: index + 1,
                        })}
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
            <span className="custom-view-section-title">
              {t("common.customViews.chooseColumns")}
            </span>
            <div className="custom-view-columns-container">
              {/* Available */}
              <div className="custom-view-column-box">
                <div className="custom-view-column-header">
                  <span>{t("common.customViews.available")}</span>
                  <TextField
                    label={t("common.customViews.searchAvailableColumns")}
                    hideLabel
                    value={columnSearch}
                    onChange={setColumnSearch}
                    placeholder={t("common.actions.search")}
                    className="mt-1"
                  />
                </div>
                <ul
                  className="custom-view-column-list"
                  aria-label={t("common.customViews.availableColumns")}
                >
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
                <div className="custom-view-column-header">
                  {t("common.customViews.selected")} ({selectedColumns.length})
                </div>
                <ul
                  className="custom-view-column-list"
                  aria-label={t("common.customViews.selectedColumns")}
                >
                  {selectedColumns.map((apiName, index) => {
                    const f = fields.find((item) => item.apiName === apiName);
                    const label = f?.label ?? apiName;
                    return (
                      <li key={apiName} className="custom-view-column-item">
                        <span>{label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={t("common.customViews.moveColumnUp", { label })}
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
                            aria-label={t("common.customViews.moveColumnDown", { label })}
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
                            aria-label={t("common.customViews.removeColumn", { label })}
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

          {/* Share this with: ONLY shown for admin */}
          {isAdmin ? (
            <div className="custom-view-section" data-testid="sharing-section">
              <span className="custom-view-section-title">
                {t("common.customViews.shareWithPrompt")}
              </span>
              <RadioGroup
                label={t("common.customViews.shareWithLabel")}
                orientation="horizontal"
                value={sharedTo}
                onChange={(val) => {
                  if (val === "only_me") {
                    setError(t("common.customViews.errors.privateUnsupported"));
                    return;
                  }
                  setError(null);
                  setSharedTo(val as "everyone");
                }}
                isDisabled={isProtected || pending}
                options={sharingOptions}
              />
            </div>
          ) : null}
        </div>

        <footer className="custom-view-footer">
          <div>
            {mode === "edit" ? (
              <Button variant="danger" isDisabled={isActionDisabled} onPress={handleDelete}>
                {t("common.customViews.deleteView")}
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onPress={onClose} isDisabled={pending}>
              {t("common.actions.cancel")}
            </Button>
            <Button isDisabled={isActionDisabled} isPending={pending} onPress={handleSave}>
              {t("common.actions.save")}
            </Button>
          </div>
        </footer>
      </div>
    </TopAlignedModal>
  );
}
