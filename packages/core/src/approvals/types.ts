import { z } from "zod";
import type { Criteria } from "../records/contract";

export const PROCESS_KINDS = ["approval", "review"] as const;
export type ProcessKind = (typeof PROCESS_KINDS)[number];

export const PROCESS_TRIGGERS = ["create", "edit", "create_or_edit"] as const;
export type ProcessTrigger = (typeof PROCESS_TRIGGERS)[number];

export const APPROVAL_OPEN_STATUSES = [
  "pending",
  "waiting_review",
  "in_review",
  "waiting_rereview",
] as const;
export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "recalled"
  | "waiting_review"
  | "in_review"
  | "waiting_rereview";
export type ApproverState = "pending" | "approved" | "rejected" | "delegated" | "skipped";
export type ActionKind =
  | "submitted"
  | "approved"
  | "rejected"
  | "delegated"
  | "recalled"
  | "auto_approved";

const scalar = z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]);

const criteriaSchema = z.lazy(() =>
  z.union([
    z.object({
      field: z.string().min(1).max(120),
      comparator: z.enum([
        "equal",
        "contains",
        "not_contains",
        "less_equal",
        "not_equal",
        "starts_with",
        "ends_with",
        "is_empty",
        "is_not_empty",
        "less_than",
        "greater_than",
        "greater_equal",
        "between",
        "not_between",
      ]),
      value: z.union([scalar, z.array(scalar).max(50)]).default(null),
    }),
    z.object({
      groupOperator: z.enum(["and", "or"]),
      group: z.array(criteriaSchema).min(1).max(50),
    }),
  ]),
) as unknown as z.ZodType<Criteria>;

export const conditionSchema = z.union([
  z.object({ kind: z.literal("all_records") }),
  z.object({ kind: z.literal("criteria"), criteria: criteriaSchema }),
]);
export type ProcessCondition = z.infer<typeof conditionSchema>;

export const approverSetSchema = z
  .object({
    kind: z.enum(["users", "roles", "groups", "record_owner_manager"]),
    refs: z.array(z.string().min(1).max(120)).max(50).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.kind !== "record_owner_manager" && value.refs.length === 0) {
      ctx.addIssue({ code: "custom", path: ["refs"], message: "Choose at least one approver." });
    }
  });

export const stepSchema = z.object({
  name: z.string().trim().min(1).max(80),
  approvers: approverSetSchema,
  rule: z.enum(["any", "all"]),
});
export type ProcessStep = z.infer<typeof stepSchema>;

export const fieldUpdateSchema = z.object({
  kind: z.literal("field_update"),
  field: z.string().min(1).max(120),
  value: scalar,
});
export type FieldUpdateAction = z.infer<typeof fieldUpdateSchema>;

const processShape = {
  name: z.string().trim().min(1).max(120),
  module: z.string().min(1).max(80),
  trigger: z.enum(PROCESS_TRIGGERS),
  criteria: conditionSchema.default({ kind: "all_records" }),
  steps: z.array(stepSchema).min(1).max(5),
  reviewFields: z.array(z.string().min(1).max(120)).max(50).default([]),
  onApprove: z.array(fieldUpdateSchema).max(20).default([]),
  onReject: z.array(fieldUpdateSchema).max(20).default([]),
};

export const createProcessSchema = z.object(processShape);
/** No defaults here: an omitted field must keep its stored value. */
export const updateProcessSchema = z.object({
  name: processShape.name.optional(),
  module: processShape.module.optional(),
  trigger: processShape.trigger.optional(),
  criteria: conditionSchema.optional(),
  steps: processShape.steps.optional(),
  reviewFields: z.array(z.string().min(1).max(120)).max(50).optional(),
  onApprove: z.array(fieldUpdateSchema).max(20).optional(),
  onReject: z.array(fieldUpdateSchema).max(20).optional(),
  active: z.boolean().optional(),
});
export const reorderProcessesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export type CreateProcessInput = z.input<typeof createProcessSchema>;
export type UpdateProcessInput = z.input<typeof updateProcessSchema>;

export type ApprovalProcess = {
  id: string;
  kind: ProcessKind;
  name: string;
  module: string;
  trigger: ProcessTrigger;
  criteria: ProcessCondition;
  steps: ProcessStep[];
  reviewFields: string[];
  onApprove: FieldUpdateAction[];
  onReject: FieldUpdateAction[];
  active: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type UserRef = { id: string; name: string };

export type ApprovalListItem = {
  id: string;
  kind: ProcessKind;
  processId: string;
  processName: string;
  module: string;
  recordId: string;
  recordLabel: string;
  step: number;
  stepName: string;
  status: RequestStatus;
  submitter: UserRef;
  submittedAt: string;
};

export type ApprovalDetail = {
  request: ApprovalListItem & { decidedAt: string | null; stepCount: number };
  record: {
    module: string;
    id: string;
    label: string;
    fields: Record<string, unknown>;
  } | null;
  steps: {
    step: number;
    name: string;
    rule: "any" | "all";
    approvers: (UserRef & { state: ApproverState; delegatedFrom: UserRef | null })[];
  }[];
  actions: {
    id: string;
    step: number;
    action: ActionKind;
    actor: UserRef | null;
    target: UserRef | null;
    comment: string | null;
    actedAt: string;
  }[];
  permissions: { canDecide: boolean; canRecall: boolean };
};

export type ApprovalHistoryItem = {
  id: string;
  requestId: string;
  kind: ProcessKind;
  module: string;
  recordId: string;
  recordLabel: string;
  processName: string;
  step: number;
  action: ActionKind;
  actor: UserRef | null;
  target: UserRef | null;
  comment: string | null;
  actedAt: string;
};

export const decisionSchema = z.object({
  comment: z.string().trim().max(2000).optional(),
  targetUserId: z.string().uuid().optional(),
});
export type DecisionInput = z.infer<typeof decisionSchema>;
export type DecisionAction = "approve" | "reject" | "delegate" | "recall";
export const DECISION_ACTIONS: readonly DecisionAction[] = [
  "approve",
  "reject",
  "delegate",
  "recall",
];

export type Page<T> = { items: T[]; nextCursor: string | null };
