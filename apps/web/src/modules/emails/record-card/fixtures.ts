import type { EmailConversation } from "../inbox/view-model";
import type {
  EmailParentModule,
  EmailRecordCardLoader,
  EmailRecordCardViewModel,
  EmailTabItem,
} from "./types";

export const EMAIL_CARD_TABS: readonly EmailTabItem[] = [
  { id: "mails", label: "Mails" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
] as const;

export const COMPOSE_EMAIL_TOOLTIP = "Available when a mailbox is connected";

export const EMPTY_STATE_TEXT = "No records found";

export const EMPTY_RECORD_CARD_EMAILS: readonly EmailConversation[] = [];

export async function loadEmailRecordCardFixture(
  _parentModule?: EmailParentModule,
  _recordId?: string,
): Promise<EmailConversation[]> {
  return [];
}

export const loadRecordCardEmailsFixture: EmailRecordCardLoader = loadEmailRecordCardFixture;

export function createEmptyEmailRecordCardViewModel(
  parentModule: EmailParentModule = "Contacts",
  recordId?: string,
): EmailRecordCardViewModel {
  return {
    parentModule,
    recordId,
    activeTab: "mails",
    tabs: EMAIL_CARD_TABS,
    emptyStateText: EMPTY_STATE_TEXT,
    composeTooltip: COMPOSE_EMAIL_TOOLTIP,
    composeDisabled: true,
  };
}

export const emptyEmailRecordCardFixture: EmailRecordCardViewModel =
  createEmptyEmailRecordCardViewModel("Contacts");
