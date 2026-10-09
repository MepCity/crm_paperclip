"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "./button";

export interface ConfirmDialogProps {
  title: string;
  message?: string;
  /** @deprecated Prefer `message`. */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "default";
  /** @deprecated Prefer `tone`. */
  variant?: "primary" | "danger";
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void | Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return typeof (value as Promise<void> | undefined)?.then === "function";
}

function resolveMessage(message?: string, children?: ReactNode): string {
  if (message !== undefined) return message;
  if (typeof children === "string") return children;
  return "";
}

function resolveTone(
  tone: ConfirmDialogProps["tone"],
  variant: ConfirmDialogProps["variant"],
): "danger" | "default" {
  if (tone) return tone;
  return variant === "danger" ? "danger" : "default";
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
}: Omit<ConfirmDialogProps, "isOpen" | "onOpenChange" | "children" | "variant"> & {
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
          onPress={close}
          isDisabled={disabled}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          size="record"
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
  message,
  children,
  confirmLabel,
  cancelLabel,
  tone,
  variant,
  busy,
  errorMessage,
  onConfirm,
  isOpen,
  onOpenChange,
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const resolvedMessage = resolveMessage(message, children);
  const resolvedTone = resolveTone(tone, variant);
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
              message={resolvedMessage}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              tone={resolvedTone}
              busy={busy}
              errorMessage={errorMessage}
              onConfirm={onConfirm}
              close={close}
              descriptionId={descriptionId}
              onPendingChange={setPending}
            />
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
