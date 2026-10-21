export const emailFolders = [
  { id: "inbox", label: "Inbox" },
  { id: "sent", label: "Sent" },
  { id: "drafts", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
] as const;

export type EmailFolder = (typeof emailFolders)[number]["id"];
export type EmailAddress = { name: string; address: string };
export type EmailMessage = {
  id: string;
  from: EmailAddress;
  to: readonly EmailAddress[];
  cc: readonly EmailAddress[];
  date: string;
  body: string;
  attachments: readonly { id: string; name: string; sizeLabel: string }[];
};
export type EmailConversation = {
  id: string;
  folder: EmailFolder;
  subject: string;
  snippet: string;
  unread: boolean;
  messages: readonly EmailMessage[];
};
export type InboxViewModel = {
  connected: boolean;
  conversations: readonly EmailConversation[];
};

export function resolveInboxSelection(
  model: InboxViewModel,
  folderParam: string | null,
  messageParam: string | null,
) {
  const folder = emailFolders.find((item) => item.id === folderParam)?.id ?? "inbox";
  const conversations = model.connected
    ? model.conversations.filter((item) => item.folder === folder)
    : [];
  return {
    folder,
    conversations,
    selected: conversations.find((item) => item.id === messageParam),
  };
}
