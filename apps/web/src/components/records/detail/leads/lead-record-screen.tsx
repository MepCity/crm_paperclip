"use client";

import { NotFoundError } from "@crm/core/errors";
import type { ListQuery, ModuleApiName, RecordId } from "@crm/core/records";
import { useMemo, useState, useSyncExternalStore } from "react";
import { BusinessCard } from "@/components/records/detail/business-card";
import { DetailsCard } from "@/components/records/detail/details-card";
import { LastUpdateLabel } from "@/components/records/detail/last-update-label";
import { RecordHeader } from "@/components/records/detail/record-header";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { useModule, useRecord, useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { LEADS_MODULE } from "@/lib/records/leads-detail.constants";
import {
  buildLeadsBusinessCardFields,
  buildLeadsDetailSections,
} from "@/lib/records/leads-detail-sections";
import { formatLeadsLastUpdateLabel } from "@/lib/records/leads-last-update";
import { leadsRecordHeaderIdentity } from "@/lib/records/leads-record-header";
import {
  type RecordListContext,
  readRecordListContext,
  subscribeRecordListContext,
} from "@/lib/records/record-list-context";
import { recordNeighborsOnPage } from "@/lib/records/record-neighbors";

const FALLBACK_LIST_PAGE_SIZE = 30;

export type LeadRecordPaths = {
  defaultList: (orgSlug: string, module: ModuleApiName) => string;
  record: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  edit: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
};

export type LeadRecordScreenProps = {
  orgSlug: string;
  recordId: RecordId;
  paths: LeadRecordPaths;
  now?: Date;
};

function useLeadsListContext(orgSlug: string): RecordListContext | null {
  return useSyncExternalStore(
    (listener) => subscribeRecordListContext(orgSlug, LEADS_MODULE, listener),
    () => readRecordListContext(orgSlug, LEADS_MODULE),
    () => null,
  );
}

function RecordNotFound() {
  return (
    <div className="p-6 text-md text-text">
      <p>The requested page could not be found.</p>
    </div>
  );
}

function LeadRecordLoadingShell() {
  return (
    <div className="flex h-full min-h-0 flex-col" data-lead-record-loading aria-hidden="true" />
  );
}

export function LeadRecordScreen({
  orgSlug,
  recordId,
  paths,
  now = new Date(),
}: LeadRecordScreenProps) {
  const [selectedTabId, setSelectedTabId] = useState("overview");
  const listContext = useLeadsListContext(orgSlug);
  const moduleQuery = useModule(LEADS_MODULE);
  const recordQuery = useRecord(LEADS_MODULE, recordId);
  const usersQuery = useUsers();
  const viewsQuery = useViews(LEADS_MODULE);

  const fallbackViewId = useMemo(() => {
    return viewsQuery.data?.find((view) => view.isDefault)?.id ?? null;
  }, [viewsQuery.data]);

  const fallbackListQuery = useMemo((): ListQuery | null => {
    if (listContext) return null;
    if (!fallbackViewId) return null;
    return { viewId: fallbackViewId, page: 1, perPage: FALLBACK_LIST_PAGE_SIZE };
  }, [fallbackViewId, listContext]);

  const fallbackList = useRecordList(
    LEADS_MODULE,
    fallbackListQuery ?? {
      viewId: fallbackViewId ?? "pending",
      page: 1,
      perPage: FALLBACK_LIST_PAGE_SIZE,
    },
    { enabled: fallbackListQuery !== null },
  );

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of usersQuery.data ?? []) map[member.userId] = member.name;
    return map;
  }, [usersQuery.data]);

  const loading =
    moduleQuery.isLoading ||
    recordQuery.isLoading ||
    usersQuery.isLoading ||
    viewsQuery.isLoading ||
    (!listContext && fallbackListQuery !== null && fallbackList.isLoading && !fallbackList.data);

  if (loading) return <LeadRecordLoadingShell />;

  if (recordQuery.isError) {
    if (recordQuery.error instanceof NotFoundError) return <RecordNotFound />;
    throw recordQuery.error;
  }
  if (moduleQuery.isError) throw moduleQuery.error;
  if (usersQuery.isError) throw usersQuery.error;
  if (viewsQuery.isError) throw viewsQuery.error;
  if (!listContext && fallbackListQuery && fallbackList.isError) throw fallbackList.error;

  const module = moduleQuery.data;
  const record = recordQuery.data;
  if (!module || !record) return <LeadRecordLoadingShell />;

  const orderedIds =
    listContext?.recordIds ?? fallbackList.data?.records.map((row) => row.id) ?? [];
  const backHref =
    listContext?.listHref ??
    (fallbackViewId
      ? paths.defaultList(orgSlug, LEADS_MODULE)
      : paths.defaultList(orgSlug, LEADS_MODULE));

  const { previousId, nextId } = recordNeighborsOnPage(orderedIds, recordId);

  const { title, subtitle } = leadsRecordHeaderIdentity(record);
  const lastUpdate = formatLeadsLastUpdateLabel(record, now, DEFAULT_FORMAT);
  const businessFields = buildLeadsBusinessCardFields(module, record);
  const detailSections = buildLeadsDetailSections(module, record);

  const overview = (
    <>
      {lastUpdate ? <LastUpdateLabel text={lastUpdate} /> : null}
      <BusinessCard fields={businessFields} ownerNames={ownerNames} format={DEFAULT_FORMAT} />
      <DetailsCard sections={detailSections} ownerNames={ownerNames} format={DEFAULT_FORMAT} />
    </>
  );

  return (
    <RecordPageFrame
      header={
        <RecordHeader
          title={title}
          subtitle={subtitle}
          back={{ label: "Back", href: backHref }}
          commands={[
            {
              id: "edit",
              label: "Edit",
              variant: "secondary",
              href: paths.edit(orgSlug, LEADS_MODULE, recordId),
            },
          ]}
          moreLabel="More Options"
          previousLabel="Previous Record"
          nextLabel="Next Record"
          previousHref={previousId ? paths.record(orgSlug, LEADS_MODULE, previousId) : undefined}
          nextHref={nextId ? paths.record(orgSlug, LEADS_MODULE, nextId) : undefined}
        />
      }
      relatedListLabel="Related List"
      relatedEntries={[]}
      tabsLabel="Record detail"
      selectedTabId={selectedTabId}
      onTabChange={setSelectedTabId}
      tabs={[{ id: "overview", label: "Overview", content: overview }]}
      scrollTopLabel="Scroll To Top"
    />
  );
}
