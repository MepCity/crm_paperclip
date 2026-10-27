import type {
  AssignmentEntry,
  AssignmentRule,
  AutomationRule,
  ReadFailure,
  ReadResult,
  RecipientSet,
} from "@crm/core/automation";
import Link from "next/link";
import { ConditionView } from "./criteria-view";

const distributionLabel: Record<AssignmentEntry["distribution"], string> = {
  single: "Single",
  round_robin: "Round robin",
};
const availabilityLabel: Record<AssignmentEntry["availability"], string> = {
  ignore: "Ignore availability",
  require_available: "Require available",
  unresolved: "Unresolved",
};
const recipientKindLabel = {
  users: "Users",
  roles: "Roles",
  groups: "Groups",
  user_conditions: "User conditions",
} as const;
const failureText: Record<ReadFailure["code"], string> = {
  forbidden: "You do not have permission to view this assignment rule.",
  not_found: "This assignment rule could not be found.",
  unavailable: "This assignment rule is currently unavailable.",
  invalid_query: "This assignment rule could not be loaded.",
};

export function RecipientView({ recipients }: { recipients: RecipientSet }) {
  return (
    <div>
      <span className="font-semibold">{recipientKindLabel[recipients.kind]}</span>{" "}
      {recipients.kind === "user_conditions" ? (
        <span className="text-text-muted">Definition: {recipients.definitionRef}</span>
      ) : (
        <span className="text-text-muted">{recipients.refs.join(", ")}</span>
      )}
    </div>
  );
}

export function AssignmentRuleDetail({
  result,
  listHref,
}: {
  result: ReadResult<AutomationRule>;
  listHref: string;
}) {
  const back = (
    <Link href={listHref} className="text-md text-link hover:underline">
      Back to Assignment Rules
    </Link>
  );
  if (!result.ok) {
    return (
      <section
        aria-label="Assignment Rule"
        className="rounded-lg border border-border bg-surface p-6 shadow-xs"
      >
        <h1 className="sr-only">Assignment Rule</h1>
        <p role="alert" data-testid={`assignment-detail-${result.error.code}`} className="mb-4">
          {failureText[result.error.code]}
        </p>
        {back}
      </section>
    );
  }
  if (result.value.kind !== "assignment") {
    return (
      <section
        aria-label="Assignment Rule"
        className="rounded-lg border border-border bg-surface p-6 shadow-xs"
      >
        <h1 className="sr-only">Assignment Rule</h1>
        <p role="alert" className="mb-4">
          This assignment rule could not be loaded.
        </p>
        {back}
      </section>
    );
  }
  const rule: AssignmentRule = result.value;
  const entries = [...rule.entries].sort((a, b) => a.position - b.position);
  return (
    <section
      aria-label="Assignment Rule"
      className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-xs"
    >
      {back}
      <header>
        <h1 className="text-xl font-semibold text-text">{rule.name}</h1>
        <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-md">
          <dt className="text-text-muted">Module</dt>
          <dd>{rule.module}</dd>
          <dt className="text-text-muted">Status</dt>
          <dd data-testid="assignment-detail-status">{rule.enabled ? "Active" : "Inactive"}</dd>
          <dt className="text-text-muted">Description</dt>
          <dd>{rule.description || "No description"}</dd>
        </dl>
      </header>
      <div>
        <h2 className="mb-2 text-lg font-semibold">Rule entries</h2>
        {entries.length === 0 ? (
          <p data-testid="assignment-detail-no-entries" className="text-md text-text-muted">
            This rule has no entries.
          </p>
        ) : (
          <table aria-label="Assignment rule entries" className="w-full text-left text-md">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th scope="col" className="py-2 pr-4">
                  Order
                </th>
                <th scope="col" className="py-2 pr-4">
                  Condition
                </th>
                <th scope="col" className="py-2 pr-4">
                  Recipients
                </th>
                <th scope="col" className="py-2 pr-4">
                  Distribution
                </th>
                <th scope="col" className="py-2">
                  Availability
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border align-top">
                  <td className="py-2 pr-4">{entry.position}</td>
                  <td className="py-2 pr-4">
                    <ConditionView condition={entry.condition} />
                  </td>
                  <td className="py-2 pr-4">
                    <RecipientView recipients={entry.recipients} />
                  </td>
                  <td className="py-2 pr-4">{distributionLabel[entry.distribution]}</td>
                  <td className="py-2">{availabilityLabel[entry.availability]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div data-testid="assignment-detail-fallback">
        <h2 className="mb-2 text-lg font-semibold">Default recipient</h2>
        {rule.fallback ? (
          <RecipientView recipients={rule.fallback} />
        ) : (
          <p className="text-md text-text-muted">No default recipient is configured.</p>
        )}
      </div>
    </section>
  );
}
