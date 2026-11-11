import { z } from "zod";
import { conditionSchema } from "../approvals/types";

export const JOURNEY_MODULES = ["Leads", "Contacts", "Accounts", "Deals"] as const;
export type JourneyModule = (typeof JOURNEY_MODULES)[number];

export const JOURNEY_STATUSES = ["draft", "active", "inactive"] as const;
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];

export const JOURNEY_VERSION_STATES = ["draft", "active", "superseded"] as const;
export type JourneyVersionState = (typeof JOURNEY_VERSION_STATES)[number];

export const journeyActionTimingSchema = z.union([
  z.literal("immediate"),
  z.object({
    type: z.literal("immediate"),
  }),
  z.object({
    type: z.literal("after").optional(),
    amount: z.number().int().positive("Delay amount must be positive"),
    unit: z.enum(["minutes", "hours", "days"]),
  }),
]);
export type JourneyActionTiming = z.infer<typeof journeyActionTimingSchema>;

export const journeyEmailActionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("email"),
  timing: journeyActionTimingSchema.default("immediate"),
  templateId: z.string().nullable().optional(),
});
export type JourneyEmailAction = z.infer<typeof journeyEmailActionSchema>;

export const journeyTaskActionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("task"),
  timing: journeyActionTimingSchema.default("immediate"),
  subject: z.string().min(1, "Subject is required"),
  dueOffsetDays: z.number().int().nonnegative().default(0),
  priority: z.enum(["High", "Highest", "Normal", "Low", "Lowest"]).default("Normal"),
});
export type JourneyTaskAction = z.infer<typeof journeyTaskActionSchema>;

export const journeyCallActionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("call"),
  timing: journeyActionTimingSchema.default("immediate"),
  subject: z.string().min(1, "Subject is required"),
  callType: z.enum(["Outbound", "Inbound"]).default("Outbound"),
});
export type JourneyCallAction = z.infer<typeof journeyCallActionSchema>;

export const journeyFieldUpdateActionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("field_update"),
  timing: journeyActionTimingSchema.default("immediate"),
  field: z.string().min(1, "Field name is required"),
  value: z.unknown(),
});
export type JourneyFieldUpdateAction = z.infer<typeof journeyFieldUpdateActionSchema>;

export const journeyNotifyUserActionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("notify_user"),
  timing: journeyActionTimingSchema.default("immediate"),
  userRef: z.string().min(1, "User reference is required"),
  message: z.string().min(1, "Message is required"),
});
export type JourneyNotifyUserAction = z.infer<typeof journeyNotifyUserActionSchema>;

export const journeyActionSchema = z.discriminatedUnion("kind", [
  journeyEmailActionSchema,
  journeyTaskActionSchema,
  journeyCallActionSchema,
  journeyFieldUpdateActionSchema,
  journeyNotifyUserActionSchema,
]);
export type JourneyAction = z.infer<typeof journeyActionSchema>;

export const journeyDeadlineSchema = z.object({
  amount: z.number().int().positive("Deadline amount must be positive"),
  unit: z.enum(["minutes", "hours", "days"]),
});
export type JourneyDeadline = z.infer<typeof journeyDeadlineSchema>;

export const journeyStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "State name is required"),
  isStart: z.boolean().optional().default(false),
  actions: z.array(journeyActionSchema).default([]),
  deadline: journeyDeadlineSchema.optional().nullable(),
});
export type JourneyState = z.infer<typeof journeyStateSchema>;
export type JourneyStateInput = z.input<typeof journeyStateSchema>;

export const journeyTriggerSchema = z.union([
  z.literal("record_created"),
  z.literal("record_updated"),
  z.literal("deadline_missed"),
  z.object({
    kind: z.literal("record_created"),
  }),
  z.object({
    kind: z.literal("record_updated"),
  }),
  z.object({
    kind: z.literal("deadline_missed"),
  }),
  z.object({
    kind: z.literal("webform_submitted"),
    formId: z.string().min(1, "Form ID is required"),
  }),
  z.object({
    kind: z.literal("date_reached"),
    field: z.string().min(1, "Field is required"),
    offset: z
      .union([
        z.number(),
        z.object({
          amount: z.number().int(),
          unit: z.enum(["minutes", "hours", "days"]),
        }),
      ])
      .optional(),
  }),
  // Also accept type: ... for triggers
  z.object({
    type: z.literal("record_created"),
  }),
  z.object({
    type: z.literal("record_updated"),
  }),
  z.object({
    type: z.literal("deadline_missed"),
  }),
  z.object({
    type: z.literal("webform_submitted"),
    formId: z.string().min(1, "Form ID is required"),
  }),
  z.object({
    type: z.literal("date_reached"),
    field: z.string().min(1, "Field is required"),
    offset: z
      .union([
        z.number(),
        z.object({
          amount: z.number().int(),
          unit: z.enum(["minutes", "hours", "days"]),
        }),
      ])
      .optional(),
  }),
]);
export type JourneyTrigger = z.infer<typeof journeyTriggerSchema>;

export const journeyTransitionSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1, "Source state is required"),
  to: z.string().min(1, "Target state is required"),
  trigger: journeyTriggerSchema,
  criteria: conditionSchema.optional().nullable(),
  actions: z.array(journeyActionSchema).default([]),
});
export type JourneyTransition = z.infer<typeof journeyTransitionSchema>;
export type JourneyTransitionInput = z.input<typeof journeyTransitionSchema>;

export const createJourneySchema = z.object({
  name: z.string().trim().min(1, "Journey name is required").max(100),
  module: z.enum(JOURNEY_MODULES, {
    message: "Module must be Leads, Contacts, Accounts, or Deals",
  }),
  description: z.string().optional().default(""),
});
export type CreateJourneyInput = z.input<typeof createJourneySchema>;

export const updateJourneyDraftSchema = z.object({
  name: z.string().trim().min(1, "Journey name cannot be empty").max(100).optional(),
  description: z.string().optional(),
  states: z.array(journeyStateSchema).optional(),
  transitions: z.array(journeyTransitionSchema).optional(),
});
export type UpdateJourneyDraftInput = z.input<typeof updateJourneyDraftSchema>;

export interface JourneyVersionSummary {
  id: string;
  journeyId: string;
  number: number;
  state: JourneyVersionState;
  states: JourneyState[];
  transitions: JourneyTransition[];
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
}

export interface JourneyDetail {
  id: string;
  name: string;
  module: JourneyModule;
  description: string;
  status: JourneyStatus;
  draftVersionId: string | null;
  activeVersionId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  currentVersion: JourneyVersionSummary | null;
  draftVersion: JourneyVersionSummary | null;
  activeVersion: JourneyVersionSummary | null;
  currentRecordCount: number;
}

export interface JourneySummary {
  id: string;
  name: string;
  module: JourneyModule;
  description: string;
  status: JourneyStatus;
  draftVersionId: string | null;
  activeVersionId: string | null;
  currentRecordCount: number;
  lastModifiedAt: string;
  lastModifiedBy: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}
