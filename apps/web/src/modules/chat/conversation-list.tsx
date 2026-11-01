"use client";

import { useUiTranslations } from "@/i18n/client-provider";
import { Avatar, formatMessageTime } from "./conversation-view";
import type { ChatContact, ChatConversation } from "./data";
import { dayDiff } from "./text";

const shortDate = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function listTime(iso: string): string {
  return dayDiff(iso) === 0 ? formatMessageTime(iso) : shortDate.format(new Date(iso));
}

export function ConversationList({
  conversations,
  selfId,
  onOpen,
}: {
  conversations: readonly ChatConversation[];
  selfId: string;
  onOpen(id: string): void;
}) {
  const t = useUiTranslations();
  return (
    <ul className="chat-list" data-testid="chat-conversation-list">
      {conversations.map((conversation) => {
        const last = conversation.lastMessage;
        const preview = last
          ? last.deleted
            ? t("chat.deletedMessage")
            : `${last.authorId === selfId ? t("chat.youPrefix") : conversation.kind === "direct" ? "" : `${last.authorName}: `}${last.text}`
          : "";
        return (
          <li key={conversation.id}>
            <button
              type="button"
              className={`chat-row${conversation.unreadCount > 0 ? " chat-row-unread" : ""}`}
              onClick={() => onOpen(conversation.id)}
              data-testid="chat-conversation-row"
            >
              <Avatar name={conversation.title} presence={conversation.presence} />
              <span className="chat-row-main">
                <span className="chat-row-title">{conversation.title}</span>
                <span className="chat-row-preview">{preview}</span>
              </span>
              <span className="chat-row-side">
                {last && <span className="chat-row-time">{listTime(last.timestamp)}</span>}
                {conversation.unreadCount > 0 && (
                  <span className="chat-tab-badge" data-testid="chat-row-unread-badge">
                    <span className="sr-only">
                      {t("chat.footerBadgeUnread", { count: conversation.unreadCount })}
                    </span>
                    <span aria-hidden="true">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </span>
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ContactList({
  contacts,
  onOpen,
}: {
  contacts: readonly ChatContact[];
  onOpen(userId: string): void;
}) {
  return (
    <ul className="chat-list" data-testid="chat-contact-list">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <button
            type="button"
            className="chat-row"
            onClick={() => onOpen(contact.id)}
            data-testid="chat-contact-row"
          >
            <Avatar name={contact.name} presence={contact.presence} />
            <span className="chat-row-main">
              <span className="chat-row-title">{contact.name}</span>
              {contact.email && <span className="chat-row-preview">{contact.email}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
