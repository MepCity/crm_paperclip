"use client";

import type { FieldValue } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { DedupConflictRoute } from "@/components/records/deduplicate/dedup-conflict-route";
import { RecordDetailScreen } from "@/components/records/detail/record-detail-screen";
import { DraftsPage } from "@/components/records/drafts/drafts-page";
import { MergeDuplicatesScreen } from "@/components/records/merge/merge-duplicates-screen";
import { ManageTagsPage } from "@/components/records/tags/manage-tags-page";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordMergePath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { ModuleFormClient } from "./module-form-client";
import { ModuleListClient } from "./module-list-client";
import { resolveModuleScreen } from "./registry";

export type ModuleRouteKind =
  | "list"
  | "detail"
  | "create"
  | "edit"
  | "clone"
  | "merge"
  | "deduplicate"
  | "tags"
  | "drafts";

export function ModuleRouteClient({
  moduleTab,
  kind,
  orgSlug,
  viewId,
  recordId,
  currentUserId,
  createPrefill,
}: {
  moduleTab: string;
  kind: ModuleRouteKind;
  orgSlug: string;
  viewId?: string;
  recordId?: string;
  currentUserId: string;
  createPrefill?: Readonly<Record<string, FieldValue>>;
}) {
  const definition = resolveModuleScreen(moduleTab);
  if (!definition) throw new Error("Unknown module screen.");
  const router = useRouter();
  if (kind === "tags") {
    const listHref = moduleListDefaultPath(orgSlug, definition.tab);
    return (
      <ManageTagsPage moduleName={definition.pluralLabel} onBack={() => router.push(listHref)} />
    );
  }
  if (kind === "drafts") {
    const listHref = moduleListDefaultPath(orgSlug, definition.tab);
    return <DraftsPage onBack={() => router.push(listHref)} />;
  }
  if (kind === "list")
    return (
      <ModuleListClient
        definition={definition}
        orgSlug={orgSlug}
        viewId={viewId}
        currentUserId={currentUserId}
      />
    );
  if (kind === "deduplicate")
    return <DedupConflictRoute orgSlug={orgSlug} definition={definition} />;
  if (kind === "merge" && recordId) {
    const paths = {
      defaultList: moduleListDefaultPath,
      record: moduleRecordPath,
    };
    return (
      <MergeDuplicatesScreen
        orgSlug={orgSlug}
        recordId={recordId}
        definition={definition}
        paths={paths}
      />
    );
  }
  if (kind === "detail" && recordId) {
    const paths = {
      defaultList: moduleListDefaultPath,
      record: moduleRecordPath,
      edit: moduleRecordEditPath,
      clone: moduleRecordClonePath,
      merge: moduleRecordMergePath,
    };
    const DetailScreen = definition.detail.Screen;
    if (DetailScreen) {
      return (
        <DetailScreen orgSlug={orgSlug} recordId={recordId} paths={paths} definition={definition} />
      );
    }
    return (
      <RecordDetailScreen
        definition={definition}
        orgSlug={orgSlug}
        recordId={recordId}
        paths={paths}
      />
    );
  }
  return (
    <ModuleFormClient
      definition={definition}
      orgSlug={orgSlug}
      currentUserId={currentUserId}
      createPrefill={createPrefill}
      recordId={kind === "edit" ? recordId : undefined}
      cloneSourceId={kind === "clone" ? recordId : undefined}
    />
  );
}
