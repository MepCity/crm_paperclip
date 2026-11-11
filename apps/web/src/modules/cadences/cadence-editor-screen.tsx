"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  activateCadence,
  deactivateCadence,
  deleteCadence,
  fetchCadence,
  publishCadence,
  updateCadenceDraft,
} from "./api";
import type {
  CadenceDetail,
  CadenceExitRule,
  CadenceModule,
  CadenceStep,
  CadenceStepDelay,
} from "./types";

interface CadenceEditorScreenProps {
  orgSlug: string;
  cadenceId: string;
}

export function CadenceEditorScreen({ orgSlug, cadenceId }: CadenceEditorScreenProps) {
  const t = useUiTranslations();
  const router = useRouter();

  const [cadence, setCadence] = useState<CadenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editor working state (steps & exit rules)
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [exitRules, setExitRules] = useState<CadenceExitRule[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Step Add/Edit Modal state
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepKind, setStepKind] = useState<"email" | "task" | "call">("email");
  const [stepDelayAmount, setStepDelayAmount] = useState<number>(0);
  const [stepDelayUnit, setStepDelayUnit] = useState<"minutes" | "hours" | "days">("days");
  // Step specific fields
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [emailName, setEmailName] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDueOffset, setTaskDueOffset] = useState<number>(0);
  const [taskPriority, setTaskPriority] = useState<
    "High" | "Highest" | "Normal" | "Low" | "Lowest"
  >("Normal");
  const [callSubject, setCallSubject] = useState("");
  const [callType, setCallType] = useState<"Outbound" | "Inbound">("Outbound");

  // Delete cadence confirm dialog
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await fetchCadence(orgSlug, cadenceId);
      setCadence(detail);
      const activeVer = detail.currentVersion ?? detail.draftVersion ?? detail.publishedVersion;
      setSteps(activeVer?.steps ?? []);
      setExitRules(activeVer?.exitRules ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cadence");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, cadenceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const moduleNameMap: Record<CadenceModule, string> = {
    Leads: t("shell.leads"),
    Contacts: t("shell.contacts"),
    Accounts: t("shell.accounts"),
    Deals: t("shell.deals"),
  };

  const openAddStepModal = (kind: "email" | "task" | "call") => {
    setEditingStepIndex(null);
    setStepKind(kind);
    setStepDelayAmount(steps.length === 0 ? 0 : 1);
    setStepDelayUnit("days");
    setEmailTemplateId("");
    setEmailName("");
    setTaskSubject("");
    setTaskDueOffset(0);
    setTaskPriority("Normal");
    setCallSubject("");
    setCallType("Outbound");
    setStepModalOpen(true);
  };

  const openEditStepModal = (index: number) => {
    const s = steps[index];
    if (!s) return;
    setEditingStepIndex(index);
    setStepKind(s.kind);
    setStepDelayAmount(s.delay.amount);
    setStepDelayUnit(s.delay.unit);

    if (s.kind === "email") {
      setEmailTemplateId(s.templateId ?? "");
      setEmailName(s.name ?? "");
    } else if (s.kind === "task") {
      setTaskSubject(s.subject);
      setTaskDueOffset(s.dueOffsetDays);
      setTaskPriority(s.priority);
    } else if (s.kind === "call") {
      setCallSubject(s.subject);
      setCallType(s.callType);
    }
    setStepModalOpen(true);
  };

  const handleSaveStep = () => {
    const delay: CadenceStepDelay = {
      amount: Math.max(0, stepDelayAmount),
      unit: stepDelayUnit,
    };

    let step: CadenceStep;
    const stepId =
      editingStepIndex !== null && steps[editingStepIndex]
        ? steps[editingStepIndex].id
        : `step-${Date.now()}`;

    if (stepKind === "email") {
      step = {
        id: stepId,
        kind: "email",
        delay,
        templateId: emailTemplateId.trim() || null,
        name: emailName.trim() || undefined,
      };
    } else if (stepKind === "task") {
      step = {
        id: stepId,
        kind: "task",
        delay,
        subject: taskSubject.trim() || t("modules.cadences.editor.stepTask"),
        dueOffsetDays: Math.max(0, taskDueOffset),
        priority: taskPriority,
      };
    } else {
      step = {
        id: stepId,
        kind: "call",
        delay,
        subject: callSubject.trim() || t("modules.cadences.editor.stepCall"),
        callType,
      };
    }

    if (editingStepIndex !== null) {
      const nextSteps = [...steps];
      nextSteps[editingStepIndex] = step;
      setSteps(nextSteps);
    } else {
      setSteps([...steps, step]);
    }
    setStepModalOpen(false);
  };

  const handleDeleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const nextSteps = [...steps];
    const current = nextSteps[index];
    const target = nextSteps[targetIndex];
    if (current && target) {
      nextSteps[index] = target;
      nextSteps[targetIndex] = current;
      setSteps(nextSteps);
    }
  };

  const toggleExitRule = (kind: "reply" | "meeting_booked" | "field_condition") => {
    const exists = exitRules.some(
      (r) => r.kind === kind || (kind === "reply" && r.kind === "on_reply"),
    );
    if (exists) {
      setExitRules(
        exitRules.filter((r) => r.kind !== kind && !(kind === "reply" && r.kind === "on_reply")),
      );
    } else {
      if (kind === "field_condition") {
        setExitRules([
          ...exitRules,
          {
            id: `exit-${Date.now()}`,
            kind: "field_condition",
            condition: {
              kind: "criteria",
              criteria: {
                field: "Lead_Status",
                comparator: "equal",
                value: "Contacted",
              },
            },
          },
        ]);
      } else {
        setExitRules([...exitRules, { id: `exit-${Date.now()}`, kind }]);
      }
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      setError(null);
      const updated = await updateCadenceDraft(orgSlug, cadenceId, {
        steps,
        exitRules,
      });
      setCadence(updated);
      setSuccessMessage(t("modules.cadences.editor.draftSaved"));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);
      // Auto-save draft before publishing if modified
      await updateCadenceDraft(orgSlug, cadenceId, {
        steps,
        exitRules,
      });
      const published = await publishCadence(orgSlug, cadenceId);
      setCadence(published);
      setSuccessMessage(t("modules.cadences.editor.publish"));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish cadence");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!cadence) return;
    try {
      setTogglingStatus(true);
      setError(null);
      if (cadence.status === "active") {
        const deactivated = await deactivateCadence(orgSlug, cadenceId);
        setCadence(deactivated);
      } else {
        const activated = await activateCadence(orgSlug, cadenceId);
        setCadence(activated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteCadence = async () => {
    try {
      setDeleting(true);
      await deleteCadence(orgSlug, cadenceId);
      router.push(`/crm/${orgSlug}/settings/cadences`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cadence");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!cadence) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12">
        <p className="text-destructive mb-4">{error ?? "Cadence not found"}</p>
        <Link href={`/crm/${orgSlug}/settings/cadences`} className="text-primary hover:underline">
          {t("modules.cadences.editor.back")}
        </Link>
      </div>
    );
  }

  const isReplyChecked = exitRules.some((r) => r.kind === "reply" || r.kind === "on_reply");
  const isMeetingChecked = exitRules.some((r) => r.kind === "meeting_booked");
  const isFieldConditionChecked = exitRules.some((r) => r.kind === "field_condition");

  const formatDelay = (delay: CadenceStepDelay) => {
    const unitLabel =
      delay.unit === "minutes"
        ? t("modules.cadences.editor.delayMinutes")
        : delay.unit === "hours"
          ? t("modules.cadences.editor.delayHours")
          : t("modules.cadences.editor.delayDays");
    return t("modules.cadences.editor.delayAfter", {
      amount: delay.amount,
      unit: unitLabel,
    });
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/crm/${orgSlug}/settings/cadences`}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={t("modules.cadences.editor.back")}
            data-testid="cadence-editor-back"
          >
            <Icons.chevronLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground" data-testid="cadence-editor-name">
                {cadence.name}
              </h1>
              <Badge variant="neutral">{moduleNameMap[cadence.module] ?? cadence.module}</Badge>
              {cadence.status === "active" ? (
                <Badge variant="success" data-testid="cadence-status-badge">
                  {t("modules.cadences.list.statusActive")}
                </Badge>
              ) : cadence.status === "inactive" ? (
                <Badge variant="neutral" data-testid="cadence-status-badge">
                  {t("modules.cadences.list.statusInactive")}
                </Badge>
              ) : (
                <Badge variant="neutral" data-testid="cadence-status-badge">
                  {t("modules.cadences.list.statusDraft")}
                </Badge>
              )}
            </div>
            {cadence.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{cadence.description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => router.push(`/crm/${orgSlug}/settings/cadences/${cadenceId}/reports`)}
            data-testid="cadence-reports-button"
          >
            {t("modules.cadences.reports.title") || "Reports"}
          </Button>

          <Button
            variant="secondary"
            onClick={handleSaveDraft}
            isDisabled={savingDraft || publishing}
            data-testid="cadence-save-draft-button"
          >
            {savingDraft ? <Spinner className="size-4" /> : t("modules.cadences.editor.saveDraft")}
          </Button>

          <Button
            variant="primary"
            onClick={handlePublish}
            isDisabled={steps.length === 0 || publishing || savingDraft}
            data-testid="cadence-publish-button"
          >
            {publishing ? <Spinner className="size-4" /> : t("modules.cadences.editor.publish")}
          </Button>

          {cadence.publishedVersionId && (
            <Button
              variant="secondary"
              onClick={handleToggleStatus}
              isDisabled={togglingStatus}
              data-testid="cadence-toggle-status-button"
            >
              {togglingStatus ? (
                <Spinner className="size-4" />
              ) : cadence.status === "active" ? (
                t("modules.cadences.editor.deactivate")
              ) : (
                t("modules.cadences.editor.activate")
              )}
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => setConfirmDeleteOpen(true)}
            data-testid="cadence-delete-button"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 mb-4 text-sm text-success bg-success/10 rounded-md">
          {successMessage}
        </div>
      )}

      {/* Main Content Layout (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Steps List (2 cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {t("modules.cadences.editor.steps")} ({steps.length})
            </h2>

            {/* Add Step Button Bar */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAddStepModal("email")}
                data-testid="add-email-step-button"
              >
                <Icons.envelope className="size-3.5 mr-1 text-primary" />
                {t("modules.cadences.editor.addEmail")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAddStepModal("task")}
                data-testid="add-task-step-button"
              >
                <Icons.check className="size-3.5 mr-1 text-accent-orange" />
                {t("modules.cadences.editor.addTask")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAddStepModal("call")}
                data-testid="add-call-step-button"
              >
                <Icons.phone className="size-3.5 mr-1 text-accent-teal" />
                {t("modules.cadences.editor.addCall")}
              </Button>
            </div>
          </div>

          {/* Steps Cards */}
          {steps.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
              <p className="text-sm">{t("modules.cadences.editor.noSteps")}</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="cadence-steps-list">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card shadow-xs hover:border-primary/50 transition-colors"
                  data-testid={`cadence-step-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-mono font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>

                    <div className="p-2 rounded-md bg-muted/60">
                      {step.kind === "email" ? (
                        <Icons.envelope className="size-4 text-primary" />
                      ) : step.kind === "task" ? (
                        <Icons.check className="size-4 text-accent-orange" />
                      ) : (
                        <Icons.phone className="size-4 text-accent-teal" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {step.kind === "email"
                            ? step.name || t("modules.cadences.editor.stepEmail")
                            : step.subject}
                        </span>
                        <Badge variant="neutral" className="text-xs">
                          {formatDelay(step.delay)}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.kind === "email"
                          ? step.templateId
                            ? `${t("modules.cadences.editor.template")}: ${step.templateId}`
                            : ""
                          : step.kind === "task"
                            ? `${t("modules.cadences.editor.priority")}: ${step.priority} · +${step.dueOffsetDays} ${t("modules.cadences.editor.delayDays")}`
                            : `${t("modules.cadences.editor.callType")}: ${step.callType}`}
                      </p>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t("modules.cadences.editor.stepMoveUp")}
                      aria-label={t("modules.cadences.editor.stepMoveUp")}
                      data-testid={`step-up-${idx}`}
                    >
                      <Icons.chevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, "down")}
                      disabled={idx === steps.length - 1}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t("modules.cadences.editor.stepMoveDown")}
                      aria-label={t("modules.cadences.editor.stepMoveDown")}
                      data-testid={`step-down-${idx}`}
                    >
                      <Icons.chevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditStepModal(idx)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title={t("modules.cadences.editor.stepEdit")}
                      aria-label={t("modules.cadences.editor.stepEdit")}
                      data-testid={`step-edit-${idx}`}
                    >
                      <Icons.fieldEdit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(idx)}
                      className="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                      title={t("modules.cadences.editor.stepDelete")}
                      aria-label={t("modules.cadences.editor.stepDelete")}
                      data-testid={`step-delete-${idx}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Audience & Exit Rules (1 col) */}
        <div className="flex flex-col space-y-6">
          {/* Audience Card */}
          <div className="p-5 rounded-lg border border-border bg-card shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-2">
              {t("modules.cadences.editor.audienceTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {(cadence.currentVersion ?? cadence.draftVersion ?? cadence.publishedVersion)
                ?.audience?.kind === "manual"
                ? t("modules.cadences.list.audienceManual")
                : `${t("modules.cadences.dialog.customView")} (${moduleNameMap[cadence.module]})`}
            </p>
          </div>

          {/* Exit Rules Card */}
          <div className="p-5 rounded-lg border border-border bg-card shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-1">
              {t("modules.cadences.editor.exitRulesTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("modules.cadences.editor.exitRulesDesc")}
            </p>

            <div className="space-y-3">
              {/* Option 1: Reply */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                  checked={isReplyChecked}
                  onChange={() => toggleExitRule("reply")}
                  data-testid="exit-rule-reply-checkbox"
                />
                <span className="text-sm text-foreground">
                  {t("modules.cadences.editor.exitOnReply")}
                </span>
              </label>

              {/* Option 2: Meeting */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                  checked={isMeetingChecked}
                  onChange={() => toggleExitRule("meeting_booked")}
                  data-testid="exit-rule-meeting-checkbox"
                />
                <span className="text-sm text-foreground">
                  {t("modules.cadences.editor.exitOnMeeting")}
                </span>
              </label>

              {/* Option 3: Field condition */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                  checked={isFieldConditionChecked}
                  onChange={() => toggleExitRule("field_condition")}
                  data-testid="exit-rule-field-checkbox"
                />
                <div>
                  <span className="text-sm text-foreground block">
                    {t("modules.cadences.editor.exitOnFieldCondition")}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {t("modules.cadences.editor.fieldConditionHint")}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Step Configure Modal */}
      {stepModalOpen && (
        <TopAlignedModal
          isOpen={stepModalOpen}
          onOpenChange={(open) => !open && setStepModalOpen(false)}
          panelClassName="max-w-md w-full"
        >
          <div
            className="flex flex-col bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-6"
            role="dialog"
            aria-modal="true"
            aria-label={t("modules.cadences.editor.stepDialogTitle")}
            data-testid="cadence-step-modal"
          >
            <h2 className="text-lg font-bold text-foreground mb-4">
              {t("modules.cadences.editor.stepDialogTitle")} (
              {stepKind === "email"
                ? t("modules.cadences.editor.stepEmail")
                : stepKind === "task"
                  ? t("modules.cadences.editor.stepTask")
                  : t("modules.cadences.editor.stepCall")}
              )
            </h2>

            <div className="space-y-4">
              {/* Delay Amount & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="step-delay-amount"
                    className="block text-xs font-semibold text-muted-foreground mb-1"
                  >
                    {t("modules.cadences.editor.delayLabel")}
                  </label>
                  <input
                    id="step-delay-amount"
                    type="number"
                    min="0"
                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    value={stepDelayAmount}
                    onChange={(e) => setStepDelayAmount(Number(e.target.value) || 0)}
                    data-testid="step-delay-amount-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="step-delay-unit"
                    className="block text-xs font-semibold text-muted-foreground mb-1"
                  >
                    {t("modules.cadences.editor.delayUnit")}
                  </label>
                  <select
                    id="step-delay-unit"
                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    value={stepDelayUnit}
                    onChange={(e) =>
                      setStepDelayUnit(e.target.value as "minutes" | "hours" | "days")
                    }
                    data-testid="step-delay-unit-select"
                  >
                    <option value="days">{t("modules.cadences.editor.delayDays")}</option>
                    <option value="hours">{t("modules.cadences.editor.delayHours")}</option>
                    <option value="minutes">{t("modules.cadences.editor.delayMinutes")}</option>
                  </select>
                </div>
              </div>

              {/* Email Step Specific Fields */}
              {stepKind === "email" && (
                <>
                  <div>
                    <label
                      htmlFor="step-email-name"
                      className="block text-xs font-semibold text-muted-foreground mb-1"
                    >
                      {t("modules.cadences.editor.subject")}
                    </label>
                    <input
                      id="step-email-name"
                      type="text"
                      className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t("modules.cadences.editor.subjectPlaceholder")}
                      value={emailName}
                      onChange={(e) => setEmailName(e.target.value)}
                      data-testid="step-email-name-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="step-email-template"
                      className="block text-xs font-semibold text-muted-foreground mb-1"
                    >
                      {t("modules.cadences.editor.template")}
                    </label>
                    <input
                      id="step-email-template"
                      type="text"
                      className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t("modules.cadences.editor.template")}
                      value={emailTemplateId}
                      onChange={(e) => setEmailTemplateId(e.target.value)}
                      data-testid="step-email-template-input"
                    />
                  </div>
                </>
              )}

              {/* Task Step Specific Fields */}
              {stepKind === "task" && (
                <>
                  <div>
                    <label
                      htmlFor="step-task-subject"
                      className="block text-xs font-semibold text-muted-foreground mb-1"
                    >
                      {t("modules.cadences.editor.subject")}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="step-task-subject"
                      type="text"
                      className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t("modules.cadences.editor.subjectPlaceholder")}
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      data-testid="step-task-subject-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="step-task-due-offset"
                        className="block text-xs font-semibold text-muted-foreground mb-1"
                      >
                        {t("modules.cadences.editor.dueOffset")}
                      </label>
                      <input
                        id="step-task-due-offset"
                        type="number"
                        min="0"
                        className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={taskDueOffset}
                        onChange={(e) => setTaskDueOffset(Number(e.target.value) || 0)}
                        data-testid="step-task-due-offset-input"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="step-task-priority"
                        className="block text-xs font-semibold text-muted-foreground mb-1"
                      >
                        {t("modules.cadences.editor.priority")}
                      </label>
                      <select
                        id="step-task-priority"
                        className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={taskPriority}
                        onChange={(e) =>
                          setTaskPriority(
                            e.target.value as "High" | "Highest" | "Normal" | "Low" | "Lowest",
                          )
                        }
                        data-testid="step-task-priority-select"
                      >
                        <option value="Normal">
                          {t("modules.cadences.editor.priorityNormal")}
                        </option>
                        <option value="High">{t("modules.cadences.editor.priorityHigh")}</option>
                        <option value="Highest">
                          {t("modules.cadences.editor.priorityHighest")}
                        </option>
                        <option value="Low">{t("modules.cadences.editor.priorityLow")}</option>
                        <option value="Lowest">
                          {t("modules.cadences.editor.priorityLowest")}
                        </option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Call Step Specific Fields */}
              {stepKind === "call" && (
                <>
                  <div>
                    <label
                      htmlFor="step-call-subject"
                      className="block text-xs font-semibold text-muted-foreground mb-1"
                    >
                      {t("modules.cadences.editor.subject")}{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="step-call-subject"
                      type="text"
                      className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t("modules.cadences.editor.subjectPlaceholder")}
                      value={callSubject}
                      onChange={(e) => setCallSubject(e.target.value)}
                      data-testid="step-call-subject-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="step-call-type"
                      className="block text-xs font-semibold text-muted-foreground mb-1"
                    >
                      {t("modules.cadences.editor.callType")}
                    </label>
                    <select
                      id="step-call-type"
                      className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      value={callType}
                      onChange={(e) => setCallType(e.target.value as "Outbound" | "Inbound")}
                      data-testid="step-call-type-select"
                    >
                      <option value="Outbound">
                        {t("modules.cadences.editor.callTypeOutbound")}
                      </option>
                      <option value="Inbound">
                        {t("modules.cadences.editor.callTypeInbound")}
                      </option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setStepModalOpen(false)}
                data-testid="step-cancel-button"
              >
                {t("modules.cadences.editor.cancelStep")}
              </Button>
              <Button variant="primary" onClick={handleSaveStep} data-testid="step-save-button">
                {t("modules.cadences.editor.saveStep")}
              </Button>
            </div>
          </div>
        </TopAlignedModal>
      )}

      {/* Delete Cadence Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDeleteCadence}
        title={t("modules.cadences.editor.deleteConfirmTitle")}
        message={t("modules.cadences.editor.deleteConfirmMessage", {
          name: cadence.name,
        })}
        confirmLabel={t("modules.cadences.editor.deleteCadence")}
        cancelLabel={t("modules.cadences.dialog.cancel")}
        tone="danger"
        busy={deleting}
      />
    </div>
  );
}
