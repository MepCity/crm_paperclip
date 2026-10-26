"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUiTranslations } from "@/i18n/client-provider";

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({ isOpen, onOpenChange, onLeave }: UnsavedChangesDialogProps) {
  const t = useUiTranslations();
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("records.form.unsavedTitle")}
      message={t("records.form.unsavedMessage")}
      cancelLabel={t("records.form.unsavedStay")}
      confirmLabel={t("records.form.unsavedLeave")}
      onConfirm={onLeave}
      cancelVariant="unsavedDialogStay"
      confirmVariant="unsavedDialogLeave"
      cancelClassName="min-w-(--size-unsaved-dialog-stay-width)"
      confirmClassName="min-w-(--size-unsaved-dialog-leave-width)"
    />
  );
}
