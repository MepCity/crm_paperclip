"use client";

import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "./button";

export { DialogTrigger };

export function Dialog(props: AriaDialogProps & { title?: string }) {
  const observerRef = useRef<MutationObserver | null>(null);

  // React Aria focuses the dialog when it mounts and listens for Escape on the modal
  // element. Content that replaces itself from inside the dialog (the invite form
  // turning into the created link) removes the element that holds focus without an event
  // the browser reliably delivers, so focus falls to <body> and Escape stops closing.
  // Replacing content has to leave the dialog focused again right away.
  const observeDialog = useCallback((element: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!element) return;
    const observer = new MutationObserver(() => {
      const active = document.activeElement;
      if (!active || active === document.body || active === document.documentElement) {
        element.focus();
      }
    });
    observer.observe(element, { childList: true, subtree: true });
    observerRef.current = observer;
  }, []);

  return (
    <ModalOverlay className="fixed inset-0 z-50 bg-overlay/50 flex items-center justify-center p-4">
      <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
        <AriaDialog ref={observeDialog} {...props} className="outline-none">
          {(renderProps) => (
            <>
              {props.title && (
                <Heading slot="title" className="text-xl font-semibold mb-4">
                  {props.title}
                </Heading>
              )}
              {typeof props.children === "function" ? props.children(renderProps) : props.children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

export interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}

function isPromise(value: void | Promise<void>): value is Promise<void> {
  return typeof (value as Promise<void> | undefined)?.then === "function";
}

function ConfirmDialogSession({
  title,
  children,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  close,
  descriptionId,
  onPendingChange,
}: ConfirmDialogProps & {
  close: () => void;
  descriptionId: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const [pending, setPending] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    return () => onPendingChange(false);
  }, [onPendingChange]);

  function setPendingState(next: boolean) {
    setPending(next);
    onPendingChange(next);
  }

  return (
    <>
      <Heading slot="title" className="text-xl font-semibold mb-4">
        {title}
      </Heading>
      <p id={descriptionId} className="text-sm text-text-muted mb-4">
        {children}
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onPress={close} isDisabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          isPending={pending}
          onPress={() => {
            if (started.current) return;
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
  children,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const [pending, setPending] = useState(false);

  return (
    <ModalOverlay
      isKeyboardDismissDisabled={pending}
      className="fixed inset-0 z-50 bg-overlay/50 flex items-center justify-center p-4"
    >
      <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
        <AriaDialog role="alertdialog" aria-describedby={descriptionId} className="outline-none">
          {({ close }) => (
            <ConfirmDialogSession
              title={title}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              variant={variant}
              onConfirm={onConfirm}
              close={close}
              descriptionId={descriptionId}
              onPendingChange={setPending}
            >
              {children}
            </ConfirmDialogSession>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
