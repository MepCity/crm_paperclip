"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatSearchFilters } from "@/lib/api/wire/chat";
import type { ChatContact, ChatConversation, ChatMessageView } from "./data";
import { ChatEmptyIllustration } from "./illustrations";

export interface AdvancedSearchDialogProps {
  directory: ChatContact[];
  conversations: ChatConversation[];
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: ChatSearchFilters) => Promise<{
    messages: ChatMessageView[];
    hasMore: boolean;
  }>;
  onSelectResult: (conversationId: string, messageId: string) => void;
}

export function AdvancedSearchDialog({
  directory,
  conversations,
  isOpen,
  onClose,
  onSearch,
  onSelectResult,
}: AdvancedSearchDialogProps) {
  const t = useUiTranslations();
  const [q, setQ] = useState("");
  const [fromUser, setFromUser] = useState("");
  const [inConversation, setInConversation] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [typeThreads, setTypeThreads] = useState(true);
  const [typeChats, setTypeChats] = useState(true);
  const [typeChannels, setTypeChannels] = useState(true);
  const [hasText, setHasText] = useState(false);
  const [hasLink, setHasLink] = useState(false);
  const [hasMention, setHasMention] = useState(false);

  const [activeTab, setActiveTab] = useState<"messages" | "links">("messages");
  const [results, setResults] = useState<ChatMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const queryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQ("");
      setFromUser("");
      setInConversation("");
      setDateRange("");
      setTypeThreads(true);
      setTypeChats(true);
      setTypeChannels(true);
      setHasText(false);
      setHasLink(false);
      setHasMention(false);
      setResults([]);
      requestAnimationFrame(() => queryInputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function handleClearAll() {
    setQ("");
    setFromUser("");
    setInConversation("");
    setDateRange("");
    setTypeThreads(true);
    setTypeChats(true);
    setTypeChannels(true);
    setHasText(false);
    setHasLink(false);
    setHasMention(false);
    setResults([]);
    queryInputRef.current?.focus();
  }

  async function executeSearch() {
    setLoading(true);
    try {
      let type: string | undefined;
      const types = [
        typeThreads ? "threads" : null,
        typeChats ? "chats" : null,
        typeChannels ? "channels" : null,
      ].filter(Boolean);
      if (types.length === 1) {
        type = types[0] ?? undefined;
      }

      let after: string | undefined;
      if (dateRange === "today") {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        after = d.toISOString();
      } else if (dateRange === "7days") {
        const d = new Date(Date.now() - 7 * 86400 * 1000);
        after = d.toISOString();
      } else if (dateRange === "30days") {
        const d = new Date(Date.now() - 30 * 86400 * 1000);
        after = d.toISOString();
      }

      const res = await onSearch({
        q: q.trim() || undefined,
        from: fromUser || undefined,
        in: inConversation || undefined,
        type,
        after,
        hasLink: hasLink || activeTab === "links",
        hasMention,
        limit: 50,
      });
      setResults(res.messages);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const linkMessages = results.filter((m) => /https?:\/\//i.test(m.body));
  const displayed = activeTab === "messages" ? results : linkMessages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.advancedSearch")}
      data-testid="chat-advanced-search"
    >
      <div
        className="flex h-[85vh] w-full max-w-4xl flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden"
        data-testid="chat-advanced-search-modal"
      >
        {/* Top search bar (#43, #55) */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-surface">
          <Icons.filterSearch className="size-4 text-text-muted" aria-hidden />
          <input
            ref={queryInputRef}
            type="search"
            className="flex-1 bg-transparent text-sm text-text outline-none"
            placeholder={t("chat.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void executeSearch();
            }}
            data-testid="chat-advanced-search-input"
          />
          <Button
            variant="primary"
            size="compact"
            onPress={() => void executeSearch()}
            data-testid="chat-advanced-search-submit"
          >
            {t("chat.search")}
          </Button>
          <Button
            variant="ghost"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            data-testid="chat-advanced-search-close"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        {/* Content area: left filters, right results */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left filter column (#44–#53) */}
          <div className="w-72 border-r border-border p-4 overflow-y-auto space-y-4 bg-surface-subtle/30 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text">{t("chat.filterOptions")}</span>
              <button
                type="button"
                className="text-accent-blue hover:underline font-semibold"
                onClick={handleClearAll}
                data-testid="chat-search-clear-all"
              >
                {t("chat.clearAll")}
              </button>
            </div>

            {/* From user picker (#46) */}
            <div>
              <label
                htmlFor="chat-search-filter-from-select"
                className="block font-semibold text-text mb-1"
              >
                {t("chat.fromUser")}
              </label>
              <select
                id="chat-search-filter-from-select"
                className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-text outline-none"
                value={fromUser}
                onChange={(e) => setFromUser(e.target.value)}
                data-testid="chat-search-filter-from"
              >
                <option value="">{t("chat.fromUserPlaceholder")}</option>
                {directory.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* In conversation picker (#47) */}
            <div>
              <label
                htmlFor="chat-search-filter-in-select"
                className="block font-semibold text-text mb-1"
              >
                {t("chat.inConversation")}
              </label>
              <select
                id="chat-search-filter-in-select"
                className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-text outline-none"
                value={inConversation}
                onChange={(e) => setInConversation(e.target.value)}
                data-testid="chat-search-filter-in"
              >
                <option value="">{t("chat.inConversationPlaceholder")}</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kind === "channel" ? `#${c.title}` : c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range (#48) */}
            <div>
              <label
                htmlFor="chat-search-filter-date-select"
                className="block font-semibold text-text mb-1"
              >
                {t("chat.date")}
              </label>
              <select
                id="chat-search-filter-date-select"
                className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-text outline-none"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                data-testid="chat-search-filter-date"
              >
                <option value="">{t("chat.anyTime")}</option>
                <option value="today">{t("chat.today")}</option>
                <option value="7days">{t("chat.past7Days")}</option>
                <option value="30days">{t("chat.past30Days")}</option>
              </select>
            </div>

            {/* Conversation type checkboxes (#49) */}
            <div>
              <span className="block font-semibold text-text mb-1.5">
                {t("chat.conversationType")}
              </span>
              <div className="space-y-1.5 pl-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeThreads}
                    onChange={(e) => setTypeThreads(e.target.checked)}
                    data-testid="chat-search-type-threads"
                  />
                  <span>{t("chat.threads")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeChats}
                    onChange={(e) => setTypeChats(e.target.checked)}
                    data-testid="chat-search-type-chats"
                  />
                  <span>{t("chat.chats")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeChannels}
                    onChange={(e) => setTypeChannels(e.target.checked)}
                    data-testid="chat-search-type-channels"
                  />
                  <span>{t("chat.channels")}</span>
                </label>
              </div>
            </div>

            {/* Message contains checkboxes (#53) */}
            <div>
              <span className="block font-semibold text-text mb-1.5">
                {t("chat.messageContains")}
              </span>
              <div className="space-y-1.5 pl-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasText}
                    onChange={(e) => setHasText(e.target.checked)}
                    data-testid="chat-search-contains-text"
                  />
                  <span>{t("chat.text")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLink}
                    onChange={(e) => setHasLink(e.target.checked)}
                    data-testid="chat-search-contains-link"
                  />
                  <span>{t("chat.link")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMention}
                    onChange={(e) => setHasMention(e.target.checked)}
                    data-testid="chat-search-contains-mention"
                  />
                  <span>{t("chat.myMentions")}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right results area (#54, #56) */}
          <div className="flex flex-1 flex-col overflow-hidden bg-surface">
            {/* Category tabs (#54) */}
            <div className="flex items-center gap-6 border-b border-border px-6 pt-3 pb-2 text-xs">
              <button
                type="button"
                className={`font-semibold pb-2 -mb-2 border-b-2 transition-colors ${
                  activeTab === "messages"
                    ? "border-accent-blue text-accent-blue"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
                onClick={() => setActiveTab("messages")}
                data-testid="chat-search-tab-messages"
              >
                {t("chat.messagesTab")} ({results.length})
              </button>
              <button
                type="button"
                className={`font-semibold pb-2 -mb-2 border-b-2 transition-colors ${
                  activeTab === "links"
                    ? "border-accent-blue text-accent-blue"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
                onClick={() => setActiveTab("links")}
                data-testid="chat-search-tab-links"
              >
                {t("chat.linksTab")} ({linkMessages.length})
              </button>
            </div>

            {/* Results list or empty state (#56) */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center py-12 text-xs text-text-muted">
                  {t("chat.loading")}
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ChatEmptyIllustration />
                  <p className="mt-4 max-w-sm text-xs text-text-muted leading-relaxed">
                    {t("chat.noSearchResults")}
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded border border-border px-4 py-1.5 text-xs font-semibold text-text hover:bg-surface-hover"
                    onClick={handleClearAll}
                    data-testid="chat-search-try-new"
                  >
                    {t("chat.tryNewSearch")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayed.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left rounded border border-border p-3.5 hover:bg-surface-hover/50 transition-colors"
                      onClick={() => {
                        if (m.conversationId) {
                          onSelectResult(m.conversationId, m.id);
                        }
                      }}
                      data-testid={`chat-search-result-${m.id}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-text">{m.authorName}</span>
                        <span className="text-text-muted text-[11px]">
                          {m.createdAt.slice(0, 10)}
                        </span>
                      </div>
                      {m.conversationTitle && (
                        <div className="text-[11px] text-text-muted mb-1.5 font-mono">
                          {m.conversationTitle}
                        </div>
                      )}
                      <p className="text-xs text-text line-clamp-2">{m.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
