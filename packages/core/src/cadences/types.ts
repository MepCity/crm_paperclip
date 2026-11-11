import { z } from "zod";
import { conditionSchema } from "../approvals/types";

export const CADENCE_MODULES = ["Leads", "Contacts", "Accounts", "Deals"] as const;
export type CadenceModule = (typeof CADENCE_MODULES)[number];

export const CADENCE_STATUSES = ["draft", "active", "inactive"] as const;
export type CadenceStatus = (typeof CADENCE_STATUSES)[number];

export const CADENCE_VERSION_STATES = ["draft", "published", "superseded"] as const;
export type CadenceVersionState = (typeof CADENCE_VERSION_STATES)[number];

export const cadenceAudienceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("manual"),
  }),
  z.object({
    kind: z.literal("custom_view"),
    viewId: z.string().min(1, "View ID is required"),
    enrollNewMatches: z.boolean().default(false),
  }),
]);
export type CadenceAudience = z.infer<typeof cadenceAudienceSchema>;

export const cadenceStepDelaySchema = z.object({
  amount: z.number().int().nonnegative("Delay amount must be non-negative"),
  unit: z.enum(["minutes", "hours", "days"]),
});
export type CadenceStepDelay = z.infer<typeof cadenceStepDelaySchema>;

export const cadenceEmailStepSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("email"),
  delay: cadenceStepDelaySchema,
  templateId: z.string().nullable().optional(),
  name: z.string().optional(),
});
export type CadenceEmailStep = z.infer<typeof cadenceEmailStepSchema>;

export const cadenceTaskStepSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("task"),
  delay: cadenceStepDelaySchema,
  subject: z.string().min(1, "Subject is required"),
  dueOffsetDays: z.number().int().nonnegative().default(0),
  priority: z.enum(["High", "Highest", "Normal", "Low", "Lowest"]).default("Normal"),
});
export type CadenceTaskStep = z.infer<typeof cadenceTaskStepSchema>;

export const cadenceCallStepSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("call"),
  delay: cadenceStepDelaySchema,
  subject: z.string().min(1, "Subject is required"),
  callType: z.enum(["Outbound", "Inbound"]).default("Outbound"),
});
export type CadenceCallStep = z.infer<typeof cadenceCallStepSchema>;

export const cadenceStepSchema = z.discriminatedUnion("kind", [
  cadenceEmailStepSchema,
  cadenceTaskStepSchema,
  cadenceCallStepSchema,
]);
export type CadenceStep = z.infer<typeof cadenceStepSchema>;

export const cadenceExitRuleSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string().min(1),
    kind: z.literal("on_reply"),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("reply"),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("meeting_booked"),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("field_condition"),
    condition: conditionSchema,
  }),
]);
export type CadenceExitRule = z.infer<typeof cadenceExitRuleSchema>;

export const createCadenceSchema = z.object({
  name: z.string().trim().min(1, "Cadence name is required").max(100),
  module: z.enum(CADENCE_MODULES, {
    message: "Module must be Leads, Contacts, Accounts, or Deals",
  }),
  description: z.string().optional().default(""),
  audience: cadenceAudienceSchema.optional().default({ kind: "manual" }),
});
export type CreateCadenceInput = z.input<typeof createCadenceSchema>;

export const updateCadenceDraftSchema = z.object({
  name: z.string().trim().min(1, "Cadence name cannot be empty").max(100).optional(),
  description: z.string().optional(),
  audience: cadenceAudienceSchema.optional(),
  steps: z.array(cadenceStepSchema).optional(),
  exitRules: z.array(cadenceExitRuleSchema).optional(),
});
export type UpdateCadenceDraftInput = z.input<typeof updateCadenceDraftSchema>;

export interface CadenceFilters {
  search?: string;
  module?: string;
  status?: string;
}

export interface Cadence {
  id: string;
  organizationId: string;
  name: string;
  module: CadenceModule;
  description: string;
  status: CadenceStatus;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CadenceVersion {
  id: string;
  organizationId: string;
  cadenceId: string;
  number: number;
  state: CadenceVersionState;
  audience: CadenceAudience;
  steps: CadenceStep[];
  exitRules: CadenceExitRule[];
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
}

export interface CadenceSummary {
  id: string;
  name: string;
  module: CadenceModule;
  description: string;
  status: CadenceStatus;
  audience: CadenceAudience;
  recordCount: number;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CadenceDetail extends Cadence {
  draftVersion: CadenceVersion | null;
  publishedVersion: CadenceVersion | null;
  currentVersion: CadenceVersion;
  recordCount: number;
}

export const CADENCE_ENROLLMENT_STATES = [
  "active",
  "paused",
  "completed",
  "exited",
  "stopped",
] as const;
export type CadenceEnrollmentState = (typeof CADENCE_ENROLLMENT_STATES)[number];

export interface CadenceEnrollment {
  id: string;
  organizationId: string;
  cadenceId: string;
  versionId: string;
  recordModule: CadenceModule;
  recordId: string;
  enrolledBy: string;
  state: CadenceEnrollmentState;
  reason: string | null;
  generation: number;
  nextStepId: string | null;
  nextDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CadenceStepRun {
  id: string;
  organizationId: string;
  enrollmentId: string;
  stepId: string;
  generation: number;
  outcome: "completed" | "skipped" | "failed";
  outcomeReason: string | null;
  executedAt: string;
}

export const enrollRecordSchema = z.object({
  cadenceId: z.string().uuid(),
  recordModule: z.enum(CADENCE_MODULES),
  recordId: z.string().min(1),
});
export type EnrollRecordInput = z.infer<typeof enrollRecordSchema>;

export const enrollRecordsSchema = z.object({
  cadenceId: z.string().uuid(),
  recordModule: z.enum(CADENCE_MODULES),
  recordIds: z.array(z.string().min(1)).min(1),
});
export type EnrollRecordsInput = z.infer<typeof enrollRecordsSchema>;
