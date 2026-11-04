"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatConversation } from "./data";

export interface PinPickerDialogProps {
  conversations: ChatConversation[];
  isOpen: boolean;
  onClose: () => void;
  onPin: (conversationId: string) => Promise<void>;
}

export function PinPickerDialog({ conversations, isOpen, onClose, onPin }: PinPickerDialogProps) {
  const t = useUiTranslations();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      requestAnimationFrame(() => inputRef.current?.focus());
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

  if (!isOpen) return null;

  const needle = search.trim().toLowerCase();
  // Filter out already pinned conversations; show ones available to pin
  const available = conversations
    .filter((c) => !c.pinned)
    .filter((c) => !needle || c.title.toLowerCase().includes(needle));

  async function handleSelect(id: string) {
    try {
      await onPin(id);
      onClose();
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.pinPickerTitle")}
      data-testid="chat-pin-picker"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-lg border border-border bg-surface shadow-xl"
        data-testid="chat-picker-dialog"
      >
        {/* Header (#57, #58) */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-text">{t("chat.pinPickerTitle")}</span>
          <Button
            variant="ghost"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            data-testid="chat-pin-picker-close"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        {/* Search input (#59) */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Icons.filterSearch
              className="absolute left-2.5 top-2 size-3.5 text-text-muted"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              className="w-full rounded border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-text outline-none focus:border-focus-ring"
              placeholder={t("chat.searchChats")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="chat-pin-picker-search"
            />
          </div>
        </div>

        {/* Conversation list (#60) */}
        <div className="flex-1 overflow-y-auto divide-y divide-border p-1">
          {available.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-hover rounded transition-colors text-xs"
              onClick={() => void handleSelect(c.id)}
              data-testid={`chat-pin-option-${c.id}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-text-muted font-mono">
                  {c.kind === "channel" ? "#" : "@"}
                </span>
                <span className="font-medium text-text truncate">{c.title}</span>
              </div>
              <span className="text-[11px] font-semibold text-accent-blue">{t("chat.pin")}</span>
            </button>
          ))}
          {available.length === 0 && (
            <div className="py-8 text-center text-xs text-text-muted">{t("chat.noChatsToPin")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
