"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  Modal,
  ModalOverlay,
  type ModalOverlayProps,
} from "react-aria-components";
import "./top-aligned-modal.css";

export interface TopAlignedModalProps {
  isOpen: boolean;
  onOpenChange?: ModalOverlayProps["onOpenChange"];
  isDismissable?: boolean;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  "aria-labelledby"?: string;
  children: ReactNode;
}

export function TopAlignedModal({
  isOpen,
  onOpenChange,
  isDismissable = false,
  panelClassName,
  panelStyle,
  "aria-labelledby": ariaLabelledBy,
  children,
}: TopAlignedModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable={isDismissable}
      onOpenChange={onOpenChange}
      className="top-aligned-modal-overlay fixed inset-0 z-50 outline-none"
    >
      <Modal
        isOpen={isOpen}
        className={`top-aligned-modal-panel outline-none ${panelClassName ?? ""}`}
        style={panelStyle}
      >
        <AriaDialog aria-labelledby={ariaLabelledBy} className="top-aligned-modal-dialog">
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

export type TopAlignedModalDialogProps = AriaDialogProps;
