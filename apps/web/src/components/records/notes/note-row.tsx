"use client";

import { formatDateTime } from "@crm/core/format";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Link } from "@/components/ui/link";
import { UserAvatarPlaceholder } from "@/components/ui/user-avatar-placeholder";
import { useUtilityLabel } from "@/i18n/utility-labels";
import { useFormat } from "@/lib/format-context";
import type { NoteListItem } from "./note-list";
import "./notes.css";

export interface NoteRowProps {
  item: NoteListItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function NoteRow({ item, onEdit, onDelete }: NoteRowProps) {
  const copy = useUtilityLabel();
  const orgFormat = useFormat();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Measured while clamped: the clamp is what makes a long body overflow its box.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  return (
    <li className="note-row" data-testid="note-row">
      <UserAvatarPlaceholder size="32px" />
      <div className="note-row-main">
        {item.title ? <div className="note-row-title">{item.title}</div> : null}
        <div ref={bodyRef} className="note-row-body" data-clamped={!expanded}>
          {item.body}
        </div>
        {overflows || expanded ? (
          <Button variant="ghost" size="sm" onPress={() => setExpanded((v) => !v)}>
            {copy(expanded ? "Show Less" : "Show More")}
            <ChevronDown
              aria-hidden="true"
              className={expanded ? "h-4 w-4 rotate-180" : "h-4 w-4"}
            />
          </Button>
        ) : null}
        {item.attachments}
        <div className="note-row-meta">
          <Link href={item.parentHref}>{item.parentLabel}</Link>
          <span>{copy("Add Note")}</span>
          <span>{formatDateTime(item.createdAt, orgFormat)}</span>
          <span>{item.authorName}</span>
        </div>
      </div>
      {item.canEdit || item.canDelete ? (
        <div className="note-row-actions">
          {item.canEdit ? (
            <Button
              variant="icon"
              size="sm"
              aria-label={copy("Edit note")}
              onPress={() => onEdit(item.id)}
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </Button>
          ) : null}
          {item.canDelete ? (
            <Button
              variant="icon"
              size="sm"
              aria-label={copy("Delete note")}
              onPress={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
      {confirming ? (
        <ConfirmDialog
          isOpen
          onOpenChange={setConfirming}
          title={copy("Delete Note")}
          message={copy("Are you sure you want to delete this note?")}
          confirmLabel={copy("Delete")}
          cancelLabel={copy("Cancel")}
          tone="danger"
          onConfirm={() => onDelete(item.id)}
        />
      ) : null}
    </li>
  );
}
