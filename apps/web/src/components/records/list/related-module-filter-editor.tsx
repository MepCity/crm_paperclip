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
import { Button } from "@/components/ui/button";
import { ComboBox, ComboBoxItem } from "@/components/ui/combo-box";
import { Icons } from "@/components/ui/icon";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { Select, SelectItem } from "@/components/ui/select";
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
}
export interface RelatedModuleDraft {
  presence: "with" | "without";
  criteria: RelatedCriterionDraft[];
  nextKey: number;
}
export function initialRelatedModuleDraft(): RelatedModuleDraft {
  return { presence: "with", criteria: [], nextKey: 1 };
}

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
  const fieldType = (field.dataType === "autonumber" ? "text" : field.dataType) as FilterFieldType;
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
  const byLabel = new Map((metadata.data?.fields ?? []).map((field) => [field.label, field]));
  return config.fieldLabels.map((label) => {
    const field = byLabel.get(label);
    return { label, field, editor: field ? childEditor(field, users) : undefined };
  });
}

export function RelatedModuleFilterEditor({
  label,
  config,
  draft,
  onChange,
  users = [],
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
      <div className="flex items-center gap-1 text-sm text-text">
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
            <div className="flex items-center gap-1">
              <ComboBox
                label="Select Field"
                items={fields
                  .filter((entry) => entry.field && entry.field.apiName !== criterion.field)
                  .map((entry) => ({
                    id: entry.field?.apiName ?? entry.label,
                    label: entry.label,
                  }))}
                selectedKey={criterion.field}
                onSelectionChange={(key) => {
                  const next = fields.find((entry) => entry.field?.apiName === key);
                  if (!next?.editor) return;
                  const initial = initialFilterDraft(next.editor);
                  update(criterion.key, {
                    field: String(key),
                    draft: initial,
                    complete: isFilterComplete(next.editor, initial),
                  });
                }}
              >
                {(item) => <ComboBoxItem id={item.id}>{item.label}</ComboBoxItem>}
              </ComboBox>
              <Button
                size="sm"
                variant="secondary"
                aria-label={`Remove ${label} criterion`}
                onPress={() =>
                  onChange({
                    ...draft,
                    criteria: draft.criteria.filter((c) => c.key !== criterion.key),
                  })
                }
              >
                <Icons.close aria-hidden />
              </Button>
            </div>
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
              { key: draft.nextKey, field: null, draft: null, complete: false },
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
