"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useUiTranslations } from "@/i18n/client-provider";
import { useRecordLabel } from "@/i18n/record-labels";

export type AttachSource = "upload" | "documents" | "cloud" | "link";

export interface AttachSourceMenuProps {
  onAttach: (source: AttachSource) => void;
}

const SOURCES: { id: AttachSource; label: string; laterModule?: "M9" }[] = [
  { id: "upload", label: "Upload File" },
  { id: "documents", label: "Documents", laterModule: "M9" },
  { id: "cloud", label: "Other Cloud Drives" },
  { id: "link", label: "Link (URL)" },
];

export function AttachSourceMenu({ onAttach }: AttachSourceMenuProps) {
  const t = useUiTranslations();
  const label = useRecordLabel();
  const [open, setOpen] = useState(false);
  const Chevron = open ? Icons.chevronUp : Icons.chevronDown;
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="relatedAction"
        size="relatedAction"
        className="w-(--size-detail-attach-width) gap-1.5"
      >
        <span data-related-action-label>{t("records.attachments.attach")}</span>
        <Chevron aria-hidden data-chevron={open ? "up" : "down"} className="size-3 shrink-0" />
      </Button>
      <Menu
        aria-label="Attach source"
        placement="bottom start"
        onAction={(key) => onAttach(String(key) as AttachSource)}
      >
        {SOURCES.map((s) => (
          <MenuItem key={s.id} id={s.id} laterModule={s.laterModule}>
            {label(s.label)}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
