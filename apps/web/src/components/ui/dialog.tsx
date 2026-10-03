"use client";

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
  return (
    <ModalOverlay className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
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
