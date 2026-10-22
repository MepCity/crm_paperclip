"use client";

import type {
  FieldCriterion,
  FieldDefinition,
  RelatedFilterModule,
  RelatedModuleFilter,
} from "@crm/core/records";
import {
  MAX_RELATED_MODULE_CRITERIA,
  MAX_RELATED_MODULE_FILTERS,
} from "@crm/core/records/related-module-filters";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { useModule } from "@/lib/api/client/hooks";
import { panelFiltersToCriteria } from "@/lib/records/filter-criteria";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import {
  type FilterDraft,
  FilterEditor,
  type FilterEditorDefinition,
  initialFilterDraft,
  isFilterComplete,
} from "./filter-editor";

/** Module-supplied description of one "Filter By Related Modules" row. */
export interface RelatedModuleFilterConfig {
  /** Wire name of the child filter (what `relatedModules[].module` carries). */
  module: RelatedFilterModule;
  /** Record module whose metadata describes the child fields. */
  fieldModule: string;
  /** Parent module label shown in the inline sentence, e.g. "Cases". */
  parentLabel: string;
  /** Add Field menu entries, in display order. */
  fieldLabels: readonly string[];
}

export interface RelatedCriterionDraft {
  key: number;
  /** Child field api name; null while the Select Field menu is still pending. */
  field: string | null;
  draft: FilterDraft | null;
  /** Computed by the editor from the child field's operator/value rules. */
  complete: boolean;
  /** The Select Field menu stays open until a field is chosen or Escape is pressed. */
  menuOpen: boolean;
}
export interface RelatedModuleDraft {
  presence: "with" | "without";
  criteria: RelatedCriterionDraft[];
  nextKey: number;
}
export function initialRelatedModuleDraft(): RelatedModuleDraft {
  return { presence: "with", criteria: [], nextKey: 1 };
}

const NO_USERS: readonly MultiSelectOption[] = [];
const presenceOptions = [
  { id: "with", label: "with" },
  { id: "without", label: "without" },
] as const;

interface ChildField {
  label: string;
  field?: FieldDefinition;
  editor?: FilterEditorDefinition;
}

function childEditor(
  field: FieldDefinition,
  users: readonly MultiSelectOption[],
): FilterEditorDefinition | undefined {
  // Long text (e.g. Check-In Address) matches as text, like autonumbers.
  const fieldType = (
    field.dataType === "autonumber" || field.dataType === "textarea" ? "text" : field.dataType
  ) as FilterFieldType;
  if (!(fieldType in filterOperators)) return undefined;
  return {
    fieldType,
    ...(fieldType === "picklist"
      ? {
          options: field.picklist?.map((option) => ({
            id: option.storedValue,
            label: option.displayValue,
          })),
        }
      : {}),
    ...(fieldType === "ownerlookup" ? { options: users } : {}),
  };
}

/** Reference default for a freshly chosen date child field is `age in 2 days`. */
function initialChildDraft(editor: FilterEditorDefinition): FilterDraft {
  const initial = initialFilterDraft(editor);
  return editor.fieldType === "datetime" || editor.fieldType === "date"
    ? { ...initial, operatorId: "age_in", value: 2, daysUnit: "days" }
    : initial;
}

export function relatedModuleIsComplete(draft: RelatedModuleDraft): boolean {
  return draft.criteria.every((criterion) => criterion.complete);
}

export function relatedModuleValue(
  config: RelatedModuleFilterConfig,
  draft: RelatedModuleDraft,
): RelatedModuleFilter {
  const criteria = draft.criteria.flatMap((criterion) => {
    if (!criterion.field || !criterion.draft) return [];
    const leaf = panelFiltersToCriteria([
      {
        field: criterion.field,
        operatorId: criterion.draft.operatorId,
        value: criterion.draft.value,
        daysUnit: criterion.draft.daysUnit,
      },
    ]);
    return leaf ? [leaf as FieldCriterion] : [];
  });
  return { module: config.module, presence: draft.presence, criteria };
}

/** Child fields resolved from module metadata, in the config's display order. */
function useRelatedChildFields(
  config: RelatedModuleFilterConfig,
  users: readonly MultiSelectOption[],
): readonly ChildField[] {
  const metadata = useModule(config.fieldModule);
  const fieldDefinitions = metadata.data?.fields;
  return useMemo(() => {
    const byLabel = new Map((fieldDefinitions ?? []).map((field) => [field.label, field]));
    return config.fieldLabels.map((label) => {
      const field = byLabel.get(label);
      return { label, field, editor: field ? childEditor(field, users) : undefined };
    });
  }, [config.fieldLabels, fieldDefinitions, users]);
}

const MENU_WIDTH = 330;
const MENU_MAX_HEIGHT = 340;

/** Floating Select Field list: it overlays the table, so it is drawn outside the clipped panel. */
function SelectFieldMenu({
  label,
  fields,
  anchorRef,
  onSelect,
  onClose,
}: {
  label: string;
  fields: readonly ChildField[];
  anchorRef: RefObject<HTMLElement | null>;
  onSelect: (field: ChildField) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Above the control when there is room (as in the reference), else below.
    const above = rect.top >= MENU_MAX_HEIGHT + 8;
    setPosition({
      left: rect.left,
      top: above ? rect.top - MENU_MAX_HEIGHT - 4 : rect.bottom + 4,
    });
  }, [anchorRef]);
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !anchorRef.current?.contains(target)) onClose();
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [anchorRef, onClose]);
  const visible = fields.filter(
    (entry) => entry.field && entry.label.toLowerCase().includes(query.toLowerCase()),
  );
  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape closes the menu from its search box.
    <div
      ref={menuRef}
      className="fixed z-50 flex flex-col justify-end rounded-md border border-border bg-surface p-2 shadow-lg"
      style={{
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        width: MENU_WIDTH,
        maxHeight: MENU_MAX_HEIGHT,
        visibility: position ? "visible" : "hidden",
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div role="listbox" aria-label="Select Field" className="min-h-0 overflow-auto order-2">
        {visible.map((entry) => (
          <button
            key={entry.field?.apiName}
            type="button"
            role="option"
            aria-selected={false}
            className="block w-full cursor-default rounded px-3 py-2 text-left text-sm hover:bg-surface-hover"
            onClick={() => onSelect(entry)}
          >
            {entry.label}
          </button>
        ))}
        {visible.length === 0 ? (
          <div className="px-3 py-2 text-sm text-text-muted">No results</div>
        ) : null}
      </div>
      <div className="order-1 pb-2">
        <TextField
          label={`${label} field search`}
          hideLabel
          placeholder="Search"
          value={query}
          onChange={setQuery}
          autoFocus
        />
      </div>
    </div>,
    document.body,
  );
}

function CriterionHeader({
  label,
  fieldLabel,
  fields,
  menuOpen,
  pending,
  onToggleMenu,
  onRemove,
  onSelect,
}: {
  label: string;
  fieldLabel: string | null;
  fields: readonly ChildField[];
  menuOpen: boolean;
  pending: boolean;
  onToggleMenu: (open: boolean) => void;
  onRemove: () => void;
  onSelect: (field: ChildField) => void;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => onToggleMenu(false), [onToggleMenu]);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Remove ${label} criterion`}
        className="flex shrink-0 cursor-default items-center justify-center rounded-full border border-danger p-0 text-danger"
        onClick={onRemove}
      >
        <Icons.minus aria-hidden className="size-3" />
      </button>
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={pending ? menuOpen : undefined}
        className={`min-w-0 flex-1 cursor-default rounded-md border px-2 py-1 text-left text-sm ${
          pending ? "border-focus-ring text-text-muted" : "border-border text-text"
        }`}
        onClick={() => pending && onToggleMenu(!menuOpen)}
      >
        {fieldLabel ?? "Select Field"}
      </button>
      {pending && menuOpen ? (
        <SelectFieldMenu
          label={label}
          fields={fields}
          anchorRef={anchorRef}
          onClose={close}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}

export function RelatedModuleFilterEditor({
  label,
  config,
  draft,
  onChange,
  users = NO_USERS,
}: {
  label: string;
  config: RelatedModuleFilterConfig;
  draft: RelatedModuleDraft;
  onChange: (draft: RelatedModuleDraft) => void;
  users?: readonly MultiSelectOption[];
}) {
  const fields = useRelatedChildFields(config, users);
  const canAdd = draft.criteria.length < MAX_RELATED_MODULE_CRITERIA;
  const update = (key: number, patch: Partial<RelatedCriterionDraft>) =>
    onChange({
      ...draft,
      criteria: draft.criteria.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    });
  return (
    <div className="filter-editor" data-related-module={config.module}>
      <div className="flex flex-wrap items-center gap-1 text-sm text-text [&_button]:min-w-16">
        <span>{config.parentLabel}</span>
        <Select
          label={`${label} presence`}
          hideLabel
          variant="filter"
          items={presenceOptions}
          value={draft.presence}
          onChange={(key) =>
            onChange({ ...draft, presence: key === "without" ? "without" : "with" })
          }
        >
          {(option) => (
            <SelectItem variant="filter" id={option.id}>
              {option.label}
            </SelectItem>
          )}
        </Select>
        <span>Any {label}</span>
      </div>
      {draft.criteria.map((criterion) => {
        const child = fields.find((entry) => entry.field?.apiName === criterion.field);
        return (
          <div key={criterion.key} className="flex flex-col gap-1" data-related-criterion>
            <CriterionHeader
              label={label}
              fieldLabel={child?.label ?? null}
              fields={fields}
              menuOpen={criterion.menuOpen}
              pending={criterion.field === null}
              onToggleMenu={(open) => update(criterion.key, { menuOpen: open })}
              onRemove={() =>
                onChange({
                  ...draft,
                  criteria: draft.criteria.filter((c) => c.key !== criterion.key),
                })
              }
              onSelect={(next) => {
                if (!next.field || !next.editor) return;
                const initial = initialChildDraft(next.editor);
                update(criterion.key, {
                  field: next.field.apiName,
                  draft: initial,
                  complete: isFilterComplete(next.editor, initial),
                  menuOpen: false,
                });
              }}
            />
            {criterion.field === null ? (
              <div className="filter-editor" data-pending-criterion>
                <div
                  className="rounded-md border border-border px-2 py-1 text-sm text-text-muted opacity-50"
                  aria-disabled="true"
                >
                  is
                </div>
                <TextField label={`${label} value`} hideLabel placeholder="Type here" isDisabled />
              </div>
            ) : null}
            {child?.editor && criterion.draft ? (
              <FilterEditor
                label={`${label} ${child.label}`}
                editor={child.editor}
                draft={criterion.draft}
                onChange={(next) =>
                  update(criterion.key, {
                    draft: next,
                    complete: child.editor ? isFilterComplete(child.editor, next) : false,
                  })
                }
              />
            ) : null}
          </div>
        );
      })}
      <Button
        size="sm"
        variant="secondary"
        isDisabled={!canAdd}
        onPress={() =>
          onChange({
            ...draft,
            criteria: [
              ...draft.criteria,
              { key: draft.nextKey, field: null, draft: null, complete: false, menuOpen: true },
            ],
            nextKey: draft.nextKey + 1,
          })
        }
      >
        + Add Field
      </Button>
    </div>
  );
}

export { MAX_RELATED_MODULE_FILTERS };
