"use client";

import { useCallback, useRef } from "react";
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

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

export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";
