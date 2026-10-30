"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUiTranslations } from "@/i18n/client-provider";

export function UndoImportDialog({
  count,
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  count: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const t = useUiTranslations();
  const [error, setError] = useState<string | null>(null);
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) setError(null);
        onOpenChange(open);
      }}
      title={t("records.transfer.undoTitle")}
      message={t("records.transfer.undoMessage", { count })}
      confirmLabel={t("records.transfer.undoTitle")}
      cancelLabel={t("records.transfer.cancel")}
      tone="danger"
      errorMessage={error}
      onConfirm={async () => {
        setError(null);
        try {
          await onConfirm();
        } catch (e) {
          setError(e instanceof Error ? e.message : t("records.transfer.undoFailed"));
          throw e;
        }
      }}
    />
  );
}
