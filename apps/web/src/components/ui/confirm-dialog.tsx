"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "./button";

export interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "default";
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void | Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  cancelClassName?: string;
  confirmClassName?: string;
}

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return typeof (value as Promise<void> | undefined)?.then === "function";
}

function ConfirmDialogBody({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  busy,
  errorMessage,
  onConfirm,
  close,
  descriptionId,
  onPendingChange,
  cancelClassName,
  confirmClassName,
}: Omit<ConfirmDialogProps, "isOpen" | "onOpenChange"> & {
  message: string;
  tone: "danger" | "default";
  close: () => void;
  descriptionId: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const started = useRef(false);
  const disabled = Boolean(busy) || pending;
  const confirmVariant = tone === "danger" ? "danger" : "primary";

  useEffect(() => {
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  function setPendingState(next: boolean) {
    setPending(next);
    onPendingChange(next);
  }

  return (
    <>
      <Heading
        slot="title"
        className="mb-(--size-confirm-dialog-title-gap) text-2xl font-bold text-text-strong"
      >
        {title}
      </Heading>
      <p
        id={descriptionId}
        className="mb-(--size-confirm-dialog-message-actions-gap) text-md font-normal text-confirm-dialog-body"
      >
        {message}
      </p>
      {errorMessage ? (
        <p className="mb-3 text-sm text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="flex justify-end gap-(--size-confirm-dialog-actions-gap)">
        <Button
          ref={cancelRef}
          variant="secondary"
          size="record"
          className={cancelClassName}
          onPress={close}
          isDisabled={disabled}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          size="record"
          className={confirmClassName}
          isPending={pending}
          isDisabled={disabled}
          onPress={() => {
            if (started.current || disabled) return;
            started.current = true;
            const result = onConfirm();
            if (!isPromise(result)) {
              close();
              return;
            }
            setPendingState(true);
            void result.then(
              () => {
                close();
              },
              () => {
                started.current = false;
                setPendingState(false);
              },
            );
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}

export function ConfirmDialog({
  title,
  message = "",
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy,
  errorMessage,
  onConfirm,
  isOpen,
  onOpenChange,
  cancelClassName,
  confirmClassName,
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const keyboardLocked = Boolean(busy) || pending;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isKeyboardDismissDisabled={keyboardLocked}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal
        className={[
          "w-(--size-dialog-width) max-w-full outline-none",
          "rounded-(--radius-create-menu) bg-surface shadow-lg",
          "pt-(--size-confirm-dialog-padding-block-start)",
          "px-(--size-confirm-dialog-padding-inline)",
          "pb-(--size-confirm-dialog-padding-block-end)",
        ].join(" ")}
      >
        <AriaDialog role="alertdialog" aria-describedby={descriptionId} className="outline-none">
          {({ close }) => (
            <ConfirmDialogBody
              title={title}
              message={message}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              tone={tone}
              busy={busy}
              errorMessage={errorMessage}
              onConfirm={onConfirm}
              close={close}
              descriptionId={descriptionId}
              onPendingChange={setPending}
              cancelClassName={cancelClassName}
              confirmClassName={confirmClassName}
            />
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
