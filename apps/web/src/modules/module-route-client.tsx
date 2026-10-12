"use client";

import { RecordDetailScreen } from "@/components/records/detail/record-detail-screen";
import { MergeDuplicatesScreen } from "@/components/records/merge/merge-duplicates-screen";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordMergePath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { AccountRecordScreen } from "./accounts/account-record-screen";
import { ContactRecordScreen } from "./contacts/contact-record-screen";
import { ModuleFormClient } from "./module-form-client";
import { ModuleListClient } from "./module-list-client";
import { resolveModuleScreen } from "./registry";

export type ModuleRouteKind = "list" | "detail" | "create" | "edit" | "clone" | "merge";

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
    if (definition.apiName === "Contacts") {
      return <ContactRecordScreen orgSlug={orgSlug} recordId={recordId} paths={paths} />;
    }
    if (definition.apiName === "Accounts") {
      return <AccountRecordScreen orgSlug={orgSlug} recordId={recordId} paths={paths} />;
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
      recordId={kind === "edit" ? recordId : undefined}
      cloneSourceId={kind === "clone" ? recordId : undefined}
    />
  );
}
