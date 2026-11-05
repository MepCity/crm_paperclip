import type {
  ActionKind,
  ApprovalDetail,
  ApprovalHistoryItem,
  ApprovalListItem,
  ApprovalProcess,
  ApproverState,
  DecisionAction,
  DecisionInput,
  FieldUpdateAction,
  Page,
  ProcessCondition,
  ProcessKind,
  ProcessStep,
  ProcessTrigger,
  RequestStatus,
  UserRef,
} from "@crm/core/approvals";

export type {
  ActionKind,
  ApprovalDetail,
  ApprovalHistoryItem,
  ApprovalListItem,
  ApprovalProcess,
  ApproverState,
  DecisionAction,
  DecisionInput,
  FieldUpdateAction,
  Page,
  ProcessCondition,
  ProcessKind,
  ProcessStep,
  ProcessTrigger,
  RequestStatus,
  UserRef,
};

export type ApprovalCounts = {
  blueprint: number;
  approval: number;
  review: number;
  image_validation: number;
};

export type HistoryMeta = {
  types: string[];
  actions: ActionKind[];
  modules: string[];
  users: UserRef[];
};

export type MyJobsTabKey = "blueprint" | "approval" | "review" | "image_validation";
