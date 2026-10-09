"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({ isOpen, onOpenChange, onLeave }: UnsavedChangesDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="You have not saved your changes."
      message="Are you sure you want to move away from this page?"
      cancelLabel="Stay Here"
      confirmLabel="Yes, Leave Page"
      tone="danger"
      onConfirm={onLeave}
    />
  );
}
