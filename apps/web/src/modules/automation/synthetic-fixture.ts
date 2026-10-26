import type { AutomationRule } from "@crm/core/automation";

/**
 * Fully synthetic populated Assignment fixture (MEP-1255). Not derived from the reference CRM;
 * recipient references are opaque placeholders (open question U13).
 */
export const syntheticAssignmentRules: readonly AutomationRule[] = [
  {
    kind: "assignment",
    id: "synthetic-rule-1",
    revision: "r1",
    module: "Leads",
    name: "Synthetic regional routing",
    description: "Synthetic rule that routes by region.",
    enabled: true,
    position: 1,
    entries: [
      {
        id: "e2",
        position: 2,
        condition: { kind: "all_records" },
        recipients: { kind: "roles", refs: ["synthetic-role-a"] },
        distribution: "single",
        availability: "ignore",
      },
      {
        id: "e1",
        position: 1,
        condition: {
          kind: "criteria",
          criteria: {
            groupOperator: "and",
            group: [
              { field: "Region", comparator: "equal", value: "North" },
              {
                groupOperator: "or",
                group: [
                  { field: "Score", comparator: "greater_than", value: 10 },
                  { field: "Owner", comparator: "equal", value: { token: "CURRENTUSER" } },
                ],
              },
            ],
          },
        },
        recipients: { kind: "users", refs: ["synthetic-user-a", "synthetic-user-b"] },
        distribution: "round_robin",
        availability: "require_available",
      },
      {
        id: "e3",
        position: 3,
        condition: { kind: "all_records" },
        recipients: { kind: "user_conditions", definitionRef: "synthetic-definition-1" },
        distribution: "round_robin",
        availability: "unresolved",
      },
    ],
    fallback: { kind: "groups", refs: ["synthetic-group-a"] },
  },
  {
    kind: "assignment",
    id: "synthetic-rule-2",
    revision: "r1",
    module: "Contacts",
    name: "Synthetic contact intake",
    description: "",
    enabled: false,
    position: 2,
    entries: [],
    fallback: null,
  },
];
