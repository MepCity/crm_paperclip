"use client";

import type { RecordId } from "@crm/core/records";
import { LeadRecordScreen } from "@/components/records/detail/leads/lead-record-screen";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "@/lib/crm-paths";

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
