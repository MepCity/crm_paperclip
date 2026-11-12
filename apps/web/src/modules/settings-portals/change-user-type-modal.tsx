"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useUiTranslations } from "@/i18n/client-provider";
import type { PortalIdentity, PortalUserType } from "./types";

interface ChangeUserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userTypeId: string) => Promise<void>;
  user: PortalIdentity | null;
  userTypes: PortalUserType[];
}

export function ChangeUserTypeModal({
  isOpen,
  onClose,
  onSave,
  user,
  userTypes,
}: ChangeUserTypeModalProps) {
  const t = useUiTranslations();
  const [selectedUserTypeId, setSelectedUserTypeId] = useState(
    user?.userTypeId ?? userTypes[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserTypeId) return;
    setError(null);
    setSaving(true);
    try {
      await onSave(selectedUserTypeId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change user type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("modules.portals.changeUserType")}
      className="max-w-md"
      testId="change-user-type-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-foreground mb-1">
            {user?.displayName} ({user?.email})
          </div>
          <label
            htmlFor="change-user-type-select"
            className="block text-xs text-muted-foreground mb-1"
          >
            {t("modules.portals.selectUserType")}
          </label>
          <select
            id="change-user-type-select"
            value={selectedUserTypeId}
            onChange={(e) => setSelectedUserTypeId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            data-testid="change-user-type-select"
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
            isDisabled={saving}
            data-testid="cancel-change-type-button"
          >
            {t("modules.portals.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving}
            data-testid="confirm-change-type-button"
          >
            {saving ? t("modules.portals.saving") : t("modules.portals.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
