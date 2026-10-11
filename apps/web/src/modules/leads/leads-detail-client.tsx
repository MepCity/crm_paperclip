"use client";

import type { RecordId } from "@crm/core/records";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { LeadRecordScreen } from "./lead-record-screen";

export function LeadsDetailClient({ orgSlug, recordId }: { orgSlug: string; recordId: RecordId }) {
  return (
    <LeadRecordScreen
      orgSlug={orgSlug}
      recordId={recordId}
      paths={{
        defaultList: moduleListDefaultPath,
        record: moduleRecordPath,
        edit: moduleRecordEditPath,
        clone: moduleRecordClonePath,
      }}
    />
  );
}
