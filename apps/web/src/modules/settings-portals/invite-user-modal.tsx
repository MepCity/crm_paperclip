"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ContactOption, PortalUserType } from "./types";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { contactId: string; userTypeId: string }) => Promise<void>;
  contacts: ContactOption[];
  userTypes: PortalUserType[];
}

export function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
  contacts,
  userTypes,
}: InviteUserModalProps) {
  const t = useUiTranslations();
  const [contactId, setContactId] = useState("");
  const [userTypeId, setUserTypeId] = useState(userTypes[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredContacts = contacts.filter((c) =>
    search
      ? c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) {
      setError("Please select a contact.");
      return;
    }
    if (!userTypeId) {
      setError("Please select a user type.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onInvite({ contactId, userTypeId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite portal user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modules.portals.inviteUser")}
      className="max-w-md"
      testId="invite-user-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="contact-select"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t("modules.portals.selectContact")} *
          </label>
          <input
            id="contact-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("modules.portals.searchContacts")}
            className="w-full mb-2 px-3 py-1.5 border border-border rounded-md text-xs bg-background text-foreground"
            data-testid="contact-search-input"
          />
          <select
            id="contact-select"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            data-testid="contact-select"
          >
            <option value="">{t("modules.portals.selectContact")}...</option>
            {filteredContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="invite-usertype-select"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {t("modules.portals.selectUserType")} *
          </label>
          <select
            id="invite-usertype-select"
            value={userTypeId}
            onChange={(e) => setUserTypeId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            data-testid="user-type-select"
          >
            {userTypes.map((ut) => (
              <option key={ut.id} value={ut.id}>
                {ut.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onPress={onClose}
            isDisabled={submitting}
            data-testid="cancel-invite-button"
          >
            {t("modules.portals.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={submitting}
            data-testid="send-invite-button"
          >
            {submitting ? t("modules.portals.saving") : t("modules.portals.sendInvite")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
