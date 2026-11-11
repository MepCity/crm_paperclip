"use client";

import { Check, ChevronDown, HelpCircle, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { createJourney, fetchJourneys } from "./api";
import type { JourneyModule, JourneySummary } from "./types";

interface JourneysListScreenProps {
  orgSlug: string;
}

export function JourneysListScreen({ orgSlug }: JourneysListScreenProps) {
  const t = useUiTranslations();
  const router = useRouter();

  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [journeyName, setJourneyName] = useState("");
  const [journeyModule, setJourneyModule] = useState<JourneyModule | "">("");
  const [journeyDesc, setJourneyDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJourneys(orgSlug, {
        search: search.trim() || undefined,
        module: moduleFilter !== "all" ? moduleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setJourneys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load journeys");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, search, moduleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Click outside menus to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) {
        setModuleMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journeyName.trim() || !journeyModule) return;

    try {
      setCreating(true);
      setDialogError(null);
      const created = await createJourney(orgSlug, {
        name: journeyName.trim(),
        module: journeyModule,
        description: journeyDesc.trim() || undefined,
      });
      setCreateDialogOpen(false);
      router.push(`/crm/${orgSlug}/settings/commandcenter/journey-builder/${created.id}`);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Failed to create journey");
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: JourneySummary["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">{t("modules.journeys.list.statusActive")}</Badge>;
      case "inactive":
        return <Badge variant="neutral">{t("modules.journeys.list.statusInactive")}</Badge>;
      default:
        return <Badge variant="warning">{t("modules.journeys.list.statusDraft")}</Badge>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Tabs: PathFinder & Journey Builder */}
      <div className="border-b border-border bg-card px-6 pt-3">
        <div className="flex items-center gap-8 text-sm font-medium">
          <button
            type="button"
            className="pb-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => router.push(`/crm/${orgSlug}/settings/commandcenter/path-finder`)}
          >
            {t("modules.journeys.list.pathFinderTab") || "PathFinder"}
          </button>
          <button
            type="button"
            className="pb-2.5 text-primary border-b-2 border-primary font-semibold cursor-pointer"
          >
            {t("modules.journeys.list.journeyBuilderTab") || "Yolculuk Oluşturucu"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
        {/* Header Row: Title & Subtitle on Left, Help & Action on Right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {t("modules.journeys.list.title")}
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              {t("modules.journeys.list.subtitle")}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <a
              href="https://help.crm.reference/commandcenter/journey-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
              title={t("modules.journeys.list.help")}
              data-testid="journey-help-marker"
            >
              <HelpCircle className="size-3.5 text-muted-foreground" />
              <span>{t("modules.journeys.list.help")}</span>
            </a>

            <Button
              variant="primary"
              onClick={() => {
                setJourneyName("");
                setJourneyModule("");
                setJourneyDesc("");
                setDialogError(null);
                setCreateDialogOpen(true);
              }}
              data-testid="create-journey-button"
              className="flex items-center gap-1.5"
            >
              <Plus className="size-4" />
              <span>{t("modules.journeys.list.createJourney")}</span>
            </Button>
          </div>
        </div>

        {/* Control bar: Search + Summary Count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
              placeholder={t("modules.journeys.list.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="journey-search-input"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger flex items-center justify-between">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => loadData()}>
              Retry
            </Button>
          </div>
        )}

        {/* Journeys Table */}
        <div className="border border-border rounded-lg overflow-visible bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">{t("modules.journeys.list.columnName")}</th>
                <th className="px-4 py-3 min-w-[140px] relative">
                  <div className="flex items-center gap-1" ref={moduleMenuRef}>
                    <span>{t("modules.journeys.list.allModules")}</span>
                    <button
                      type="button"
                      onClick={() => setModuleMenuOpen((o) => !o)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      data-testid="journey-module-filter-button"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    {moduleMenuOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 w-44 bg-card border border-border rounded-md shadow-lg py-1 z-30 normal-case"
                        data-testid="journey-module-filter-menu"
                      >
                        {(
                          [
                            { key: "all", label: t("modules.journeys.list.allModules") },
                            { key: "Leads", label: t("shell.leads") },
                            { key: "Contacts", label: t("shell.contacts") },
                            { key: "Accounts", label: t("shell.accounts") },
                            { key: "Deals", label: t("shell.deals") },
                          ] as const
                        ).map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/70 flex items-center justify-between ${
                              moduleFilter === key
                                ? "font-semibold text-primary"
                                : "text-foreground"
                            }`}
                            onClick={() => {
                              setModuleFilter(key);
                              setModuleMenuOpen(false);
                            }}
                          >
                            <span>{label}</span>
                            {moduleFilter === key && <Check className="size-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right">
                  {t("modules.journeys.list.columnRecordCount")}
                </th>
                <th className="px-4 py-3">{t("modules.journeys.list.columnLastModified")}</th>
                <th className="px-4 py-3 relative">
                  <div className="flex items-center gap-1" ref={statusMenuRef}>
                    <span>{t("modules.journeys.list.columnStatus")}</span>
                    <button
                      type="button"
                      onClick={() => setStatusMenuOpen((o) => !o)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                      data-testid="journey-status-filter-button"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    {statusMenuOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 w-36 bg-card border border-border rounded-md shadow-lg py-1 z-30 normal-case"
                        data-testid="journey-status-filter-menu"
                      >
                        {(
                          [
                            { key: "all", label: t("modules.journeys.list.status") },
                            { key: "active", label: t("modules.journeys.list.statusActive") },
                            { key: "inactive", label: t("modules.journeys.list.statusInactive") },
                            { key: "draft", label: t("modules.journeys.list.statusDraft") },
                          ] as const
                        ).map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/70 flex items-center justify-between ${
                              statusFilter === key
                                ? "font-semibold text-primary"
                                : "text-foreground"
                            }`}
                            onClick={() => {
                              setStatusFilter(key);
                              setStatusMenuOpen(false);
                            }}
                          >
                            <span>{label}</span>
                            {statusFilter === key && <Check className="size-3.5" />}
                          </button>
                        ))}
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
              ) : journeys.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                    data-testid="journey-empty-state"
                  >
                    {t("modules.journeys.list.empty")}
                  </td>
                </tr>
              ) : (
                journeys.map((j) => (
                  <tr
                    key={j.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/crm/${orgSlug}/settings/commandcenter/journey-builder/${j.id}`)
                    }
                    data-testid={`journey-row-${j.id}`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link
                        href={`/crm/${orgSlug}/settings/commandcenter/journey-builder/${j.id}`}
                        className="text-primary hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {j.name}
                      </Link>
                      {j.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {j.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{j.module}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {j.currentRecordCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {j.lastModifiedBy.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground">{j.lastModifiedBy.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(j.lastModifiedAt)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" data-testid={`journey-status-${j.id}`}>
                      {getStatusBadge(j.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Journey Dialog */}
        <TopAlignedModal
          isOpen={createDialogOpen}
          onOpenChange={(open) => !open && setCreateDialogOpen(false)}
          panelClassName="max-w-md w-full"
          aria-labelledby="create-journey-title"
        >
          <div
            className="flex flex-col bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-6"
            data-testid="create-journey-dialog"
          >
            <h2 id="create-journey-title" className="text-lg font-bold text-foreground mb-4">
              {t("modules.journeys.dialog.title")}
            </h2>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              {dialogError && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded text-xs text-danger">
                  {dialogError}
                </div>
              )}

              <div>
                <label
                  htmlFor="journey-name-input"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  {t("modules.journeys.dialog.name")} <span className="text-danger">*</span>
                </label>
                <input
                  id="journey-name-input"
                  type="text"
                  required
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
                  placeholder={t("modules.journeys.dialog.namePlaceholder")}
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  data-testid="journey-name-input"
                />
              </div>

              <div>
                <label
                  htmlFor="journey-module-select"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  {t("modules.journeys.dialog.module")} <span className="text-danger">*</span>
                </label>
                <select
                  id="journey-module-select"
                  required
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                  value={journeyModule}
                  onChange={(e) => setJourneyModule(e.target.value as JourneyModule)}
                  data-testid="journey-module-select"
                >
                  <option value="" disabled>
                    {t("modules.journeys.dialog.modulePlaceholder")}
                  </option>
                  <option value="Leads">{t("shell.leads")}</option>
                  <option value="Contacts">{t("shell.contacts")}</option>
                  <option value="Accounts">{t("shell.accounts")}</option>
                  <option value="Deals">{t("shell.deals")}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="journey-desc-input"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  {t("modules.journeys.dialog.description")}
                </label>
                <textarea
                  id="journey-desc-input"
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder={t("modules.journeys.dialog.descriptionPlaceholder")}
                  value={journeyDesc}
                  onChange={(e) => setJourneyDesc(e.target.value)}
                  data-testid="journey-description-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() => setCreateDialogOpen(false)}
                  isDisabled={creating}
                  data-testid="journey-cancel-button"
                >
                  {t("modules.journeys.dialog.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isDisabled={creating || !journeyName.trim() || !journeyModule}
                  data-testid="journey-next-button"
                >
                  {creating ? <Spinner className="size-4" /> : t("modules.journeys.dialog.next")}
                </Button>
              </div>
            </form>
          </div>
        </TopAlignedModal>
      </div>
    </div>
  );
}
