"use client";

import { type ReactNode, useRef, useState } from "react";
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
  return (
    <ModalOverlay className="fixed inset-0 z-50 bg-overlay/50 flex items-center justify-center p-4">
      <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
        <AriaDialog {...props} className="outline-none">
          {(renderProps) => (
            <>
              {props.title && (
                <Heading slot="title" className="text-lg font-medium mb-4">
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

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const started = useRef(false);

  return (
    <ModalOverlay
      isKeyboardDismissDisabled={pending}
      className="fixed inset-0 z-50 bg-overlay/50 flex items-center justify-center p-4"
    >
      <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
        <AriaDialog role="alertdialog" className="outline-none">
          {({ close }) => (
            <>
              <Heading slot="title" className="text-lg font-medium mb-4">
                {title}
              </Heading>
              <p className="text-sm text-text-muted mb-4">{children}</p>
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
                    setPending(true);
                    void result.then(
                      () => {
                        close();
                      },
                      () => {
                        started.current = false;
                        setPending(false);
                      },
                    );
                  }}
                >
                  {confirmLabel}
                </Button>
              </div>
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
