"use client";

import type { AutomationPort, ReadResult, RulePage, WorkflowRule } from "@crm/core/automation";
import type { ModuleApiName, OrgContext } from "@crm/core/records";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSyntheticWorkflowRulesPort } from "./fixtures";
import { formatTrigger } from "./formatters";

export interface WorkflowRulesListScreenProps {
  orgSlug: string;
  ctx?: OrgContext;
  initialResult?: ReadResult<RulePage>;
  port?: AutomationPort;
}

const DEFAULT_MODULES: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

const fallbackCtx: OrgContext = {
  orgId: "synthetic-org",
  orgSlug: "synthetic",
  orgName: "Synthetic organization",
  userId: "synthetic-admin",
  role: "admin",
};

export function WorkflowRulesListScreen({
  orgSlug,
  ctx = fallbackCtx,
  initialResult,
  port,
}: WorkflowRulesListScreenProps) {
  const activePort = useMemo(() => port ?? createSyntheticWorkflowRulesPort(), [port]);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [result, setResult] = useState<ReadResult<RulePage> | null>(initialResult ?? null);
  const [loading, setLoading] = useState<boolean>(!initialResult);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Track which rules have had triggers requested
  const requestedTriggers = useRef<Set<string>>(new Set());

  // Trigger summaries fetched asynchronously per rule (WL4)
  const [triggers, setTriggers] = useState<
    Record<string, { loading: boolean; text?: string; error?: boolean }>
  >({});

  const fetchRules = useCallback(
    async (moduleFilter: string, cursorOffset?: string) => {
      setLoading(true);
      try {
        const queryModule = moduleFilter === "all" ? undefined : (moduleFilter as ModuleApiName);
        const res = await activePort.list(ctx, {
          kind: "workflow",
          module: queryModule,
          cursor: cursorOffset,
          limit: 50,
        });
        setResult(res);
      } catch {
        setResult({ ok: false, error: { code: "unavailable" } });
      } finally {
        setLoading(false);
      }
    },
    [activePort, ctx],
  );

  const initialFetchSkipped = useRef(Boolean(initialResult));

  // Fetch when selectedModule or cursor changes (or on mount if no initialResult)
  useEffect(() => {
    if (initialFetchSkipped.current) {
      initialFetchSkipped.current = false;
      return;
    }
    fetchRules(selectedModule, cursor);
  }, [fetchRules, selectedModule, cursor]);

  const loadTrigger = useCallback(
    async (ruleId: string) => {
      setTriggers((prev) => ({
        ...prev,
        [ruleId]: { loading: true },
      }));
      try {
        const res = await activePort.get(ctx, {
          kind: "workflow",
          id: ruleId,
        });
        if (res.ok && res.value.kind === "workflow") {
          const rule = res.value as WorkflowRule;
          setTriggers((prev) => ({
            ...prev,
            [ruleId]: { loading: false, text: formatTrigger(rule.trigger) },
          }));
        } else {
          setTriggers((prev) => ({
            ...prev,
            [ruleId]: { loading: false, error: true },
          }));
        }
      } catch {
        setTriggers((prev) => ({
          ...prev,
          [ruleId]: { loading: false, error: true },
        }));
      }
    },
    [activePort, ctx],
  );

  // Fetch trigger for each rule in current page (WL4)
  useEffect(() => {
    if (result?.ok) {
      for (const item of result.value.items) {
        if (!requestedTriggers.current.has(item.id)) {
          requestedTriggers.current.add(item.id);
          loadTrigger(item.id);
        }
      }
    }
  }, [result, loadTrigger]);

  const handleModuleChange = (newModule: string) => {
    requestedTriggers.current.clear();
    setSelectedModule(newModule);
    setCursor(undefined);
  };

  const handleNextPage = () => {
    if (result?.ok && result.value.nextCursor) {
      requestedTriggers.current.clear();
      setCursor(result.value.nextCursor);
    }
  };

  const handleRetryList = () => {
    requestedTriggers.current.clear();
    fetchRules(selectedModule, cursor);
  };

  return (
    <section
      aria-label="Workflow Rules"
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs p-6"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">Workflow Rules</h2>
          <p className="text-sm text-text-muted mt-1">
            Automate actions based on record triggers and criteria.
          </p>
        </div>

        {/* Module Filter (WL6) */}
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-module-filter" className="text-sm font-semibold text-text">
            Filter by module:
          </label>
          <select
            id="workflow-module-filter"
            aria-label="Filter workflow rules by module"
            value={selectedModule}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="h-9 rounded-md border border-border bg-surface px-3 py-1 text-sm text-text shadow-xs focus:border-primary focus:outline-none"
          >
            <option value="all">All modules</option>
            {DEFAULT_MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state (WL7) */}
      {loading ? (
        <div role="status" aria-live="polite" className="py-12 text-center text-text-muted">
          <Icons.spinner
            className="inline size-6 animate-spin text-primary mr-2"
            aria-hidden="true"
          />
          <span>Loading workflow rules...</span>
        </div>
      ) : null}

      {/* Access Denied (WL9) */}
      {!loading && result && !result.ok && result.error.code === "forbidden" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.warning className="inline size-6 text-accent-orange mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">Access denied.</p>
          <p className="text-sm text-text-muted mt-1">
            You do not have permission to view workflow rules.
          </p>
        </div>
      ) : null}

      {/* Read failure / Error with Retry (WL10) */}
      {!loading && result && !result.ok && result.error.code !== "forbidden" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.error className="inline size-6 text-accent-red mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">Workflow rules could not be loaded.</p>
          <p className="text-sm text-text-muted mt-1">
            A temporary problem occurred while retrieving workflow rules.
          </p>
          <Button variant="secondary" size="sm" onClick={handleRetryList} className="mt-4">
            Retry
          </Button>
        </div>
      ) : null}

      {/* Empty State (WL8) */}
      {!loading && result && result.ok && result.value.items.length === 0 ? (
        <div
          data-testid="workflow-empty-state"
          className="rounded-md border border-dashed border-border p-12 text-center"
        >
          <p className="text-md font-semibold text-text">
            {selectedModule === "all"
              ? "No workflow rules have been configured yet."
              : `No workflow rules found for module "${selectedModule}".`}
          </p>
          <p className="text-sm text-text-muted mt-1">
            Workflow rules automate business logic when records are created or updated.
          </p>
        </div>
      ) : null}

      {/* Populated Table (WL1, WL2, WL3, WL4, WL5) */}
      {!loading && result && result.ok && result.value.items.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="w-full overflow-auto contain-paint">
            <table aria-label="Workflow rules table" className="w-full text-left text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.value.items.map((rule) => {
                  const triggerState = triggers[rule.id];
                  const detailHref = `/crm/${encodeURIComponent(orgSlug)}/settings/workflow-rules/${encodeURIComponent(rule.id)}`;

                  return (
                    <TableRow key={rule.id}>
                      {/* WL2: Name link */}
                      <TableCell>
                        <Link
                          href={detailHref}
                          className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {rule.name}
                        </Link>
                      </TableCell>

                      {/* WL3: Module label */}
                      <TableCell>{rule.module}</TableCell>

                      {/* WL4: Trigger summary */}
                      <TableCell>
                        {triggerState?.loading ? (
                          <span className="text-xs text-text-muted italic">Loading trigger...</span>
                        ) : triggerState?.error ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-accent-red">
                            Trigger unavailable
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-xs text-text hover:bg-surface-hover"
                              onClick={() => loadTrigger(rule.id)}
                              aria-label={`Retry loading trigger for ${rule.name}`}
                            >
                              Retry
                            </Button>
                          </span>
                        ) : triggerState?.text ? (
                          <span>{triggerState.text}</span>
                        ) : (
                          <span className="text-xs text-text-muted italic">Loading trigger...</span>
                        )}
                      </TableCell>

                      {/* WL5: Static Status text (RC6) */}
                      <TableCell>
                        <span
                          className={
                            rule.enabled
                              ? "inline-block text-xs font-semibold text-accent-green"
                              : "inline-block text-xs font-semibold text-text-muted"
                          }
                        >
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </table>
          </div>

          {/* Pagination (WL11) */}
          {result.value.nextCursor ? (
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={handleNextPage}>
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
