"use client";

import type { ReadResult, RulePage, WorkflowRule } from "@crm/core/automation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonSizes, buttonStyles } from "@/components/ui/button-styles";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUiTranslations } from "@/i18n/client-provider";
import { formatTrigger } from "./formatters";
import { WorkflowCreate } from "./workflow-create";

export interface WorkflowRulesListScreenProps {
  orgSlug: string;
  result: ReadResult<RulePage>;
  triggerResults: Record<string, ReadResult<WorkflowRule>>;
  module?: string;
  cursor?: string;
}

const DEFAULT_MODULES = ["Leads", "Contacts", "Accounts", "Deals"];

export function WorkflowRulesListScreen({
  orgSlug,
  result,
  triggerResults,
  module,
  cursor,
}: WorkflowRulesListScreenProps) {
  const t = useUiTranslations();
  const [creating, setCreating] = useState(false);
  const selectedModule = module ?? "all";
  const base = `/crm/${encodeURIComponent(orgSlug)}/settings/workflow-rules`;
  const href = (nextCursor?: string) => {
    const query = new URLSearchParams();
    if (module) query.set("module", module);
    if (nextCursor) query.set("cursor", nextCursor);
    return `${base}${query.size ? `?${query}` : ""}`;
  };

  return (
    <section
      aria-label={t("modules.workflow.workflowRules")}
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs p-6"
    >
      {creating && <WorkflowCreate onClose={() => setCreating(false)} />}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text">{t("modules.workflow.workflowRules")}</h2>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.description")}</p>
        </div>

        {result.ok && (
          <Button onPress={() => setCreating(true)}>{t("modules.observedFlows.createRule")}</Button>
        )}
        {/* Module Filter (WL6) */}
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-module-filter" className="text-sm font-semibold text-text">
            {t("modules.workflow.filterByModule")}
          </label>
          <select
            id="workflow-module-filter"
            aria-label={t("modules.workflow.filterAriaLabel")}
            value={selectedModule}
            onChange={(e) => {
              const query = new URLSearchParams();
              if (e.target.value !== "all") query.set("module", e.target.value);
              window.location.assign(`${base}${query.size ? `?${query}` : ""}`);
            }}
            className="h-9 rounded-md border border-border bg-surface px-3 py-1 text-sm text-text shadow-xs focus:border-primary focus:outline-none"
          >
            <option value="all">{t("modules.workflow.allModules")}</option>
            {DEFAULT_MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Access Denied (WL9) */}
      {!result.ok && result.error.code === "forbidden" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.warning className="inline size-6 text-accent-orange mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">{t("modules.workflow.accessDenied")}</p>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.noPermission")}</p>
        </div>
      ) : null}

      {/* Read failure / Error with Retry (WL10) */}
      {!result.ok && result.error.code !== "forbidden" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.error className="inline size-6 text-accent-red mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">{t("modules.workflow.loadError")}</p>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.tempProblem")}</p>
          <a
            href={href(cursor)}
            className={`mt-4 inline-flex items-center justify-center ${buttonStyles.secondary} ${buttonSizes.sm}`}
          >
            {t("modules.workflow.retry")}
          </a>
        </div>
      ) : null}

      {/* Empty State (WL8) */}
      {result.ok && result.value.items.length === 0 ? (
        <div
          data-testid="workflow-empty-state"
          className="rounded-md border border-dashed border-border p-12 text-center"
        >
          <p className="text-md font-semibold text-text">
            {selectedModule === "all"
              ? t("modules.workflow.emptyAll")
              : t("modules.workflow.emptyModule", { module: selectedModule })}
          </p>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.emptyDescription")}</p>
        </div>
      ) : null}

      {/* Populated Table (WL1, WL2, WL3, WL4, WL5) */}
      {result.ok && result.value.items.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="w-full overflow-auto contain-paint">
            <table
              aria-label={t("modules.workflow.tableAriaLabel")}
              className="w-full text-left text-sm"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>{t("modules.workflow.name")}</TableHead>
                  <TableHead>{t("modules.workflow.module")}</TableHead>
                  <TableHead>{t("modules.workflow.trigger")}</TableHead>
                  <TableHead>{t("modules.workflow.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.value.items.map((rule) => {
                  const triggerResult = triggerResults[rule.id];
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
                        {triggerResult?.ok ? (
                          <span>{formatTrigger(triggerResult.value.trigger, t)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-accent-red">
                            {t("modules.workflow.triggerUnavailable")}
                            <a
                              href={href(cursor)}
                              aria-label={`Retry loading trigger for ${rule.name}`}
                              className={`inline-flex items-center justify-center ${buttonStyles.ghost} ${buttonSizes.sm} h-6 px-1.5 text-xs text-text hover:bg-surface-hover`}
                            >
                              {t("modules.workflow.retry")}
                            </a>
                          </span>
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
                          {rule.enabled
                            ? t("modules.workflow.enabled")
                            : t("modules.workflow.disabled")}
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
              <a
                href={href(result.value.nextCursor)}
                className={`inline-flex items-center justify-center ${buttonStyles.secondary} ${buttonSizes.sm}`}
              >
                {t("modules.workflow.nextPage")}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
