"use client";

import type { Comparator, Criteria, FieldDefinition, ListView } from "@crm/core/records";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { deletePrivateView, savePrivateView, sendViewCommand } from "./custom-view-api";
import "./custom-view-dialog.css";

export const COMPARATOR_OPTIONS = [
  { value: "equal", label: "is" },
  { value: "not_equal", label: "isn't" },
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
] as const;

export interface CriterionDraft {
  id: string;
  field: string;
  comparator: string;
  value: string;
}

export interface CustomViewDialogProps {
  open: boolean;
  mode: "create" | "edit";
  module: string;
  orgSlug: string;
  isAdmin: boolean;
  expectedRevision: string;
  initial?: Partial<ListView> & { sharedTo?: "only_me" | "everyone" };
  fields: readonly (FieldDefinition & { id?: string })[];
  onSave?: (savedView: ListView) => void;
  onDelete?: (viewId: string) => void;
  onClose: () => void;
}

function parseCriteriaDrafts(
  criteria: Criteria | null | undefined,
  fieldMap: Map<string, string>,
): CriterionDraft[] {
  if (!criteria) return [];
  if ("group" in criteria) {
    return criteria.group.flatMap((c) => parseCriteriaDrafts(c, fieldMap));
  }
  const fieldName = fieldMap.get(criteria.field) ?? criteria.field;
  const valueStr =
    criteria.value === null || criteria.value === undefined
      ? ""
      : typeof criteria.value === "object"
        ? JSON.stringify(criteria.value)
        : String(criteria.value);
  return [
    {
      id: `crit-${fieldName}-${criteria.comparator}-${Math.random()}`,
      field: fieldName,
      comparator: criteria.comparator,
      value: valueStr,
    },
  ];
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

  const [name, setName] = useState(initial?.name ?? "");
  const [sharedTo, setSharedTo] = useState<"only_me" | "everyone">(
    initial?.sharedTo ?? (isAdmin ? "everyone" : "only_me"),
  );

  const initialColumns = useMemo(() => {
    if (initial?.columns && initial.columns.length > 0) {
      return initial.columns.map((c) => apiNameById.get(c) ?? c);
    }
    return fields.slice(0, 5).map((f) => f.apiName);
  }, [initial?.columns, fields, apiNameById]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(initialColumns);
  const [columnSearch, setColumnSearch] = useState("");

  const [criteriaRows, setCriteriaRows] = useState<CriterionDraft[]>(() =>
    parseCriteriaDrafts(initial?.criteria, apiNameById),
  );

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
    const firstField = fields[0]?.apiName ?? "";
    setCriteriaRows([
      ...criteriaRows,
      {
        id: `crit-${Date.now()}-${criteriaRows.length}`,
        field: firstField,
        comparator: "equal",
        value: "",
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

    // Build criteria
    let criteria: Criteria | null = null;
    if (criteriaRows.length === 1 && criteriaRows[0]) {
      const row = criteriaRows[0];
      const fieldRef = idByApiName.get(row.field) ?? row.field;
      criteria = {
        field: fieldRef,
        comparator: row.comparator as Comparator,
        value: row.value,
      };
    } else if (criteriaRows.length > 1) {
      criteria = {
        groupOperator: "and",
        group: criteriaRows.map((row) => ({
          field: idByApiName.get(row.field) ?? row.field,
          comparator: row.comparator as Comparator,
          value: row.value,
        })),
      };
    }

    // Stable column field IDs
    const columnIds = selectedColumns.map((c) => idByApiName.get(c) ?? c);
    const viewId = initial?.id ?? `view-${Date.now()}`;

    // Admin saving shared view: write to /crm/v9/settings/custom_views
    if (isAdmin && sharedTo === "everyone") {
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
                sort: null,
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
                sort: null,
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
          sort: null,
        };
        onSave?.(savedView);
        onClose();
        return;
      }

      if (res.fieldErrors) {
        if (res.fieldErrors.view_field) {
          setError(
            `View references an inactive or unknown field: ${res.fieldErrors.view_field.join(", ")}`,
          );
        } else if (res.fieldErrors.view) {
          setError("protected_view: system and default views are immutable.");
        } else {
          setError(res.message);
        }
      } else {
        setError(res.message);
      }
      return;
    }

    // Private view save (Member or Admin choosing "Only me")
    const privateView: ListView = {
      id: viewId,
      name: trimmedName,
      systemDefined: false,
      isDefault: false,
      columns: selectedColumns,
      criteria,
      sort: null,
    };
    savePrivateView(orgSlug, module, privateView);
    setPending(false);
    onSave?.(privateView);
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

    if (isAdmin && sharedTo === "everyone") {
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
      if (res.fieldErrors?.view) {
        setError("protected_view: system and default views are immutable.");
      } else {
        setError(res.message);
      }
      return;
    }

    deletePrivateView(orgSlug, module, viewId);
    setPending(false);
    onDelete?.(viewId);
    onClose();
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
                        onChange={(val) => updateCriterion(index, { comparator: String(val) })}
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
