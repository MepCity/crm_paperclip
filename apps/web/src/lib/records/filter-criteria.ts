import type {
  Comparator,
  Criteria,
  CriteriaPeriod,
  CriteriaRelativeUnit,
  CriteriaValue,
} from "@crm/core/records";
import type { AppliedFilterValue, DateUnit, FilterOperatorId } from "./filter-operators";
import { compareCalendarDates, parsePanelDateText } from "./panel-date";

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

function wireUnit(unit: DateUnit | undefined): CriteriaRelativeUnit {
  if (unit === "weeks") return "WEEKS";
  if (unit === "months") return "MONTHS";
  return "DAYS";
}

function dayOffset(count: number, unit: DateUnit | undefined): number {
  if (unit === "weeks") return count * 7;
  if (unit === "months") return count * 30;
  return count;
}

function panelDateValue(value: AppliedFilterValue): string {
  if (typeof value !== "string") throw new Error("Expected panel date text");
  const iso = parsePanelDateText(value);
  if (!iso) throw new Error("Invalid panel date");
  return iso;
}

function panelDateRange(value: AppliedFilterValue): readonly [string, string] {
  if (!Array.isArray(value) || value.length !== 2) throw new Error("Expected date range");
  const from = typeof value[0] === "string" ? parsePanelDateText(value[0]) : null;
  const to = typeof value[1] === "string" ? parsePanelDateText(value[1]) : null;
  if (!from || !to || compareCalendarDates(from, to) > 0) throw new Error("Invalid date range");
  return [from, to];
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
      return { token: "AGEINDAYS", offset: dayOffset(value as number, daysUnit) };
    case "due_in":
      return { token: "DUEINDAYS", offset: dayOffset(value as number, daysUnit) };
    case "previous":
      return {
        token: "RELATIVE_PERIOD",
        direction: "PREVIOUS",
        unit: wireUnit(daysUnit),
        count: value as number,
      };
    case "next":
      return {
        token: "RELATIVE_PERIOD",
        direction: "NEXT",
        unit: wireUnit(daysUnit),
        count: value as number,
      };
    case "on":
      return panelDateValue(value);
    case "before":
      return panelDateValue(value);
    case "after":
      return panelDateValue(value);
    case "between":
    case "not_between":
      if (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        typeof value[1] === "number"
      ) {
        return value as CriteriaValue;
      }
      return panelDateRange(value) as CriteriaValue;
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
    case "on":
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
    case "before":
      return "less_than";
    case "less_equal":
      return "less_equal";
    case "greater_than":
    case "after":
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
    case "previous":
    case "next":
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
