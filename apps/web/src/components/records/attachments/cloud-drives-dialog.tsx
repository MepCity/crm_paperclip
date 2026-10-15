"use client";

import { ArrowRight, Box, Cloud, FileText, Folder, HardDrive, Share2, X } from "lucide-react";
import { useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";

export interface CloudDrivesDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CloudProvider {
  id: string;
  name: string;
  icon: typeof HardDrive;
}

const DEFAULT_PROVIDER: CloudProvider = {
  id: "google-drive",
  name: "Google Drive",
  icon: HardDrive,
};

const PROVIDERS: readonly CloudProvider[] = [
  DEFAULT_PROVIDER,
  { id: "box", name: "Box", icon: Box },
  { id: "evernote", name: "Evernote", icon: FileText },
  { id: "dropbox", name: "Dropbox", icon: Folder },
  { id: "onedrive", name: "OneDrive", icon: Cloud },
  { id: "sharepoint", name: "SharePoint", icon: Share2 },
] as const;

const TOOLTIP_TEXT = "Cloud drives are not available yet.";

function DisconnectedIllustration() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-4 text-text-muted select-none"
      aria-hidden="true"
    >
      {/* Background card / screen */}
      <rect x="95" y="25" width="80" height="50" rx="6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="135" cy="42" r="7" fill="currentColor" fillOpacity="0.2" />
      <rect x="115" y="54" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="123" y="62" width="24" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1" />

      {/* Desk surface */}
      <rect x="30" y="80" width="140" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
      {/* Desk legs */}
      <line
        x1="45"
        y1="84"
        x2="45"
        y2="125"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <line
        x1="155"
        y1="84"
        x2="155"
        y2="125"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />

      {/* Monitor on desk */}
      <rect
        x="75"
        y="45"
        width="38"
        height="26"
        rx="3"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      <path d="M94 71V80M88 80H100" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />

      {/* Chair & seated figure outline */}
      <path
        d="M52 115H64M58 88V115M48 68C48 62 52 58 58 58C64 58 68 62 68 68V88H48V68Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="58" cy="46" r="6" fill="currentColor" fillOpacity="0.25" />

      {/* Cloud badge */}
      <g transform="translate(85, 12)">
        <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M7 14C6 14 5 13 5 12C5 11 6 10 7 10C7.2 8.5 8.5 7.5 10 7.5C11.5 7.5 12.5 8.5 12.8 9.5C13.2 9.2 13.6 9 14 9C15 9 16 10 16 11C16.6 11.2 17 11.8 17 12.5C17 13.3 16.3 14 15.5 14H7Z"
          fill="currentColor"
          fillOpacity="0.3"
        />
      </g>

      {/* Small potted plant */}
      <path
        d="M165 72Q168 65 171 72Q174 65 177 72"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
      />
      <path d="M167 74H175L173 80H169L167 74Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function CloudDrivesDialog({ open, onClose }: CloudDrivesDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(DEFAULT_PROVIDER);

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <Modal className="flex w-full max-w-3xl flex-col overflow-hidden rounded-(--radius-create-menu) border border-border bg-surface shadow-2xl outline-none">
        <AriaDialog className="flex flex-col outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <Heading slot="title" className="text-xl font-bold text-text-strong">
              Attach from Cloud Drives
            </Heading>
            <Button
              variant="icon"
              size="compact"
              aria-label="Close Modal"
              onPress={onClose}
              className="text-text-muted hover:text-text"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>

          {/* Main Body: Left Provider Rail + Right Disconnected State */}
          <div className="flex min-h-[380px] flex-1">
            {/* Provider Rail */}
            <nav
              aria-label="Cloud drive providers"
              className="flex w-52 flex-col border-r border-border bg-surface-subtle/30 py-2"
            >
              {PROVIDERS.map((provider) => {
                const isSelected = provider.id === selectedProvider.id;
                const IconComponent = provider.icon;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedProvider(provider)}
                    className={`flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      isSelected
                        ? "border-l-4 border-primary bg-surface font-semibold text-text shadow-xs"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                    }`}
                  >
                    <IconComponent
                      className={`size-4 shrink-0 ${
                        isSelected ? "text-primary" : "text-text-muted"
                      }`}
                      aria-hidden
                    />
                    <span>{provider.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Disconnected Body */}
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <DisconnectedIllustration />

              <h2 className="mb-1 text-xl font-bold text-text-strong">Connect your account</h2>
              <p className="mb-4 text-sm text-text-muted">
                Your {selectedProvider.name} account is not connected.
              </p>

              {/* Consent sentence */}
              <p className="mb-6 max-w-md text-xs leading-relaxed text-text-muted">
                By clicking on this button you agree to the provider's{" "}
                <button
                  type="button"
                  aria-disabled="true"
                  className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Terms of use
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  aria-disabled="true"
                  className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Privacy policy
                </button>
                .
              </p>

              {/* Authenticate Button with Tooltip */}
              <TooltipTrigger delay={0} closeDelay={0}>
                <Button
                  variant="primary"
                  size="md"
                  isDisabled
                  aria-label={`Authenticate ${selectedProvider.name}`}
                >
                  Authenticate {selectedProvider.name}
                </Button>
                <Tooltip>{TOOLTIP_TEXT}</Tooltip>
              </TooltipTrigger>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-4">
            <div className="select-none rounded-full border border-border px-4 py-1.5 text-sm text-text-muted">
              No files selected
            </div>

            <TooltipTrigger delay={0} closeDelay={0}>
              <Button variant="primary" size="md" isDisabled className="flex items-center gap-1.5">
                <span>Attach</span>
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Tooltip>{TOOLTIP_TEXT}</Tooltip>
            </TooltipTrigger>
          </div>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
