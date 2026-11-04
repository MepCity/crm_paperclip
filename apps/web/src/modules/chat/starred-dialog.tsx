"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatMessageView } from "./data";
import { ChatEmptyIllustration } from "./illustrations";

export interface StarredDialogProps {
  starred: ChatMessageView[];
  isOpen: boolean;
  onClose: () => void;
  onUnstar: (conversationId: string, messageId: string) => Promise<void>;
  onGoToMessage: (conversationId: string, messageId: string) => void;
}

export function StarredDialog({
  starred,
  isOpen,
  onClose,
  onUnstar,
  onGoToMessage,
}: StarredDialogProps) {
  const t = useUiTranslations();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.starred")}
      data-testid="chat-starred"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface shadow-2xl"
        data-testid="chat-starred-dialog"
      >
        {/* Header (#41) */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text">{t("chat.starred")}</h2>
          <Button
            variant="ghost"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            data-testid="chat-starred-close"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        {/* Body (#41) */}
        <div className="flex-1 overflow-y-auto p-4">
          {starred.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChatEmptyIllustration />
              <p className="mt-4 max-w-xs text-xs text-text-muted leading-relaxed">
                {t("chat.emptyStarredDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {starred.map((m) => (
                <div
                  key={m.id}
                  className="rounded border border-border p-3 hover:bg-surface-hover/50 transition-colors"
                  data-testid={`chat-starred-item-${m.id}`}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-text">{m.authorName}</span>
                    <span className="text-text-muted text-[11px]">{m.createdAt.slice(0, 10)}</span>
                  </div>
                  {m.conversationTitle && (
                    <div className="text-[11px] text-text-muted mb-1.5">{m.conversationTitle}</div>
                  )}
                  <p className="text-xs text-text line-clamp-3 mb-2">{m.body}</p>
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <button
                      type="button"
                      className="text-text-muted hover:text-red-500 font-semibold"
                      onClick={() => {
                        if (m.conversationId) {
                          void onUnstar(m.conversationId, m.id);
                        }
                      }}
                      data-testid={`chat-starred-unstar-${m.id}`}
                    >
                      {t("chat.unstar")}
                    </button>
                    <button
                      type="button"
                      className="font-semibold text-accent-blue hover:underline"
                      onClick={() => {
                        if (m.conversationId) {
                          onGoToMessage(m.conversationId, m.id);
                        }
                      }}
                      data-testid={`chat-starred-go-${m.id}`}
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
