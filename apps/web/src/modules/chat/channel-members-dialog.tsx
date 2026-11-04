"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ChatContact, ChatConversation, ChatMemberView } from "./data";

export interface ChannelMembersDialogProps {
  conversation: ChatConversation;
  members: ChatMemberView[];
  directory: ChatContact[];
  selfId: string;
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onArchive: () => Promise<void>;
  onLeave: () => Promise<void>;
}

export function ChannelMembersDialog({
  conversation,
  members,
  directory,
  selfId,
  isOpen,
  onClose,
  onRename,
  onAddMember,
  onRemoveMember,
  onArchive,
  onLeave,
}: ChannelMembersDialogProps) {
  const t = useUiTranslations();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(conversation.title);
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const isOwner = conversation.membershipRole === "owner";

  useEffect(() => {
    if (isOpen) {
      setName(conversation.title);
      setRenaming(false);
      setAdding(false);
      setSelectedUserId("");
      setLoading(false);
    }
  }, [isOpen, conversation.title]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const existingUserIds = new Set([selfId, ...members.map((m) => m.id)]);
  const availableToAdd = directory.filter((d) => !existingUserIds.has(d.id));

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      await onRename(name.trim());
      setRenaming(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || loading) return;
    setLoading(true);
    try {
      await onAddMember(selectedUserId);
      setSelectedUserId("");
      setAdding(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.channelMembers")}
      data-testid="chat-channel-members-dialog"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-text-muted">#</span>
            <span className="text-sm font-semibold text-text">{conversation.title}</span>
          </div>
          <Button
            variant="ghost"
            size="compact"
            aria-label={t("chat.close")}
            onPress={onClose}
            data-testid="chat-channel-members-close"
          >
            <Icons.close className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Owner actions: rename */}
          {isOwner && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text">{t("chat.rename")}</span>
                {!renaming && (
                  <button
                    type="button"
                    className="text-accent-blue hover:underline font-semibold"
                    onClick={() => setRenaming(true)}
                    data-testid="chat-channel-rename-btn"
                  >
                    {t("chat.edit")}
                  </button>
                )}
              </div>
              {renaming && (
                <form onSubmit={handleRenameSubmit} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded border border-border bg-surface px-3 py-1 text-xs text-text outline-none focus:border-focus-ring"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="chat-channel-rename-input"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="compact"
                    isDisabled={!name.trim() || loading}
                    data-testid="chat-channel-rename-submit"
                  >
                    {t("chat.saveEdit")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    onPress={() => setRenaming(false)}
                  >
                    {t("chat.cancel")}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Members list & add member */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text">
                {t("chat.members")} ({members.length + 1})
              </span>
              {isOwner && !adding && availableToAdd.length > 0 && (
                <button
                  type="button"
                  className="text-accent-blue hover:underline font-semibold"
                  onClick={() => setAdding(true)}
                  data-testid="chat-channel-add-member-btn"
                >
                  {t("chat.addMember")}
                </button>
              )}
            </div>

            {adding && (
              <form onSubmit={handleAddMemberSubmit} className="flex gap-2 mb-3">
                <select
                  className="flex-1 rounded border border-border bg-surface px-2.5 py-1 text-xs text-text outline-none"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  data-testid="chat-channel-add-member-select"
                >
                  <option value="">{t("chat.pickerSearch")}</option>
                  {availableToAdd.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  variant="primary"
                  size="compact"
                  isDisabled={!selectedUserId || loading}
                  data-testid="chat-channel-add-member-submit"
                >
                  {t("chat.create")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onPress={() => setAdding(false)}
                >
                  {t("chat.cancel")}
                </Button>
              </form>
            )}

            <div className="rounded border border-border divide-y divide-border max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="font-semibold text-text">
                  {t("chat.you")} ({isOwner ? "Owner" : "Member"})
                </span>
              </div>
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                  data-testid={`chat-channel-member-row-${m.id}`}
                >
                  <span className="text-text">{m.name}</span>
                  {isOwner && (
                    <button
                      type="button"
                      className="text-red-500 hover:underline text-[11px]"
                      onClick={() => void onRemoveMember(m.id)}
                      data-testid={`chat-channel-remove-member-${m.id}`}
                    >
                      {t("chat.removeMember")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone: Leave or Archive */}
          <div className="pt-3 border-t border-border flex justify-between items-center">
            {isOwner ? (
              <Button
                type="button"
                variant="danger"
                size="compact"
                onPress={() => {
                  if (window.confirm(t("chat.archiveChannelConfirm"))) {
                    void onArchive().then(onClose);
                  }
                }}
                data-testid="chat-channel-archive-btn"
              >
                {t("chat.archive")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                size="compact"
                onPress={() => {
                  if (window.confirm(t("chat.leaveChannelConfirm"))) {
                    void onLeave().then(onClose);
                  }
                }}
                data-testid="chat-channel-leave-btn"
              >
                {t("chat.leave")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
