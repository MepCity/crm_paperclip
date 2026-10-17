"use client";

import type { ModuleApiName } from "@crm/core/records";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { TimelineEvent } from "@/components/records/detail/timeline";
import { toast } from "@/components/ui/toast";
import { apiFetch, CRM_ORG_HEADER } from "@/lib/api/client/fetch";
import { useOrgSlug } from "@/lib/api/client/provider";
import type { AttachmentRow } from "./attachments-card";

/** Provisional record selection budget (OQ-01, P1): 10 files / 100 MB combined (decimal MB). */
export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 100_000_000;
export const BUDGET_MESSAGE =
  "You can attach up to 10 files with a total size of 100 MB at a time.";
const TOO_LARGE_MESSAGE = "File size exceeds the limit.";
const TYPE_MESSAGE = "This file type is not supported.";

interface WireAttachment {
  id: string;
  File_Name: string;
  Size: number;
  $type: "file" | "link";
  $link_url?: string;
  Created_Time: string;
  Created_By: { id: string; name: string } | null;
}

export interface UploadState {
  name: string;
  progress: number;
  error?: string;
}

export function withinBudget(files: readonly { size: number }[]): boolean {
  return (
    files.length <= MAX_FILES && files.reduce((sum, file) => sum + file.size, 0) <= MAX_TOTAL_BYTES
  );
}

function attachmentsPath(module: string, id: string, attachmentId?: string): string {
  const base = `/crm/v2.2/${encodeURIComponent(module)}/${encodeURIComponent(id)}/Attachments`;
  return attachmentId ? `${base}/${encodeURIComponent(attachmentId)}` : base;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toRow(item: WireAttachment): AttachmentRow {
  return {
    id: item.id,
    fileName: item.File_Name,
    size: Number(item.Size) || 0,
    type: item.$type,
    ...(item.$type === "link" && item.$link_url ? { linkUrl: item.$link_url } : {}),
    attachedBy: item.Created_By?.name ?? "",
    createdTime: formatDate(item.Created_Time),
  };
}

// Deleted attachments leave no record behind (permanent delete), so their Timeline
// events live in this session-scoped store. Provisional rule (OQ-04).
interface DeletedEvent {
  key: string;
  event: TimelineEvent;
}
let deletedEvents: readonly DeletedEvent[] = [];
const listeners = new Set<() => void>();
function recordDeleted(entry: DeletedEvent) {
  deletedEvents = [...deletedEvents, entry];
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetDeletedAttachmentEvents() {
  deletedEvents = [];
}

function attachmentsKey(orgSlug: string, module: string, id: string) {
  return ["attachments", orgSlug, module, id] as const;
}

function uploadError(status: number): string {
  if (status === 413) return TOO_LARGE_MESSAGE;
  if (status === 415) return TYPE_MESSAGE;
  return "Could not attach the file.";
}

export interface UseAttachments {
  rows: AttachmentRow[];
  events: readonly TimelineEvent[];
  loading: boolean;
  error: string | null;
  uploading: UploadState[];
  upload: (files: File[]) => Promise<void>;
  attachLink: (url: string) => Promise<void>;
  download: (row: AttachmentRow) => Promise<void>;
  remove: (row: AttachmentRow) => Promise<void>;
}

export const ATTACHMENT_PARENTS: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

export function useAttachments(
  parentModule: ModuleApiName,
  parentId: string,
  options: { enabled?: boolean } = {},
): UseAttachments {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  const key = attachmentsKey(orgSlug, parentModule, parentId);
  const query = useQuery({
    queryKey: key,
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const out: WireAttachment[] = [];
      for (let page = 1; ; page++) {
        const body = (await apiFetch(
          orgSlug,
          `${attachmentsPath(parentModule, parentId)}?page=${page}&per_page=100`,
        )) as { data?: WireAttachment[]; info?: { more_records?: boolean } } | null;
        if (!body?.data) break;
        out.push(...body.data);
        if (!body.info?.more_records) break;
      }
      return out;
    },
  });
  const [uploading, setUploading] = useState<UploadState[]>([]);
  const deleted = useSyncExternalStore(
    subscribe,
    () => deletedEvents,
    () => deletedEvents,
  );
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: key }),
    [queryClient, key],
  );

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (!withinBudget(files)) {
        toast({ variant: "danger", title: BUDGET_MESSAGE });
        return;
      }
      const batch = crypto.randomUUID();
      setUploading(files.map((file) => ({ name: file.name, progress: 0 })));
      const failed: UploadState[] = [];
      for (const [index, file] of files.entries()) {
        const form = new FormData();
        form.set("file", file, file.name);
        try {
          const response = await fetch(attachmentsPath(parentModule, parentId), {
            method: "POST",
            credentials: "same-origin",
            headers: { [CRM_ORG_HEADER]: orgSlug, "X-Upload-Batch": batch },
            body: form,
          });
          if (!response.ok)
            failed.push({ name: file.name, progress: 0, error: uploadError(response.status) });
        } catch {
          failed.push({ name: file.name, progress: 0, error: uploadError(0) });
        }
        const done = index + 1;
        setUploading((current) =>
          current.map((item, i) => (i < done ? { ...item, progress: 100 } : item)),
        );
      }
      await refresh();
      setUploading(failed);
    },
    [orgSlug, parentModule, parentId, refresh],
  );

  const attachLink = useCallback(
    async (url: string) => {
      const form = new FormData();
      form.set("attachmentUrl", url);
      await apiFetch(orgSlug, attachmentsPath(parentModule, parentId), { method: "POST", form });
      await refresh();
    },
    [orgSlug, parentModule, parentId, refresh],
  );

  const download = useCallback(
    async (row: AttachmentRow) => {
      const response = await fetch(attachmentsPath(parentModule, parentId, row.id), {
        credentials: "same-origin",
        headers: { [CRM_ORG_HEADER]: orgSlug },
      });
      if (!response.ok) {
        toast({ variant: "danger", title: "Could not download the file." });
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = row.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    [orgSlug, parentModule, parentId],
  );

  const remove = useCallback(
    async (row: AttachmentRow) => {
      await apiFetch(orgSlug, attachmentsPath(parentModule, parentId, row.id), {
        method: "DELETE",
      });
      recordDeleted({
        key: `${parentModule}:${parentId}`,
        event: {
          id: `attachment-deleted-${row.id}`,
          at: new Date().toISOString(),
          kind: "attachment",
          moduleId: "attachments",
          title: `Attachment deleted: ${row.fileName}`,
          actorName: "You",
        },
      });
      await refresh();
    },
    [orgSlug, parentModule, parentId, refresh],
  );

  const rows = useMemo(() => (query.data ?? []).map(toRow), [query.data]);
  const events = useMemo(() => {
    const added = (query.data ?? []).map(
      (item): TimelineEvent => ({
        id: `attachment-${item.id}`,
        at: item.Created_Time,
        kind: "attachment",
        moduleId: "attachments",
        title: `Attachment added: ${item.File_Name}`,
        actorName: item.Created_By?.name ?? "",
        actorId: item.Created_By?.id,
      }),
    );
    const mine = deleted.filter((d) => d.key === `${parentModule}:${parentId}`).map((d) => d.event);
    return [...added, ...mine];
  }, [query.data, deleted, parentModule, parentId]);

  return {
    rows,
    events,
    loading: query.isLoading,
    error: query.isError ? "Could not load attachments." : null,
    uploading,
    upload,
    attachLink,
    download,
    remove,
  };
}
