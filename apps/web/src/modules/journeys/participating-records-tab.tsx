"use client";

import { Clock, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import { fetchJourneyInstances, fetchJourneyTransitionLog } from "./api";
import type {
  JourneyInstanceSummary,
  JourneyState,
  JourneyTransition,
  JourneyTransitionRunSummary,
} from "./types";

export interface ParticipatingRecordsTabProps {
  orgSlug: string;
  journeyId: string;
  states: JourneyState[];
  transitions: JourneyTransition[];
}

export function ParticipatingRecordsTab({
  orgSlug,
  journeyId,
  states,
  transitions,
}: ParticipatingRecordsTabProps) {
  const t = useUiTranslations();

  const [instances, setInstances] = useState<JourneyInstanceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entryDateFilter, setEntryDateFilter] = useState<"all" | "today" | "7d" | "30d">("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "has_deadline" | "no_deadline">(
    "all",
  );

  // Transition Log modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeInstance, setActiveInstance] = useState<JourneyInstanceSummary | null>(null);
  const [logs, setLogs] = useState<JourneyTransitionRunSummary[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const loadInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let enteredAfter: string | undefined;
      const now = new Date();
      if (entryDateFilter === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        enteredAfter = startOfToday.toISOString();
      } else if (entryDateFilter === "7d") {
        enteredAfter = new Date(now.getTime() - 7 * 86400000).toISOString();
      } else if (entryDateFilter === "30d") {
        enteredAfter = new Date(now.getTime() - 30 * 86400000).toISOString();
      }

      let hasDeadline: boolean | undefined;
      if (deadlineFilter === "has_deadline") hasDeadline = true;
      else if (deadlineFilter === "no_deadline") hasDeadline = false;

      const data = await fetchJourneyInstances(orgSlug, journeyId, {
        stateId: stateFilter !== "all" ? stateFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        enteredAfter,
        hasDeadline,
        page: 1,
        limit: 50,
      });

      setInstances(data.instances);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load participating records");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, journeyId, stateFilter, statusFilter, entryDateFilter, deadlineFilter]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const handleOpenLog = async (inst: JourneyInstanceSummary) => {
    setActiveInstance(inst);
    setLogModalOpen(true);
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await fetchJourneyTransitionLog(orgSlug, journeyId, inst.id);
      setLogs(data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Failed to load transition logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "-";
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

  const getStateName = (stateId: string) => {
    return states.find((s) => s.id === stateId)?.name ?? stateId;
  };

  const getTransitionLabel = (transitionId: string) => {
    const tr = transitions.find((t) => t.id === transitionId);
    if (!tr) return transitionId;
    const fromName = states.find((s) => s.id === tr.from)?.name ?? tr.from;
    const toName = states.find((s) => s.id === tr.to)?.name ?? tr.to;
    return `${fromName} → ${toName}`;
  };

  return (
    <div className="flex flex-col flex-1 p-6 gap-5 bg-background overflow-y-auto">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">
              {t("modules.journeys.participants.filterState") || "State"}:
            </span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary"
              data-testid="participants-filter-state"
            >
              <option value="all">
                {t("modules.journeys.participants.allStates") || "All States"}
              </option>
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">
              {t("modules.journeys.participants.filterStatus") || "Status"}:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary"
              data-testid="participants-filter-status"
            >
              <option value="all">
                {t("modules.journeys.participants.allStatuses") || "All Statuses"}
              </option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="exited">Exited</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          {/* Entry Date Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">
              {t("modules.journeys.participants.filterEntryDate") || "Entry Date"}:
            </span>
            <select
              value={entryDateFilter}
              onChange={(e) => setEntryDateFilter(e.target.value as "all" | "today" | "7d" | "30d")}
              className="px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary"
              data-testid="participants-filter-entry-date"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Deadline Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-semibold">
              {t("modules.journeys.participants.filterDeadline") || "Deadline"}:
            </span>
            <select
              value={deadlineFilter}
              onChange={(e) =>
                setDeadlineFilter(e.target.value as "all" | "has_deadline" | "no_deadline")
              }
              className="px-2.5 py-1.5 rounded-md border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary"
              data-testid="participants-filter-deadline"
            >
              <option value="all">All Deadlines</option>
              <option value="has_deadline">Has Deadline</option>
              <option value="no_deadline">No Deadline</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total: {total}</span>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => loadInstances()}
            data-testid="participants-refresh-button"
            className="flex items-center gap-1 text-xs"
          >
            <RotateCw className="size-3" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Instances Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-xs">
        {loading && instances.length === 0 ? (
          <div className="flex justify-center py-16" data-testid="participants-loading">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : instances.length === 0 ? (
          <div
            className="py-16 text-center text-sm text-muted-foreground"
            data-testid="participants-empty"
          >
            {t("modules.journeys.participants.empty") || "No participating records found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="participants-table">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">
                    {t("modules.journeys.participants.colRecord") || "Record"}
                  </th>
                  <th className="px-4 py-3">
                    {t("modules.journeys.participants.colState") || "Current State"}
                  </th>
                  <th className="px-4 py-3">
                    {t("modules.journeys.participants.colEnteredAt") || "Entered At"}
                  </th>
                  <th className="px-4 py-3">
                    {t("modules.journeys.participants.colDeadline") || "Deadline"}
                  </th>
                  <th className="px-4 py-3">
                    {t("modules.journeys.participants.colStatus") || "Status"}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("modules.journeys.participants.colActions") || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {instances.map((inst) => (
                  <tr
                    key={inst.id}
                    className="hover:bg-muted/10 transition-colors"
                    data-testid={`participant-row-${inst.id}`}
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/crm/${orgSlug}/tab/${inst.recordModule}/${inst.recordId}`}
                        data-testid={`participant-record-link-${inst.id}`}
                        className="text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Badge variant="neutral" className="text-[10px] py-0 px-1 font-mono">
                          {inst.recordModule}
                        </Badge>
                        <span>{inst.recordName || inst.recordId}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      <Badge variant="neutral" className="text-xs">
                        {getStateName(inst.currentStateId)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {formatDate(inst.stateEnteredAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {inst.deadlineAt ? (
                        <span className="text-warning flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(inst.deadlineAt)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          inst.status === "active"
                            ? "success"
                            : inst.status === "completed"
                              ? "neutral"
                              : inst.status === "exited"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => handleOpenLog(inst)}
                        data-testid={`view-log-button-${inst.id}`}
                        className="text-xs py-1 px-2.5"
                      >
                        {t("modules.journeys.participants.viewLog") || "Transition Log"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transition Log Dialog */}
      <TopAlignedModal
        isOpen={logModalOpen}
        onOpenChange={setLogModalOpen}
        isDismissable
        aria-labelledby="transition-log-title"
        panelClassName="max-w-2xl w-full bg-card border border-border rounded-lg p-5 shadow-lg"
      >
        <div data-testid="transition-log-dialog" className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 id="transition-log-title" className="text-base font-semibold text-foreground">
              {t("modules.journeys.participants.logModalTitle") || "Transition Log"}
              {activeInstance && (
                <span className="text-xs text-muted-foreground ml-2 font-mono">
                  ({activeInstance.recordModule}: {activeInstance.recordId})
                </span>
              )}
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setLogModalOpen(false)}
              data-testid="close-log-modal"
            >
              {t("modules.journeys.participants.close") || "Close"}
            </Button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-10" data-testid="log-loading">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : logsError ? (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded">
              {logsError}
            </div>
          ) : logs.length === 0 ? (
            <div
              className="py-10 text-center text-sm text-muted-foreground"
              data-testid="log-empty"
            >
              {t("modules.journeys.participants.noLogs") || "No transitions executed yet."}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="pb-2">
                      {t("modules.journeys.participants.colTransitionName") || "Transition"}
                    </th>
                    <th className="pb-2">
                      {t("modules.journeys.participants.colResult") || "Result"}
                    </th>
                    <th className="pb-2">
                      {t("modules.journeys.participants.colExecutedAt") || "Executed At"}
                    </th>
                    <th className="pb-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/10 transition-colors"
                      data-testid={`log-row-${log.id}`}
                    >
                      <td className="py-2.5 font-semibold text-foreground">
                        {getTransitionLabel(log.transitionId)}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={log.result === "success" ? "success" : "danger"}>
                          {log.result}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground font-mono">
                        {formatDate(log.executedAt)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground font-mono">
                        {log.resultReason || log.eventId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TopAlignedModal>
    </div>
  );
}
