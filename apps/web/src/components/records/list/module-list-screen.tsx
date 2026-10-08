"use client";

import { NotFoundError } from "@crm/core/errors";
import type { FieldDefinition, ModuleApiName, SortSpec } from "@crm/core/records";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { FilterGroup } from "./filter-panel";
import { FilterPanel } from "./filter-panel";
import { ListToolbar } from "./list-toolbar";
import "./module-list-page.css";
import {
  useModule,
  useRecordCount,
  useRecordList,
  useRefreshModuleListData,
  useUsers,
  useView,
  useViews,
} from "@/lib/api/client/hooks";
import { withSearchParams } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import {
  appliedSortFromState,
  type ListSearchState,
  listQueryFromSearchState,
  parseListSearchParams,
  searchParamsFromListState,
} from "@/lib/records/list-search-params";
import { resolveSortFieldLabels } from "@/lib/records/sort-fields";
import { RecordTable } from "./record-table";
import { ViewTabStrip } from "./view-tab-strip";

export interface ModuleListPaths {
  defaultList: (orgSlug: string, module: ModuleApiName) => string;
  customList: (orgSlug: string, module: ModuleApiName, viewId: string) => string;
  record: (orgSlug: string, module: ModuleApiName, recordId: string) => string;
  create: (orgSlug: string, module: ModuleApiName) => string;
}

export interface ModuleListScreenConfig {
  module: ModuleApiName;
  linkField: string;
  pluralLabel: string;
  createLabel: string;
  filterTitle: string;
  filterGroups: readonly FilterGroup[];
  sortFieldLabels: readonly string[];
  linkFieldLabel: string;
  paths: ModuleListPaths;
}

export interface ModuleListScreenProps {
  orgSlug: string;
  config: ModuleListScreenConfig;
  /** When omitted, the default view from `useViews` is used. */
  viewId?: string;
}

function ListNotFound() {
  return (
    <div className="p-6 text-md text-text">
      <p>The requested page could not be found.</p>
    </div>
  );
}

export function ModuleListScreen({ orgSlug, config, viewId: routeViewId }: ModuleListScreenProps) {
  const viewsQuery = useViews(config.module);
  const resolvedViewId = useMemo(() => {
    if (routeViewId) return routeViewId;
    return viewsQuery.data?.find((view) => view.isDefault)?.id ?? null;
  }, [routeViewId, viewsQuery.data]);

  if (viewsQuery.isError) throw viewsQuery.error;
  if (viewsQuery.isLoading) {
    return <div className="module-list-page" aria-hidden="true" />;
  }
  if (!resolvedViewId) {
    return <ListNotFound />;
  }

  return (
    <ModuleListScreenLoaded
      orgSlug={orgSlug}
      config={config}
      routeViewId={routeViewId}
      viewId={resolvedViewId}
    />
  );
}

function ModuleListScreenLoaded({
  orgSlug,
  config,
  routeViewId,
  viewId,
}: ModuleListScreenProps & { routeViewId?: string; viewId: string }) {
  const router = useRouter();
  const refreshModuleListData = useRefreshModuleListData(config.module);
  const searchParams = useSearchParams();
  const searchState = useMemo(() => parseListSearchParams(searchParams), [searchParams]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterSelection, setFilterSelection] = useState<string[]>([]);

  const moduleQuery = useModule(config.module);
  const viewQuery = useView(config.module, viewId);
  const view = viewQuery.data;

  const columnApiNames = view?.columns ?? [];
  const sortFields = useMemo(
    () => resolveSortFieldLabels(config, moduleQuery.data?.fields ?? []),
    [config, moduleQuery.data?.fields],
  );
  const eligibleSortFields = useMemo(
    () => new Set(sortFields.map((field) => field.apiName)),
    [sortFields],
  );

  const listQuery = useMemo(() => {
    if (columnApiNames.length === 0) return null;
    return listQueryFromSearchState(viewId, columnApiNames, searchState, eligibleSortFields);
  }, [columnApiNames, eligibleSortFields, searchState, viewId]);

  const list = useRecordList(
    config.module,
    listQuery ?? { viewId, page: 1, perPage: 30, fields: [] },
    { enabled: listQuery !== null },
  );
  const count = useRecordCount(config.module, { viewId });
  const users = useUsers();

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of users.data ?? []) map[member.userId] = member.name;
    return map;
  }, [users.data]);

  const columns = useMemo((): FieldDefinition[] => {
    const byName = new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field]));
    return columnApiNames
      .map((apiName) => byName.get(apiName))
      .filter((field): field is FieldDefinition => field !== undefined);
  }, [columnApiNames, moduleQuery.data?.fields]);

  const listBasePath = useMemo(() => {
    if (routeViewId) return config.paths.customList(orgSlug, config.module, routeViewId);
    return config.paths.defaultList(orgSlug, config.module);
  }, [config.module, config.paths, orgSlug, routeViewId]);

  function navigate(next: ListSearchState) {
    if (!listBasePath) return;
    const href = withSearchParams(listBasePath, searchParamsFromListState(next));
    router.push(href);
  }

  function refreshView() {
    refreshModuleListData();
  }

  const appliedSort = appliedSortFromState(searchState, eligibleSortFields);
  const emptyMessage = `No ${config.pluralLabel} found.`;
  const initialLoading =
    moduleQuery.isLoading ||
    (viewQuery.isLoading && !view) ||
    (listQuery !== null && list.isLoading && !list.data);

  if (viewQuery.isError && viewQuery.error instanceof NotFoundError) {
    return <ListNotFound />;
  }
  if (viewQuery.isError && !(viewQuery.error instanceof NotFoundError)) {
    throw viewQuery.error;
  }
  if (list.isError && list.error instanceof NotFoundError) {
    return <ListNotFound />;
  }
  if (list.isError) throw list.error;
  if (count.isError && count.error instanceof NotFoundError) {
    return <ListNotFound />;
  }
  if (count.isError) throw count.error;
  if (users.isError) throw users.error;
  if (moduleQuery.isError) throw moduleQuery.error;

  if (initialLoading || !view || !listQuery || !list.data) {
    return <div className="module-list-page" aria-hidden="true" />;
  }

  const records = list.data.records;
  const total = count.data ?? null;
  const moreRecords = list.data.moreRecords;
  const page = list.data.page;
  const perPage = list.data.perPage;

  const previousState: ListSearchState = { ...searchState, page: Math.max(1, page - 1) };
  const nextState: ListSearchState = { ...searchState, page: page + 1 };

  const previousHref =
    page > 1 && listBasePath
      ? withSearchParams(listBasePath, searchParamsFromListState(previousState))
      : null;
  const nextHref =
    moreRecords && listBasePath
      ? withSearchParams(listBasePath, searchParamsFromListState(nextState))
      : null;

  return (
    <div className="module-list-page">
      <ViewTabStrip viewName={view.name} />
      <ListToolbar
        filterOpen={filterOpen}
        onFilterChange={setFilterOpen}
        onRefresh={refreshView}
        fields={sortFields}
        sort={appliedSort}
        onSortApply={(next: SortSpec) => {
          navigate({
            ...searchState,
            sortBy: next.field,
            sortOrder: next.order,
          });
        }}
        create={{
          label: config.createLabel,
          href: config.paths.create(orgSlug, config.module),
        }}
      />
      <div className="module-list-body">
        {filterOpen ? (
          <FilterPanel
            title={config.filterTitle}
            searchLabel="Search filter choices"
            searchPlaceholder="Search"
            groups={config.filterGroups}
            selectedIds={filterSelection}
            onSelectionChange={setFilterSelection}
          />
        ) : null}
        <div className="module-list-table-host">
          <RecordTable
            columns={columns}
            records={records}
            linkField={config.linkField}
            rowHref={(record) => config.paths.record(orgSlug, config.module, record.id)}
            selectedIds={selectedIds}
            onSelectedIdsChange={(ids) => setSelectedIds([...ids])}
            wrapText
            emptyMessage={emptyMessage}
            ownerNames={ownerNames}
            format={DEFAULT_FORMAT}
            footer={{
              total,
              page,
              pageSize: perPage,
              recordCount: records.length,
              moreRecords,
              previousHref,
              nextHref,
            }}
          />
        </div>
      </div>
    </div>
  );
}
