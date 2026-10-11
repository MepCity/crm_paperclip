"use client";

import { RecordDetailScreen } from "@/components/records/detail/record-detail-screen";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { ModuleFormClient } from "./module-form-client";
import { ModuleListClient } from "./module-list-client";
import { resolveModuleScreen } from "./registry";

export type ModuleRouteKind = "list" | "detail" | "create" | "edit" | "clone";

export function ModuleRouteClient({
  moduleTab,
  kind,
  orgSlug,
  viewId,
  recordId,
  currentUserId,
}: {
  moduleTab: string;
  kind: ModuleRouteKind;
  orgSlug: string;
  viewId?: string;
  recordId?: string;
  currentUserId: string;
}) {
  const definition = resolveModuleScreen(moduleTab);
  if (!definition) throw new Error("Unknown module screen.");
  if (kind === "list")
    return <ModuleListClient definition={definition} orgSlug={orgSlug} viewId={viewId} />;
  if (kind === "detail" && recordId) {
    return (
      <RecordDetailScreen
        definition={definition}
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
  return (
    <ModuleFormClient
      definition={definition}
      orgSlug={orgSlug}
      currentUserId={currentUserId}
      recordId={kind === "edit" ? recordId : undefined}
      cloneSourceId={kind === "clone" ? recordId : undefined}
    />
  );
}
