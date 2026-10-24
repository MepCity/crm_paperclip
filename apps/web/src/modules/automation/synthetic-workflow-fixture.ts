import type { WorkflowRule } from "@crm/core/automation";

/**
 * Synthetic workflow rules for read-only preview and testing.
 * Strictly synthetic data; no reference CRM customer data, identifiers, or names.
 */
export const leadWelcomeRule: WorkflowRule = {
  id: "wf-rule-lead-welcome",
  revision: "rev-1",
  module: "Leads",
  name: "High Value Lead Follow-up",
  description:
    "Triggers notification and scheduled task for newly created leads with high expected value.",
  enabled: true,
  position: 1,
  kind: "workflow",
  trigger: {
    kind: "record",
    on: "create",
  },
  branches: [
    {
      id: "br-lead-1",
      position: 1,
      condition: {
        kind: "criteria",
        criteria: {
          field: "Lead_Source",
          comparator: "equal",
          value: "Web Download",
        },
      },
      immediate: [
        {
          id: "act-lead-welcome-email",
          kind: "notification",
          definitionRef: "template:lead_welcome_pack",
        },
      ],
      scheduled: [
        {
          id: "sched-lead-call",
          timing: {
            kind: "event_relative",
            offsetSeconds: 86400,
          },
          actions: [
            {
              id: "act-lead-create-task",
              kind: "activity",
              definitionRef: "task:introductory_call",
            },
          ],
        },
      ],
    },
  ],
};

export const dealDiscountRule: WorkflowRule = {
  id: "wf-rule-deal-discount",
  revision: "rev-1",
  module: "Deals",
  name: "Large Deal Approval Routing",
  description:
    "Routes deals to discount verification when stage reaches Negotiation and amount exceeds threshold.",
  enabled: true,
  position: 2,
  kind: "workflow",
  trigger: {
    kind: "field_change",
    fields: ["Stage", "Amount"],
  },
  branches: [
    {
      id: "br-deal-1",
      position: 1,
      condition: {
        kind: "criteria",
        criteria: {
          groupOperator: "and",
          group: [
            { field: "Stage", comparator: "equal", value: "Negotiation" },
            { field: "Amount", comparator: "greater_than", value: 100000 },
          ],
        },
      },
      immediate: [
        {
          id: "act-deal-field-update",
          kind: "field_update",
          definitionRef: "field_update:flag_executive_review",
        },
        {
          id: "act-deal-webhook",
          kind: "webhook",
          definitionRef: "webhook:notify_deal_desk",
        },
      ],
      scheduled: [],
    },
  ],
};

export const contactRenewalRule: WorkflowRule = {
  id: "wf-rule-contact-renewal",
  revision: "rev-1",
  module: "Contacts",
  name: "Annual Contract Renewal Notice",
  description: "Sends an automated renewal check 30 days prior to contract expiration date.",
  enabled: false,
  position: 3,
  kind: "workflow",
  trigger: {
    kind: "date",
    field: "Contract_End_Date",
    timezone: "UTC",
  },
  branches: [
    {
      id: "br-contact-1",
      position: 1,
      condition: {
        kind: "all_records",
      },
      immediate: [],
      scheduled: [
        {
          id: "sched-contact-renewal-notice",
          timing: {
            kind: "field_relative",
            field: "Contract_End_Date",
            offsetSeconds: -2592000,
            timezone: "UTC",
          },
          actions: [
            {
              id: "act-contact-renewal-email",
              kind: "notification",
              definitionRef: "template:contract_renewal_notice",
            },
          ],
        },
      ],
    },
  ],
};

export const accountSyncRule: WorkflowRule = {
  id: "wf-rule-account-sync",
  revision: "rev-1",
  module: "Accounts",
  name: "Enterprise Account Data Sync",
  description: "Synchronizes account updates to enterprise systems upon modification.",
  enabled: true,
  position: 4,
  kind: "workflow",
  trigger: {
    kind: "record",
    on: "edit",
  },
  branches: [
    {
      id: "br-account-1",
      position: 1,
      condition: {
        kind: "criteria",
        criteria: {
          field: "Account_Type",
          comparator: "equal",
          value: "Enterprise",
        },
      },
      immediate: [
        {
          id: "act-account-fn-sync",
          kind: "function",
          definitionRef: "fn:sync_billing_profile",
        },
      ],
      scheduled: [],
    },
  ],
};

export const SYNTHETIC_WORKFLOW_RULES: readonly WorkflowRule[] = [
  leadWelcomeRule,
  dealDiscountRule,
  contactRenewalRule,
  accountSyncRule,
];
