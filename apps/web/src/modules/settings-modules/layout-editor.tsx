"use client";

import type { CustomizationField, LayoutDefinition } from "@crm/core/customization";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Columns2,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  addSection,
  hideField,
  moveFieldInColumn,
  moveFieldToColumn,
  placeField,
  removeSection,
  renameSection,
  reorderSection,
  saveLayout,
  setSectionColumnCount,
} from "./layouts-api";

export function LayoutEditor({
  orgSlug,
  module,
  initialLayout,
  fields,
  initialRevision,
  onCancel,
  onSaved,
}: {
  orgSlug: string;
  module: string;
  initialLayout: LayoutDefinition;
  fields: CustomizationField[];
  initialRevision: string;
  onCancel: () => void;
  onSaved?: (layout: LayoutDefinition, nextRevision: string) => void;
}) {
  const [layout, setLayout] = useState<LayoutDefinition>(initialLayout);
  const [revision, setRevision] = useState(initialRevision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; stale?: boolean } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionColumns, setNewSectionColumns] = useState<1 | 2>(2);

  // Map of field metadata by ID
  const fieldsById = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);

  // Find placed vs unplaced fields
  const placedFieldIds = useMemo(() => {
    return new Set(layout.sections.flatMap((s) => s.columns.flat()));
  }, [layout]);

  const unplacedFields = useMemo(() => {
    return fields.filter((f) => !placedFieldIds.has(f.id));
  }, [fields, placedFieldIds]);

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    const result = await saveLayout(orgSlug, module, revision, layout);
    setSaving(false);

    if (result.ok) {
      setRevision(result.revision);
      setSuccess("Layout saved successfully.");
      onSaved?.(layout, result.revision);
    } else {
      setError({ message: result.message, stale: result.stale });
    }
  }

  function handleAddSection() {
    if (!newSectionLabel.trim()) return;
    setLayout((prev) => addSection(prev, newSectionLabel, newSectionColumns));
    setNewSectionLabel("");
    setAddingSection(false);
  }

  return (
    <div className="flex flex-col gap-6" data-layout-editor>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm font-semibold text-text hover:text-text-muted"
            aria-label="Back to Layouts"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Layouts
          </button>
          <span className="text-text-muted">/</span>
          <h2 className="text-lg font-semibold text-text">{layout.label || "Standard"} Layout</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-text hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-text hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">{error.message}</p>
            {error.stale ? (
              <p className="mt-1 text-xs opacity-90">
                Your unsaved changes in this editor are preserved. When ready, click &quot;Save
                Layout&quot; to attempt saving again.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success"
        >
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <p className="font-semibold">{success}</p>
        </div>
      ) : null}

      {/* Main Grid: Layout Canvas on Left, Available Fields on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Sections (2 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text">Sections</h3>
            {!addingSection ? (
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-text hover:bg-surface-muted"
                aria-label="Add Section"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add Section
              </button>
            ) : null}
          </div>

          {/* Add Section Form */}
          {addingSection ? (
            <div className="rounded-lg border border-border bg-surface-muted p-4">
              <h4 className="mb-3 text-sm font-semibold text-text">New Section</h4>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  aria-label="New Section Name"
                  placeholder="Section Name"
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Columns:</span>
                  <button
                    type="button"
                    onClick={() => setNewSectionColumns(1)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${newSectionColumns === 1 ? "bg-primary text-primary-text" : "border border-border bg-surface text-text"}`}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSectionColumns(2)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${newSectionColumns === 2 ? "bg-primary text-primary-text" : "border border-border bg-surface text-text"}`}
                  >
                    2
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={!newSectionLabel.trim()}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-text hover:bg-primary/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSection(false);
                      setNewSectionLabel("");
                    }}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Sections List */}
          <div className="flex flex-col gap-5">
            {layout.sections.map((section, sIdx) => (
              <div
                key={section.id}
                className="rounded-lg border border-border bg-surface p-4 shadow-2xs"
                data-section={section.id}
              >
                {/* Section Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      aria-label={`Section Name ${section.label}`}
                      value={section.label}
                      onChange={(e) =>
                        setLayout((prev) => renameSection(prev, section.id, e.target.value))
                      }
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm font-semibold text-text focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  {/* Section Controls */}
                  <div className="flex items-center gap-2">
                    {/* Columns Selector */}
                    <div className="flex items-center gap-1 border-r border-border pr-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLayout((prev) => setSectionColumnCount(prev, section.id, 1))
                        }
                        aria-label={`Set ${section.label} to 1 column`}
                        aria-pressed={section.columnCount === 1}
                        className={`rounded px-2 py-1 text-xs font-semibold ${section.columnCount === 1 ? "bg-primary text-primary-text" : "text-text-muted hover:text-text"}`}
                      >
                        1 Col
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLayout((prev) => setSectionColumnCount(prev, section.id, 2))
                        }
                        aria-label={`Set ${section.label} to 2 columns`}
                        aria-pressed={section.columnCount === 2}
                        className={`rounded px-2 py-1 text-xs font-semibold ${section.columnCount === 2 ? "bg-primary text-primary-text" : "text-text-muted hover:text-text"}`}
                      >
                        <Columns2 className="inline size-3.5 mr-1" aria-hidden="true" />2 Col
                      </button>
                    </div>

                    {/* Move Up / Down */}
                    <button
                      type="button"
                      disabled={sIdx === 0}
                      onClick={() => setLayout((prev) => reorderSection(prev, sIdx, sIdx - 1))}
                      aria-label={`Move section ${section.label} up`}
                      className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={sIdx === layout.sections.length - 1}
                      onClick={() => setLayout((prev) => reorderSection(prev, sIdx, sIdx + 1))}
                      aria-label={`Move section ${section.label} down`}
                      className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>

                    {/* Delete Section */}
                    {layout.sections.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setLayout((prev) => removeSection(prev, section.id))}
                        aria-label={`Delete section ${section.label}`}
                        className="rounded p-1 text-error/70 hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Section Columns */}
                <div
                  className={`grid gap-4 ${section.columnCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                >
                  {section.columns.map((column, colIdx) => (
                    <div
                      key={colIdx === 0 ? `${section.id}-left` : `${section.id}-right`}
                      className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-surface-muted/40 p-2.5 min-h-[100px]"
                      data-column={colIdx}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-text-muted px-1">
                        <span>Column {colIdx + 1}</span>
                        <span>{column.length} fields</span>
                      </div>

                      {column.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-3 text-xs italic text-text-muted">
                          Drop or place fields here
                        </div>
                      ) : (
                        column.map((fieldId, fIdx) => {
                          const field = fieldsById.get(fieldId);
                          const fieldLabel = field?.label || fieldId;
                          const isRequired = Boolean(field?.required);

                          return (
                            <div
                              key={fieldId}
                              className="flex items-center justify-between rounded-md border border-border bg-surface p-2 shadow-2xs hover:border-primary/50"
                              data-field-id={fieldId}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate text-xs font-semibold text-text">
                                    {fieldLabel}
                                  </span>
                                  {isRequired ? (
                                    <span className="rounded bg-error/10 px-1 py-0.2 text-[10px] font-semibold text-error">
                                      Required
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-[11px] text-text-muted">
                                  {field?.dataType || "text"}
                                </span>
                              </div>

                              {/* Field Action Buttons */}
                              <div className="flex items-center gap-0.5">
                                {/* Move Up */}
                                <button
                                  type="button"
                                  disabled={fIdx === 0}
                                  onClick={() =>
                                    setLayout((prev) =>
                                      moveFieldInColumn(prev, section.id, colIdx, fIdx, fIdx - 1),
                                    )
                                  }
                                  aria-label={`Move ${fieldLabel} up`}
                                  className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                                >
                                  <ArrowUp className="size-3.5" aria-hidden="true" />
                                </button>

                                {/* Move Down */}
                                <button
                                  type="button"
                                  disabled={fIdx === column.length - 1}
                                  onClick={() =>
                                    setLayout((prev) =>
                                      moveFieldInColumn(prev, section.id, colIdx, fIdx, fIdx + 1),
                                    )
                                  }
                                  aria-label={`Move ${fieldLabel} down`}
                                  className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-20"
                                >
                                  <ArrowDown className="size-3.5" aria-hidden="true" />
                                </button>

                                {/* Move to other column if 2-col */}
                                {section.columnCount === 2 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLayout((prev) =>
                                        moveFieldToColumn(
                                          prev,
                                          section.id,
                                          colIdx,
                                          colIdx === 0 ? 1 : 0,
                                          fieldId,
                                        ),
                                      )
                                    }
                                    aria-label={`Move ${fieldLabel} to column ${colIdx === 0 ? 2 : 1}`}
                                    className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text"
                                  >
                                    {colIdx === 0 ? (
                                      <ArrowRight className="size-3.5" aria-hidden="true" />
                                    ) : (
                                      <ArrowLeft className="size-3.5" aria-hidden="true" />
                                    )}
                                  </button>
                                ) : null}

                                {/* Hide / Remove field from layout */}
                                <button
                                  type="button"
                                  onClick={() => setLayout((prev) => hideField(prev, fieldId))}
                                  aria-label={`Hide ${fieldLabel}`}
                                  className="rounded p-1 text-text-muted hover:bg-error/10 hover:text-error"
                                >
                                  <EyeOff className="size-3.5" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Available / Unused Fields Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text">Available Fields</h3>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-muted">
              {unplacedFields.length}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Fields listed here are not placed on the record page. Click &quot;Add to Layout&quot; to
            place a field into the layout.
          </p>

          <div
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 max-h-[600px] overflow-y-auto"
            data-unused-fields
          >
            {unplacedFields.length === 0 ? (
              <p className="py-8 text-center text-xs italic text-text-muted">
                All fields are currently placed in the layout.
              </p>
            ) : (
              unplacedFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-muted/30 p-2 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-text truncate">{field.label}</span>
                      {field.required ? (
                        <span className="rounded bg-error/10 px-1 py-0.2 text-[10px] font-semibold text-error">
                          Required
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-text-muted">{field.dataType}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (layout.sections.length > 0) {
                        const targetSec = layout.sections[0];
                        if (targetSec) {
                          setLayout((prev) => placeField(prev, targetSec.id, 0, field.id));
                        }
                      }
                    }}
                    aria-label={`Add ${field.label} to layout`}
                    className="flex items-center gap-1 rounded bg-surface border border-border px-2 py-1 text-xs font-semibold text-text hover:bg-surface-muted hover:border-primary"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
