"use client";

import type { FieldValue } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { SelectUserDialog } from "@/components/records/form/select-user-dialog";
import { useHomeCurrency } from "@/lib/api/client/hooks";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordPath } from "@/lib/crm-paths";
import { consumeRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { readRecordListContext } from "@/lib/records/record-list-context";
import { resolveModuleScreenByApiName } from "./registry";
import type { ModuleScreenDefinition } from "./types";
import "./module-form-page.css";

export function ModuleFormClient({
  orgSlug,
  definition,
  currentUserId,
  recordId,
  cloneSourceId,
  createPrefill,
}: {
  orgSlug: string;
  definition: ModuleScreenDefinition;
  currentUserId: string;
  recordId?: string;
  cloneSourceId?: string;
  createPrefill?: Readonly<Record<string, FieldValue>>;
}) {
  const moduleApiName = definition.apiName;
  const router = useRouter();
  const homeCurrency = useHomeCurrency();
  const [prefill] = useState(() =>
    !recordId && !cloneSourceId
      ? { ...consumeRecordCreatePrefill(orgSlug, moduleApiName)?.fields, ...createPrefill }
      : undefined,
  );
  const hasPrefill = prefill && Object.keys(prefill).length > 0;
  const defaultCancel = cloneSourceId
    ? moduleRecordPath(orgSlug, definition.tab, cloneSourceId)
    : recordId
      ? moduleRecordPath(orgSlug, definition.tab, recordId)
      : moduleListDefaultPath(orgSlug, definition.tab);
  return (
    <div className="module-form-page record-form-page" data-form-variant={definition.form.variant}>
      <RecordFormScreen
        currentUserId={currentUserId}
        recordId={recordId}
        cloneSourceId={cloneSourceId}
        config={{
          module: moduleApiName,
          variant: definition.form.variant,
          rules: definition.form.rules,
          sectionColumnOverrides: definition.form.fallbackColumns,
          inventoryChrome: definition.form.inventoryChrome,
          profileImageLaterModule: definition.form.profileImageLaterModule,
          profileImageIcon: definition.form.profileImageIcon,
          createPrefill: hasPrefill ? prefill : undefined,
          currencyPrefix: homeCurrency.data?.symbol,
          paths: {
            detail: (id, targetModule) => {
              if (targetModule) {
                const targetDef = resolveModuleScreenByApiName(targetModule);
                return moduleRecordPath(orgSlug, targetDef?.tab ?? targetModule, id);
              }
              return moduleRecordPath(orgSlug, definition.tab, id);
            },
            record: (targetModule, id) => {
              const targetDef = resolveModuleScreenByApiName(targetModule);
              return moduleRecordPath(orgSlug, targetDef?.tab ?? targetModule, id);
            },
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
