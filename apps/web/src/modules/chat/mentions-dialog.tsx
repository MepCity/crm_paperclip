"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatMessageView } from "./data";
import { ChatEmptyIllustration } from "./illustrations";

export interface MentionsDialogProps {
  mentions: ChatMessageView[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => Promise<void>;
  onGoToMessage: (conversationId: string, messageId: string) => void;
}

/**
 * Returns true if the message mentions ONLY broadcast groups (@all or @available)
 * without any direct @Name mentions.
 */
export function isBroadcastOnlyMention(body: string): boolean {
  if (!body) return false;
  const matches = Array.from(body.matchAll(/(?:^|[\s([{"'])@([^\s,.:;!?)}\]"']+)/g));
  if (matches.length === 0) return false;

  let hasBroadcast = false;
  let hasDirect = false;

  for (const match of matches) {
    const tag = match[1]?.toLowerCase();
    if (tag === "all" || tag === "available") {
      hasBroadcast = true;
    } else {
      hasDirect = true;
    }
  }

  return hasBroadcast && !hasDirect;
}

export function MentionsDialog({
  mentions,
  isOpen,
  onClose,
  onMarkAllRead,
  onGoToMessage,
}: MentionsDialogProps) {
  const t = useUiTranslations();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [hideBroadcast, setHideBroadcast] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const visible = mentions.filter((m) => {
    if (showUnreadOnly && m.status !== "sent") return false;
    if (hideBroadcast && isBroadcastOnlyMention(m.body)) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.mentions")}
      data-testid="chat-mentions"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface shadow-2xl"
        data-testid="chat-mentions-dialog"
      >
        {/* Header (#35–#39) */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <h2 className="text-sm font-semibold text-text shrink-0">{t("chat.mentions")}</h2>
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={hideBroadcast}
                onChange={(e) => setHideBroadcast(e.target.checked)}
                className="size-3.5"
                data-testid="chat-mentions-hide-broadcast"
              />
              <span>{t("chat.hideBroadcastMentions")}</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="size-3.5"
                data-testid="chat-mentions-unread-only"
              />
              <span>{t("chat.showUnreadMentions")}</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-accent-blue hover:underline font-semibold"
              onClick={() => void onMarkAllRead()}
              data-testid="chat-mentions-mark-all-read"
            >
              {t("chat.markAllRead")}
            </button>
            <Button
              variant="ghost"
              size="compact"
              aria-label={t("chat.close")}
              onPress={onClose}
              data-testid="chat-mentions-close"
            >
              <Icons.close className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Body (#40) */}
        <div className="flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChatEmptyIllustration />
              <p className="mt-4 max-w-xs text-xs text-text-muted leading-relaxed">
                {t("chat.emptyMentionsDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((m) => (
                <div
                  key={m.id}
                  className="rounded border border-border p-3 hover:bg-surface-hover/50 transition-colors"
                  data-testid={`chat-mention-item-${m.id}`}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-text">{m.authorName}</span>
                    <span className="text-text-muted text-[11px]">{m.createdAt.slice(0, 10)}</span>
                  </div>
                  {m.conversationTitle && (
                    <div className="text-[11px] text-text-muted mb-1.5">{m.conversationTitle}</div>
                  )}
                  <p className="text-xs text-text line-clamp-3 mb-2">{m.body}</p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-semibold text-accent-blue hover:underline"
                      onClick={() => {
                        if (m.conversationId) {
                          onGoToMessage(m.conversationId, m.id);
                        }
                      }}
                      data-testid={`chat-mention-go-${m.id}`}
                    >
                      {t("chat.goToMessage")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
