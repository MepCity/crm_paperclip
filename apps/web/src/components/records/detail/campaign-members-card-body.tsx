"use client";

import type {
  Criteria,
  FieldValue,
  ModuleApiName,
  ModuleRecordReference,
  RecordData,
} from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useRecordList, useViews } from "@/lib/api/client/hooks";
import { openActivityCreate } from "@/modules/activity-add-new";

const LIST_PAGE_SIZE = 100;

export interface CampaignMembersCardBodyProps {
  campaignRecord: RecordData;
  memberKind: "Lead" | "Contact";
  recordPath: (module: ModuleApiName, id: string) => string;
  orgSlug?: string;
}

function reference(value: FieldValue | undefined): ModuleRecordReference | null {
  return typeof value === "object" && value !== null && "id" in value && "module" in value
    ? (value as ModuleRecordReference)
    : null;
}

function text(value: FieldValue | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function CampaignMembersCardBody({
  campaignRecord,
  memberKind,
  recordPath,
  orgSlug = "",
}: CampaignMembersCardBodyProps) {
  const router = useRouter();
  const filter = useMemo<Criteria>(
    () => ({ field: "Campaign", comparator: "equal", value: campaignRecord.id }),
    [campaignRecord.id],
  );

  const membersQuery = useRecordList(
    "Campaign_Members",
    { viewId: "all-campaign-members", page: 1, perPage: LIST_PAGE_SIZE, filters: filter },
    { enabled: Boolean(campaignRecord.id) },
  );

  const targetField = memberKind;
  const targetModule: ModuleApiName = memberKind === "Lead" ? "Leads" : "Contacts";

  const matchingMemberRows = useMemo(() => {
    return (membersQuery.data?.records ?? []).filter((row) => {
      const refVal = reference(row.fields[targetField]);
      return refVal !== null && Boolean(refVal.id);
    });
  }, [membersQuery.data?.records, targetField]);

  const targetIds = useMemo(() => {
    return [
      ...new Set(
        matchingMemberRows
          .map((row) => {
            const refVal = reference(row.fields[targetField]);
            return refVal ? String(refVal.id) : null;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }, [matchingMemberRows, targetField]);

  const targetViews = useViews(targetModule);
  const targetViewId = useMemo(
    () =>
      targetViews.data?.find((v) => v.isDefault)?.id ??
      (targetModule === "Leads" ? "all-leads" : "all-contacts"),
    [targetViews.data, targetModule],
  );

  const targetFilter = useMemo<Criteria>(
    () => ({
      groupOperator: "or",
      group: targetIds.map((id) => ({ field: "id", comparator: "equal", value: id })),
    }),
    [targetIds],
  );

  const hasTargets = targetIds.length > 0;
  const targetsQuery = useRecordList(
    targetModule,
    {
      viewId: targetViewId ?? "pending",
      page: 1,
      perPage: LIST_PAGE_SIZE,
      filters: targetFilter,
    },
    { enabled: targetViewId !== null && hasTargets },
  );

  const targetsById = useMemo(
    () => new Map((targetsQuery.data?.records ?? []).map((rec) => [rec.id, rec])),
    [targetsQuery.data?.records],
  );

  if (membersQuery.isLoading || (hasTargets && (targetViews.isLoading || targetsQuery.isLoading))) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }

  if (membersQuery.isError || (hasTargets && (targetViews.isError || targetsQuery.isError))) {
    return <RelatedRecordsListError />;
  }

  if (matchingMemberRows.length === 0) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        No records found
      </div>
    );
  }

  const nameColumnHeader = memberKind === "Lead" ? "Lead Name" : "Contact Name";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-md">
        <thead>
          <tr className="border-b border-panel-border text-left text-text-muted">
            <th className="px-2 py-2 font-semibold">{nameColumnHeader}</th>
            <th className="px-2 py-2 font-semibold">Member Status</th>
            <th className="px-2 py-2 font-semibold">Email</th>
            <th className="px-2 py-2 font-semibold">Phone</th>
          </tr>
        </thead>
        <tbody>
          {matchingMemberRows.map((row) => {
            const memberRef = reference(row.fields[targetField]);
            if (!memberRef) return null;
            const targetRecord = targetsById.get(memberRef.id);
            const memberName =
              text(targetRecord?.fields.Full_Name) ||
              [text(targetRecord?.fields.First_Name), text(targetRecord?.fields.Last_Name)]
                .filter(Boolean)
                .join(" ") ||
              text(targetRecord?.fields.Last_Name) ||
              memberRef.name ||
              memberRef.id;

            const memberStatus = text(row.fields.Member_Status);
            const email = text(targetRecord?.fields.Email);
            const phone = text(targetRecord?.fields.Phone);

            return (
              <tr key={row.id} className="border-b border-panel-border last:border-b-0">
                <td className="px-2 py-2">
                  <Link
                    href={recordPath(targetModule, memberRef.id)}
                    variant="body"
                    className="text-primary hover:underline"
                  >
                    {memberName}
                  </Link>
                </td>
                <td className="px-2 py-2 text-text">{memberStatus ?? "—"}</td>
                <td className="px-2 py-2">
                  {email ? (
                    <Link
                      href={`mailto:${email}`}
                      variant="body"
                      laterModule="M10"
                      className="text-primary hover:underline"
                    >
                      {email}
                    </Link>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-text">
                  {phone ? (
                    <span className="inline-flex items-center gap-1">
                      <span>{phone}</span>
                      <Button
                        variant="icon"
                        size="compact"
                        aria-label="Call"
                        onPress={() =>
                          targetRecord &&
                          openActivityCreate(
                            orgSlug,
                            "Calls",
                            targetModule,
                            targetRecord,
                            (path) => router.push(path),
                            recordPath("Campaigns", campaignRecord.id),
                          )
                        }
                      >
                        <Icons.phone aria-hidden className="size-3.5" />
                      </Button>
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
