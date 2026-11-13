"use client";

import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  Heading,
  ModalOverlay,
} from "react-aria-components";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-md",
  testId,
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className="fixed inset-0 z-50 bg-overlay/50 flex items-start justify-center p-4 sm:p-6 backdrop-blur-xs overflow-y-auto"
    >
      <AriaModal
        data-testid={testId}
        className={`bg-card border border-border rounded-xl shadow-xl w-full p-6 outline-hidden max-h-[calc(100vh-3rem)] overflow-y-auto my-auto ${className}`}
      >
        <AriaDialog className="outline-hidden">
          {title && (
            <Heading slot="title" className="text-lg font-semibold text-foreground mb-4">
              {title}
            </Heading>
          )}
          {children}
        </AriaDialog>
      </AriaModal>
    </ModalOverlay>
  );
}
