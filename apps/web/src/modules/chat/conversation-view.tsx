"use client";

import {
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { CopyIcon, PencilIcon, StarIcon, TrashIcon } from "./chat-icons";
import { Composer } from "./composer";
import type { ChatConversation, ChatDataSource, ChatMessageView, ShownPresence } from "./data";
import { dayDiff, dayKey, extractMentions, initialsOf, linkify } from "./text";

const BOTTOM_THRESHOLD = 24;

export function PresenceDot({ presence }: { presence: ShownPresence | "invisible" | null }) {
  return <span className={`chat-presence-dot chat-presence-${presence ?? "offline"}`} />;
}

export function Avatar({ name, presence }: { name: string; presence?: ShownPresence }) {
  return (
    <span className="chat-avatar" aria-hidden>
      {initialsOf(name)}
      {presence && (
        <span className="chat-avatar-presence">
          <PresenceDot presence={presence} />
        </span>
      )}
    </span>
  );
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatMessageTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

function MessageText({ body }: { body: string }) {
  return (
    <>
      {linkify(body).map((part, index) =>
        part.kind === "link" ? (
          <a
            // biome-ignore lint/suspicious/noArrayIndexKey: static split of one string
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {part.value}
          </a>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: static split of one string
          <Fragment key={index}>{part.value}</Fragment>
        ),
      )}
    </>
  );
}

interface MessageRowProps {
  message: ChatMessageView;
  own: boolean;
  dataSource: ChatDataSource;
  conversationId: string;
  showAuthor: boolean;
}

function MessageRow({ message, own, dataSource, conversationId, showAuthor }: MessageRowProps) {
  const t = useUiTranslations();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const confirmed = message.status === "sent";
  const members = dataSource.membersOf(conversationId);

  async function saveEdit() {
    const body = draft.trim();
    if (!body) return;
    if (body === message.body) {
      setEditing(false);
      return;
    }
    try {
      await dataSource.editMessage(
        conversationId,
        message.id,
        body,
        extractMentions(body, members, message.mentions),
      );
      setEditing(false);
    } catch {
      setEditing(true);
    }
  }

  function onEditKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void saveEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
      setDraft(message.body);
    }
  }

  function copy() {
    void navigator.clipboard?.writeText(message.body).catch(() => {});
  }

  return (
    <li
      className={`chat-message${own ? " chat-message-own" : ""}${message.status === "failed" ? " chat-message-failed" : ""}`}
      data-testid="chat-message"
      data-message-id={message.id}
    >
      {showAuthor && (
        <div className="chat-message-meta">
          <span className="chat-message-author">{own ? t("chat.you") : message.authorName}</span>
          <time className="chat-message-time" dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
      )}
      {message.deleted ? (
        <p className="chat-message-body chat-message-deleted" data-testid="chat-message-deleted">
          {t("chat.deletedMessage")}
        </p>
      ) : editing ? (
        <div className="chat-message-edit">
          <textarea
            className="chat-composer-input"
            // biome-ignore lint/a11y/noAutofocus: the editor opens on an explicit user action
            autoFocus
            rows={2}
            aria-label={t("chat.editLabel")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onEditKey}
            data-testid="chat-edit-input"
          />
          <div className="chat-message-edit-actions">
            <Button
              variant="secondary"
              size="compact"
              onPress={() => {
                setEditing(false);
                setDraft(message.body);
              }}
            >
              {t("chat.cancel")}
            </Button>
            <Button
              variant="primary"
              size="compact"
              onPress={() => void saveEdit()}
              data-testid="chat-edit-save"
            >
              {t("chat.saveEdit")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="chat-message-body">
          <MessageText body={message.body} />
          {message.edited && <span className="chat-message-edited"> {t("chat.edited")}</span>}
        </p>
      )}
      {message.status === "sending" && (
        <span className="chat-message-status">{t("chat.sending")}</span>
      )}
      {message.status === "failed" && (
        <span className="chat-message-status chat-message-status-failed" role="alert">
          {t("chat.sendFailed")}{" "}
          <button
            type="button"
            className="chat-inline-action"
            onClick={() => void dataSource.retryMessage(conversationId, message.id)}
            data-testid="chat-retry"
          >
            {t("chat.retry")}
          </button>{" "}
          <button
            type="button"
            className="chat-inline-action"
            onClick={() => dataSource.discardMessage(conversationId, message.id)}
          >
            {t("chat.discard")}
          </button>
        </span>
      )}
      {confirmed && !message.deleted && !editing && (
        <div className="chat-message-actions" role="toolbar" aria-label={t("chat.messageActions")}>
          <button
            type="button"
            className="chat-action"
            aria-label={message.starred ? t("chat.unstar") : t("chat.star")}
            aria-pressed={message.starred}
            onClick={() =>
              void dataSource
                .starMessage(conversationId, message.id, !message.starred)
                .catch(() => {})
            }
            data-testid="chat-action-star"
          >
            <StarIcon filled={message.starred} className="size-3.5" />
          </button>
          <button
            type="button"
            className="chat-action"
            aria-label={t("chat.copyText")}
            onClick={copy}
            data-testid="chat-action-copy"
          >
            <CopyIcon className="size-3.5" />
          </button>
          {own && (
            <>
              <button
                type="button"
                className="chat-action"
                aria-label={t("chat.edit")}
                onClick={() => {
                  setDraft(message.body);
                  setEditing(true);
                }}
                data-testid="chat-action-edit"
              >
                <PencilIcon className="size-3.5" />
              </button>
              <button
                type="button"
                className="chat-action"
                aria-label={t("chat.delete")}
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete(true);
                }}
                data-testid="chat-action-delete"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t("chat.deleteTitle")}
          message={t("chat.deleteBody")}
          confirmLabel={t("chat.deleteConfirm")}
          cancelLabel={t("chat.cancel")}
          tone="danger"
          isOpen
          errorMessage={deleteError}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(false);
          }}
          onConfirm={async () => {
            try {
              await dataSource.deleteMessage(conversationId, message.id);
              setConfirmDelete(false);
            } catch {
              setDeleteError(t("chat.errorGeneric"));
            }
          }}
        />
      )}
    </li>
  );
}

function dayLabel(iso: string, t: ReturnType<typeof useUiTranslations>): string {
  const diff = dayDiff(iso);
  if (diff === 0) return t("chat.today");
  if (diff === 1) return t("chat.yesterday");
  return dateFormat.format(new Date(iso));
}

export interface ConversationViewProps {
  dataSource: ChatDataSource;
  conversation: ChatConversation;
  onBack(): void;
}

/**
 * Conversation view (spec: history, day separators, edited marker, deleted
 * placeholder, mark read at the bottom) with the composer underneath.
 * Refs: MEP-1420, ADR 0015 §3, §7
 */
export function ConversationView({ dataSource, conversation, onBack }: ConversationViewProps) {
  const t = useUiTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const prevHeightRef = useRef<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const { id } = conversation;
  const { openConversation, markRead, loadOlder } = dataSource;
  const messages = dataSource.messagesOf(id);
  const members = dataSource.membersOf(id);
  const hasOlder = dataSource.hasOlder(id);
  const lastKey = messages[messages.length - 1]?.id;

  useEffect(() => {
    void openConversation(id).catch(() => {});
  }, [id, openConversation]);

  const atBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
  }, []);

  const maybeMarkRead = useCallback(() => {
    if (atBottom()) markRead(id);
  }, [atBottom, markRead, id]);

  // Stay glued to the bottom for new messages; keep position when older ones are prepended.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the newest message changes
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = null;
    } else if (stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
    maybeMarkRead();
  }, [lastKey, messages.length, maybeMarkRead]);

  async function fetchOlder() {
    if (loadingOlder) return;
    setLoadingOlder(true);
    prevHeightRef.current = scrollRef.current?.scrollHeight ?? null;
    try {
      await loadOlder(id);
    } catch {
      prevHeightRef.current = null;
    } finally {
      setLoadingOlder(false);
    }
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = atBottom();
    if (stickRef.current) markRead(id);
    if (el.scrollTop <= 8 && hasOlder && !loadingOlder && messages.length > 0) void fetchOlder();
  }

  const rows = useMemo(() => {
    const out: Array<{ message: ChatMessageView; separator?: string; showAuthor: boolean }> = [];
    let lastDay = "";
    let lastAuthor = "";
    let lastTime = 0;
    for (const message of messages) {
      const day = dayKey(message.createdAt);
      const separator = day !== lastDay ? dayLabel(message.createdAt, t) : undefined;
      const time = new Date(message.createdAt).getTime();
      const showAuthor =
        Boolean(separator) || message.authorId !== lastAuthor || time - lastTime > 5 * 60_000;
      out.push({ message, separator, showAuthor });
      lastDay = day;
      lastAuthor = message.authorId;
      lastTime = time;
    }
    return out;
  }, [messages, t]);

  const presenceLabel = conversation.presence
    ? t(`chat.presence.${conversation.presence}` as Parameters<typeof t>[0])
    : null;

  return (
    <div className="chat-conversation" data-testid="chat-conversation">
      <div className="chat-conversation-header">
        <Button
          variant="icon"
          size="compact"
          aria-label={t("chat.back")}
          onPress={onBack}
          className="size-7"
          data-testid="chat-conversation-back"
        >
          <Icons.chevronLeft className="size-4" aria-hidden />
        </Button>
        <Avatar name={conversation.title} />
        <div className="chat-conversation-title-block">
          <div className="chat-conversation-title" data-testid="chat-conversation-title">
            {conversation.title}
          </div>
          {presenceLabel && (
            <div className="chat-conversation-presence">
              <PresenceDot presence={conversation.presence ?? "offline"} />
              <span>{presenceLabel}</span>
            </div>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="chat-conversation-scroll"
        onScroll={onScroll}
        role="log"
        aria-label={t("chat.messagesLabel")}
        data-testid="chat-conversation-scroll"
      >
        {hasOlder && messages.length > 0 && (
          <div className="chat-older">
            <button
              type="button"
              className="chat-inline-action"
              disabled={loadingOlder}
              onClick={() => void fetchOlder()}
              data-testid="chat-load-older"
            >
              {loadingOlder ? t("chat.loading") : t("chat.loadOlder")}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="chat-conversation-empty">{t("chat.noMessagesYet")}</p>
        )}
        <ul className="chat-message-list">
          {rows.map(({ message, separator, showAuthor }) => (
            <Fragment key={message.id}>
              {separator && (
                <li className="chat-day-separator" data-testid="chat-day-separator">
                  <span>{separator}</span>
                </li>
              )}
              <MessageRow
                message={message}
                own={message.authorId === dataSource.selfId}
                dataSource={dataSource}
                conversationId={id}
                showAuthor={showAuthor}
              />
            </Fragment>
          ))}
        </ul>
      </div>
      <Composer
        members={members}
        onSend={(body, mentions) => {
          stickRef.current = true;
          void dataSource.sendMessage(id, body, mentions);
        }}
      />
    </div>
  );
}
