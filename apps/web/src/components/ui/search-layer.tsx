"use client";

import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";

/** Search overlays share modal dismissal, focus containment and trigger restoration. */
export function SearchLayer({ children }: { children: ReactNode }) {
  return (
    <ModalOverlay
      isDismissable
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/50 p-2"
    >
      <Modal className="w-full max-w-3xl overflow-hidden rounded-md border border-border bg-surface shadow-lg outline-none">
        <Dialog aria-label="Search records" className="max-h-screen overflow-auto outline-none">
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
