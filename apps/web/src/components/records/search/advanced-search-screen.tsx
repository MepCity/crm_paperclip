"use client";

import type { Criteria, ModuleApiName, SearchGroup, SortSpec } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FilterDraft } from "@/components/records/list/filter-editor";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { useModule, useUsers, useView, useViews } from "@/lib/api/client/hooks";
import { useClientRecordService, useOrgSlug } from "@/lib/api/client/provider";
import { moduleScreens, resolveModuleScreenByApiName } from "@/modules/registry";
import type { ModuleScreenDefinition } from "@/modules/types";
import { AdvancedSearchCard, NotesSearchCard } from "./advanced-search-card";
import { AdvancedSearchFilterPanel } from "./advanced-search-filter-panel";
import {
  DEFAULT_PAGE_SIZE,
  getDocumentedModuleFilterItems,
  SORT_OPTIONS,
  SYSTEM_FILTER_FIELDS,
} from "./constants";
import { ManageColumnsDialog } from "./manage-columns-dialog";

export interface AdvancedSearchScreenProps {
  initialQuery?: string;
  initialModule?: string;
  moduleDefinitions?: readonly ModuleScreenDefinition[];
}

/** Preload module metadata and view list in parallel from screen mount. */
function ModulePrefetcher({ module }: { module: ModuleApiName }) {
  useModule(module);
  useViews(module);
  return null;
}

interface AdvancedSearchModuleCardProps {
  module: ModuleApiName;
  moduleLabel: string;
  definition?: ModuleScreenDefinition;
  total: number;
  records: SearchGroup["records"];
  page: number;
  perPage: number;
  selectedColumns?: readonly string[];
  onColumnsChange: (columns: string[]) => void;
  ownerNames: Readonly<Record<string, string>>;
  onPageChange: (newPage: number) => void;
  orgSlug: string;
}

function AdvancedSearchModuleCard({
  module,
  moduleLabel,
  definition,
  total,
  records,
  page,
  perPage,
  selectedColumns,
  onColumnsChange,
  ownerNames,
  onPageChange,
  orgSlug,
}: AdvancedSearchModuleCardProps) {
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);

  const moduleData = useModule(module);
  const viewsData = useViews(module);

  const defaultViewId =
    viewsData.data?.find((v) => v.isDefault)?.id ?? viewsData.data?.[0]?.id ?? "";
  const defaultView = useView(module, defaultViewId);
  const viewColumns = defaultView.data?.columns;

  const allFields = moduleData.data?.fields ?? [];
  const fieldsByApiName = useMemo(() => {
    return Object.fromEntries(allFields.map((f) => [f.apiName, f]));
  }, [allFields]);

  const defaultColumns = useMemo(() => {
    if (viewColumns && viewColumns.length > 0) {
      return viewColumns.slice(0, 5);
    }
    if (definition?.searchColumns && definition.searchColumns.length > 0) {
      return definition.searchColumns.slice(0, 5);
    }
    if (allFields.length > 0) {
      const linkField = definition?.list?.linkField;
      const names = allFields.map((f) => f.apiName);
      if (linkField && names.includes(linkField)) {
        return [linkField, ...names.filter((n) => n !== linkField)].slice(0, 5);
      }
      return names.slice(0, 5);
    }
    const linkField = definition?.list?.linkField;
    return linkField ? [linkField] : [];
  }, [viewColumns, definition?.searchColumns, definition?.list?.linkField, allFields]);

  const activeColumns = selectedColumns ?? defaultColumns;

  return (
    <>
      <AdvancedSearchCard
        module={module}
        moduleLabel={moduleLabel}
        definition={definition}
        total={total}
        records={records}
        page={page}
        perPage={perPage}
        columns={activeColumns}
        fieldsByApiName={fieldsByApiName}
        ownerNames={ownerNames}
        onPageChange={onPageChange}
        onOpenManageColumns={() => setIsManageColumnsOpen(true)}
        orgSlug={orgSlug}
      />
      {isManageColumnsOpen && (
        <ManageColumnsDialog
          isOpen={true}
          onClose={() => setIsManageColumnsOpen(false)}
          moduleLabel={moduleLabel}
          allFields={allFields}
          selectedColumns={activeColumns}
          onSave={onColumnsChange}
        />
      )}
    </>
  );
}

export function AdvancedSearchScreen({
  initialQuery = "",
  initialModule,
  moduleDefinitions = moduleScreens,
}: AdvancedSearchScreenProps) {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();

  const documentedItems = useMemo(
    () => getDocumentedModuleFilterItems(moduleDefinitions),
    [moduleDefinitions],
  );

  const registeredModules = useMemo(
    () => documentedItems.filter((item) => item.isRegistered).map((item) => item.moduleApiName),
    [documentedItems],
  );

  const [queryText, setQueryText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSortId, setSelectedSortId] = useState<string>("Modified_Time");

  // Selected modules in filter
  const [appliedModules, setAppliedModules] = useState<ModuleApiName[]>(() => {
    if (initialModule && registeredModules.includes(initialModule)) {
      return [initialModule];
    }
    return [...registeredModules];
  });

  // Applied field criteria
  const [appliedCriteria, setAppliedCriteria] = useState<Criteria | undefined>(undefined);
  const [appliedFilterNames, setAppliedFilterNames] = useState<string[]>([]);
  const [appliedSelectedFields, setAppliedSelectedFields] = useState<string[]>([]);
  const [appliedDrafts, setAppliedDrafts] = useState<Record<string, FilterDraft>>({});

  // Card pagination: module -> page
  const [cardPages, setCardPages] = useState<Record<string, number>>({});

  // Search results
  const [searchGroups, setSearchGroups] = useState<readonly SearchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<unknown | null>(null);

  // Request generation trackers
  const searchRequestIdRef = useRef(0);
  const cardPageRequestIdRef = useRef<Record<string, number>>({});

  const users = useUsers();

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of users.data ?? []) {
      map[member.userId] = member.name;
    }
    return map;
  }, [users.data]);

  // Selected columns per module card (temporary, per page session)
  const [moduleColumns, setModuleColumns] = useState<Record<string, string[]>>({});

  const activeSortSpec: SortSpec = useMemo(() => {
    const found = SORT_OPTIONS.find((opt) => opt.id === selectedSortId);
    return found ? found.sort : { field: "Modified_Time", order: "desc" };
  }, [selectedSortId]);

  // Perform search
  const performSearch = useCallback(
    async (
      text: string,
      modules: ModuleApiName[],
      criteria?: Criteria,
      sortSpec: SortSpec = activeSortSpec,
    ) => {
      const requestId = ++searchRequestIdRef.current;
      const trimmed = text.trim();
      if (trimmed.length < 3) {
        setSearchGroups([]);
        setIsLoading(false);
        setSearchError(null);
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      try {
        const results = await service.search({
          text: trimmed,
          modules: modules,
          filters: criteria,
          sort: sortSpec,
          perPage: DEFAULT_PAGE_SIZE,
          page: 1,
        });
        if (searchRequestIdRef.current !== requestId) {
          return;
        }
        setSearchGroups(results);
        // Reset card pages to 1
        setCardPages({});
        setIsLoading(false);
      } catch (err) {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }
        setSearchError(err);
        setSearchGroups([]);
        setIsLoading(false);
      }
    },
    [service, activeSortSpec],
  );

  // Trigger search on mount if initial query >= 3
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialQuery.trim().length >= 3) {
        void performSearch(initialQuery, appliedModules, appliedCriteria, activeSortSpec);
      }
    }
  }, [initialQuery, appliedModules, appliedCriteria, activeSortSpec, performSearch]);

  // Single card page change
  async function handleCardPageChange(module: ModuleApiName, newPage: number) {
    const trimmed = submittedQuery.trim();
    if (trimmed.length < 3) return;

    const baseSearchId = searchRequestIdRef.current;
    const pageRequestId = (cardPageRequestIdRef.current[module] ?? 0) + 1;
    cardPageRequestIdRef.current[module] = pageRequestId;

    try {
      const results = await service.search({
        text: trimmed,
        modules: [module],
        filters: appliedCriteria,
        sort: activeSortSpec,
        page: newPage,
        perPage: DEFAULT_PAGE_SIZE,
      });

      if (searchRequestIdRef.current !== baseSearchId) {
        return;
      }
      if (cardPageRequestIdRef.current[module] !== pageRequestId) {
        return;
      }

      const updatedGroup = results.find((g) => g.module === module);
      if (updatedGroup) {
        setSearchGroups((prev) => prev.map((g) => (g.module === module ? updatedGroup : g)));
        setCardPages((prev) => ({ ...prev, [module]: newPage }));
      }
    } catch {
      // Keep existing results on error
    }
  }

  function handleQuerySubmit() {
    setSubmittedQuery(queryText);
    router.replace(
      `/crm/${orgSlug}/search?q=${encodeURIComponent(queryText.trim())}${
        appliedModules.length === 1 ? `&module=${encodeURIComponent(appliedModules[0] ?? "")}` : ""
      }`,
    );
    void performSearch(queryText, appliedModules, appliedCriteria, activeSortSpec);
  }

  function handleClose() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/crm/${orgSlug}`);
    }
  }

  function handleSortChange(sortId: string) {
    setSelectedSortId(sortId);
    const found = SORT_OPTIONS.find((opt) => opt.id === sortId);
    if (found) {
      void performSearch(submittedQuery, appliedModules, appliedCriteria, found.sort);
    }
  }

  function handleFilterApply({
    modules,
    criteria,
    selectedFields,
    drafts,
  }: {
    modules: ModuleApiName[];
    criteria?: Criteria;
    selectedFields: string[];
    drafts: Record<string, FilterDraft>;
  }) {
    setAppliedModules(modules);
    setAppliedCriteria(criteria);
    setAppliedSelectedFields(selectedFields);
    setAppliedDrafts(drafts);

    // Compute active filter names for summary
    const names: string[] = [];
    if (modules.length < registeredModules.length) {
      names.push(...modules);
    }
    if (criteria) {
      if ("field" in criteria && criteria.field) {
        const field = SYSTEM_FILTER_FIELDS.find((f) => f.apiName === criteria.field);
        names.push(field?.label ?? criteria.field);
      } else if ("group" in criteria && Array.isArray(criteria.group)) {
        for (const item of criteria.group) {
          if ("field" in item && item.field) {
            const field = SYSTEM_FILTER_FIELDS.find((f) => f.apiName === item.field);
            names.push(field?.label ?? item.field);
          }
        }
      }
    }
    setAppliedFilterNames(names);

    void performSearch(submittedQuery, modules, criteria, activeSortSpec);
  }

  function handleFilterClear() {
    setAppliedModules([...registeredModules]);
    setAppliedCriteria(undefined);
    setAppliedFilterNames([]);
    setAppliedSelectedFields([]);
    setAppliedDrafts({});
    void performSearch(submittedQuery, [...registeredModules], undefined, activeSortSpec);
  }

  const filterSummary = useMemo(() => {
    if (appliedFilterNames.length === 0) return null;
    return appliedFilterNames.join(", ");
  }, [appliedFilterNames]);

  if (searchError) {
    throw searchError;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg overflow-y-auto">
      {/* Prefetch metadata & views for all registered modules */}
      {registeredModules.map((mod) => (
        <ModulePrefetcher key={mod} module={mod} />
      ))}

      {/* Top Header Bar (Dark) */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-rail-surface px-6 text-white shadow-md">
        <h1 className="text-lg font-bold tracking-tight text-white">Search</h1>

        {/* S-19: Advanced Query Field */}
        <div className="flex flex-1 max-w-2xl items-center">
          <input
            type="text"
            aria-label="Search records"
            placeholder="Search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleQuerySubmit();
              }
            }}
            className="w-full rounded bg-surface px-3 py-1.5 text-sm text-text outline-none shadow-inner placeholder:text-text-placeholder focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* S-20: Close Icon Button */}
        <div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <Icons.close className="size-4" />
          </button>
        </div>
      </header>

      {/* Sub-bar: Funnel & Sort */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-3">
          {/* S-21: Funnel Icon Button */}
          <button
            type="button"
            aria-label="Filter"
            aria-expanded={isFilterPanelOpen}
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`flex size-8 items-center justify-center rounded border border-border bg-surface transition-colors hover:bg-surface-hover ${
              isFilterPanelOpen ? "border-primary text-primary" : "text-text"
            }`}
          >
            <Icons.filter className="size-4" />
          </button>

          {/* Filter By Summary */}
          {filterSummary && (
            <span className="text-sm font-semibold text-text">Filter By {filterSummary}</span>
          )}
        </div>

        {/* S-22: Sort By Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Sort By</span>
          <Select
            label="Sort By"
            hideLabel
            items={SORT_OPTIONS}
            value={selectedSortId}
            onChange={(key) => handleSortChange(String(key))}
          >
            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex min-h-0 flex-1 gap-6 p-6">
        {/* Left Filter Panel */}
        {isFilterPanelOpen && (
          <AdvancedSearchFilterPanel
            appliedModules={appliedModules}
            appliedSelectedFields={appliedSelectedFields}
            appliedDrafts={appliedDrafts}
            onApply={handleFilterApply}
            onClear={handleFilterClear}
            users={users.data ?? []}
            registeredModules={registeredModules}
            moduleDefinitions={moduleDefinitions}
          />
        )}

        {/* Results Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {!isLoading && submittedQuery.trim().length >= 3 && searchGroups.length === 0 && (
            <div className="border border-panel-border bg-surface py-6 text-center text-sm text-text-muted">
              No records found.
            </div>
          )}

          {/* Result Cards */}
          {!isLoading &&
            submittedQuery.trim().length >= 3 &&
            searchGroups.map((group) => {
              const definition =
                resolveModuleScreenByApiName(group.module, moduleDefinitions) ??
                resolveModuleScreenByApiName(group.module);
              const moduleLabel =
                definition?.pluralLabel ??
                documentedItems.find((m) => m.moduleApiName === group.module)?.label ??
                group.module;

              return (
                <AdvancedSearchModuleCard
                  key={group.module}
                  module={group.module}
                  moduleLabel={moduleLabel}
                  definition={definition}
                  total={group.total}
                  records={group.records}
                  page={cardPages[group.module] ?? 1}
                  perPage={DEFAULT_PAGE_SIZE}
                  selectedColumns={moduleColumns[group.module]}
                  onColumnsChange={(cols) =>
                    setModuleColumns((prev) => ({ ...prev, [group.module]: cols }))
                  }
                  ownerNames={ownerNames}
                  onPageChange={(newPage) => handleCardPageChange(group.module, newPage)}
                  orgSlug={orgSlug}
                />
              );
            })}

          {/* Notes Card: rendered below results if search has run */}
          {!isLoading && submittedQuery.trim().length >= 3 && <NotesSearchCard />}

          {/* S-46: Cross-application search link */}
          {!isLoading && submittedQuery.trim().length >= 3 && (
            <div className="mt-4 mb-8 flex justify-center py-4 border-t border-border">
              <Link
                href="#"
                laterModule="P3"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Icons.filterSearch className="size-4" />
                <span>Search across applications</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
