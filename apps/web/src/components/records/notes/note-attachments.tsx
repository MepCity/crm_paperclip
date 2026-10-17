"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { apiFetch, CRM_ORG_HEADER } from "@/lib/api/client/fetch";
import { useOrgSlug } from "@/lib/api/client/provider";

/** Interim budget for one note (OQ-06): decimal MB, configurable later. */
export const NOTE_ATTACH_MAX_FILES = 5;
export const NOTE_ATTACH_MAX_BYTES = 20_000_000;
export const NOTE_ATTACH_BUDGET_MESSAGE =
  "You can attach up to 5 files with a total size of 20 MB to a note.";

export interface NoteAttachment {
  id: string;
  fileName: string;
  size: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** Appends picked files while the note budget holds; otherwise keeps the list and flags it. */
export function addPendingFiles(
  current: readonly File[],
  incoming: readonly File[],
  alreadyAttached = 0,
  alreadyBytes = 0,
): { files: File[]; overBudget: boolean } {
  const next = [...current, ...incoming];
  const total = alreadyBytes + next.reduce((sum, file) => sum + file.size, 0);
  if (alreadyAttached + next.length > NOTE_ATTACH_MAX_FILES || total > NOTE_ATTACH_MAX_BYTES)
    return { files: [...current], overBudget: true };
  return { files: next, overBudget: false };
}

export function notifyOverBudget() {
  toast({ variant: "danger", title: NOTE_ATTACH_BUDGET_MESSAGE });
}

export function PendingFileChips({
  files,
  onRemove,
}: {
  files: readonly File[];
  onRemove: (index: number) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ul data-testid="note-pending-files" className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: the same file may be picked twice
          key={`${file.name}-${index}`}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm"
        >
          <span>{file.name}</span>
          <span className="text-text-muted">{formatFileSize(file.size)}</span>
          <Button
            variant="icon"
            size="sm"
            aria-label={`Remove ${file.name}`}
            onPress={() => onRemove(index)}
          >
            <X className="size-3" aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

const attachmentPath = (noteId: string, attachmentId?: string) =>
  `/crm/v2.2/Notes/${encodeURIComponent(noteId)}/Attachments${
    attachmentId ? `/${encodeURIComponent(attachmentId)}` : ""
  }`;

const attachmentsKey = (orgSlug: string, noteId: string) =>
  ["note-attachments", orgSlug, noteId] as const;

export function useNoteAttachments(noteId: string) {
  const orgSlug = useOrgSlug();
  return useQuery<NoteAttachment[]>({
    queryKey: attachmentsKey(orgSlug, noteId),
    queryFn: async () => {
      const body = (await apiFetch(orgSlug, attachmentPath(noteId))) as {
        data?: { id: string; File_Name: string; Size: number }[];
      } | null;
      return (body?.data ?? []).map((row) => ({
        id: row.id,
        fileName: row.File_Name,
        size: row.Size,
      }));
    },
  });
}

/** Uploads one request per file under a shared batch id; resolves to the names that failed. */
export function useUploadNoteAttachments() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return async (noteId: string, files: readonly File[]): Promise<string[]> => {
    const batch = crypto.randomUUID();
    const failed: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.set("file", file);
      try {
        const response = await fetch(attachmentPath(noteId), {
          method: "POST",
          credentials: "same-origin",
          headers: { [CRM_ORG_HEADER]: orgSlug, "X-Upload-Batch": batch },
          body: form,
        });
        if (!response.ok) failed.push(file.name);
      } catch {
        failed.push(file.name);
      }
    }
    await queryClient.invalidateQueries({ queryKey: attachmentsKey(orgSlug, noteId) });
    return failed;
  };
}

async function download(orgSlug: string, noteId: string, item: NoteAttachment) {
  const response = await fetch(attachmentPath(noteId, item.id), {
    credentials: "same-origin",
    headers: { [CRM_ORG_HEADER]: orgSlug },
  });
  if (!response.ok) {
    toast({ variant: "danger", title: "Unable to download the file." });
    return;
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NoteAttachmentList({
  noteId,
  editable = false,
  uploadError,
}: {
  noteId: string;
  editable?: boolean;
  uploadError?: string | null;
}) {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  const query = useNoteAttachments(noteId);
  const remove = useMutation({
    mutationFn: (attachmentId: string) =>
      apiFetch(orgSlug, attachmentPath(noteId, attachmentId), { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attachmentsKey(orgSlug, noteId) }),
    onError: () => toast({ variant: "danger", title: "Unable to delete the attachment." }),
  });
  const items = query.data ?? [];
  if (items.length === 0 && !uploadError) return null;
  return (
    <div data-testid="note-attachments" className="flex flex-col gap-1 text-sm">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onPress={() => download(orgSlug, noteId, item)}>
            {item.fileName}
          </Button>
          <span className="text-text-muted">{formatFileSize(item.size)}</span>
          {editable ? (
            <Button
              variant="icon"
              size="sm"
              aria-label={`Delete ${item.fileName}`}
              isDisabled={remove.isPending}
              onPress={() => remove.mutate(item.id)}
            >
              <X className="size-3" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ))}
      {uploadError ? (
        <p role="alert" className="text-danger">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
