import { ValidationError } from "../../errors";
import { MAX_INBOUND_ATTACHMENT_BYTES } from "../types";

export interface OutboundAttachmentInput {
  name: string;
  sizeBytes: number;
  contentType: string;
}

/** Checks every file and the aggregate size against the cap (default 20 MiB). */
export function validateOutboundAttachments(
  files: OutboundAttachmentInput[],
  capBytes: number = MAX_INBOUND_ATTACHMENT_BYTES,
): void {
  let total = 0;
  for (const file of files) {
    if (file.name.trim() === "") {
      throw new ValidationError({ attachments: ["Every attachment needs a name."] });
    }
    if (!Number.isInteger(file.sizeBytes) || file.sizeBytes < 0) {
      throw new ValidationError({ attachments: ["An attachment has an invalid size."] });
    }
    total += file.sizeBytes;
  }
  if (total > capBytes) {
    throw new ValidationError(
      { attachments: ["The attachments are larger than the allowed total size."] },
      "The attachments are too large.",
      "limit",
    );
  }
}

export function inboundStorageDecision(sizeBytes: number): "store" | "not_stored" {
  return sizeBytes <= MAX_INBOUND_ATTACHMENT_BYTES ? "store" : "not_stored";
}
