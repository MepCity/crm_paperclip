"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { type AttachSource, AttachSourceMenu } from "./attach-source-menu";

export type { AttachSource };

export interface AttachmentRow {
  id: string;
  fileName: string;
  size: number;
  type: "file" | "link";
  linkUrl?: string;
  attachedBy: string;
  createdTime: string;
}

export interface AttachmentsCardProps {
  rows: AttachmentRow[];
  loading?: boolean;
  error?: string | null;
  uploading?: { name: string; progress: number; error?: string }[];
  onAttach: (source: AttachSource) => void;
  onFilesSelected: (files: File[]) => void;
  onDownload: (row: AttachmentRow) => void;
  onDelete: (row: AttachmentRow) => Promise<void> | void;
  canEdit?: boolean;
  /** Rail jump target (AT-01). */
  targetId?: string;
}

/** Decimal sizes: KB below 1 MB, MB above. */
export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function AttachmentsCard({
  rows,
  loading,
  error,
  uploading = [],
  onAttach,
  onFilesSelected,
  onDownload,
  onDelete,
  canEdit = true,
  targetId = "attachments",
}: AttachmentsCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<AttachmentRow | null>(null);

  function handleAttach(source: AttachSource) {
    if (source === "upload") inputRef.current?.click();
    onAttach(source);
  }

  const isEmpty = rows.length === 0 && uploading.length === 0;

  return (
    <section
      id={targetId}
      aria-label="Attachments"
      data-related-card="attachments"
      className="detail-card border border-panel-border"
    >
      <div className="flex items-center justify-between min-h-(--size-list-header-height) py-2 border-b border-panel-border">
        <div className="flex items-center gap-3">
          <h3 className="text-md font-bold text-text-strong">Attachments</h3>
          {rows.length > 0 ? (
            <span
              data-part="count"
              className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full bg-surface-active text-2xs font-semibold text-text-muted"
            >
              {rows.length}
            </span>
          ) : null}
        </div>
        {canEdit ? <AttachSourceMenu onAttach={handleAttach} /> : null}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          data-part="file-input"
          aria-label="Upload files"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) onFilesSelected(files);
            e.target.value = "";
          }}
        />
      </div>

      {loading ? (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          Loading…
        </div>
      ) : error ? (
        <div role="alert" className="py-8 text-center text-md text-danger">
          {error}
        </div>
      ) : isEmpty ? (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          No Attachment
        </div>
      ) : (
        <div className="overflow-x-auto py-2">
          <table className="w-full text-left text-md">
            <thead>
              <tr className="border-b border-panel-border text-text-muted">
                <th scope="col" className="px-2 py-2 font-semibold text-text-strong">
                  File Name
                </th>
                <th scope="col" className="px-2 py-2 font-semibold text-text-strong">
                  Attached By
                </th>
                <th scope="col" className="px-2 py-2 font-semibold text-text-strong">
                  Date Added
                </th>
                <th scope="col" className="px-2 py-2 font-semibold text-text-strong">
                  Size
                </th>
                <th scope="col" className="w-8 px-2 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {uploading.map((u) => (
                <tr
                  key={`up-${u.name}`}
                  data-part="uploading"
                  className="border-b border-panel-border"
                >
                  <td className="px-2 py-2 text-text">{u.name}</td>
                  <td colSpan={4} className="px-2 py-2">
                    {u.error ? (
                      <span role="alert" className="text-danger">
                        {u.error}
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        <progress
                          value={u.progress}
                          max={100}
                          aria-label={`Uploading ${u.name}`}
                          className="mr-2 h-1.5 w-32 align-middle"
                        />
                        {Math.round(u.progress)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-attachment-row={row.id}
                  className="group border-b border-panel-border last:border-b-0"
                >
                  <td className="px-2 py-2">
                    {row.type === "link" && row.linkUrl ? (
                      <a
                        href={row.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {row.fileName}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDownload(row)}
                        className="text-primary hover:underline"
                      >
                        {row.fileName}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-2 text-text">{row.attachedBy}</td>
                  <td className="px-2 py-2 text-text">{row.createdTime}</td>
                  <td className="px-2 py-2 text-text">
                    {row.type === "link" ? "" : formatAttachmentSize(row.size)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {canEdit ? (
                      <Button
                        variant="icon"
                        size="compact"
                        aria-label={`Delete ${row.fileName}`}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        onPress={() => setPendingDelete(row)}
                      >
                        <Icons.close aria-hidden className="size-3.5" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={async () => {
          if (pendingDelete) await onDelete(pendingDelete);
        }}
      />
    </section>
  );
}
