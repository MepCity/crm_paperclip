"use client";

import type { FieldValue } from "@crm/core/records";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { SelectUserDialog } from "@/components/records/form/select-user-dialog";
import { useHomeCurrency } from "@/lib/api/client/hooks";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordPath } from "@/lib/crm-paths";
import {
  consumeRecordCreatePrefill,
  readRecordCreatePrefill,
} from "@/lib/records/record-create-prefill";
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
  const [returnTo] = useState(() =>
    recordId || cloneSourceId
      ? undefined
      : readRecordCreatePrefill(orgSlug, moduleApiName)?.returnTo,
  );
  const [sessionPrefill, setSessionPrefill] = useState<Readonly<Record<string, FieldValue>> | null>(
    () => {
      if (recordId || cloneSourceId) return null;
      return readRecordCreatePrefill(orgSlug, moduleApiName)?.fields ?? null;
    },
  );
  // Read from the router, not the window: during a client navigation the window URL lags behind.
  const intentName = useSearchParams().get("intent");
  const [editIntent] = useState(() =>
    recordId && intentName ? definition.form.editIntents?.[intentName] : undefined,
  );

  useEffect(() => {
    if (recordId || cloneSourceId) return;
    const consumed = consumeRecordCreatePrefill(orgSlug, moduleApiName);
    if (consumed?.fields) {
      setSessionPrefill(consumed.fields);
    }
  }, [orgSlug, moduleApiName, recordId, cloneSourceId]);

  const prefill = useMemo(() => {
    if (recordId || cloneSourceId) return undefined;
    const combined = { ...sessionPrefill, ...createPrefill };
    return Object.keys(combined).length > 0 ? combined : undefined;
  }, [recordId, cloneSourceId, sessionPrefill, createPrefill]);
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
          inventoryFooterEnd: definition.form.inventoryFooterEnd,
          profileImageLaterModule: definition.form.profileImageLaterModule,
          profileImageIcon: definition.form.profileImageIcon,
          createPrefill: hasPrefill ? prefill : undefined,
          editIntent,
          currencyPrefix: homeCurrency.data?.symbol,
          paths: {
            detail: (id, targetModule) => {
              if (returnTo && !recordId && !cloneSourceId && !targetModule) return returnTo;
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
