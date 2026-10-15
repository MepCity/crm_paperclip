"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";

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
  const [open, setOpen] = useState(false);
  const Chevron = open ? Icons.chevronUp : Icons.chevronDown;
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="compact" className="flex items-center gap-1.5">
        <span>Attach</span>
        <Chevron
          aria-hidden
          data-chevron={open ? "up" : "down"}
          className="size-3 text-text-muted"
        />
      </Button>
      <Menu
        aria-label="Attach source"
        placement="bottom start"
        onAction={(key) => onAttach(String(key) as AttachSource)}
      >
        {SOURCES.map((s) => (
          <MenuItem key={s.id} id={s.id} laterModule={s.laterModule}>
            {s.label}
          </MenuItem>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
