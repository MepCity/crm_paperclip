"use client";

import type { ModuleApiName } from "@crm/core/records";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { AttachLinkDialog } from "./attach-link-dialog";
import { AttachmentsCard, type AttachSource } from "./attachments-card";
import { CloudDrivesDialog } from "./cloud-drives-dialog";
import { useAttachments } from "./use-attachments";

export interface AttachmentsCardContainerProps {
  parentModule: ModuleApiName;
  parentId: string;
  targetId: string;
}

/** Data-connected Attachments card of a parent record's detail page. */
export function AttachmentsCardContainer({
  parentModule,
  parentId,
  targetId,
}: AttachmentsCardContainerProps) {
  const attachments = useAttachments(parentModule, parentId);
  const [dialog, setDialog] = useState<"link" | "cloud" | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleAttach(source: AttachSource) {
    if (source === "link") setDialog("link");
    if (source === "cloud") setDialog("cloud");
  }

  async function attachLink(url: string) {
    setSubmitting(true);
    setLinkError(null);
    try {
      await attachments.attachLink(url);
      setDialog(null);
    } catch {
      setLinkError("Could not attach the link.");
      toast({ variant: "danger", title: "Could not attach the link." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AttachmentsCard
        targetId={targetId}
        rows={attachments.rows}
        loading={attachments.loading}
        error={attachments.error}
        uploading={attachments.uploading}
        hasMore={attachments.hasMore}
        loadingMore={attachments.loadingMore}
        onLoadMore={attachments.loadMore}
        onAttach={handleAttach}
        onFilesSelected={(files) => void attachments.upload(files)}
        onDownload={(row) => void attachments.download(row)}
        onDelete={attachments.remove}
      />
      <AttachLinkDialog
        open={dialog === "link"}
        onClose={() => {
          setDialog(null);
          setLinkError(null);
        }}
        onAttach={attachLink}
        submitting={submitting}
        error={linkError}
      />
      <CloudDrivesDialog open={dialog === "cloud"} onClose={() => setDialog(null)} />
    </>
  );
}
