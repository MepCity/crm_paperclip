"use client";

import type { FieldDefinition } from "@crm/core/records";
import type { ReactNode } from "react";
import { useId } from "react";
import { Dialog as AriaDialog, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { DEDUP_MAX_FIELDS, dedupConfirmMessage, dedupFieldPanelMessage } from "./dedup-config";

/**
 * Centered card shell shared by the deduplication dialogs, with the same surface, radius and
 * shadow tokens the confirmation dialog uses.
 */
function DedupModal({
  labelledBy,
  widthClassName,
  children,
}: {
  labelledBy: string;
  widthClassName: string;
  children: ReactNode;
}) {
  return (
    <ModalOverlay
      isOpen
      isDismissable={false}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal
        className={`${widthClassName} max-w-full rounded-(--radius-create-menu) bg-surface shadow-lg outline-none`}
      >
        <AriaDialog aria-labelledby={labelledBy} className="p-6 outline-none">
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

export interface DedupFieldDialogProps {
  pluralLabel: string;
  panelFields: readonly FieldDefinition[];
  selected: readonly string[];
  onToggle: (apiName: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function DedupFieldDialog({
  pluralLabel,
  panelFields,
  selected,
  onToggle,
  onSubmit,
  onCancel,
}: DedupFieldDialogProps) {
  const titleId = useId();
  const limitReached = selected.length >= DEDUP_MAX_FIELDS;
  return (
    <DedupModal labelledBy={titleId} widthClassName="w-[34rem]">
      <div data-dedup-field-dialog>
        <h2 id={titleId} className="mb-2 text-2xl font-bold text-text-strong">
          Select Field
        </h2>
        <p className="mb-5 text-md text-confirm-dialog-body">
          {dedupFieldPanelMessage(pluralLabel)}{" "}
          <strong className="font-semibold text-text-strong">
            Maximum of {DEDUP_MAX_FIELDS} fields can be selected.
          </strong>
        </p>
        <ul className="mb-6 flex max-h-64 flex-col gap-4 overflow-auto">
          {panelFields.map((field) => (
            <li key={field.apiName}>
              <Checkbox
                label={field.label}
                isSelected={selected.includes(field.apiName)}
                isDisabled={limitReached && !selected.includes(field.apiName)}
                onChange={() => onToggle(field.apiName)}
              />
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-(--size-confirm-dialog-actions-gap)">
          <Button
            variant="primary"
            size="record"
            isDisabled={selected.length === 0}
            onPress={onSubmit}
          >
            Find And Merge Duplicates
          </Button>
          <Button variant="secondary" size="record" onPress={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </DedupModal>
  );
}

export interface DedupConfirmDialogProps {
  pluralLabel: string;
  onCancel: () => void;
  onProceed: () => void;
}

export function DedupConfirmDialog({ pluralLabel, onCancel, onProceed }: DedupConfirmDialogProps) {
  const titleId = useId();
  return (
    <DedupModal labelledBy={titleId} widthClassName="w-[30rem]">
      <div data-dedup-confirm-dialog>
        <h2 id={titleId} className="mb-3 text-2xl font-bold text-text-strong">
          Deduplicate {pluralLabel}
        </h2>
        <p className="mb-4 text-md text-confirm-dialog-body">{dedupConfirmMessage(pluralLabel)}</p>
        <ul className="mb-4 flex list-disc flex-col gap-3 pl-5 text-md text-confirm-dialog-body marker:text-text-muted">
          <li>
            <p className="font-semibold text-text-strong">Auto-Merge:</p>
            <p>
              System will automatically merge the duplicate records if all the values of the records
              are same.
            </p>
          </li>
          <li>
            <p className="font-semibold text-text-strong">Resolve Conflicts:</p>
            <p>
              You will be prompted to resolve the conflicts with the duplicate records if any value
              of the records are different.
            </p>
          </li>
        </ul>
        <Link href="#learn-more" variant="text" className="text-primary">
          Learn More
        </Link>
        <div className="mt-6 flex items-center justify-end gap-(--size-confirm-dialog-actions-gap)">
          <Button variant="secondary" size="record" onPress={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="record" onPress={onProceed}>
            Yes, proceed
          </Button>
        </div>
      </div>
    </DedupModal>
  );
}

export interface DedupProgressDialogProps {
  onDismiss: () => void;
}

export function DedupProgressDialog({ onDismiss }: DedupProgressDialogProps) {
  const titleId = useId();
  return (
    <DedupModal labelledBy={titleId} widthClassName="w-[38rem]">
      <div data-dedup-progress-dialog>
        <h2 id={titleId} className="sr-only">
          Deduplication started
        </h2>
        <p className="mb-6 text-md text-confirm-dialog-body">
          Deduplication will take few minutes. You will be notified via email and popup once this
          action is complete.
        </p>
        <div className="flex justify-center">
          <Button variant="secondary" size="record" onPress={onDismiss}>
            OK
          </Button>
        </div>
      </div>
    </DedupModal>
  );
}

export interface DedupConflictPopupProps {
  pluralLabel: string;
  summary: string;
  conflictMessage: string;
  onLater: () => void;
  onResolveNow: () => void;
}

export function DedupConflictPopup({
  pluralLabel,
  summary,
  conflictMessage,
  onLater,
  onResolveNow,
}: DedupConflictPopupProps) {
  const titleId = useId();
  return (
    <DedupModal labelledBy={titleId} widthClassName="w-[32rem]">
      <div data-dedup-conflict-popup>
        <div className="-m-6 mb-4 flex items-center justify-between bg-overlay px-6 py-3">
          <h2 id={titleId} className="text-md font-semibold text-surface">
            Deduplicate {pluralLabel}
          </h2>
          <Button
            variant="icon"
            size="compact"
            aria-label="Collapse deduplication notice"
            className="text-surface"
            onPress={onLater}
          >
            <Icons.minus aria-hidden className="size-4" />
          </Button>
        </div>
        <p className="mb-1 text-md text-confirm-dialog-body">{summary}</p>
        <p className="mb-5 text-md text-confirm-dialog-body">{conflictMessage}</p>
        <div className="flex items-center justify-end gap-(--size-confirm-dialog-actions-gap)">
          <Link href="#do-it-later" variant="body" onPress={onLater}>
            Do it later
          </Link>
          <Button variant="secondary" size="record" onPress={onResolveNow}>
            Resolve Now
          </Button>
        </div>
      </div>
    </DedupModal>
  );
}
