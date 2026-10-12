"use client";

import { useRouter } from "next/navigation";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { SelectUserDialog } from "@/components/records/form/select-user-dialog";
import { useHomeCurrency } from "@/lib/api/client/hooks";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordPath } from "@/lib/crm-paths";
import { readRecordListContext } from "@/lib/records/record-list-context";
import type { ModuleScreenDefinition } from "./types";
import "./module-form-page.css";

export function ModuleFormClient({
  orgSlug,
  definition,
  currentUserId,
  recordId,
  cloneSourceId,
}: {
  orgSlug: string;
  definition: ModuleScreenDefinition;
  currentUserId: string;
  recordId?: string;
  cloneSourceId?: string;
}) {
  const moduleApiName = definition.apiName;
  const router = useRouter();
  const homeCurrency = useHomeCurrency();
  const defaultCancel = cloneSourceId
    ? moduleRecordPath(orgSlug, definition.tab, cloneSourceId)
    : recordId
      ? moduleRecordPath(orgSlug, definition.tab, recordId)
      : moduleListDefaultPath(orgSlug, definition.tab);
  return (
    <div className="module-form-page record-form-page">
      <RecordFormScreen
        currentUserId={currentUserId}
        recordId={recordId}
        cloneSourceId={cloneSourceId}
        config={{
          module: moduleApiName,
          rules: definition.form.rules,
          sectionColumnOverrides: definition.form.fallbackColumns,
          addressGroups: definition.form.addressGroups,
          addressChildFieldOrder: definition.form.addressChildFieldOrder,
          inventoryChrome: definition.form.inventoryChrome,
          profileImageLaterModule: definition.form.profileImageLaterModule,
          currencyPrefix: homeCurrency.data?.symbol,
          paths: {
            detail: (id) => moduleRecordPath(orgSlug, definition.tab, id),
            create: moduleCreatePath(orgSlug, definition.tab),
            cancel: defaultCancel,
          },
          navigate: (path) => {
            const destination =
              !recordId && !cloneSourceId && path === defaultCancel
                ? (readRecordListContext(orgSlug, moduleApiName)?.listHref ?? path)
                : path;
            router.push(destination);
          },
          renderOwnerPicker: (props) => (
            <SelectUserDialog
              {...props}
              title="Select User"
              searchLabel="Search Users"
              searchPlaceholder="Search Users"
              selectedUserLabel="Selected User:"
              selectColumnLabel="Select"
              columnUserName="User Name"
              columnAvatarLabel="Avatar"
              columnRole="Role"
              columnEmail="Email"
              columnProfile="Profile"
              cancelLabel="Cancel"
              doneLabel="Done"
            />
          ),
        }}
      />
    </div>
  );
}
