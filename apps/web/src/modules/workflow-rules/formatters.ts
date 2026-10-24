import type { ActionKind, Condition, Timing, Trigger } from "@crm/core/automation";
import type { Comparator, Criteria, CriteriaValue } from "@crm/core/records";

export function formatTrigger(trigger: Trigger): string {
  switch (trigger.kind) {
    case "record":
      switch (trigger.on) {
        case "create":
          return "On record creation";
        case "edit":
          return "On record edit";
        case "create_or_edit":
          return "On record creation or edit";
        case "delete":
          return "On record deletion";
        default:
          return `Record event (${trigger.on})`;
      }
    case "field_change":
      return `When fields change: ${trigger.fields.join(", ")}`;
    case "date":
      return `Date field: ${trigger.field} (${trigger.timezone})`;
    default:
      return "Unknown trigger";
  }
}

export function formatComparator(comparator: Comparator): string {
  switch (comparator) {
    case "equal":
      return "equals";
    case "not_equal":
      return "does not equal";
    case "contains":
      return "contains";
    case "not_contains":
      return "does not contain";
    case "starts_with":
      return "starts with";
    case "ends_with":
      return "ends with";
    case "greater_than":
      return ">";
    case "less_than":
      return "<";
    case "greater_equal":
      return ">=";
    case "less_equal":
      return "<=";
    case "is_empty":
      return "is empty";
    case "is_not_empty":
      return "is not empty";
    case "between":
      return "between";
    case "not_between":
      return "not between";
    default:
      return String(comparator);
  }
}

export function formatCriteriaValue(value: CriteriaValue): string {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return `[${value.map(formatCriteriaValue).join(", ")}]`;
    }
    if ("token" in value) {
      return `\${${value.token}}`;
    }
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return String(value);
}

export function formatCriteria(criteria: Criteria): string {
  if ("groupOperator" in criteria) {
    const parts = criteria.group.map(formatCriteria);
    const op = ` ${criteria.groupOperator.toUpperCase()} `;
    return `(${parts.join(op)})`;
  }
  if ("field" in criteria) {
    const comp = formatComparator(criteria.comparator);
    const val = formatCriteriaValue(criteria.value);
    return `${criteria.field} ${comp} ${val}`;
  }
  return "Unknown criteria";
}

export function formatCondition(condition: Condition): string {
  if (condition.kind === "all_records") {
    return "All records";
  }
  if (condition.kind === "criteria") {
    return formatCriteria(condition.criteria);
  }
  return "Unknown condition";
}

export function formatTiming(timing: Timing): string {
  if (timing.kind === "event_relative") {
    if (timing.offsetSeconds === 0) {
      return "At the time of event";
    }
    const absSeconds = Math.abs(timing.offsetSeconds);
    const direction = timing.offsetSeconds < 0 ? "before" : "after";
    if (absSeconds % 86400 === 0) {
      const days = absSeconds / 86400;
      return `${days} day${days > 1 ? "s" : ""} ${direction} event`;
    }
    if (absSeconds % 3600 === 0) {
      const hours = absSeconds / 3600;
      return `${hours} hour${hours > 1 ? "s" : ""} ${direction} event`;
    }
    return `${absSeconds} second(s) ${direction} event`;
  }

  if (timing.kind === "field_relative") {
    const absSeconds = Math.abs(timing.offsetSeconds);
    const direction = timing.offsetSeconds < 0 ? "before" : "after";
    if (timing.offsetSeconds === 0) {
      return `On ${timing.field} (${timing.timezone})`;
    }
    if (absSeconds % 86400 === 0) {
      const days = absSeconds / 86400;
      return `${days} day${days > 1 ? "s" : ""} ${direction} ${timing.field} (${timing.timezone})`;
    }
    if (absSeconds % 3600 === 0) {
      const hours = absSeconds / 3600;
      return `${hours} hour${hours > 1 ? "s" : ""} ${direction} ${timing.field} (${timing.timezone})`;
    }
    return `${absSeconds} second(s) ${direction} ${timing.field} (${timing.timezone})`;
  }

  return "Unknown timing";
}

export function formatActionKind(kind: ActionKind): string {
  switch (kind) {
    case "notification":
      return "Email Notification";
    case "activity":
      return "Task / Activity";
    case "field_update":
      return "Field Update";
    case "webhook":
      return "Webhook";
    case "function":
      return "Custom Function";
    case "record_create":
      return "Create Record";
    case "conversion":
      return "Conversion";
    default:
      return String(kind);
  }
}
