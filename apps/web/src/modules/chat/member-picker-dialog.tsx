"use client";

import { useMemo, useState } from "react";
import { Heading } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import { Avatar } from "./conversation-view";
import type { ChatContact } from "./data";

export type PickerMode = "direct" | "group";

export const GROUP_MIN_MEMBERS = 2;
export const GROUP_MAX_MEMBERS = 50;

export interface MemberPickerDialogProps {
  mode: PickerMode;
  directory: readonly ChatContact[];
  /** Direct: resolves with the picked user; group: with the name and members. */
  onSubmitDirect(userId: string): Promise<void>;
  onSubmitGroup(name: string, memberUserIds: string[]): Promise<void>;
  onClose(): void;
}

/**
 * Member picker for "Send a Direct Message" (single pick) and "Start a Group
 * Conversation" (2–50 members and a name). Spec controls #61–#64.
 * Refs: MEP-1420
 */
export function MemberPickerDialog({
  mode,
  directory,
  onSubmitDirect,
  onSubmitGroup,
  onClose,
}: MemberPickerDialogProps) {
  const t = useUiTranslations();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return directory;
    return directory.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) || (c.email ?? "").toLowerCase().includes(needle),
    );
  }, [directory, query]);

  const title = mode === "direct" ? t("chat.sendDirectMessage") : t("chat.selectUsersForGroup");
  const canCreate =
    name.trim().length > 0 &&
    selected.length >= GROUP_MIN_MEMBERS &&
    selected.length <= GROUP_MAX_MEMBERS &&
    !busy;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch {
      setError(t("chat.errorGeneric"));
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < GROUP_MAX_MEMBERS
          ? [...current, id]
          : current,
    );
  }

  return (
    <DialogTrigger
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog aria-label={title} data-testid="chat-picker-dialog">
        {() => (
          <div className="chat-picker">
            <div className="mb-3 flex items-center justify-between">
              <Heading slot="title" className="text-lg font-semibold text-text">
                {title}
              </Heading>
              <Button
                variant="icon"
                size="compact"
                aria-label={t("chat.close")}
                onPress={onClose}
                className="size-8"
              >
                <Icons.close className="size-4" aria-hidden />
              </Button>
            </div>

            {mode === "group" && (
              <label className="chat-picker-field">
                <span className="chat-picker-label">{t("chat.groupName")}</span>
                <input
                  className="chat-picker-input"
                  value={name}
                  maxLength={80}
                  placeholder={t("chat.groupNamePlaceholder")}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="chat-group-name"
                />
              </label>
            )}

            <div className="chat-search-field mb-2">
              <Icons.filterSearch className="chat-search-icon" aria-hidden />
              <input
                type="search"
                className="chat-search-input"
                placeholder={t("chat.pickerSearch")}
                aria-label={t("chat.pickerSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="chat-picker-search"
              />
            </div>

            <ul className="chat-picker-list" data-testid="chat-picker-list">
              {visible.map((contact) => {
                const checked = selected.includes(contact.id);
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      className="chat-row"
                      aria-pressed={mode === "group" ? checked : undefined}
                      disabled={busy}
                      onClick={() =>
                        mode === "group"
                          ? toggle(contact.id)
                          : void run(() => onSubmitDirect(contact.id))
                      }
                      data-testid="chat-picker-row"
                    >
                      {mode === "group" && (
                        <span
                          className={`chat-picker-check${checked ? " chat-picker-check-on" : ""}`}
                        >
                          {checked && <Icons.check className="size-3" aria-hidden />}
                        </span>
                      )}
                      <Avatar name={contact.name} presence={contact.presence} />
                      <span className="chat-row-main">
                        <span className="chat-row-title">{contact.name}</span>
                        {contact.email && <span className="chat-row-preview">{contact.email}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && (
                <li className="chat-picker-empty">{t("chat.noPeopleFound")}</li>
              )}
            </ul>

            {error && (
              <p className="chat-picker-error" role="alert">
                {error}
              </p>
            )}

            {mode === "group" && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-text-muted" data-testid="chat-picker-count">
                  {selected.length < GROUP_MIN_MEMBERS
                    ? t("chat.groupHint")
                    : t("chat.selectedCount", { count: selected.length })}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onPress={onClose}>
                    {t("chat.cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={!canCreate}
                    onPress={() => void run(() => onSubmitGroup(name.trim(), selected))}
                    data-testid="chat-group-create"
                  >
                    {t("chat.create")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
