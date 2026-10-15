"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [error, setError] = useState<string | null>(null);
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) setError(null);
        onOpenChange(open);
      }}
      title="Undo Import"
      message={`This will delete the ${count} records added by this import. Updated records are not changed. This cannot be reversed.`}
      confirmLabel="Undo Import"
      cancelLabel="Cancel"
      tone="danger"
      errorMessage={error}
      onConfirm={async () => {
        setError(null);
        try {
          await onConfirm();
        } catch (e) {
          setError(e instanceof Error ? e.message : "The import could not be undone.");
          throw e;
        }
      }}
    />
  );
}
