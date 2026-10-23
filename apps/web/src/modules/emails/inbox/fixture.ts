import type {
  EmailAddress,
  EmailConversation,
  EmailFolder,
  EmailMessage,
  InboxViewModel,
} from "./view-model";

const owner: EmailAddress = { name: "Alex Morgan", address: "alex@example.com" };
const partner: EmailAddress = { name: "Robin Ellis", address: "robin@example.com" };

function message(id: string, body: string, outgoing = false): EmailMessage {
  return {
    id,
    from: outgoing ? owner : partner,
    to: [outgoing ? partner : owner],
    cc: [],
    date: "2026-10-21T09:30:00Z",
    body,
    attachments: [],
  };
}

const topics = [
  ["Project overview", "Here is the overview for our next discussion."],
  ["Workshop agenda", "The workshop will cover planning and next steps."],
  ["Meeting notes", "Thank you for the discussion. These are the agreed next steps."],
  ["Updated schedule", "The revised schedule is ready for review."],
  ["Review checklist", "Please review the checklist before our next meeting."],
  ["Delivery update", "The delivery is progressing according to the agreed schedule."],
  ["Planning summary", "Here is a summary of this week's planning session."],
  ["Resource guide", "The resource guide includes the materials we discussed."],
  ["Follow-up questions", "I have collected the questions from our last conversation."],
] as const;

const conversations: EmailConversation[] = topics.map(([subject, body], index) => {
  const folder: EmailFolder = index < 6 ? "inbox" : index < 8 ? "sent" : "drafts";
  const latest = message(`message-${index + 1}`, body, folder !== "inbox");
  return {
    id: `conversation-${index + 1}`,
    folder,
    subject,
    snippet: body,
    unread: folder === "inbox" && index < 2,
    messages: [latest],
  };
});

// Nine conversations, twelve invented messages. Scheduled stays empty for the empty state.
const first = conversations[0];
if (first) {
  first.messages = [
    {
      ...message("overview-1", "Could you share an overview of the proposed work?", true),
      date: "2026-10-19T08:00:00Z",
    },
    {
      ...message("overview-2", "I will prepare an overview for our next discussion."),
      date: "2026-10-20T08:00:00Z",
    },
    {
      ...message("overview-3", "Thank you. Please include the planning notes.", true),
      date: "2026-10-20T10:00:00Z",
    },
    {
      ...message(
        "overview-4",
        "Here is the overview for our next discussion.\n\nThe planning notes are included in the attachment.",
      ),
      cc: [{ name: "Casey Reed", address: "casey@example.com" }],
      attachments: [{ id: "overview-file", name: "project-overview.pdf", sizeLabel: "120 KB" }],
    },
  ];
}

export const inboxFixture: InboxViewModel = { connected: true, conversations };
