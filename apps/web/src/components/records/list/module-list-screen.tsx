"use client";

import { NotFoundError, ValidationError } from "@crm/core/errors";
import type {
  ActivityFilterValue,
  Criteria,
  FieldDefinition,
  ListResult,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  SortSpec,
} from "@crm/core/records";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { RecordBoard, type RecordBoardProps } from "@/components/records/board/record-board";
import { DeduplicateJob } from "@/components/records/deduplicate/dedup-job";
import { NotFoundMessage } from "@/components/shell/not-found-message";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ModuleKey } from "@/components/ui/later-module";
import type { MenuAction } from "@/components/ui/menu";
import {
  combineCriteriaAnd,
  firstLetterCriteria,
  panelFiltersToCriteria,
} from "@/lib/records/filter-criteria";
import type { AppliedFilter } from "@/lib/records/filter-operators";
import { ExportLauncher } from "../transfer/export-launcher";
import { ChangeOwnerDialog } from "./change-owner-dialog";
import type { FilterGroup } from "./filter-panel";
import { FilterPanel } from "./filter-panel";
import { ListToolbar } from "./list-toolbar";
import { MassUpdateDialog } from "./mass-update-dialog";
import { massUpdateFieldsInLayoutOrder } from "./mass-update-fields";
import { SelectionBar } from "./selection-bar";
import "./module-list-page.css";
import {
  useDeleteRecords,
  useModule,
  useRecordCount,
  useRecordList,
  useRefreshModuleListData,
  useUsers,
  useView,
  useViews,
} from "@/lib/api/client/hooks";
import { moduleDeduplicatePath, moduleImportPath, withSearchParams } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { usePreference } from "@/lib/preferences";
import {
  appliedSortFromState,
  LIST_PAGE_DEFAULT,
  LIST_PER_PAGE_DEFAULT,
  type ListPerPage,
  type ListSearchState,
  listQueryFromSearchState,
  parseListSearchParams,
  searchParamsFromListState,
} from "@/lib/records/list-search-params";
import { writeRecordListContext } from "@/lib/records/record-list-context";
import { resolveSortFieldLabels } from "@/lib/records/sort-fields";
import { RecordTable } from "./record-table";
import { ViewSettingsMenu } from "./view-settings-menu";
import { ViewTabStrip } from "./view-tab-strip";

export interface ModuleListPaths {
  defaultList: (orgSlug: string, module: ModuleApiName) => string;
  customList: (orgSlug: string, module: ModuleApiName, viewId: string) => string;
  record: (orgSlug: string, module: ModuleApiName, recordId: string) => string;
  create: (orgSlug: string, module: ModuleApiName) => string;
}

export interface ModuleListBoardProps {
  metadata: ModuleMetadata;
  orgSlug: string;
  ownerNames: Readonly<Record<string, string>>;
  viewId: string;
  filters?: Criteria;
  search?: string;
  sort?: SortSpec;
  perPage: number;
}

export interface ModuleListScreenConfig {
  module: ModuleApiName;
  defaultPresentation?: "table" | "board";
  board?: (input: {
    records: readonly RecordData[];
    metadata: ModuleMetadata;
    orgSlug: string;
    ownerNames: Readonly<Record<string, string>>;
  }) => RecordBoardProps;
  boardComponent?: React.ComponentType<ModuleListBoardProps>;
  boardToolbar?: ReactNode;
  linkField: string;
  pluralLabel: string;
  singularLabel: string;
  createLabel: string;
  filterTitle: string;
  filterGroups: readonly FilterGroup[];
  sortFieldLabels: readonly string[];
  linkFieldLabel: string;
  paths: ModuleListPaths;
  pinnedViews?: readonly string[];
  phoneLaterModule?: ModuleKey;
  linkWebsite?: boolean;
  /** ISO 4217 code for currency cells of the table; plain number when omitted. */
  cellCurrencyCode?: string;
  badgeColumn?: boolean;
  /** L-41 is visible in this module’s saved list evidence. */
  activityRibbon?: boolean;
  /** Interim: Search box in the view menu, filtering the view rows by name (Tasks). */
  viewMenuSearch?: boolean;
  /** View type tile ids to draw (see `ViewTypeSwitcher`); omitted draws all six. */
  viewTypeTileIds?: readonly string[];
  /** Measured Actions menu width in px (Activities rows 38-39). */
  actionsMenuWidth?: number;
  /** Activities-only list look (MEP-590 difference table); other modules keep the shared look. */
  listVariant?: "activities";
  /** Row hover tools in order (Activities rows 32-33); omitted draws ellipsis + note. */
  /** Meetings: draw the Related To module pictogram. */
  relatedToPictogram?: boolean;
  /** Boolean field marking all-day rows (date-only Start/End cells). */
  allDayField?: string;
  /** Row edit pencil links to the record edit page; leave off until the module has an edit form. */
  rowEditLink?: boolean;
  rowTools?: readonly ("edit" | "ellipsis" | "note")[];
  /** Screen inventory absent from field metadata; omitted for the original Leads screen. */
  inventory?: {
    actions: readonly Omit<MenuAction, "onAction">[];
    createItems?: readonly MenuAction[];
  };
  /**
   * Toolbar Actions menu of a screen that carries no other inventory, as the original Leads
   * list does; `inventory.actions` wins when both are given.
   */
  toolbarActions?: readonly Omit<MenuAction, "onAction">[];
  /** Create opens this dialog over the list instead of the create page (Meetings). */
  quickCreate?: (props: {
    orgSlug: string;
    currentUserId: string;
    onClose: () => void;
  }) => ReactNode;
}

const MAX_EXPORT_SELECTION = 500;
const TRANSFER_MODULES = ["Leads", "Contacts", "Accounts", "Deals"] as const;

function isTransferModule(module: string): module is (typeof TRANSFER_MODULES)[number] {
  return (TRANSFER_MODULES as readonly string[]).includes(module);
}

export interface ModuleListScreenProps {
  orgSlug: string;
  config: ModuleListScreenConfig;
  /** When omitted, the default view from `useViews` is used. */
  viewId?: string;
  /** The signed-in user; a quick-create dialog uses it as the default Host. */
  currentUserId?: string;
}

function ListNotFound() {
  return (
    <div className="p-6 text-md text-text">
      <NotFoundMessage />
    </div>
  );
}

export function ModuleListScreen({
  orgSlug,
  config,
  viewId: routeViewId,
  currentUserId,
}: ModuleListScreenProps) {
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
      currentUserId={currentUserId}
    />
  );
}

function ModuleListScreenLoaded({
  orgSlug,
  config,
  routeViewId,
  viewId,
  currentUserId,
}: ModuleListScreenProps & { routeViewId?: string; viewId: string }) {
  const router = useRouter();
  const refreshModuleListData = useRefreshModuleListData(config.module);
  const searchParams = useSearchParams();
  const [storedPerPage, setStoredPerPage] = usePreference("list.per-page", LIST_PER_PAGE_DEFAULT);
  const [wrapText, setWrapText] = usePreference(`list.wrap-text.${viewId}`, true);
  const searchState = useMemo(
    () => parseListSearchParams(searchParams, storedPerPage),
    [searchParams, storedPerPage],
  );
  const requestedPresentation = searchParams.get("presentation");
  const hasBoard = Boolean(config.board || config.boardComponent);
  const presentation = hasBoard
    ? requestedPresentation === "table" || requestedPresentation === "board"
      ? requestedPresentation
      : (config.defaultPresentation ?? "table")
    : "table";
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterSelection, setFilterSelection] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [appliedCriteria, setAppliedCriteria] = useState<Criteria | undefined>(undefined);
  const [appliedActivityFilter, setAppliedActivityFilter] = useState<ActivityFilterValue | null>(
    null,
  );
  const [letter, setLetter] = useState<string | null>(null);
  const [filterApplyError, setFilterApplyError] = useState<string | null>(null);
  const [acceptedListSnapshot, setAcceptedListSnapshot] = useState<{
    list: ListResult;
    total: number;
  } | null>(null);
  const priorViewId = useRef(viewId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [massUpdateOpen, setMassUpdateOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);
  const [dedupOpen, setDedupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelected, setExportSelected] = useState<string[] | undefined>(undefined);
  const deleteRecords = useDeleteRecords(config.module);

  const viewsQuery = useViews(config.module);
  const moduleQuery = useModule(config.module);
  const viewQuery = useView(config.module, viewId);
  const users = useUsers();
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

  useEffect(() => {
    if (priorViewId.current === viewId) return;
    priorViewId.current = viewId;
    setAppliedFilters([]);
    setAppliedCriteria(undefined);
    setAppliedActivityFilter(null);
    setLetter(null);
    setFilterSelection([]);
    setFilterApplyError(null);
    setSelectedIds([]);
    setAcceptedListSnapshot(null);
  }, [viewId]);

  /** Panel criteria and the header's first-letter choice restrict the list together (Interim). */
  const listCriteria = useMemo(
    () => combineCriteriaAnd([appliedCriteria, firstLetterCriteria(config.linkField, letter)]),
    [appliedCriteria, config.linkField, letter],
  );

  const listQuery = useMemo(() => {
    if (columnApiNames.length === 0) return null;
    // Row presentation may need a field that is not a visible column.
    const queryFields = config.allDayField
      ? [...new Set([...columnApiNames, config.allDayField])]
      : columnApiNames;
    const base = listQueryFromSearchState(viewId, queryFields, searchState, eligibleSortFields);
    return {
      ...base,
      ...(listCriteria ? { filters: listCriteria } : {}),
      ...(appliedActivityFilter ? { activityFilter: appliedActivityFilter } : {}),
      ...(config.activityRibbon ? { includeActivitySummary: true } : {}),
    };
  }, [
    appliedActivityFilter,
    columnApiNames,
    config.allDayField,
    config.activityRibbon,
    eligibleSortFields,
    listCriteria,
    searchState,
    viewId,
  ]);

  const countQuery = useMemo(
    () => ({
      viewId,
      ...(listCriteria ? { filters: listCriteria } : {}),
      ...(appliedActivityFilter ? { activityFilter: appliedActivityFilter } : {}),
    }),
    [appliedActivityFilter, listCriteria, viewId],
  );

  const list = useRecordList(
    config.module,
    listQuery ?? { viewId, page: 1, perPage: 30, fields: [] },
    { enabled: listQuery !== null },
  );
  const count = useRecordCount(config.module, countQuery);

  const listValidationError =
    list.isError && list.error instanceof ValidationError ? list.error : null;
  const countValidationError =
    count.isError && count.error instanceof ValidationError ? count.error : null;
  const hasFilterValidationError = Boolean(listValidationError || countValidationError);

  useEffect(() => {
    if (
      list.isSuccess &&
      !list.isPlaceholderData &&
      !list.isFetching &&
      count.isSuccess &&
      !count.isFetching &&
      list.data &&
      count.data !== undefined &&
      !hasFilterValidationError
    ) {
      setAcceptedListSnapshot({ list: list.data, total: count.data });
    }
  }, [
    count.data,
    count.isFetching,
    count.isSuccess,
    hasFilterValidationError,
    list.data,
    list.isFetching,
    list.isPlaceholderData,
    list.isSuccess,
  ]);

  const serverFilterMessage = useMemo(() => {
    const error = listValidationError ?? countValidationError;
    if (!error) return null;
    const messages = error.fieldErrors.filters ?? error.fieldErrors.activityFilter;
    return messages?.[0] ?? error.message;
  }, [countValidationError, listValidationError]);

  useEffect(() => {
    if (serverFilterMessage) setFilterApplyError(serverFilterMessage);
  }, [serverFilterMessage]);

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of users.data ?? []) map[member.userId] = member.name;
    return map;
  }, [users.data]);

  const columns = useMemo((): FieldDefinition[] => {
    const byName = new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field]));
    return columnApiNames
      .map(
        (apiName) =>
          byName.get(apiName) ??
          (config.inventory
            ? {
                apiName,
                label: apiName,
                dataType: "text" as const,
                required: false,
                readOnly: true,
                unique: false,
                massUpdate: false,
                views: { view: true, create: false, edit: false, quickCreate: false },
              }
            : undefined),
      )
      .filter((field): field is FieldDefinition => field !== undefined);
  }, [columnApiNames, config.inventory, moduleQuery.data?.fields]);

  const massUpdateFields = useMemo(
    () => (moduleQuery.data ? massUpdateFieldsInLayoutOrder(moduleQuery.data) : []),
    [moduleQuery.data],
  );

  const ownerField = useMemo(
    () => moduleQuery.data?.fields.find((field) => field.dataType === "ownerlookup") ?? null,
    [moduleQuery.data?.fields],
  );

  const ownerOptions = useMemo(
    () =>
      (users.data ?? []).map((member) => ({
        id: member.userId,
        name: member.name,
        email: member.email,
      })),
    [users.data],
  );

  const listBasePath = useMemo(() => {
    if (routeViewId) return config.paths.customList(orgSlug, config.module, routeViewId);
    return config.paths.defaultList(orgSlug, config.module);
  }, [config.module, config.paths, orgSlug, routeViewId]);

  const listHrefForContext = useMemo(() => {
    if (!listBasePath) return null;
    const params = searchParamsFromListState(searchState);
    if (hasBoard && requestedPresentation) params.set("presentation", presentation);
    return withSearchParams(listBasePath, params);
  }, [listBasePath, searchState, hasBoard, requestedPresentation, presentation]);

  useEffect(() => {
    const pageData = list.data;
    if (!listQuery || !pageData || !listHrefForContext || list.isPlaceholderData) return;
    writeRecordListContext(orgSlug, {
      module: config.module,
      viewId,
      listHref: listHrefForContext,
      page: pageData.page,
      perPage: pageData.perPage,
      recordIds: pageData.records.map((record) => record.id),
    });
  }, [
    config.module,
    list.data,
    list.isPlaceholderData,
    listHrefForContext,
    listQuery,
    orgSlug,
    viewId,
  ]);

  function navigate(next: ListSearchState) {
    if (!listBasePath) return;
    const params = searchParamsFromListState(next);
    if (hasBoard && requestedPresentation) params.set("presentation", presentation);
    const href = withSearchParams(listBasePath, params);
    router.push(href);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when list context changes
  useEffect(() => {
    setSelectedIds([]);
  }, [
    viewId,
    searchState.page,
    searchState.perPage,
    searchState.sortBy,
    searchState.sortOrder,
    filterSelection,
  ]);

  /** A page-size choice is stored as a preference and applied to the address from page 1. */
  function changePerPage(next: ListPerPage) {
    setStoredPerPage(next);
    navigate({ ...searchState, page: LIST_PAGE_DEFAULT, perPage: next });
  }

  /**
   * Column header options write the same address keys as the Sort popover's Apply, and start
   * the new sort on page 1. The Sort popover keeps the open page (MEP-77 behaviour).
   */
  function applyColumnSort(next: SortSpec) {
    navigate({
      ...searchState,
      page: LIST_PAGE_DEFAULT,
      sortBy: next.field,
      sortOrder: next.order,
    });
  }

  function refreshView() {
    setSelectedIds([]);
    refreshModuleListData();
  }

  function applyPanelFilters(
    applied: AppliedFilter[],
    activityFilter?: ActivityFilterValue | null,
  ) {
    const inputs = applied.map((row) => ({
      field: row.itemId,
      operatorId: row.operatorId,
      value: row.value,
      daysUnit: row.daysUnit,
    }));
    setFilterApplyError(null);
    setAppliedFilters(applied);
    setAppliedCriteria(panelFiltersToCriteria(inputs));
    setAppliedActivityFilter(activityFilter ?? null);
    setSelectedIds([]);
    if (searchState.page !== LIST_PAGE_DEFAULT) {
      navigate({ ...searchState, page: LIST_PAGE_DEFAULT });
    }
  }

  function clearPanelFilters() {
    setAppliedFilters([]);
    setAppliedCriteria(undefined);
    setAppliedActivityFilter(null);
    setFilterApplyError(null);
    setSelectedIds([]);
    if (searchState.page !== LIST_PAGE_DEFAULT) {
      navigate({ ...searchState, page: LIST_PAGE_DEFAULT });
    }
  }

  function handleFilterSelectionChange(next: string[]) {
    setFilterSelection(next);
    if (next.length === 0 && (appliedCriteria !== undefined || appliedActivityFilter !== null)) {
      clearPanelFilters();
    }
  }

  function handleFilterClear() {
    if (appliedCriteria === undefined && appliedActivityFilter === null) {
      clearPanelFilters();
    }
  }

  /**
   * The header's letter choice is a criterion of its own; the panel keeps what it applied.
   * A new choice starts on page 1 and drops row selection, like applying a panel filter.
   */
  function applyLetter(letterChoice: string | null) {
    setLetter(letterChoice);
    setSelectedIds([]);
    if (searchState.page !== LIST_PAGE_DEFAULT) {
      navigate({ ...searchState, page: LIST_PAGE_DEFAULT });
    }
  }

  function clearSelection() {
    setSelectedIds([]);
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
  if (list.isError && !listValidationError) throw list.error;
  if (count.isError && count.error instanceof NotFoundError) {
    return <ListNotFound />;
  }
  if (count.isError && !countValidationError) throw count.error;
  if (users.isError) throw users.error;
  if (moduleQuery.isError) throw moduleQuery.error;

  const listSettled = list.isSuccess && !list.isPlaceholderData && !list.isFetching;
  const countSettled = count.isSuccess && !count.isFetching;
  const hasActiveFilter = listCriteria !== undefined || appliedActivityFilter !== null;
  const awaitingFilteredPair =
    hasActiveFilter && !(listSettled && countSettled && !hasFilterValidationError);
  const useAcceptedSnapshot =
    acceptedListSnapshot !== null && (hasFilterValidationError || awaitingFilteredPair);

  const listPage = useAcceptedSnapshot ? acceptedListSnapshot.list : (list.data ?? null);

  if (initialLoading || !view || !listQuery || !listPage) {
    return <div className="module-list-page" aria-hidden="true" />;
  }

  const records = listPage.records;
  const total = useAcceptedSnapshot ? acceptedListSnapshot.total : (count.data ?? null);
  const moreRecords = listPage.moreRecords;
  const page = listPage.page;
  const perPage = listPage.perPage;

  const pageRecordIds = new Set(records.map((record) => record.id));
  const pageSelectedIds = selectedIds.filter((id) => pageRecordIds.has(id));
  const selectionActive = pageSelectedIds.length > 0;

  function openDeleteDialog() {
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    const ids = [...pageSelectedIds];
    if (ids.length === 0) return;
    setDeleteError(null);
    try {
      await deleteRecords.mutateAsync(ids);
      setDeleteOpen(false);
      const deletedAllOnPage = ids.length === records.length;
      clearSelection();
      if (deletedAllOnPage && page > 1) {
        navigate({ ...searchState, page: page - 1 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      setDeleteError(message);
      throw error;
    }
  }

  function openToolbarAction(action: string) {
    // The module-wide cleanup works on the whole module, so it never needs a row selection.
    if (action === "deduplicate") {
      setDedupOpen(true);
      return;
    }
    if (action === "export" && transferModule) {
      setExportSelected(undefined);
      setExportOpen(true);
      return;
    }
    openSelectedMassAction(action);
  }

  function openSelectedMassAction(action: string) {
    if (!["mass-transfer", "mass-update", "mass-delete"].includes(action)) return;
    if (!selectionActive) return;
    if (action === "mass-transfer") setChangeOwnerOpen(true);
    if (action === "mass-update") setMassUpdateOpen(true);
    if (action === "mass-delete") openDeleteDialog();
  }

  const deleteTitle =
    pageSelectedIds.length === 1
      ? `Delete ${config.singularLabel}`
      : `Delete ${config.pluralLabel}`;
  const deleteMessage =
    pageSelectedIds.length === 1
      ? `Are you sure you want to delete the selected ${config.singularLabel}?`
      : `Are you sure you want to delete the ${pageSelectedIds.length} selected ${config.pluralLabel}?`;

  const previousState: ListSearchState = { ...searchState, page: Math.max(1, page - 1) };
  const nextState: ListSearchState = { ...searchState, page: page + 1 };

  const previousParams = searchParamsFromListState(previousState);
  const nextParams = searchParamsFromListState(nextState);
  if (hasBoard && requestedPresentation) {
    previousParams.set("presentation", presentation);
    nextParams.set("presentation", presentation);
  }
  const boardProps =
    presentation === "board" && config.board && moduleQuery.data
      ? config.board({ records, metadata: moduleQuery.data, orgSlug, ownerNames })
      : null;
  const previousHref =
    page > 1 && listBasePath ? withSearchParams(listBasePath, previousParams) : null;
  const nextHref = moreRecords && listBasePath ? withSearchParams(listBasePath, nextParams) : null;

  const inert = () => {};
  const toolbarActions = config.inventory?.actions ?? config.toolbarActions;
  const transferModule = isTransferModule(config.module) ? config.module : null;
  const exportSelectedTooLarge = pageSelectedIds.length > MAX_EXPORT_SELECTION;
  const createItems: readonly MenuAction[] | undefined = transferModule
    ? [
        {
          id: "import",
          label: `Import ${config.pluralLabel}`,
          onAction: () => router.push(moduleImportPath(orgSlug, config.module)),
        },
        ...(config.inventory?.createItems ?? []).filter((item) => item.id !== "import"),
      ]
    : config.inventory?.createItems;
  const selectionActions: MenuAction[] = [
    { id: "run-macro", label: "Run Macro", onAction: inert },
    { id: "create-task", label: "Create Task", onAction: inert },
    {
      id: "change-owner",
      label: "Change Owner",
      onAction: ownerField ? () => setChangeOwnerOpen(true) : inert,
    },
    { id: "cadences", label: "Cadences", onAction: inert },
    { id: "add-to-campaigns", label: "Add to Campaigns", onAction: inert },
    { id: "print-mailing-labels", label: "Print Mailing Labels", onAction: inert },
    { id: "print-using-canvas", label: "Print Using Canvas", onAction: inert },
    { id: "mail-merge", label: "Mail Merge", onAction: inert },
    { id: "mass-convert", label: "Mass Convert", onAction: inert },
    { id: "delete", label: "Delete", onAction: openDeleteDialog },
    {
      id: "export-selected",
      label: exportSelectedTooLarge
        ? `Export Selected Records (max ${MAX_EXPORT_SELECTION})`
        : "Export Selected Records",
      isDisabled: exportSelectedTooLarge,
      onAction: transferModule
        ? () => {
            setExportSelected([...pageSelectedIds]);
            setExportOpen(true);
          }
        : inert,
    },
  ];

  return (
    <div
      className="module-list-page"
      data-list-variant={config.listVariant}
      data-list-module={config.listVariant ? config.module : undefined}
    >
      <ViewTabStrip
        viewName={view.name}
        views={config.inventory ? viewsQuery.data : undefined}
        pinnedViews={config.pinnedViews}
        searchable={config.viewMenuSearch}
        onViewChange={(id) => {
          const params = new URLSearchParams();
          if (hasBoard && requestedPresentation) params.set("presentation", presentation);
          router.push(
            withSearchParams(config.paths.customList(orgSlug, config.module, id), params),
          );
        }}
      />
      {selectionActive && presentation === "table" ? (
        <SelectionBar
          laterInventory={Boolean(config.inventory)}
          selectedCount={pageSelectedIds.length}
          onClear={clearSelection}
          onMassUpdate={massUpdateFields.length > 0 ? () => setMassUpdateOpen(true) : undefined}
          actions={selectionActions}
        />
      ) : (
        <ListToolbar
          viewTypeTileIds={config.viewTypeTileIds}
          actionsMenuWidth={config.actionsMenuWidth}
          presentation={hasBoard ? presentation : undefined}
          onPresentationChange={
            hasBoard
              ? (next) => {
                  const params = searchParamsFromListState(searchState);
                  params.set("presentation", next);
                  setSelectedIds([]);
                  router.push(withSearchParams(listBasePath, params));
                }
              : undefined
          }
          filterOpen={filterOpen}
          onFilterChange={(open) => {
            const activeIds = appliedFilters.map((filter) => filter.itemId);
            if (appliedActivityFilter) activeIds.push("Activities");
            setFilterSelection(activeIds);
            setFilterOpen(open);
          }}
          onRefresh={presentation === "board" ? undefined : refreshView}
          fields={sortFields}
          sort={appliedSort}
          onSortApply={(next: SortSpec | null) => {
            navigate({
              ...searchState,
              sortBy: next?.field ?? null,
              sortOrder: next?.order ?? null,
            });
          }}
          actions={toolbarActions?.map((item) => ({
            ...item,
            onAction: () => openToolbarAction(item.id),
          }))}
          create={{
            label: config.createLabel,
            href: config.quickCreate ? undefined : config.paths.create(orgSlug, config.module),
            onPress: config.quickCreate ? () => setQuickCreateOpen(true) : undefined,
            items: createItems,
            moreLaterModule: config.inventory && !transferModule ? "M6" : undefined,
          }}
        />
      )}
      {presentation === "board" && (config.boardToolbar || boardProps?.toolbar) ? (
        <div className="module-list-board-toolbar">
          {config.boardToolbar ?? boardProps?.toolbar}
        </div>
      ) : null}
      {quickCreateOpen
        ? config.quickCreate?.({
            orgSlug,
            currentUserId: currentUserId ?? "",
            onClose: () => setQuickCreateOpen(false),
          })
        : null}
      {massUpdateOpen && massUpdateFields.length > 0 ? (
        <MassUpdateDialog
          isOpen
          onOpenChange={setMassUpdateOpen}
          module={config.module}
          recordIds={pageSelectedIds}
          fields={massUpdateFields}
          users={ownerOptions}
          onSuccess={clearSelection}
        />
      ) : null}
      {changeOwnerOpen && ownerField ? (
        <ChangeOwnerDialog
          isOpen
          onOpenChange={setChangeOwnerOpen}
          module={config.module}
          recordIds={pageSelectedIds}
          ownerField={ownerField}
          users={ownerOptions}
          onSuccess={clearSelection}
        />
      ) : null}
      {transferModule ? (
        <ExportLauncher
          key={exportSelected ? "selected" : "view"}
          module={transferModule}
          moduleLabel={config.pluralLabel}
          viewId={viewId}
          selectedIds={exportSelected}
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
      ) : null}
      {dedupOpen && moduleQuery.data ? (
        <DeduplicateJob
          module={config.module}
          pluralLabel={config.pluralLabel}
          fields={moduleQuery.data.fields}
          conflictGroupsHref={(fields) => moduleDeduplicatePath(orgSlug, config.module, fields)}
          onClose={() => setDedupOpen(false)}
        />
      ) : null}
      {deleteOpen ? (
        <ConfirmDialog
          isOpen
          onOpenChange={(open) => {
            if (!open && !deleteRecords.isPending) setDeleteOpen(false);
          }}
          title={deleteTitle}
          message={deleteMessage}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          busy={deleteRecords.isPending}
          errorMessage={deleteError}
          onConfirm={confirmDelete}
        />
      ) : null}
      <div className="module-list-body">
        {filterOpen ? (
          <FilterPanel
            key={viewId}
            title={config.filterTitle}
            searchLabel="Search filter choices"
            searchPlaceholder="Search"
            groups={config.filterGroups}
            initialFilters={appliedFilters}
            initialActivityFilter={appliedActivityFilter}
            selectedIds={filterSelection}
            onSelectionChange={handleFilterSelectionChange}
            applyErrorMessage={filterApplyError}
            onApply={applyPanelFilters}
            onClear={handleFilterClear}
          />
        ) : null}
        <div className="module-list-table-host">
          {presentation === "board" && config.boardComponent && moduleQuery.data ? (
            <config.boardComponent
              metadata={moduleQuery.data}
              orgSlug={orgSlug}
              ownerNames={ownerNames}
              viewId={viewId}
              filters={listCriteria}
              search={searchParams.get("search") ?? undefined}
              sort={appliedSort ?? undefined}
              perPage={searchState.perPage}
            />
          ) : boardProps ? (
            <RecordBoard {...boardProps} toolbar={undefined} />
          ) : (
            <RecordTable
              laterInventory={Boolean(config.inventory)}
              badgeColumn={config.badgeColumn}
              activitySummaries={config.activityRibbon ? listPage.activitySummaries : undefined}
              phoneLaterModule={config.phoneLaterModule}
              linkWebsite={config.linkWebsite}
              currencyCode={config.cellCurrencyCode}
              numericDates={config.listVariant === "activities"}
              rowTools={config.rowTools}
              relatedToPictogram={config.relatedToPictogram}
              allDayField={config.allDayField}
              rowEditHref={
                config.rowEditLink
                  ? (record) => `${config.paths.record(orgSlug, config.module, record.id)}/edit`
                  : undefined
              }
              columns={columns}
              records={records}
              linkField={config.linkField}
              linkFieldLabel={config.linkFieldLabel}
              rowHref={(record) => config.paths.record(orgSlug, config.module, record.id)}
              selectedIds={pageSelectedIds}
              onSelectedIdsChange={(ids) => {
                const allowed = new Set(records.map((record) => record.id));
                setSelectedIds([...ids].filter((id) => allowed.has(id)));
              }}
              sortableFields={eligibleSortFields}
              onSortChange={applyColumnSort}
              alphabet={{ value: letter, onChange: applyLetter }}
              wrapText={wrapText}
              emptyMessage={emptyMessage}
              settings={
                <ViewSettingsMenu
                  laterModule={config.inventory ? "M11" : undefined}
                  perPage={searchState.perPage}
                  onPerPageChange={changePerPage}
                  wrapText={wrapText}
                  onWrapTextChange={setWrapText}
                />
              }
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
          )}
        </div>
      </div>
    </div>
  );
}
