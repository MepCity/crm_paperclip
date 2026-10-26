"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";

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
  const t = useUiTranslations();
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/50 px-4"
        >
          <Modal className="w-[min(950px,95vw)] max-w-full rounded-(--radius-create-menu) bg-surface p-6 shadow-lg outline-none">
            <AriaDialog className="outline-none">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="size-6 shrink-0 text-danger fill-danger/10"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <Heading slot="title" className="text-xl font-bold text-text-strong">
                    {t("modules.emailSettings.bookingTitle")}
                  </Heading>
                  <p className="mt-2 text-md text-text-muted">
                    {t("modules.emailSettings.bookingDescription")}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-(--size-confirm-dialog-actions-gap)">
                <Button variant="primary" size="record" onPress={handleConfigure}>
                  {t("modules.emailSettings.configureHours")}
                </Button>
                <Button variant="secondary" size="record" onPress={handleCancel}>
                  {t("common.actions.cancel")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
