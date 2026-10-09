import type { Comparator, Criteria, CriteriaPeriod, CriteriaValue } from "@crm/core/records";
import type { AppliedFilterValue, FilterOperatorId } from "./filter-operators";

export interface PanelFilterInput {
  field: string;
  operatorId: FilterOperatorId;
  value: AppliedFilterValue;
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

function criterionValue(operatorId: FilterOperatorId, value: AppliedFilterValue): CriteriaValue {
  switch (operatorId) {
    case "is_empty":
    case "is_not_empty":
      return null;
    case "today":
      return { token: "TODAY" };
    case "age_in":
      return { token: "AGEINDAYS", offset: value as number };
    case "due_in":
      return { token: "DUEINDAYS", offset: value as number };
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
    case "previous":
    case "next":
    case "on":
    case "before":
    case "after":
    case "current_fy":
    case "current_fq":
    case "previous_fy":
    case "previous_fq":
    case "next_fy":
    case "next_fq":
    case "belongs_to_role":
    case "not_belongs_to_role":
    case "belongs_to_group":
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
    case "between":
    case "not_between":
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
    case "previous":
    case "next":
    case "on":
    case "before":
    case "after":
    case "current_fy":
    case "current_fq":
    case "previous_fy":
    case "previous_fq":
    case "next_fy":
    case "next_fq":
    case "belongs_to_role":
    case "not_belongs_to_role":
    case "belongs_to_group":
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
    value: criterionValue(input.operatorId, input.value),
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
