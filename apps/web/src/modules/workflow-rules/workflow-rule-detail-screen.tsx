"use client";

import type { ReadResult, WorkflowRule } from "@crm/core/automation";
import { buttonSizes, buttonStyles } from "@/components/ui/button-styles";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useUiTranslations } from "@/i18n/client-provider";
import { formatActionKind, formatCondition, formatTiming, formatTrigger } from "./formatters";

export interface WorkflowRuleDetailScreenProps {
  orgSlug: string;
  ruleId: string;
  result: ReadResult<WorkflowRule>;
}

export function WorkflowRuleDetailScreen({
  orgSlug,
  ruleId,
  result,
}: WorkflowRuleDetailScreenProps) {
  const t = useUiTranslations();
  const listHref = `/crm/${encodeURIComponent(orgSlug)}/settings/workflow-rules`;

  return (
    <section
      aria-label={t("modules.workflow.ruleDetails")}
      className="relative min-h-screen rounded-lg border border-border bg-surface shadow-xs p-6"
    >
      {/* Return link to list (WD1 / WD6) */}
      <div className="mb-6">
        <Link
          href={listHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Icons.chevronLeft className="size-4" aria-hidden="true" />
          <span>{t("modules.workflow.backToList")}</span>
        </Link>
      </div>

      {!result.ok ? <h1 className="sr-only">{t("modules.workflow.ruleDetails")}</h1> : null}

      {/* Forbidden State (WD6) */}
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

      {/* Not Found State (WD6) */}
      {!result.ok && result.error.code === "not_found" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.error className="inline size-6 text-text-muted mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">{t("modules.workflow.notFound")}</p>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.notFoundDesc")}</p>
        </div>
      ) : null}

      {/* Error State with Retry (WD6) */}
      {!result.ok && result.error.code !== "forbidden" && result.error.code !== "not_found" ? (
        <div
          role="alert"
          className="rounded-md border border-border bg-surface-muted p-6 text-center"
        >
          <Icons.error className="inline size-6 text-accent-red mb-2" aria-hidden="true" />
          <p className="text-md font-semibold text-text">{t("modules.workflow.loadDetailError")}</p>
          <p className="text-sm text-text-muted mt-1">{t("modules.workflow.tempDetailProblem")}</p>
          <a
            href={`${listHref}/${encodeURIComponent(ruleId)}`}
            className={`mt-4 inline-flex items-center justify-center ${buttonStyles.secondary} ${buttonSizes.sm}`}
          >
            {t("modules.workflow.retry")}
          </a>
        </div>
      ) : null}

      {/* Populated Detail Screen (WD1, WD2, WD3, WD4, WD5) */}
      {result.ok ? (
        <div className="space-y-8">
          {/* WD1: Header summary */}
          <div className="border-b border-border pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-text">{result.value.name}</h1>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text">
                  {t("modules.workflow.modulePrefix", { module: result.value.module })}
                </span>
                <span
                  className={
                    result.value.enabled
                      ? "rounded-full bg-accent-green/10 px-3 py-1 text-xs font-semibold text-accent-green"
                      : "rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-muted"
                  }
                >
                  {result.value.enabled
                    ? t("modules.workflow.enabled")
                    : t("modules.workflow.disabled")}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-text-muted">
              {result.value.description || t("modules.workflow.noDescription")}
            </p>
          </div>

          {/* WD2: Trigger Region */}
          <div className="rounded-lg border border-border bg-surface-muted/30 p-5">
            <h2 className="text-base font-semibold text-text mb-2">
              {t("modules.workflow.trigger")}
            </h2>
            <div className="text-sm text-text">
              <span className="font-semibold text-text-muted mr-2">
                {t("modules.workflow.executionBasis")}
              </span>
              <span>{formatTrigger(result.value.trigger, t)}</span>
            </div>
          </div>

          {/* WD3: Condition Branches */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">
              {t("modules.workflow.conditionBranches")}
            </h2>
            {result.value.branches.length === 0 ? (
              <p className="text-sm text-text-muted italic">{t("modules.workflow.noBranches")}</p>
            ) : (
              <div className="space-y-6">
                {[...result.value.branches]
                  .sort((a, b) => a.position - b.position)
                  .map((branch) => (
                    <div
                      key={branch.id}
                      className="rounded-lg border border-border bg-surface p-5 shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="text-sm font-semibold text-text">
                          {t("modules.workflow.branch", { position: branch.position })}
                        </span>
                      </div>

                      {/* Condition criteria */}
                      <div className="text-sm">
                        <span className="font-semibold text-text-muted mr-2">
                          {t("modules.workflow.criteria")}
                        </span>
                        <code className="rounded bg-surface-muted px-2 py-1 text-xs text-text font-mono">
                          {formatCondition(branch.condition)}
                        </code>
                      </div>

                      {/* WD4: Immediate Actions */}
                      <div className="pt-2">
                        <h3 className="text-sm font-semibold text-text mb-2">
                          {t("modules.workflow.immediateActions")}
                        </h3>
                        {branch.immediate.length === 0 ? (
                          <p className="text-xs text-text-muted italic">
                            {t("modules.workflow.noImmediateActions")}
                          </p>
                        ) : (
                          <ul className="divide-y divide-border rounded-md border border-border bg-surface-muted/20">
                            {branch.immediate.map((action) => (
                              <li
                                key={action.id}
                                className="flex items-center justify-between px-3 py-2 text-xs"
                              >
                                <span className="font-semibold text-text">
                                  {formatActionKind(action.kind)}
                                </span>
                                <span className="text-text-muted font-mono">
                                  {action.definitionRef}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* WD5: Scheduled Groups */}
                      <div className="pt-2">
                        <h3 className="text-sm font-semibold text-text mb-2">
                          {t("modules.workflow.scheduledActions")}
                        </h3>
                        {branch.scheduled.length === 0 ? (
                          <p className="text-xs text-text-muted italic">
                            {t("modules.workflow.noScheduledActions")}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {branch.scheduled.map((sched) => (
                              <div
                                key={sched.id}
                                className="rounded-md border border-border bg-surface-muted/20 p-3 space-y-2"
                              >
                                <div className="text-xs font-semibold text-text">
                                  <span className="text-text-muted mr-1.5">
                                    {t("modules.workflow.timing")}
                                  </span>
                                  <span>{formatTiming(sched.timing)}</span>
                                </div>
                                <ul className="divide-y divide-border rounded border border-border bg-surface">
                                  {sched.actions.map((act) => (
                                    <li
                                      key={act.id}
                                      className="flex items-center justify-between px-3 py-1.5 text-xs"
                                    >
                                      <span className="font-semibold text-text">
                                        {formatActionKind(act.kind)}
                                      </span>
                                      <span className="text-text-muted font-mono">
                                        {act.definitionRef}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
