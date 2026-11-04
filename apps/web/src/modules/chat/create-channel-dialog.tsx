"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatContact } from "./data";

export interface CreateChannelDialogProps {
  directory: ChatContact[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    visibility: "public" | "private",
    memberUserIds?: string[],
  ) => Promise<void>;
}

export function CreateChannelDialog({
  directory,
  isOpen,
  onClose,
  onSubmit,
}: CreateChannelDialogProps) {
  const t = useUiTranslations();
  const nameId = useId();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setVisibility("public");
      setSearch("");
      setSelectedIds([]);
      setError(null);
      setSubmitting(false);
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
  const filtered = directory.filter(
    (c) =>
      !needle ||
      c.name.toLowerCase().includes(needle) ||
      (c.email ?? "").toLowerCase().includes(needle),
  );

  function toggleUser(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, visibility, selectedIds.length > 0 ? selectedIds : undefined);
      onClose();
    } catch {
      setError(t("chat.errorGeneric"));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.createChannel")}
      data-testid="chat-create-channel-dialog"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-text">{t("chat.createChannel")}</h2>
          <Button
            variant="ghost"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            data-testid="chat-create-channel-close"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div
                className="rounded-md bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400"
                role="alert"
                data-testid="chat-create-channel-error"
              >
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor={nameId} className="block text-xs font-semibold text-text mb-1">
                {t("chat.channelName")}
              </label>
              <input
                id={nameId}
                ref={inputRef}
                type="text"
                maxLength={80}
                required
                className="w-full rounded border border-border bg-surface px-3 py-1.5 text-sm text-text outline-none focus:border-focus-ring"
                placeholder={t("chat.channelNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="chat-channel-name-input"
              />
            </div>

            {/* Visibility */}
            <div>
              <span className="block text-xs font-semibold text-text mb-1.5">
                {t("chat.channelVisibility")}
              </span>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="channel-visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-0.5"
                    data-testid="chat-channel-public-radio"
                  />
                  <div>
                    <div className="font-semibold text-text">{t("chat.public")}</div>
                    <div className="text-text-muted">{t("chat.publicChannelDesc")}</div>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="channel-visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mt-0.5"
                    data-testid="chat-channel-private-radio"
                  />
                  <div>
                    <div className="font-semibold text-text">{t("chat.private")}</div>
                    <div className="text-text-muted">{t("chat.privateChannelDesc")}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Member picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-text">{t("chat.channelMembers")}</span>
                {selectedIds.length > 0 && (
                  <span className="text-xs text-text-muted">
                    {t("chat.selectedCount", { count: selectedIds.length })}
                  </span>
                )}
              </div>
              <input
                type="search"
                className="w-full rounded border border-border bg-surface px-3 py-1.5 text-xs text-text outline-none focus:border-focus-ring mb-2"
                placeholder={t("chat.pickerSearch")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="chat-channel-members-search"
              />
              <div className="max-h-36 overflow-y-auto rounded border border-border divide-y divide-border">
                {filtered.map((person) => {
                  const checked = selectedIds.includes(person.id);
                  return (
                    <label
                      key={person.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-surface-hover"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(person.id)}
                        data-testid={`chat-channel-member-check-${person.id}`}
                      />
                      <span className="font-medium text-text">{person.name}</span>
                    </label>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-3 py-3 text-center text-xs text-text-muted">
                    {t("chat.noPeopleFound")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onPress={onClose}
              data-testid="chat-create-channel-cancel"
            >
              {t("chat.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="compact"
              isDisabled={!name.trim() || submitting}
              data-testid="chat-create-channel-submit"
            >
              {submitting ? t("chat.loading") : t("chat.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
