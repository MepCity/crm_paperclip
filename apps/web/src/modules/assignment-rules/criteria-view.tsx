import type { Condition } from "@crm/core/automation";
import type { Criteria, CriteriaValue } from "@crm/core/records";

function formatValue(value: CriteriaValue): string {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  if (value !== null && typeof value === "object" && "token" in value) return `\${${value.token}}`;
  return String(value);
}

function CriteriaNode({ criteria }: { criteria: Criteria }) {
  if ("group" in criteria) {
    return (
      <div className="border-l-2 border-border pl-3">
        <span className="text-sm font-semibold uppercase text-text-muted">
          {criteria.groupOperator}
        </span>
        <ul className="mt-1 space-y-1">
          {criteria.group.map((child, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: criteria children have no identity
            <li key={i}>
              <CriteriaNode criteria={child} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <span className="text-md text-text">
      {criteria.field} <span className="text-text-muted">{criteria.comparator}</span>{" "}
      {formatValue(criteria.value)}
    </span>
  );
}

/** Structured, non-executable rendering of an entry condition (AD2). */
export function ConditionView({ condition }: { condition: Condition }) {
  if (condition.kind === "all_records") return <span className="text-md">All records</span>;
  return <CriteriaNode criteria={condition.criteria} />;
}
