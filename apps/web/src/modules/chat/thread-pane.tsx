"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { Composer } from "./composer";
import { formatMessageTime } from "./conversation-view";
import type { ChatDataSource, ChatMessageView } from "./data";

export interface ThreadPaneProps {
  rootMessage: ChatMessageView;
  dataSource: ChatDataSource;
  conversationId: string;
  onClose: () => void;
}

export function ThreadPane({ rootMessage, dataSource, conversationId, onClose }: ThreadPaneProps) {
  const t = useUiTranslations();
  const replies = dataSource.repliesOf(rootMessage.id);
  const members = dataSource.membersOf(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void dataSource.loadReplies(rootMessage.id);
    void dataSource.markThreadRead(rootMessage.id);
  }, [rootMessage.id, dataSource]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll down when replies change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [replies.length]);

  return (
    <div className="flex flex-col h-full bg-surface" data-testid="chat-thread-pane">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Button
          variant="ghost"
          size="compact"
          aria-label={t("chat.close")}
          onPress={onClose}
          data-testid="chat-thread-close"
        >
          <Icons.chevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="text-xs font-semibold text-text">{t("chat.threadReplies")}</span>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Root message */}
        <div
          className="rounded border border-border/80 bg-surface-subtle/40 p-3"
          data-testid="chat-thread-root"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-text">{rootMessage.authorName}</span>
            <span className="text-text-muted text-[11px]">
              {formatMessageTime(rootMessage.createdAt)}
            </span>
          </div>
          <p className="text-xs text-text">{rootMessage.body}</p>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 border-t border-border" />
          <span className="text-[11px] font-semibold text-text-muted">
            {t("chat.repliesCount", { count: replies.length })}
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Replies list */}
        <div className="space-y-2.5">
          {replies.map((reply) => {
            const own = reply.authorId === dataSource.selfId;
            return (
              <div
                key={reply.id}
                className={`p-2.5 rounded text-xs ${
                  own ? "bg-accent-blue/10 ml-4" : "bg-surface-hover/60 mr-4"
                }`}
                data-testid={`chat-thread-reply-${reply.id}`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-text">
                    {own ? t("chat.you") : reply.authorName}
                  </span>
                  <span className="text-text-muted">{formatMessageTime(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-text">{reply.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply composer */}
      <div className="p-2 border-t border-border">
        <Composer
          members={members}
          placeholder={t("chat.replyPlaceholder")}
          onSend={(body, mentions) => {
            void dataSource.sendReply(rootMessage.id, body, mentions);
          }}
        />
      </div>
    </div>
  );
}
