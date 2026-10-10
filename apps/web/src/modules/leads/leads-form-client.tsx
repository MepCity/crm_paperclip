"use client";

import { useRouter } from "next/navigation";
import { leadsFormRules } from "@/components/records/form/leads-form-rules";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { SelectUserDialog } from "@/components/records/form/select-user-dialog";
import { useHomeCurrency } from "@/lib/api/client/hooks";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordPath } from "@/lib/crm-paths";
import { readRecordListContext } from "@/lib/records/record-list-context";
import { LEADS_MODULE } from "./list-config";
import "./leads-form-page.css";

export function LeadsFormClient({
  orgSlug,
  currentUserId,
  recordId,
  cloneSourceId,
}: {
  orgSlug: string;
  currentUserId: string;
  recordId?: string;
  cloneSourceId?: string;
}) {
  const router = useRouter();
  const homeCurrency = useHomeCurrency();
  const defaultCancel = cloneSourceId
    ? moduleRecordPath(orgSlug, LEADS_MODULE, cloneSourceId)
    : recordId
      ? moduleRecordPath(orgSlug, LEADS_MODULE, recordId)
      : moduleListDefaultPath(orgSlug, LEADS_MODULE);
  return (
    <div className="leads-form-page record-form-page">
      <RecordFormScreen
        currentUserId={currentUserId}
        recordId={recordId}
        cloneSourceId={cloneSourceId}
        config={{
          module: LEADS_MODULE,
          rules: leadsFormRules,
          currencyPrefix: homeCurrency.data?.symbol,
          paths: {
            detail: (id) => moduleRecordPath(orgSlug, LEADS_MODULE, id),
            create: moduleCreatePath(orgSlug, LEADS_MODULE),
            cancel: defaultCancel,
          },
          navigate: (path) => {
            const destination =
              !recordId && !cloneSourceId && path === defaultCancel
                ? (readRecordListContext(orgSlug, LEADS_MODULE)?.listHref ?? path)
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
