"use client";

import { supportsAttachmentCard } from "@crm/core/attachments/modules";
import { type FormatOptions, formatDate as formatRecordDate } from "@crm/core/format";
import type { ModuleApiName } from "@crm/core/records";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/toast";
import { apiFetch, CRM_ORG_HEADER } from "@/lib/api/client/fetch";
import { useOrgSlug } from "@/lib/api/client/provider";
import { apiKeys } from "@/lib/api/client/query-keys";
import { useFormat } from "@/lib/format-context";
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

function formatDate(iso: string, format: FormatOptions): string {
  try {
    return formatRecordDate(iso, format);
  } catch {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(format.locale, { month: "short", day: "numeric", year: "numeric" });
  }
}

function toRow(item: WireAttachment, format: FormatOptions): AttachmentRow {
  return {
    id: item.id,
    fileName: item.File_Name,
    size: Number(item.Size) || 0,
    type: item.$type,
    ...(item.$type === "link" && item.$link_url ? { linkUrl: item.$link_url } : {}),
    attachedBy: item.Created_By?.name ?? "",
    createdTime: formatDate(item.Created_Time, format),
  };
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
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  uploading: UploadState[];
  upload: (files: File[]) => Promise<void>;
  attachLink: (url: string) => Promise<void>;
  download: (row: AttachmentRow) => Promise<void>;
  remove: (row: AttachmentRow) => Promise<void>;
}

const PAGE_SIZE = 20;

export function useAttachments(
  parentModule: ModuleApiName,
  parentId: string,
  options: { enabled?: boolean } = {},
): UseAttachments {
  const format = useFormat();
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  const key = attachmentsKey(orgSlug, parentModule, parentId);
  // Pages load on demand (the card's "Show more"); never the whole list up front.
  const query = useInfiniteQuery({
    queryKey: key,
    enabled: options.enabled ?? supportsAttachmentCard(parentModule),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const body = (await apiFetch(
        orgSlug,
        `${attachmentsPath(parentModule, parentId)}?page=${pageParam}&per_page=${PAGE_SIZE}`,
      )) as { data?: WireAttachment[]; info?: { more_records?: boolean } } | null;
      return { items: body?.data ?? [], more: Boolean(body?.info?.more_records) };
    },
    getNextPageParam: (last, all) => (last.more ? all.length + 1 : undefined),
  });
  const loaded = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const [uploading, setUploading] = useState<UploadState[]>([]);
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: apiKeys.timelines(orgSlug) }),
    ]);
  }, [queryClient, key, orgSlug]);

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
      await refresh();
    },
    [orgSlug, parentModule, parentId, refresh],
  );

  const rows = useMemo(() => loaded.map((item) => toRow(item, format)), [loaded, format]);
  return {
    rows,
    loading: query.isLoading,
    error: query.isError ? "Could not load attachments." : null,
    hasMore: Boolean(query.hasNextPage),
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    uploading,
    upload,
    attachLink,
    download,
    remove,
  };
}
