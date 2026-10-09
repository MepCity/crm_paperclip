"use client";

import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { NumberField } from "@/components/ui/number-field";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import {
  type AppliedFilterValue,
  type DateUnit,
  type FilterFieldType,
  type FilterOperator,
  type FilterOperatorId,
  filterOperators,
  operatorsWithoutCriteriaSupport,
} from "@/lib/records/filter-operators";

export interface FilterEditorDefinition {
  fieldType: FilterFieldType;
  options?: readonly MultiSelectOption[];
  currencyCode?: string;
}
// NaN represents an empty number input; it is never emitted by onApply.
export interface FilterDraft {
  operatorId: FilterOperatorId;
  value: AppliedFilterValue;
  daysUnit?: DateUnit;
}
export function initialFilterDraft(editor: FilterEditorDefinition): FilterDraft {
  const operatorId = filterOperators[editor.fieldType].defaultOperator;
  return {
    operatorId,
    value: editor.fieldType === "boolean" ? true : null,
    daysUnit: "days",
  };
}
export function draftOperator(
  editor: FilterEditorDefinition,
  draft: FilterDraft,
): FilterOperator | undefined {
  return filterOperators[editor.fieldType].operators.find(
    (operator) => operator.id === draft.operatorId,
  );
}
export function isFilterComplete(editor: FilterEditorDefinition, draft: FilterDraft): boolean {
  if (operatorsWithoutCriteriaSupport.has(draft.operatorId)) return false;
  const control = draftOperator(editor, draft)?.control;
  const value = draft.value;
  switch (control) {
    case "none":
      return true;
    case "text":
      return typeof value === "string" && value.trim().length > 0;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "range":
      return (
        Array.isArray(value) &&
        value.length === 2 &&
        value.every((v) => typeof v === "number" && Number.isFinite(v))
      );
    case "choices":
    case "users":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
          (v) => typeof v === "string" && editor.options?.some((option) => option.id === v),
        )
      );
    case "state":
      return typeof value === "boolean";
    case "days":
      return (
        (draft.daysUnit ?? "days") === "days" &&
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= 0
      );
    case "date":
      return typeof value === "string" && value.trim().length > 0;
    case "date_range":
      return false;
    default:
      return false;
  }
}
export function FilterEditor({
  label,
  editor,
  draft,
  onChange,
}: {
  label: string;
  editor: FilterEditorDefinition;
  draft: FilterDraft;
  onChange: (draft: FilterDraft) => void;
}) {
  const operators: readonly FilterOperator[] = filterOperators[editor.fieldType].operators;
  const control = draftOperator(editor, draft)?.control;
  const value = draft.value;
  const setValue = (value: AppliedFilterValue) => onChange({ ...draft, value });
  const number = (name: string, current: number, change: (next: number) => void) => (
    <NumberField
      hideLabel
      placeholder={
        name.endsWith("lower value") ? "From" : name.endsWith("upper value") ? "To" : undefined
      }
      label={name}
      value={current}
      onChange={change}
      prefix={
        editor.currencyCode && (
          <span className="flex items-center pl-1 text-sm text-text">{editor.currencyCode}</span>
        )
      }
    />
  );
  return (
    <div className="filter-editor" data-field-type={editor.fieldType}>
      <Select
        label={`${label} operator`}
        hideLabel
        variant="filter"
        items={operators}
        value={draft.operatorId}
        onChange={(key) => {
          const operator = operators.find((operator) => operator.id === key);
          if (operator && operator.id !== draft.operatorId)
            onChange({
              operatorId: operator.id,
              value: operator.control === "state" ? true : null,
              daysUnit: operator.control === "days" ? "days" : draft.daysUnit,
            });
        }}
      >
        {(operator) => (
          <SelectItem variant="filter" id={operator.id}>
            {operator.label}
          </SelectItem>
        )}
      </Select>
      {control !== "none" && (
        <div key={draft.operatorId} className="filter-value">
          {control === "text" && (
            <TextField
              label={`${label} value`}
              hideLabel
              placeholder="Type here"
              value={typeof value === "string" ? value : ""}
              onChange={setValue}
            />
          )}
          {control === "number" &&
            number(`${label} value`, typeof value === "number" ? value : Number.NaN, setValue)}
          {control === "range" && (
            <div className="filter-number-range">
              {number(
                `${label} lower value`,
                Array.isArray(value) && typeof value[0] === "number" ? value[0] : Number.NaN,
                (next) =>
                  setValue([
                    next,
                    Array.isArray(value) && typeof value[1] === "number" ? value[1] : Number.NaN,
                  ]),
              )}
              {number(
                `${label} upper value`,
                Array.isArray(value) && typeof value[1] === "number" ? value[1] : Number.NaN,
                (next) =>
                  setValue([
                    Array.isArray(value) && typeof value[0] === "number" ? value[0] : Number.NaN,
                    next,
                  ]),
              )}
            </div>
          )}
          {(control === "choices" || control === "users") && (
            <MultiSelect
              variant={control === "users" ? "users" : "choices"}
              label={`${label} value`}
              placeholder={control === "users" ? "Click to Select Users." : "None"}
              options={editor.options ?? []}
              value={
                Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
              }
              onChange={setValue}
            />
          )}
          {control === "state" && (
            <Select
              label={`${label} value`}
              hideLabel
              variant="filter"
              items={[
                { id: "selected", label: "Selected" },
                { id: "not_selected", label: "Not Selected" },
              ]}
              value={value === false ? "not_selected" : "selected"}
              onChange={(key) => setValue(key === "selected")}
            >
              {(option) => (
                <SelectItem variant="filter" id={option.id}>
                  {option.label}
                </SelectItem>
              )}
            </Select>
          )}
          {control === "days" && (
            <div className="flex min-w-0 items-start gap-1">
              <div className="min-w-0 flex-1">
                <NumberField
                  hideLabel
                  label={`${label} value`}
                  value={typeof value === "number" ? value : Number.NaN}
                  onChange={setValue}
                />
              </div>
              <Select
                label={`${label} unit`}
                hideLabel
                variant="filter"
                items={[
                  { id: "days", label: "days" },
                  { id: "weeks", label: "weeks" },
                  { id: "months", label: "months" },
                ]}
                value={draft.daysUnit ?? "days"}
                onChange={(key) => onChange({ ...draft, daysUnit: key as DateUnit, value: null })}
              >
                {(option) => (
                  <SelectItem variant="filter" id={option.id}>
                    {option.label}
                  </SelectItem>
                )}
              </Select>
            </div>
          )}
          {control === "date" && (
            <TextField
              label={`${label} value`}
              hideLabel
              placeholder="DD.MM.YYYY"
              value={typeof value === "string" ? value : ""}
              onChange={setValue}
            />
          )}
          {control === "date_range" && (
            <div className="filter-date-range flex min-w-0 flex-col gap-(--size-filter-editor-value-gap)">
              <TextField
                label={`${label} from date`}
                hideLabel
                placeholder="From Date"
                value={Array.isArray(value) && typeof value[0] === "string" ? value[0] : ""}
                onChange={(from) =>
                  setValue([
                    from,
                    Array.isArray(value) && typeof value[1] === "string" ? value[1] : "",
                  ])
                }
              />
              <TextField
                label={`${label} to date`}
                hideLabel
                placeholder="To Date"
                value={Array.isArray(value) && typeof value[1] === "string" ? value[1] : ""}
                onChange={(to) =>
                  setValue([
                    Array.isArray(value) && typeof value[0] === "string" ? value[0] : "",
                    to,
                  ])
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
