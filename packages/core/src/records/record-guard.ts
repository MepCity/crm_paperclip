import { canOnRecord } from "../access/evaluate";
import type { AccessSnapshot } from "../access/types";
import { ForbiddenError } from "../errors";
import type { RecordService } from "./contract";

/**
 * Shared guard for services that act on a record they only hold an id for (cadence enrollment
 * actions, sub-resources): the caller must be able to read the record (404 otherwise, via the
 * access-bound record service) and edit it (403 `permission_denied`).
 */
export async function assertRecordEditable(
  access: { accessSnapshot: AccessSnapshot; recordService: RecordService },
  module: string,
  recordId: string,
): Promise<void> {
  const record = await access.recordService.get(module, recordId);
  const owner = record.fields.Owner;
  const ownerId =
    typeof owner === "string"
      ? owner
      : owner && typeof owner === "object" && "id" in owner && typeof owner.id === "string"
        ? owner.id
        : undefined;
  if (!canOnRecord(access.accessSnapshot, module, "edit", ownerId))
    throw new ForbiddenError("User does not have write access to record", "permission_denied");
}
