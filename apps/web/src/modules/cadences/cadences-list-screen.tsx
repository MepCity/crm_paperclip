"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { createCadence, fetchCadences } from "./api";
import type { CadenceAudience, CadenceModule, CadenceSummary } from "./types";

interface CadencesListScreenProps {
  orgSlug: string;
}

export function CadencesListScreen({ orgSlug }: CadencesListScreenProps) {
  const t = useUiTranslations();
  const router = useRouter();

  const [cadences, setCadences] = useState<CadenceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Create dialog state (C2)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cadenceName, setCadenceName] = useState("");
  const [cadenceModule, setCadenceModule] = useState<CadenceModule | "">("");
  const [cadenceDesc, setCadenceDesc] = useState("");
  const [cadenceAudienceType, setCadenceAudienceType] = useState<"none" | "manual" | "custom_view">(
    "none",
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchCadences(orgSlug, {
        search,
        module: moduleFilter,
        status: statusFilter,
      });
      setCadences(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cadences");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, search, moduleFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateDialog = () => {
    setCadenceName("");
    setCadenceModule("");
    setCadenceDesc("");
    setCadenceAudienceType("none");
    setCreateError(null);
    setCreateDialogOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const isNextValid =
    cadenceName.trim().length > 0 && cadenceModule !== "" && cadenceAudienceType !== "none";

  const handleCreate = async () => {
    if (!isNextValid) return;
    try {
      setCreating(true);
      setCreateError(null);
      const audience: CadenceAudience =
        cadenceAudienceType === "custom_view"
          ? { kind: "custom_view", viewId: "all-records", enrollNewMatches: true }
          : { kind: "manual" };

      const created = await createCadence(orgSlug, {
        name: cadenceName.trim(),
        module: cadenceModule as CadenceModule,
        description: cadenceDesc.trim(),
        audience,
      });
      setCreateDialogOpen(false);
      router.push(`/crm/${orgSlug}/settings/cadences/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create cadence");
      setCreating(false);
    }
  };

  const moduleNameMap: Record<CadenceModule, string> = {
    Leads: t("shell.leads"),
    Contacts: t("shell.contacts"),
    Accounts: t("shell.accounts"),
    Deals: t("shell.deals"),
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-7xl mx-auto w-full">
      {/* Header & Description */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t("modules.cadences.list.title")}
            </h1>
            {/* Contextual help marker */}
            <a
              href="https://help.crm.reference/cadences"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              title={t("modules.cadences.list.help")}
              aria-label={t("modules.cadences.list.help")}
              data-testid="cadence-help-marker"
            >
              <Icons.info className="size-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            {t("modules.cadences.list.description")}
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
        <div className="relative w-full sm:w-72">
          <Icons.filterSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("modules.cadences.list.searchPlaceholder")}
            aria-label={t("modules.cadences.list.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="cadence-search-input"
          />
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateDialog}
          data-testid="create-cadence-button"
          className="w-full sm:w-auto"
        >
          {t("modules.cadences.list.createCadence")}
        </Button>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-visible bg-background shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">{t("modules.cadences.list.columnName")}</th>

                {/* Module dropdown filter header (C1a) */}
                <th className="px-4 py-3 min-w-[160px] relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => setModuleMenuOpen((o) => !o)}
                      className="inline-flex items-center gap-1 font-semibold text-xs uppercase hover:text-foreground focus:outline-none"
                      data-testid="module-filter-button"
                      aria-haspopup="listbox"
                      aria-expanded={moduleMenuOpen}
                    >
                      <span>
                        {moduleFilter === "all"
                          ? t("modules.cadences.list.allModules")
                          : (moduleNameMap[moduleFilter as CadenceModule] ?? moduleFilter)}
                      </span>
                      <Icons.chevronDown className="size-3" />
                    </button>

                    {moduleMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-48 rounded-md bg-popover shadow-lg ring-1 ring-border py-1 z-50 text-popover-foreground text-sm font-normal normal-case"
                        role="listbox"
                        data-testid="module-filter-menu"
                      >
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-1.5 hover:bg-muted ${
                            moduleFilter === "all" ? "font-semibold bg-muted/60" : ""
                          }`}
                          onClick={() => {
                            setModuleFilter("all");
                            setModuleMenuOpen(false);
                          }}
                        >
                          {t("modules.cadences.list.allModules")}
                        </button>
                        {(["Leads", "Contacts", "Accounts", "Deals"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 hover:bg-muted ${
                              moduleFilter === m ? "font-semibold bg-muted/60" : ""
                            }`}
                            onClick={() => {
                              setModuleFilter(m);
                              setModuleMenuOpen(false);
                            }}
                          >
                            {moduleNameMap[m]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 min-w-[180px]">
                  {t("modules.cadences.list.columnAudience")}
                </th>

                <th className="px-4 py-3 min-w-[120px]">
                  {t("modules.cadences.list.columnRecordCount")}
                </th>

                {/* Status dropdown filter header (C1b) */}
                <th className="px-4 py-3 min-w-[140px] relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      onClick={() => setStatusMenuOpen((o) => !o)}
                      className="inline-flex items-center gap-1 font-semibold text-xs uppercase hover:text-foreground focus:outline-none"
                      data-testid="status-filter-button"
                      aria-haspopup="listbox"
                      aria-expanded={statusMenuOpen}
                    >
                      <span>
                        {statusFilter === "all"
                          ? t("modules.cadences.list.status")
                          : statusFilter === "active"
                            ? t("modules.cadences.list.statusActive")
                            : t("modules.cadences.list.statusInactive")}
                      </span>
                      <Icons.chevronDown className="size-3" />
                    </button>

                    {statusMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-36 rounded-md bg-popover shadow-lg ring-1 ring-border py-1 z-50 text-popover-foreground text-sm font-normal normal-case"
                        role="listbox"
                        data-testid="status-filter-menu"
                      >
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-1.5 hover:bg-muted ${
                            statusFilter === "all" ? "font-semibold bg-muted/60" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("all");
                            setStatusMenuOpen(false);
                          }}
                        >
                          {t("modules.cadences.list.status")}
                        </button>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-1.5 hover:bg-muted ${
                            statusFilter === "active" ? "font-semibold bg-muted/60" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("active");
                            setStatusMenuOpen(false);
                          }}
                        >
                          {t("modules.cadences.list.statusActive")}
                        </button>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-1.5 hover:bg-muted ${
                            statusFilter === "inactive" ? "font-semibold bg-muted/60" : ""
                          }`}
                          onClick={() => {
                            setStatusFilter("inactive");
                            setStatusMenuOpen(false);
                          }}
                        >
                          {t("modules.cadences.list.statusInactive")}
                        </button>
                      </div>
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Spinner className="size-6 inline-block" />
                  </td>
                </tr>
              ) : cadences.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                    data-testid="cadence-empty-state"
                  >
                    {t("modules.cadences.list.empty")}
                  </td>
                </tr>
              ) : (
                cadences.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/crm/${orgSlug}/settings/cadences/${c.id}`)}
                    data-testid={`cadence-row-${c.id}`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link
                        href={`/crm/${orgSlug}/settings/cadences/${c.id}`}
                        className="text-primary hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.name}
                      </Link>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {c.description}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {moduleNameMap[c.module] ?? c.module}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {c.audience.kind === "manual"
                        ? t("modules.cadences.list.audienceManual")
                        : t("modules.cadences.dialog.customView")}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground font-mono">{c.recordCount}</td>

                    <td className="px-4 py-3">
                      {c.status === "active" ? (
                        <Badge variant="success">{t("modules.cadences.list.statusActive")}</Badge>
                      ) : c.status === "inactive" ? (
                        <Badge variant="neutral">{t("modules.cadences.list.statusInactive")}</Badge>
                      ) : (
                        <Badge variant="neutral">{t("modules.cadences.list.statusDraft")}</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* C2 Create Cadence Dialog */}
      {createDialogOpen && (
        <TopAlignedModal
          isOpen={createDialogOpen}
          onOpenChange={(open) => !open && setCreateDialogOpen(false)}
          panelClassName="max-w-md w-full"
        >
          <div
            className="flex flex-col bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("modules.cadences.dialog.title")}
            data-testid="create-cadence-dialog"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t("modules.cadences.dialog.title")}
            </h2>

            {createError && (
              <div className="p-2.5 mb-3 text-xs text-destructive bg-destructive/10 rounded-md">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              {/* Row 1: Cadence Name (required, focused) */}
              <div>
                <label
                  htmlFor="cadence-name-input"
                  className="block text-xs font-semibold text-muted-foreground mb-1"
                >
                  {t("modules.cadences.dialog.name")} <span className="text-destructive">*</span>
                </label>
                <input
                  id="cadence-name-input"
                  ref={nameInputRef}
                  type="text"
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={t("modules.cadences.dialog.namePlaceholder")}
                  value={cadenceName}
                  onChange={(e) => setCadenceName(e.target.value)}
                  data-testid="cadence-name-input"
                />
              </div>

              {/* Row 2: Module (required dropdown) */}
              <div>
                <label
                  htmlFor="cadence-module-select"
                  className="block text-xs font-semibold text-muted-foreground mb-1"
                >
                  {t("modules.cadences.dialog.module")} <span className="text-destructive">*</span>
                </label>
                <select
                  id="cadence-module-select"
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  value={cadenceModule}
                  onChange={(e) => {
                    const mod = e.target.value as CadenceModule | "";
                    setCadenceModule(mod);
                    if (mod === "") {
                      setCadenceAudienceType("none");
                    } else if (cadenceAudienceType === "none") {
                      setCadenceAudienceType("manual");
                    }
                  }}
                  data-testid="cadence-module-select"
                >
                  <option value="">{t("modules.cadences.dialog.modulePlaceholder")}</option>
                  {(["Leads", "Contacts", "Accounts", "Deals"] as const).map((m) => (
                    <option key={m} value={m}>
                      {moduleNameMap[m]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Description (multiline textarea) */}
              <div>
                <label
                  htmlFor="cadence-desc-input"
                  className="block text-xs font-semibold text-muted-foreground mb-1"
                >
                  {t("modules.cadences.dialog.description")}
                </label>
                <textarea
                  id="cadence-desc-input"
                  rows={3}
                  className="w-full p-2.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  placeholder={t("modules.cadences.dialog.descriptionPlaceholder")}
                  value={cadenceDesc}
                  onChange={(e) => setCadenceDesc(e.target.value)}
                  data-testid="cadence-description-input"
                />
              </div>

              {/* Row 4: Who is this for? (disabled until module chosen) */}
              <div>
                <label
                  htmlFor="cadence-audience-select"
                  className="block text-xs font-semibold text-muted-foreground mb-1"
                >
                  {t("modules.cadences.dialog.audience")}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  id="cadence-audience-select"
                  disabled={cadenceModule === ""}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  value={cadenceAudienceType}
                  onChange={(e) =>
                    setCadenceAudienceType(e.target.value as "none" | "manual" | "custom_view")
                  }
                  data-testid="cadence-audience-select"
                >
                  <option value="none">{t("modules.cadences.dialog.audiencePlaceholder")}</option>
                  <option value="manual">{t("modules.cadences.list.audienceManual")}</option>
                  <option value="custom_view">
                    {t("modules.cadences.dialog.customView")} (
                    {cadenceModule ? moduleNameMap[cadenceModule as CadenceModule] : ""})
                  </option>
                </select>
              </div>
            </div>

            {/* Bottom-Right Cancel and Next Buttons */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setCreateDialogOpen(false)}
                isDisabled={creating}
                data-testid="cadence-cancel-button"
              >
                {t("modules.cadences.dialog.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                isDisabled={!isNextValid || creating}
                data-testid="cadence-next-button"
              >
                {creating ? <Spinner className="size-4" /> : t("modules.cadences.dialog.next")}
              </Button>
            </div>
          </div>
        </TopAlignedModal>
      )}
    </div>
  );
}
