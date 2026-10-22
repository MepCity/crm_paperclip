import type { RelatedListControlDefinition } from "@/modules/types";

export type EmailParentModule = "Leads" | "Contacts" | "Accounts" | "Deals";

export type EmailTabKey = "mails" | "drafts" | "scheduled";

export interface EmailTabItem {
  id: EmailTabKey;
  label: string;
}

export interface EmailRecordCardViewModel {
  parentModule: EmailParentModule;
  recordId?: string;
  activeTab: EmailTabKey;
  tabs: readonly EmailTabItem[];
  emptyStateText: string;
  composeTooltip: string;
  composeDisabled: boolean;
}

export interface EmailsRecordCardProps {
  parentModule?: EmailParentModule;
  recordId?: string;
  recipientEmail?: string;
  targetId?: string;
  subtabRowEndControl?: RelatedListControlDefinition;
  initialTab?: EmailTabKey;
  onTabChange?: (tab: EmailTabKey) => void;
  tooltipOpen?: boolean;
}
