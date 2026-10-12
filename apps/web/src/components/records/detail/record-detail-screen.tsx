"use client";

import { NotFoundError } from "@crm/core/errors";
import type { ListQuery, ModuleApiName, RecordData, RecordId } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { BusinessCard } from "@/components/records/detail/business-card";
import { DetailsCard } from "@/components/records/detail/details-card";
import { LastUpdateLabel } from "@/components/records/detail/last-update-label";
import { RECORD_DETAIL_RAIL_VISIBLE_KEY } from "@/components/records/detail/record-detail-rail";
import { RecordHeader } from "@/components/records/detail/record-header";
import { RecordPageFrame } from "@/components/records/detail/record-page-frame";
import { RecordRailToggle } from "@/components/records/detail/record-rail-toggle";
import { TimelineHistory, TimelineSurface } from "@/components/records/detail/timeline";
import { NotFoundMessage } from "@/components/shell/not-found-message";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import {
  useDeleteRecords,
  useModule,
  useRecord,
  useRecordList,
  useUpdateRecord,
  useUsers,
  useViews,
} from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { usePreference } from "@/lib/preferences";
import {
  type RecordListContext,
  readRecordListContext,
  removeRecordFromListContext,
  subscribeRecordListContext,
} from "@/lib/records/record-list-context";
import { recordNeighborsOnPage } from "@/lib/records/record-neighbors";
import type { ModuleScreenDefinition, RelatedListDefinition } from "@/modules/types";
import { AccountsLinkedContactSummary } from "./accounts-linked-contact-summary";
import { InlineEditProvider } from "./inline-edit-context";
import { RelatedCardsContainer } from "./related-cards-container";

const FALLBACK_LIST_PAGE_SIZE = 30;

export type RecordDetailPaths = {
  defaultList: (orgSlug: string, module: ModuleApiName) => string;
  record: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  edit: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  clone: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
  merge: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
};

export type RecordDetailScreenProps = {
  orgSlug: string;
  recordId: RecordId;
  paths: RecordDetailPaths;
  definition: ModuleScreenDefinition;
  now?: Date;
  buildRelatedLists?: (record: RecordData) => readonly RelatedListDefinition[];
  linkedContactSummaryPath?: (recordId: RecordId) => string;
};

function useModuleListContext(
  orgSlug: string,
  moduleApiName: ModuleApiName,
): RecordListContext | null {
  return useSyncExternalStore(
    (listener) => subscribeRecordListContext(orgSlug, moduleApiName, listener),
    () => readRecordListContext(orgSlug, moduleApiName),
    () => null,
  );
}

function RecordNotFound() {
  return (
    <div className="p-6 text-md text-text">
      <NotFoundMessage />
    </div>
  );
}

function RecordLoadingShell({ definition }: { definition: ModuleScreenDefinition }) {
  return (
    <div
      className="flex h-full min-h-0 flex-col"
      {...definition.detail.loadingAttributes}
      aria-hidden="true"
    />
  );
}

export function RecordDetailScreen({
  orgSlug,
  recordId,
  paths,
  definition,
  now = new Date(),
  buildRelatedLists,
  linkedContactSummaryPath,
}: RecordDetailScreenProps) {
  const moduleApiName = definition.apiName;
  const rules = definition.detail;
  const StatusSection = rules.statusRibbon?.component;
  const router = useRouter();
  const [selectedTabId, setSelectedTabId] = useState("overview");
  const [statusOverride, setStatusOverride] = useState<string | null | undefined>(undefined);
  const [railVisible, setRailVisible] = usePreference(RECORD_DETAIL_RAIL_VISIBLE_KEY, true);
  const [selectedRelatedId, setSelectedRelatedId] = useState<string | undefined>(
    rules.relatedLists?.[0]?.id,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const updateRecord = useUpdateRecord(moduleApiName);
  const deleteRecords = useDeleteRecords(moduleApiName);
  const listContext = useModuleListContext(orgSlug, moduleApiName);
  const viewsQueryEnabled = listContext === null;
  const moduleQuery = useModule(moduleApiName);
  const recordQuery = useRecord(moduleApiName, recordId);
  const usersQuery = useUsers();
  const viewsQuery = useViews(moduleApiName, { enabled: viewsQueryEnabled });

  const fallbackViewId = useMemo(() => {
    return viewsQuery.data?.find((view) => view.isDefault)?.id ?? null;
  }, [viewsQuery.data]);

  const fallbackListQuery = useMemo((): ListQuery | null => {
    if (listContext) return null;
    if (!fallbackViewId) return null;
    return { viewId: fallbackViewId, page: 1, perPage: FALLBACK_LIST_PAGE_SIZE };
  }, [fallbackViewId, listContext]);

  const fallbackList = useRecordList(
    moduleApiName,
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

  const timelineUserOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((user) => ({
        id: user.userId,
        label: user.name,
      })),
    [usersQuery.data],
  );

  const relatedLists = useMemo(() => {
    if (recordQuery.data && buildRelatedLists) return buildRelatedLists(recordQuery.data);
    return rules.relatedLists ?? [];
  }, [buildRelatedLists, recordQuery.data, rules.relatedLists]);
  const hasRelatedLists = relatedLists.length > 0;
  const relatedEntries = useMemo(() => {
    return relatedLists.map((item) => ({
      id: item.id,
      label: item.title,
      targetId: item.targetId,
      countBadge: item.countBadge,
      moduleKey: item.moduleKey,
      laterModule: item.moduleKey === "M2" ? undefined : item.moduleKey,
      railAction: item.railAction
        ? {
            id: item.railAction.id,
            label: item.railAction.label,
            moduleKey: item.railAction.moduleKey,
            laterModule: item.railAction.moduleKey === "M2" ? undefined : item.railAction.moduleKey,
            onAction: item.railAction.onAction,
          }
        : undefined,
    }));
  }, [relatedLists]);

  const loading =
    moduleQuery.isLoading ||
    recordQuery.isLoading ||
    usersQuery.isLoading ||
    (viewsQueryEnabled && viewsQuery.isLoading) ||
    (!listContext && fallbackListQuery !== null && fallbackList.isLoading && !fallbackList.data);

  if (loading) return <RecordLoadingShell definition={definition} />;

  if (recordQuery.isError) {
    if (recordQuery.error instanceof NotFoundError) return <RecordNotFound />;
    throw recordQuery.error;
  }
  if (moduleQuery.isError) throw moduleQuery.error;
  if (usersQuery.isError) throw usersQuery.error;
  if (viewsQueryEnabled && viewsQuery.isError) throw viewsQuery.error;
  if (!listContext && fallbackListQuery && fallbackList.isError) throw fallbackList.error;

  const module = moduleQuery.data;
  const record = recordQuery.data;
  if (!module || !record) return <RecordLoadingShell definition={definition} />;

  const orderedIds =
    listContext?.recordIds ?? fallbackList.data?.records.map((row) => row.id) ?? [];
  const backHref = listContext?.listHref ?? paths.defaultList(orgSlug, definition.tab);

  const { previousId, nextId } = recordNeighborsOnPage(orderedIds, recordId);

  const statusField = module.fields.find((field) => field.apiName === rules.statusRibbon?.field);
  const serverStatus =
    rules.statusRibbon?.readValue(record.fields[rules.statusRibbon.field]) ?? null;
  const displayStatus = statusOverride !== undefined ? statusOverride : serverStatus;
  const displayRecord = rules.statusRibbon
    ? { ...record, fields: { ...record.fields, [rules.statusRibbon.field]: displayStatus } }
    : record;
  const { title, subtitle, subtitleLaterModule, subtitleHref, portraitIcon } = rules.header(record);
  const lastUpdate = rules.lastUpdate(record, now, DEFAULT_FORMAT);
  const businessFields = rules.businessCard(module, displayRecord);
  const detailSections = rules.sections(module, displayRecord);

  function openDeleteDialog() {
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await deleteRecords.mutateAsync([recordId]);
      removeRecordFromListContext(orgSlug, moduleApiName, recordId);
      setDeleteOpen(false);
      router.push(backHref);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      setDeleteError(message);
      throw error;
    }
  }

  const moreMenuGroups = rules.moreOptions({
    onClone: () => router.push(paths.clone(orgSlug, definition.tab, recordId)),
    onDelete: openDeleteDialog,
    onFindMergeDuplicates: () => router.push(paths.merge(orgSlug, definition.tab, recordId)),
  });

  // Module rules supply the optional status ribbon after the update label.
  const overview = (
    <>
      {lastUpdate ? <LastUpdateLabel text={lastUpdate} /> : null}
      {statusField && StatusSection ? (
        <StatusSection
          module={moduleApiName}
          recordId={recordId}
          field={statusField}
          value={displayStatus}
          onValueChange={setStatusOverride}
        />
      ) : null}
      <InlineEditProvider
        key={recordId}
        eligible={rules.inlineEditable}
        users={(usersQuery.data ?? []).map((user) => ({
          id: user.userId,
          name: user.name,
          email: user.email,
        }))}
        save={async (input) => {
          await updateRecord.mutateAsync({ id: recordId, input });
          await recordQuery.refetch();
        }}
      >
        <BusinessCard fields={businessFields} ownerNames={ownerNames} format={DEFAULT_FORMAT} />
        {rules.linkedContactSummary && linkedContactSummaryPath ? (
          <AccountsLinkedContactSummary
            accountRecord={displayRecord}
            contactRecordPath={linkedContactSummaryPath}
          />
        ) : null}
        <DetailsCard
          sections={detailSections}
          ownerNames={ownerNames}
          format={DEFAULT_FORMAT}
          railLayout={railVisible ? "shown" : "hidden"}
        />
        {relatedLists.length > 0 ? (
          <RelatedCardsContainer
            relatedLists={relatedLists}
            orgSlug={orgSlug}
            managerRecord={record}
            recordPath={(id) => paths.record(orgSlug, definition.tab, id)}
            contactRecordPath={(id) => paths.record(orgSlug, "Contacts", id)}
          />
        ) : null}
      </InlineEditProvider>
    </>
  );

  const timeline = (
    <TimelineSurface subtabs={rules.timeline.subtabs} activeSubtabId="history">
      <TimelineHistory
        heading="Timeline History"
        filterButtonLabel="History filter"
        events={rules.timeline.events.map((event) => ({
          ...event,
          kind: rules.timeline.normalizeEventKind(event.kind),
        }))}
        format={DEFAULT_FORMAT}
        initialFilterExpanded={false}
        modulesLabel="Modules"
        modulesAllLabel="All Modules"
        moduleOptions={rules.timeline.modules}
        usersLabel="Users"
        usersAllLabel="All Users"
        userOptions={timelineUserOptions}
        timeLabel="Time"
        sourcesLabel="Sources"
        sourcesAllLabel="All Sources"
        sourceOptions={rules.timeline.sources}
        applyLabel="Apply Filter"
        onApply={() => {}}
        upcomingAutomatedActions={rules.timeline.upcomingAutomatedActions}
      />
    </TimelineSurface>
  );

  const railChrome = rules.relatedListRail;
  const relatedRailHeaderAction = hasRelatedLists ? (
    <Button
      variant="icon"
      size="compact"
      aria-label={railChrome?.organizeAriaLabel ?? "Organize Contacts Details"}
      laterModule="M11"
      className="size-6 text-text-muted hover:text-text"
    >
      <Icons.list aria-hidden className="size-4" />
    </Button>
  ) : undefined;

  const relatedRailFooter = hasRelatedLists ? (
    <div className="pt-2 border-t border-border mt-2 flex flex-col gap-1">
      <Link
        href="#add-related-list"
        variant="body"
        laterModule="M11"
        className="flex items-center h-(--size-menu-item-height) px-(--size-record-rail-text-inset) text-md font-normal text-primary hover:underline"
      >
        Add Related List
      </Link>
      {railChrome ? (
        <>
          <h3 className="px-(--size-record-rail-text-inset) pt-2 text-sm font-semibold text-text-muted">
            {railChrome.linksGroup.title}
          </h3>
          <Link
            href={`#${railChrome.linksGroup.addLink.id}`}
            variant="body"
            laterModule={railChrome.linksGroup.addLink.moduleKey}
            className="flex items-center h-(--size-menu-item-height) px-(--size-record-rail-text-inset) text-md font-normal text-primary hover:underline"
          >
            {railChrome.linksGroup.addLink.label}
          </Link>
        </>
      ) : null}
    </div>
  ) : undefined;

  return (
    <>
      {deleteOpen ? (
        <ConfirmDialog
          isOpen
          onOpenChange={(open) => {
            if (!open && !deleteRecords.isPending) setDeleteOpen(false);
          }}
          title={rules.deleteTitle}
          message={rules.deleteMessage}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          busy={deleteRecords.isPending}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
        />
      ) : null}
      <RecordPageFrame
        header={
          <RecordHeader
            title={title}
            subtitle={subtitle}
            subtitleLaterModule={subtitleLaterModule}
            subtitleHref={subtitleHref}
            portraitIcon={portraitIcon ?? rules.portraitIcon}
            addTags={rules.addTags}
            back={{ label: "Back", href: backHref }}
            commands={[
              ...(rules.headerCommands ?? []),
              {
                id: "edit",
                label: "Edit",
                variant: "secondary",
                href: paths.edit(orgSlug, definition.tab, recordId),
              },
            ]}
            menuGroups={moreMenuGroups}
            moreLabel="More Options"
            previousLabel="Previous Record"
            nextLabel="Next Record"
            previousHref={
              previousId ? paths.record(orgSlug, definition.tab, previousId) : undefined
            }
            nextHref={nextId ? paths.record(orgSlug, definition.tab, nextId) : undefined}
          />
        }
        relatedListLabel="Related List"
        relatedEntries={relatedEntries}
        selectedRelatedId={selectedRelatedId}
        onRelatedSelectionChange={setSelectedRelatedId}
        relatedRailHeaderAction={relatedRailHeaderAction}
        relatedRailFooter={relatedRailFooter}
        tabsLabel="Record detail"
        selectedTabId={selectedTabId}
        onTabChange={setSelectedTabId}
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "timeline", label: "Timeline", content: timeline },
        ]}
        relatedRailVisible={railVisible}
        railControl={
          <RecordRailToggle railVisible={railVisible} onRailVisibleChange={setRailVisible} />
        }
        scrollTopLabel="Scroll To Top"
      />
    </>
  );
}
