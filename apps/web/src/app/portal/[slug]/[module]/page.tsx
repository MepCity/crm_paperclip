"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { fetchPortalRecords, PortalApiError } from "@/modules/external-portal/portal-client";
import { usePortal } from "@/modules/external-portal/portal-context";
import { PortalNotFound } from "@/modules/external-portal/portal-not-found";
import type { PortalListPageInfo, PortalModule } from "@/modules/external-portal/types";

export default function PortalModuleListPage() {
  const params = useParams<{ slug: string; module: string }>();
  const slug = params?.slug ?? "";
  const moduleParam = (params?.module ?? "") as PortalModule;
  const { session, loading: sessionLoading } = usePortal();

  const [records, setRecords] = useState<readonly Record<string, unknown>[]>([]);
  const [pageInfo, setPageInfo] = useState<PortalListPageInfo>({
    page: 1,
    per_page: 20,
    more_records: false,
    sort_by: "id",
    sort_order: "desc",
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moduleConfig = session?.userType?.modules?.[moduleParam];
  const isEnabled = Boolean(moduleConfig?.enabled);

  const loadData = useCallback(
    async (
      page = 1,
      searchQuery = search,
      sortBy = pageInfo.sort_by,
      sortOrder = pageInfo.sort_order,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPortalRecords(slug, moduleParam, {
          page,
          per_page: pageInfo.per_page,
          search: searchQuery || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        const rows = (res.data ?? []).map((r: Record<string, unknown>) => {
          const f = (r.fields && typeof r.fields === "object" ? r.fields : {}) as Record<
            string,
            unknown
          >;
          const rowData: Record<string, unknown> = { id: r.id, ...f, ...r };
          delete rowData.fields;
          return rowData;
        });
        setRecords(rows);
        setPageInfo(res.info);
      } catch (err) {
        if (err instanceof PortalApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load records");
        }
      } finally {
        setLoading(false);
      }
    },
    [slug, moduleParam, search, pageInfo.sort_by, pageInfo.sort_order, pageInfo.per_page],
  );

  useEffect(() => {
    if (!sessionLoading && session) {
      if (!isEnabled) {
        setNotFound(true);
        return;
      }
      void loadData(1);
    }
  }, [sessionLoading, session, isEnabled, loadData]);

  if (sessionLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
    );
  }

  if (notFound || !isEnabled) {
    return (
      <PortalNotFound
        slug={slug}
        title="Module Not Available"
        message={`The module "${moduleParam}" is not enabled or accessible for your account.`}
      />
    );
  }

  const projectedFieldNames = moduleConfig?.fields.map((f) => f.apiName) ?? [];
  const displayColumns =
    projectedFieldNames.length > 0
      ? projectedFieldNames
      : records[0]
        ? Object.keys(records[0]).filter((k) => k !== "id")
        : ["id"];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    void loadData(1, searchInput);
  };

  const handleSort = (field: string) => {
    const nextOrder = pageInfo.sort_by === field && pageInfo.sort_order === "asc" ? "desc" : "asc";
    void loadData(1, search, field, nextOrder);
  };

  const canCreateCase = moduleParam === "Cases" && Boolean(moduleConfig?.actions.create);

  return (
    <div className="space-y-6" data-testid={`portal-module-list-${moduleParam}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{moduleParam}</h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Viewing records available to your portal account
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateCase && (
            <Link
              href={`/portal/${encodeURIComponent(slug)}/Cases/new`}
              className="inline-flex items-center justify-center rounded bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
              data-testid="portal-create-case-button"
            >
              + New Case
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex max-w-sm flex-1 items-center gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search records..."
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            data-testid="portal-search-input"
          />
          <button
            type="submit"
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
            data-testid="portal-search-submit"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-[var(--color-text-muted)]">Page {pageInfo.page}</div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]">
              <tr>
                {displayColumns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="cursor-pointer px-4 py-3 font-semibold hover:text-[var(--color-text)] select-none"
                    data-testid={`portal-col-header-${col}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.replace(/_/g, " ")}</span>
                      {pageInfo.sort_by === col && (
                        <span>{pageInfo.sort_order === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="py-12 text-center text-xs text-[var(--color-text-muted)]"
                  >
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="py-12 text-center text-xs text-[var(--color-text-muted)]"
                    data-testid="portal-no-records"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => {
                  const id = String(row.id ?? `row-${idx}`);
                  return (
                    <tr
                      key={id}
                      className="transition hover:bg-[var(--color-bg-muted)]"
                      data-testid={`portal-record-row-${id}`}
                    >
                      {displayColumns.map((col, cIdx) => {
                        const val = row[col];
                        const textVal =
                          val === null || val === undefined
                            ? "—"
                            : typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val);

                        return (
                          <td key={col} className="px-4 py-3 text-[var(--color-text)]">
                            {cIdx === 0 ? (
                              <Link
                                href={`/portal/${encodeURIComponent(slug)}/${encodeURIComponent(moduleParam)}/${encodeURIComponent(id)}`}
                                className="font-semibold text-[var(--color-primary)] hover:underline"
                                data-testid={`portal-record-link-${id}`}
                              >
                                {textVal}
                              </Link>
                            ) : (
                              <span>{textVal}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/portal/${encodeURIComponent(slug)}/${encodeURIComponent(moduleParam)}/${encodeURIComponent(id)}`}
                          className="rounded border border-[var(--color-border)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-xs text-[var(--color-text-muted)]">Page {pageInfo.page}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageInfo.page <= 1 || loading}
              onClick={() => void loadData(pageInfo.page - 1)}
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] disabled:opacity-40"
              data-testid="portal-pagination-prev"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pageInfo.more_records || loading}
              onClick={() => void loadData(pageInfo.page + 1)}
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] disabled:opacity-40"
              data-testid="portal-pagination-next"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
