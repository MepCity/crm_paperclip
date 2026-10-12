import type { Comparator, Criteria, CriteriaPeriod, CriteriaValue } from "@crm/core/records";
import { displayDateToIso } from "./filter-date-input";
import type { AppliedFilterValue, DateUnit, FilterOperatorId } from "./filter-operators";

export interface PanelFilterInput {
  field: string;
  operatorId: FilterOperatorId;
  value: AppliedFilterValue;
  daysUnit?: DateUnit;
}

const periodByOperator: Partial<Record<FilterOperatorId, CriteriaPeriod>> = {
  tomorrow: "TOMORROW",
  yesterday: "YESTERDAY",
  till_yesterday: "TILL_YESTERDAY",
  starting_tomorrow: "STARTING_TOMORROW",
  this_week: "THIS_WEEK",
  previous_week: "PREVIOUS_WEEK",
  this_month: "THIS_MONTH",
  previous_month: "PREVIOUS_MONTH",
  this_year: "THIS_YEAR",
  previous_year: "PREVIOUS_YEAR",
  next_year: "NEXT_YEAR",
};

function isoDateValue(value: AppliedFilterValue): string {
  if (typeof value !== "string") throw new Error("Expected a display date string");
  const iso = displayDateToIso(value);
  if (!iso) throw new Error("Invalid display date");
  return iso;
}

function isoDateRangeValue(value: AppliedFilterValue): [string, string] {
  if (!Array.isArray(value) || value.length !== 2) throw new Error("Expected a date range");
  const from = typeof value[0] === "string" ? displayDateToIso(value[0]) : null;
  const to = typeof value[1] === "string" ? displayDateToIso(value[1]) : null;
  if (!from || !to || from > to) throw new Error("Invalid date range");
  return [from, to];
}

function dayTokenValue(
  operatorId: "age_in" | "due_in",
  offset: number,
  unit: DateUnit,
): CriteriaValue {
  const token = operatorId === "age_in" ? "AGEINDAYS" : "DUEINDAYS";
  if (unit === "days") return { token, offset };
  return { token, offset, unit };
}

function criterionValue(
  operatorId: FilterOperatorId,
  value: AppliedFilterValue,
  daysUnit?: DateUnit,
): CriteriaValue {
  switch (operatorId) {
    case "is_empty":
    case "is_not_empty":
      return null;
    case "today":
      return { token: "TODAY" };
    case "age_in":
    case "due_in": {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error("Invalid day offset");
      }
      return dayTokenValue(operatorId, value, daysUnit ?? "days");
    }
    case "previous":
    case "next": {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
        throw new Error("Invalid relative count");
      }
      const unit = daysUnit ?? "days";
      return {
        token: "RELATIVE",
        direction: operatorId === "previous" ? "previous" : "next",
        count: value,
        unit,
      };
    }
    case "on":
      return isoDateValue(value);
    case "before":
    case "after":
      return isoDateValue(value);
    case "between":
    case "not_between": {
      if (Array.isArray(value) && typeof value[0] === "string" && typeof value[1] === "string") {
        return isoDateRangeValue(value);
      }
      return value as CriteriaValue;
    }
    case "tomorrow":
    case "yesterday":
    case "till_yesterday":
    case "starting_tomorrow":
    case "this_week":
    case "previous_week":
    case "this_month":
    case "previous_month":
    case "this_year":
    case "previous_year":
    case "next_year": {
      const name = periodByOperator[operatorId];
      if (!name) throw new Error(`Missing period for ${operatorId}`);
      return { token: "PERIOD", name };
    }
    case "current_fy":
    case "current_fq":
    case "previous_fy":
    case "previous_fq":
    case "next_fy":
    case "next_fq":
    case "belongs_to_role":
    case "not_belongs_to_role":
    case "belongs_to_group":
    case "is_nearby":
      throw new Error(`Operator ${operatorId} is not mapped to criteria yet`);
    case "equal":
    case "not_equal":
    case "contains":
    case "not_contains":
    case "starts_with":
    case "ends_with":
    case "less_than":
    case "less_equal":
    case "greater_than":
    case "greater_equal":
      return (typeof value === "string" ? value.trim() : value) as CriteriaValue;
    default: {
      const _exhaustive: never = operatorId;
      return _exhaustive;
    }
  }
}

function comparatorForOperator(operatorId: FilterOperatorId): Comparator {
  switch (operatorId) {
    case "equal":
      return "equal";
    case "not_equal":
      return "not_equal";
    case "contains":
      return "contains";
    case "not_contains":
      return "not_contains";
    case "starts_with":
      return "starts_with";
    case "ends_with":
      return "ends_with";
    case "is_empty":
      return "is_empty";
    case "is_not_empty":
      return "is_not_empty";
    case "less_than":
      return "less_than";
    case "less_equal":
      return "less_equal";
    case "greater_than":
      return "greater_than";
    case "greater_equal":
      return "greater_equal";
    case "between":
      return "between";
    case "not_between":
      return "not_between";
    case "age_in":
    case "due_in":
      return "less_equal";
    case "before":
      return "less_than";
    case "after":
      return "greater_than";
    case "previous":
    case "next":
    case "on":
    case "today":
    case "tomorrow":
    case "yesterday":
    case "till_yesterday":
    case "starting_tomorrow":
    case "this_week":
    case "previous_week":
    case "this_month":
    case "previous_month":
    case "this_year":
    case "previous_year":
    case "next_year":
      return "equal";
    case "current_fy":
    case "current_fq":
    case "previous_fy":
    case "previous_fq":
    case "next_fy":
    case "next_fq":
    case "belongs_to_role":
    case "not_belongs_to_role":
    case "belongs_to_group":
    case "is_nearby":
      throw new Error(`Operator ${operatorId} is not mapped to criteria yet`);
    default: {
      const _exhaustive: never = operatorId;
      return _exhaustive;
    }
  }
}

function leaf(input: PanelFilterInput): Criteria {
  return {
    field: input.field,
    comparator: comparatorForOperator(input.operatorId),
    value: criterionValue(input.operatorId, input.value, input.daysUnit),
  };
}

/** Maps completed panel rows to port criteria; empty input yields no extra restriction. */
export function panelFiltersToCriteria(inputs: readonly PanelFilterInput[]): Criteria | undefined {
  if (inputs.length === 0) return undefined;
  if (inputs.length === 1) {
    const only = inputs[0];
    if (!only) return undefined;
    return leaf(only);
  }
  return { groupOperator: "and", group: inputs.map(leaf) };
}

/**
 * Criterion for the list header's first-letter choice. `null` means All and adds nothing. The
 * comparison itself is the text-family case-insensitive `starts_with` rule
 * (`packages/core/src/records/README.md`).
 */
export function firstLetterCriteria(
  linkField: string,
  letter: string | null,
): Criteria | undefined {
  if (!letter) return undefined;
  return { field: linkField, comparator: "starts_with", value: letter };
}

/**
 * AND-combines the criteria that restrict a list, ignoring absent parts and flattening a part
 * that is already an `and` group instead of nesting it. Undefined when nothing restricts.
 */
export function combineCriteriaAnd(parts: readonly (Criteria | undefined)[]): Criteria | undefined {
  const present = parts.filter((part): part is Criteria => part !== undefined);
  if (present.length === 0) return undefined;
  const group = present.flatMap((part) =>
    "groupOperator" in part && part.groupOperator === "and" ? [...part.group] : [part],
  );
  if (group.length === 1) return group[0];
  return { groupOperator: "and", group };
}
