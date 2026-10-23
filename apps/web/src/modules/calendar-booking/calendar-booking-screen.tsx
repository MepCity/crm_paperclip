"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";

export interface CalendarBookingScreenProps {
  orgSlug: string;
  onConfigure?: () => void;
  onCancel?: () => void;
}

export function CalendarBookingScreen({
  orgSlug,
  onConfigure,
  onCancel,
}: CalendarBookingScreenProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
    } else {
      router.push(`/crm/${orgSlug}/settings`);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  return (
    <div data-testid="calendar-booking-content" className="min-h-[400px] w-full">
      {isOpen && (
        <ModalOverlay
          isOpen={isOpen}
          onOpenChange={(open) => {
            if (!open) handleCancel();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="w-(--size-dialog-width) max-w-full rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
            <AriaDialog className="outline-none">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-6 shrink-0 text-warning" aria-hidden="true" />
                <div className="flex-1">
                  <Heading slot="title" className="text-xl font-bold text-text-strong">
                    Business Hours Not Configured
                  </Heading>
                  <p className="mt-2 text-md text-text-muted">
                    Calendar booking needs your organization&apos;s business hours.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-(--size-confirm-dialog-actions-gap)">
                <Button variant="secondary" size="record" onPress={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" size="record" onPress={handleConfigure}>
                  Configure Business Hours
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
