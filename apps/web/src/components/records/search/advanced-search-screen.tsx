"use client";

import type {
  Criteria,
  FieldDefinition,
  ModuleApiName,
  SearchGroup,
  SortSpec,
} from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { useModule, useUsers, useViews } from "@/lib/api/client/hooks";
import { useClientRecordService, useOrgSlug } from "@/lib/api/client/provider";
import { moduleScreens } from "@/modules/registry";
import { AdvancedSearchCard, NotesSearchCard } from "./advanced-search-card";
import { AdvancedSearchFilterPanel } from "./advanced-search-filter-panel";
import {
  DEFAULT_PAGE_SIZE,
  DOCUMENTED_MODULE_FILTER_ITEMS,
  SORT_OPTIONS,
  SYSTEM_FILTER_FIELDS,
} from "./constants";
import { ManageColumnsDialog } from "./manage-columns-dialog";

export interface AdvancedSearchScreenProps {
  initialQuery?: string;
  initialModule?: string;
}

export function AdvancedSearchScreen({
  initialQuery = "",
  initialModule,
}: AdvancedSearchScreenProps) {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();

  const [queryText, setQueryText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedSortId, setSelectedSortId] = useState<string>("Modified_Time");

  // Selected modules in filter
  const registeredModuleNames = useMemo(() => moduleScreens.map((s) => s.apiName), []);
  const [selectedModules, setSelectedModules] = useState<ModuleApiName[]>(() => {
    if (initialModule && registeredModuleNames.includes(initialModule)) {
      return [initialModule];
    }
    return [...registeredModuleNames];
  });

  // Applied field criteria
  const [appliedCriteria, setAppliedCriteria] = useState<Criteria | undefined>(undefined);
  const [appliedFilterNames, setAppliedFilterNames] = useState<string[]>([]);

  // Card pagination: module -> page
  const [cardPages, setCardPages] = useState<Record<string, number>>({});

  // Search results
  const [searchGroups, setSearchGroups] = useState<readonly SearchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Metadata for Leads & Contacts
  const leadsModule = useModule("Leads");
  const contactsModule = useModule("Contacts");
  const leadsViews = useViews("Leads");
  const contactsViews = useViews("Contacts");
  const users = useUsers();

  const fieldsByModule = useMemo(() => {
    const map: Record<string, Record<string, FieldDefinition>> = {};
    if (leadsModule.data?.fields) {
      map.Leads = Object.fromEntries(leadsModule.data.fields.map((f) => [f.apiName, f]));
    }
    if (contactsModule.data?.fields) {
      map.Contacts = Object.fromEntries(contactsModule.data.fields.map((f) => [f.apiName, f]));
    }
    return map;
  }, [leadsModule.data?.fields, contactsModule.data?.fields]);

  // Selected columns per module card
  const [moduleColumns, setModuleColumns] = useState<Record<string, string[]>>({});

  // Initialize default 5 columns from default list view
  useEffect(() => {
    setModuleColumns((current) => {
      const next = { ...current };
      let changed = false;

      if (!next.Leads && leadsViews.data) {
        const defaultView = leadsViews.data.find((v) => v.isDefault);
        if (defaultView) {
          // If listViewSummaries only has summaries, fetch default view or fallback
          next.Leads = ["Full_Name", "Company", "Email", "Phone", "Lead_Source"];
          changed = true;
        } else if (leadsModule.data?.fields) {
          next.Leads = leadsModule.data.fields.slice(0, 5).map((f) => f.apiName);
          changed = true;
        }
      }

      if (!next.Contacts && contactsViews.data) {
        const defaultView = contactsViews.data.find((v) => v.isDefault);
        if (defaultView) {
          next.Contacts = ["Full_Name", "Account_Name", "Email", "Phone", "Owner"];
          changed = true;
        } else if (contactsModule.data?.fields) {
          next.Contacts = contactsModule.data.fields.slice(0, 5).map((f) => f.apiName);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [leadsViews.data, contactsViews.data, leadsModule.data?.fields, contactsModule.data?.fields]);

  // Manage columns modal state
  const [managingModule, setManagingModule] = useState<ModuleApiName | null>(null);

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
      const trimmed = text.trim();
      if (trimmed.length < 3) {
        setSearchGroups([]);
        setIsLoading(false);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const results = await service.search({
          text: trimmed,
          modules: modules.length > 0 ? modules : undefined,
          filters: criteria,
          sort: sortSpec,
          perPage: DEFAULT_PAGE_SIZE,
          page: 1,
        });
        setSearchGroups(results);
        // Reset card pages to 1
        setCardPages({});
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Search failed.");
        setSearchGroups([]);
      } finally {
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
        void performSearch(initialQuery, selectedModules, appliedCriteria, activeSortSpec);
      }
    }
  }, [initialQuery, selectedModules, appliedCriteria, activeSortSpec, performSearch]);

  // Single card page change
  async function handleCardPageChange(module: ModuleApiName, newPage: number) {
    const trimmed = submittedQuery.trim();
    if (trimmed.length < 3) return;

    try {
      const results = await service.search({
        text: trimmed,
        modules: [module],
        filters: appliedCriteria,
        sort: activeSortSpec,
        page: newPage,
        perPage: DEFAULT_PAGE_SIZE,
      });

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
        selectedModules.length === 1
          ? `&module=${encodeURIComponent(selectedModules[0] ?? "")}`
          : ""
      }`,
    );
    void performSearch(queryText, selectedModules, appliedCriteria, activeSortSpec);
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
      void performSearch(submittedQuery, selectedModules, appliedCriteria, found.sort);
    }
  }

  function handleFilterApply({
    modules,
    criteria,
  }: {
    modules: ModuleApiName[];
    criteria?: Criteria;
  }) {
    setSelectedModules(modules);
    setAppliedCriteria(criteria);

    // Compute active filter names for summary
    const names: string[] = [];
    if (modules.length < registeredModuleNames.length) {
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
    setSelectedModules([...registeredModuleNames]);
    setAppliedCriteria(undefined);
    setAppliedFilterNames([]);
    void performSearch(submittedQuery, [...registeredModuleNames], undefined, activeSortSpec);
  }

  const filterSummary = useMemo(() => {
    if (appliedFilterNames.length === 0) return null;
    return appliedFilterNames.join(", ");
  }, [appliedFilterNames]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 overflow-y-auto">
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
            <span className="text-sm font-medium text-text">Filter By {filterSummary}</span>
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
            selectedModules={selectedModules}
            onModulesChange={setSelectedModules}
            onApply={handleFilterApply}
            onClear={handleFilterClear}
            users={users.data ?? []}
          />
        )}

        {/* Results Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {isLoading && (
            <div className="flex items-center justify-center p-12 text-sm text-text-muted">
              <Icons.spinner className="size-5 animate-spin mr-2" />
              Loading results...
            </div>
          )}

          {errorMessage && (
            <div
              className="mb-4 rounded-md border border-danger/20 bg-danger/10 p-4 text-sm text-danger"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && submittedQuery.trim().length < 3 && (
            <div className="rounded-md border border-panel-border bg-surface p-12 text-center text-sm text-text-muted">
              Enter at least 3 characters to search.
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            submittedQuery.trim().length >= 3 &&
            searchGroups.length === 0 && (
              <div className="rounded-md border border-panel-border bg-surface p-12 text-center text-sm text-text-muted">
                No records found.
              </div>
            )}

          {/* Result Cards */}
          {!isLoading &&
            !errorMessage &&
            submittedQuery.trim().length >= 3 &&
            searchGroups.map((group) => {
              const defaultCols =
                group.module === "Contacts"
                  ? ["Full_Name", "Account_Name", "Email", "Phone", "Owner"]
                  : ["Full_Name", "Company", "Email", "Phone", "Lead_Source"];

              const activeColumns = moduleColumns[group.module] ?? defaultCols;
              const moduleLabel =
                DOCUMENTED_MODULE_FILTER_ITEMS.find((m) => m.moduleApiName === group.module)
                  ?.label ?? group.module;

              return (
                <AdvancedSearchCard
                  key={group.module}
                  module={group.module}
                  moduleLabel={moduleLabel}
                  total={group.total}
                  records={group.records}
                  page={cardPages[group.module] ?? 1}
                  perPage={DEFAULT_PAGE_SIZE}
                  columns={activeColumns}
                  fieldsByApiName={fieldsByModule[group.module] ?? {}}
                  onPageChange={(newPage) => handleCardPageChange(group.module, newPage)}
                  onOpenManageColumns={() => setManagingModule(group.module)}
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

      {/* Manage Columns Dialog */}
      {managingModule && (
        <ManageColumnsDialog
          isOpen={true}
          onClose={() => setManagingModule(null)}
          moduleLabel={
            DOCUMENTED_MODULE_FILTER_ITEMS.find((m) => m.moduleApiName === managingModule)?.label ??
            managingModule
          }
          allFields={
            managingModule === "Leads"
              ? (leadsModule.data?.fields ?? [])
              : (contactsModule.data?.fields ?? [])
          }
          selectedColumns={
            moduleColumns[managingModule] ??
            (managingModule === "Contacts"
              ? ["Full_Name", "Account_Name", "Email", "Phone", "Owner"]
              : ["Full_Name", "Company", "Email", "Phone", "Lead_Source"])
          }
          onSave={(cols) => {
            setModuleColumns((prev) => ({ ...prev, [managingModule]: cols }));
          }}
        />
      )}
    </div>
  );
}
