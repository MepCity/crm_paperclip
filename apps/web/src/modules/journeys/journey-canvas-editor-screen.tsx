"use client";

import { ArrowLeft, ArrowRight, BarChart2, Clock, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  activateJourney,
  deactivateJourney,
  deleteJourney,
  fetchJourney,
  publishJourney,
  updateJourneyDraft,
} from "./api";
import { ParticipatingRecordsTab } from "./participating-records-tab";
import type {
  JourneyAction,
  JourneyDeadline,
  JourneyDetail,
  JourneyModule,
  JourneyState,
  JourneyTransition,
  JourneyTrigger,
} from "./types";

interface JourneyCanvasEditorScreenProps {
  orgSlug: string;
  journeyId: string;
}

export function JourneyCanvasEditorScreen({ orgSlug, journeyId }: JourneyCanvasEditorScreenProps) {
  const t = useUiTranslations();
  const router = useRouter();

  const [journey, setJourney] = useState<JourneyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"canvas" | "records">("canvas");

  // Canvas Working State
  const [states, setStates] = useState<JourneyState[]>([]);
  const [transitions, setTransitions] = useState<JourneyTransition[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);

  // Operations state
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await fetchJourney(orgSlug, journeyId);
      setJourney(detail);
      const activeVer = detail.currentVersion ?? detail.draftVersion ?? detail.activeVersion;
      const initialStates = activeVer?.states ?? [];
      setStates(initialStates);
      setTransitions(activeVer?.transitions ?? []);
      setSelectedStateId((prev) => prev ?? initialStates[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load journey");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, journeyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // State operations
  const handleAddState = () => {
    const newStateId = `state_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newStateNumber = states.length + 1;
    const isFirst = states.length === 0;
    const newState: JourneyState = {
      id: newStateId,
      name: `State ${newStateNumber}`,
      isStart: isFirst,
      actions: [],
      deadline: null,
    };
    setStates((prev) => [...prev, newState]);
    setSelectedStateId(newStateId);
    setSelectedTransitionId(null);
  };

  const handleDeleteState = (stateId: string) => {
    setStates((prev) => prev.filter((s) => s.id !== stateId));
    // Remove transitions referencing this state
    setTransitions((prev) => prev.filter((t) => t.from !== stateId && t.to !== stateId));
    if (selectedStateId === stateId) {
      setSelectedStateId(null);
    }
  };

  const handleUpdateSelectedState = (updates: Partial<JourneyState>) => {
    if (!selectedStateId) return;
    setStates((prev) =>
      prev.map((s) => {
        if (s.id === selectedStateId) {
          return { ...s, ...updates };
        }
        // If designating as start state, clear isStart on other states
        if (updates.isStart === true) {
          return { ...s, isStart: false };
        }
        return s;
      }),
    );
  };

  // Transition operations
  const handleAddTransition = () => {
    if (states.length < 2) {
      setError("At least two states are required to create a transition.");
      return;
    }
    const startState = states.find((s) => s.isStart) ?? states[0];
    if (!startState) return;

    let fromId = startState.id;
    let toId = states.find((s) => s.id !== startState.id)?.id ?? startState.id;

    if (selectedStateId && selectedStateId !== startState.id) {
      fromId = startState.id;
      toId = selectedStateId;
    } else if (selectedStateId && selectedStateId === startState.id) {
      fromId = startState.id;
      toId = states.find((s) => s.id !== startState.id)?.id ?? startState.id;
    }

    const newTransId = `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newTrans: JourneyTransition = {
      id: newTransId,
      from: fromId,
      to: toId,
      trigger: "record_updated",
      criteria: null,
      actions: [],
    };
    setTransitions((prev) => [...prev, newTrans]);
    setSelectedTransitionId(newTransId);
    setSelectedStateId(null);
  };

  const handleDeleteTransition = (transId: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== transId));
    if (selectedTransitionId === transId) {
      setSelectedTransitionId(null);
    }
  };

  const handleUpdateSelectedTransition = (updates: Partial<JourneyTransition>) => {
    if (!selectedTransitionId) return;
    setTransitions((prev) =>
      prev.map((t) => (t.id === selectedTransitionId ? { ...t, ...updates } : t)),
    );
  };

  // State Actions
  const handleAddActionToSelectedState = (kind: JourneyAction["kind"]) => {
    if (!selectedStateId) return;
    const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let newAction: JourneyAction;

    switch (kind) {
      case "email":
        newAction = {
          id: actionId,
          kind: "email",
          timing: "immediate",
          templateId: "",
        };
        break;
      case "task":
        newAction = {
          id: actionId,
          kind: "task",
          timing: "immediate",
          subject: "Follow-up Task",
          dueOffsetDays: 1,
          priority: "Normal",
        };
        break;
      case "call":
        newAction = {
          id: actionId,
          kind: "call",
          timing: "immediate",
          subject: "Outreach Call",
          callType: "Outbound",
        };
        break;
      case "field_update":
        newAction = {
          id: actionId,
          kind: "field_update",
          timing: "immediate",
          field: "Status",
          value: "In Progress",
        };
        break;
      default:
        newAction = {
          id: actionId,
          kind: "notify_user",
          timing: "immediate",
          userRef: "owner",
          message: "Record entered state",
        };
        break;
    }

    setStates((prev) =>
      prev.map((s) =>
        s.id === selectedStateId ? { ...s, actions: [...s.actions, newAction] } : s,
      ),
    );
  };

  const handleDeleteActionFromSelectedState = (actionId: string) => {
    if (!selectedStateId) return;
    setStates((prev) =>
      prev.map((s) =>
        s.id === selectedStateId
          ? { ...s, actions: s.actions.filter((a) => a.id !== actionId) }
          : s,
      ),
    );
  };

  const handleUpdateActionInSelectedState = (actionId: string, updates: Partial<JourneyAction>) => {
    if (!selectedStateId) return;
    setStates((prev) =>
      prev.map((s) =>
        s.id === selectedStateId
          ? {
              ...s,
              actions: s.actions.map((a) =>
                a.id === actionId ? ({ ...a, ...updates } as JourneyAction) : a,
              ),
            }
          : s,
      ),
    );
  };

  // Draft, Publish, Status Handlers
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      setError(null);
      const updated = await updateJourneyDraft(orgSlug, journeyId, {
        states,
        transitions,
      });
      setJourney(updated);
      setSuccessMessage(t("modules.journeys.editor.draftSaved"));
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
      // Auto-save draft before publishing
      await updateJourneyDraft(orgSlug, journeyId, {
        states,
        transitions,
      });
      const published = await publishJourney(orgSlug, journeyId);
      setJourney(published);
      setSuccessMessage(t("modules.journeys.editor.publish"));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish journey");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!journey) return;
    try {
      setTogglingStatus(true);
      setError(null);
      if (journey.status === "active") {
        const deactivated = await deactivateJourney(orgSlug, journeyId);
        setJourney(deactivated);
      } else {
        const activated = await activateJourney(orgSlug, journeyId);
        setJourney(activated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteJourney(orgSlug, journeyId);
      router.push(`/crm/${orgSlug}/settings/commandcenter/journey-builder`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete journey");
      setDeleting(false);
    }
  };

  const selectedState = states.find((s) => s.id === selectedStateId);
  const selectedTransition = transitions.find((t) => t.id === selectedTransitionId);

  const moduleNameMap: Record<JourneyModule, string> = {
    Leads: t("shell.leads"),
    Contacts: t("shell.contacts"),
    Accounts: t("shell.accounts"),
    Deals: t("shell.deals"),
  };

  const getTriggerLabel = (trigger: JourneyTrigger) => {
    const rawKind =
      typeof trigger === "string"
        ? trigger
        : "kind" in trigger
          ? trigger.kind
          : "type" in trigger
            ? trigger.type
            : "record_created";
    switch (rawKind) {
      case "record_created":
        return t("modules.journeys.editor.triggerRecordCreated");
      case "record_updated":
        return t("modules.journeys.editor.triggerRecordUpdated");
      case "webform_submitted":
        return t("modules.journeys.editor.triggerWebformSubmitted");
      case "date_reached":
        return t("modules.journeys.editor.triggerDateReached");
      case "deadline_missed":
        return t("modules.journeys.editor.triggerDeadlineMissed");
      default:
        return rawKind;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Journey not found.{" "}
        <Link href={`/crm/${orgSlug}/settings/commandcenter/journey-builder`}>Return to list</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/crm/${orgSlug}/settings/commandcenter/journey-builder`}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            data-testid="journey-editor-back"
            aria-label={t("modules.journeys.editor.back")}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-bold text-foreground tracking-tight"
                data-testid="journey-editor-name"
              >
                {journey.name}
              </h1>
              <Badge variant="neutral" className="text-xs">
                {moduleNameMap[journey.module]}
              </Badge>
              <Badge
                variant={
                  journey.status === "active"
                    ? "success"
                    : journey.status === "draft"
                      ? "warning"
                      : "neutral"
                }
                data-testid="journey-status-badge"
              >
                {journey.status === "active"
                  ? t("modules.journeys.list.statusActive")
                  : journey.status === "draft"
                    ? t("modules.journeys.list.statusDraft")
                    : t("modules.journeys.list.statusInactive")}
              </Badge>
            </div>
            {journey.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {journey.description}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onPress={handleAddState}
            data-testid="add-state-button"
            className="flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>{t("modules.journeys.editor.addState")}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onPress={handleAddTransition}
            data-testid="add-transition-button"
            className="flex items-center gap-1.5"
            isDisabled={states.length < 2}
          >
            <ArrowRight className="size-3.5" />
            <span>{t("modules.journeys.editor.addTransition")}</span>
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          <Button
            variant="secondary"
            size="sm"
            onPress={handleSaveDraft}
            isDisabled={savingDraft || publishing}
            data-testid="journey-save-draft-button"
          >
            {savingDraft ? (
              <Spinner className="size-3.5" />
            ) : (
              t("modules.journeys.editor.saveDraft")
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onPress={handlePublish}
            isDisabled={publishing || savingDraft}
            data-testid="journey-publish-button"
          >
            {publishing ? <Spinner className="size-3.5" /> : t("modules.journeys.editor.publish")}
          </Button>

          {journey.activeVersionId && (
            <Button
              variant="secondary"
              size="sm"
              onPress={handleToggleStatus}
              isDisabled={togglingStatus}
              data-testid="journey-toggle-status-button"
            >
              {togglingStatus ? (
                <Spinner className="size-3.5" />
              ) : journey.status === "active" ? (
                t("modules.journeys.editor.deactivate")
              ) : (
                t("modules.journeys.editor.activate")
              )}
            </Button>
          )}

          <Link
            href={`/crm/${orgSlug}/settings/commandcenter/journey-builder/${journeyId}/reports`}
            data-testid="journey-reports-button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold shadow-xs"
          >
            <BarChart2 className="size-3.5" />
            <span>{t("modules.journeys.reports.title") || "Reports"}</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10 p-1.5"
            onPress={() => setConfirmDeleteOpen(true)}
            data-testid="delete-journey-button"
            aria-label={t("modules.journeys.editor.delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* View Mode Tabs Bar */}
      <div className="flex items-center gap-6 px-6 border-b border-border bg-card shrink-0">
        <button
          type="button"
          onClick={() => setActiveViewTab("canvas")}
          data-testid="tab-canvas"
          className={`py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeViewTab === "canvas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("modules.journeys.editor.tabCanvas") || "Canvas"}
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab("records")}
          data-testid="tab-participating-records"
          className={`py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeViewTab === "records"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("modules.journeys.participants.title") || "Participating Records"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div
          className="mx-6 mt-3 p-3 bg-danger/10 border border-danger/20 rounded-md text-xs text-danger flex items-center justify-between shrink-0"
          data-testid="publish-error-alert"
        >
          <span className="font-semibold whitespace-pre-wrap">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger hover:underline ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mt-3 p-3 bg-success/10 border border-success/20 rounded-md text-xs text-success flex items-center justify-between shrink-0">
          <span className="font-semibold">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-success hover:underline ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace: Canvas or Participating Records */}
      {activeViewTab === "records" ? (
        <ParticipatingRecordsTab
          orgSlug={orgSlug}
          journeyId={journeyId}
          states={states}
          transitions={transitions}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div
            className="flex-1 overflow-auto p-8 bg-muted/20 relative"
            data-testid="journey-canvas"
          >
            {states.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No states in this journey yet. Click "Add State" to begin.
                </p>
                <Button variant="primary" size="sm" onPress={handleAddState}>
                  {t("modules.journeys.editor.addState")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                {/* States Row / Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {states.map((st) => {
                    const isSelected = selectedStateId === st.id;
                    const outgoing = transitions.filter((t) => t.from === st.id);
                    const incoming = transitions.filter((t) => t.to === st.id);

                    return (
                      /* biome-ignore lint/a11y/useSemanticElements: card wraps interactive details and delete button */
                      <div
                        key={st.id}
                        role="button"
                        tabIndex={0}
                        data-testid={`journey-state-card-${st.id}`}
                        className={`bg-card rounded-lg border p-4 shadow-sm cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-md"
                            : "border-border hover:border-primary/50"
                        }`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedStateId(st.id);
                            setSelectedTransitionId(null);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStateId(st.id);
                          setSelectedTransitionId(null);
                        }}
                      >
                        {/* State Card Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold text-sm text-foreground"
                              data-testid={`state-name-${st.id}`}
                            >
                              {st.name}
                            </span>
                            {st.isStart && (
                              <Badge
                                variant="success"
                                className="text-[10px] py-0 px-1.5"
                                data-testid={`start-badge-${st.id}`}
                              >
                                {t("modules.journeys.editor.startBadge")}
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-danger p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteState(st.id);
                            }}
                            title="Delete State"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* State Details */}
                        <div className="space-y-2 text-xs text-muted-foreground">
                          {st.deadline && (
                            <div className="inline-flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded text-[11px]">
                              <Clock className="size-3" />
                              <span>
                                {t("modules.journeys.editor.deadlineLabel")}: {st.deadline.amount}{" "}
                                {st.deadline.unit}
                              </span>
                            </div>
                          )}

                          <div>
                            <div className="font-semibold text-[11px] text-foreground mb-1">
                              {t("modules.journeys.editor.actions")} ({st.actions.length})
                            </div>
                            {st.actions.length === 0 ? (
                              <span className="text-muted-foreground italic">
                                {t("modules.journeys.editor.noActions")}
                              </span>
                            ) : (
                              <ul className="space-y-1">
                                {st.actions.map((act) => (
                                  <li
                                    key={act.id}
                                    className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded"
                                  >
                                    <span className="capitalize font-semibold text-foreground">
                                      {act.kind.replace("_", " ")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {typeof act.timing === "string"
                                        ? act.timing
                                        : "amount" in act.timing
                                          ? `${act.timing.amount} ${act.timing.unit}`
                                          : "immediate"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Transition Connections Indicator */}
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                            <span>In: {incoming.length}</span>
                            <span>Out: {outgoing.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Transitions List in Canvas */}
                {transitions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
                      Transitions ({transitions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transitions.map((tr) => {
                        const fromState = states.find((s) => s.id === tr.from);
                        const toState = states.find((s) => s.id === tr.to);
                        const isSelected = selectedTransitionId === tr.id;

                        return (
                          /* biome-ignore lint/a11y/useSemanticElements: card wraps interactive details and delete button */
                          <div
                            key={tr.id}
                            role="button"
                            tabIndex={0}
                            data-testid={`journey-transition-card-${tr.id}`}
                            className={`bg-card rounded-lg border p-3.5 shadow-sm cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 shadow-md"
                                : "border-border hover:border-primary/50"
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTransitionId(tr.id);
                                setSelectedStateId(null);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransitionId(tr.id);
                              setSelectedStateId(null);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                <span>{fromState?.name ?? tr.from}</span>
                                <ArrowRight className="size-3.5 text-primary" />
                                <span>{toState?.name ?? tr.to}</span>
                              </div>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-danger p-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTransition(tr.id);
                                }}
                                title="Delete Transition"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center justify-between">
                              <span className="bg-muted/50 px-2 py-0.5 rounded text-[11px]">
                                {getTriggerLabel(tr.trigger)}
                              </span>
                              {tr.actions.length > 0 && (
                                <span className="text-[11px] font-semibold text-foreground">
                                  {tr.actions.length} action(s)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right-side Property Panel */}
          <div
            className="w-80 sm:w-96 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto"
            data-testid="journey-property-panel"
          >
            {selectedState ? (
              /* State Properties Panel */
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="font-semibold text-sm text-foreground">
                    {t("modules.journeys.editor.stateProperties")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10 text-xs px-2 py-1"
                    onClick={() => handleDeleteState(selectedState.id)}
                    data-testid="delete-state-button"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    {t("modules.journeys.editor.delete")}
                  </Button>
                </div>

                {/* State Name */}
                <div>
                  <label
                    htmlFor="selected-state-name-input"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    {t("modules.journeys.editor.stateName")}
                  </label>
                  <input
                    id="selected-state-name-input"
                    type="text"
                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                    value={selectedState.name}
                    onChange={(e) => handleUpdateSelectedState({ name: e.target.value })}
                    data-testid="state-name-input"
                  />
                </div>

                {/* Is Start State */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="is-start-checkbox"
                    type="checkbox"
                    className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                    checked={selectedState.isStart ?? false}
                    onChange={(e) => handleUpdateSelectedState({ isStart: e.target.checked })}
                    data-testid="state-is-start-checkbox"
                  />
                  <label
                    htmlFor="is-start-checkbox"
                    className="text-xs text-foreground font-semibold cursor-pointer"
                  >
                    {t("modules.journeys.editor.isStart")}
                    <p className="text-[11px] text-muted-foreground font-normal">
                      {t("modules.journeys.editor.isStartDesc")}
                    </p>
                  </label>
                </div>

                {/* Deadline Configuration */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="deadline-toggle"
                      className="text-xs font-semibold text-foreground cursor-pointer"
                    >
                      {t("modules.journeys.editor.deadlineLabel")}
                    </label>
                    <input
                      id="deadline-toggle"
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary"
                      checked={Boolean(selectedState.deadline)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleUpdateSelectedState({
                            deadline: { amount: 3, unit: "days" },
                          });
                        } else {
                          handleUpdateSelectedState({ deadline: null });
                        }
                      }}
                      data-testid="state-deadline-toggle"
                    />
                  </div>

                  {selectedState.deadline && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <input
                          type="number"
                          min="1"
                          aria-label="Deadline amount"
                          className="w-full px-2.5 py-1 text-xs bg-background border border-border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          value={selectedState.deadline.amount}
                          onChange={(e) => {
                            if (!selectedState.deadline) return;
                            handleUpdateSelectedState({
                              deadline: {
                                ...selectedState.deadline,
                                amount: Math.max(1, parseInt(e.target.value, 10) || 1),
                              },
                            });
                          }}
                          data-testid="state-deadline-amount"
                        />
                      </div>
                      <div>
                        <select
                          aria-label="Deadline unit"
                          className="w-full px-2.5 py-1 text-xs bg-background border border-border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          value={selectedState.deadline.unit}
                          onChange={(e) => {
                            if (!selectedState.deadline) return;
                            handleUpdateSelectedState({
                              deadline: {
                                ...selectedState.deadline,
                                unit: e.target.value as JourneyDeadline["unit"],
                              },
                            });
                          }}
                          data-testid="state-deadline-unit"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Configuration */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {t("modules.journeys.editor.actions")}
                    </h3>
                    <div className="flex items-center gap-1">
                      <select
                        className="px-2 py-0.5 text-xs bg-background border border-border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddActionToSelectedState(e.target.value as JourneyAction["kind"]);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        data-testid="add-state-action-select"
                      >
                        <option value="" disabled>
                          + Add Action
                        </option>
                        <option value="email">{t("modules.journeys.editor.actionEmail")}</option>
                        <option value="task">{t("modules.journeys.editor.actionTask")}</option>
                        <option value="call">{t("modules.journeys.editor.actionCall")}</option>
                        <option value="field_update">
                          {t("modules.journeys.editor.actionFieldUpdate")}
                        </option>
                        <option value="notify_user">
                          {t("modules.journeys.editor.actionNotifyUser")}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedState.actions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        {t("modules.journeys.editor.noActions")}
                      </p>
                    ) : (
                      selectedState.actions.map((act, index) => (
                        <div
                          key={act.id}
                          className="p-3 bg-muted/30 border border-border rounded-md text-xs space-y-2"
                          data-testid={`state-action-${index}`}
                        >
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span className="capitalize">{act.kind.replace("_", " ")}</span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-danger"
                              onClick={() => handleDeleteActionFromSelectedState(act.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          {/* Kind-specific configuration */}
                          {act.kind === "email" && (
                            <div>
                              <label className="block text-[11px] text-muted-foreground mb-0.5">
                                Template ID
                                <input
                                  type="text"
                                  className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                  value={act.templateId ?? ""}
                                  placeholder="template_123"
                                  onChange={(e) =>
                                    handleUpdateActionInSelectedState(act.id, {
                                      templateId: e.target.value,
                                    })
                                  }
                                  data-testid="action-template-id"
                                />
                              </label>
                            </div>
                          )}

                          {act.kind === "task" && (
                            <div className="space-y-1.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Subject
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.subject}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        subject: e.target.value,
                                      })
                                    }
                                    data-testid="action-task-subject"
                                  />
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                                    Due Offset (Days)
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                      value={act.dueOffsetDays}
                                      onChange={(e) =>
                                        handleUpdateActionInSelectedState(act.id, {
                                          dueOffsetDays: parseInt(e.target.value, 10) || 0,
                                        })
                                      }
                                    />
                                  </label>
                                </div>
                                <div>
                                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                                    Priority
                                    <select
                                      className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                      value={act.priority}
                                      onChange={(e) =>
                                        handleUpdateActionInSelectedState(act.id, {
                                          priority: e.target.value as "Normal" | "High" | "Low",
                                        })
                                      }
                                    >
                                      <option value="Normal">Normal</option>
                                      <option value="High">High</option>
                                      <option value="Low">Low</option>
                                    </select>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}

                          {act.kind === "call" && (
                            <div className="space-y-1.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Subject
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.subject}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        subject: e.target.value,
                                      })
                                    }
                                    data-testid="action-call-subject"
                                  />
                                </label>
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Call Type
                                  <select
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.callType}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        callType: e.target.value as "Inbound" | "Outbound",
                                      })
                                    }
                                  >
                                    <option value="Outbound">Outbound</option>
                                    <option value="Inbound">Inbound</option>
                                  </select>
                                </label>
                              </div>
                            </div>
                          )}

                          {act.kind === "field_update" && (
                            <div className="space-y-1.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Field
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.field}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        field: e.target.value,
                                      })
                                    }
                                    data-testid="action-field-name"
                                  />
                                </label>
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Value
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={String(act.value ?? "")}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        value: e.target.value,
                                      })
                                    }
                                    data-testid="action-field-value"
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {act.kind === "notify_user" && (
                            <div className="space-y-1.5">
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  User Ref
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.userRef}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        userRef: e.target.value,
                                      })
                                    }
                                    data-testid="action-user-ref"
                                  />
                                </label>
                              </div>
                              <div>
                                <label className="block text-[11px] text-muted-foreground mb-0.5">
                                  Message
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                    value={act.message}
                                    onChange={(e) =>
                                      handleUpdateActionInSelectedState(act.id, {
                                        message: e.target.value,
                                      })
                                    }
                                    data-testid="action-message"
                                  />
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Timing setting */}
                          <div className="pt-1.5 border-t border-border/50">
                            <label className="block text-[11px] text-muted-foreground mb-0.5">
                              Execution Timing
                              <select
                                className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                                value={typeof act.timing === "string" ? act.timing : "after"}
                                onChange={(e) => {
                                  if (e.target.value === "immediate") {
                                    handleUpdateActionInSelectedState(act.id, {
                                      timing: "immediate",
                                    });
                                  } else {
                                    handleUpdateActionInSelectedState(act.id, {
                                      timing: { amount: 1, unit: "days" },
                                    });
                                  }
                                }}
                              >
                                <option value="immediate">Immediate</option>
                                <option value="after">After delay</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : selectedTransition ? (
              /* Transition Properties Panel */
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="font-semibold text-sm text-foreground">
                    {t("modules.journeys.editor.transitionProperties")}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10 text-xs px-2 py-1"
                    onPress={() => handleDeleteTransition(selectedTransition.id)}
                    data-testid="delete-transition-button"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    {t("modules.journeys.editor.delete")}
                  </Button>
                </div>

                {/* Source State */}
                <div>
                  <label
                    htmlFor="transition-from-select"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    {t("modules.journeys.editor.sourceState")}
                  </label>
                  <select
                    id="transition-from-select"
                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    value={selectedTransition.from}
                    onChange={(e) => handleUpdateSelectedTransition({ from: e.target.value })}
                    data-testid="transition-from-select"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isStart ? "(Start)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target State */}
                <div>
                  <label
                    htmlFor="transition-to-select"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    {t("modules.journeys.editor.targetState")}
                  </label>
                  <select
                    id="transition-to-select"
                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    value={selectedTransition.to}
                    onChange={(e) => handleUpdateSelectedTransition({ to: e.target.value })}
                    data-testid="transition-to-select"
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isStart ? "(Start)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trigger Type */}
                <div className="pt-3 border-t border-border">
                  <label
                    htmlFor="transition-trigger-select"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    {t("modules.journeys.editor.trigger")}
                  </label>
                  <select
                    id="transition-trigger-select"
                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    value={
                      typeof selectedTransition.trigger === "string"
                        ? selectedTransition.trigger
                        : "kind" in selectedTransition.trigger
                          ? selectedTransition.trigger.kind
                          : "type" in selectedTransition.trigger
                            ? selectedTransition.trigger.type
                            : "record_created"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "webform_submitted") {
                        handleUpdateSelectedTransition({
                          trigger: { kind: "webform_submitted", formId: "form_1" },
                        });
                      } else if (val === "date_reached") {
                        handleUpdateSelectedTransition({
                          trigger: {
                            kind: "date_reached",
                            field: "Created_Time",
                            offset: { amount: 1, unit: "days" },
                          },
                        });
                      } else {
                        handleUpdateSelectedTransition({
                          trigger: val as "record_created" | "record_updated" | "deadline_missed",
                        });
                      }
                    }}
                    data-testid="transition-trigger-select"
                  >
                    <option value="record_created">
                      {t("modules.journeys.editor.triggerRecordCreated")}
                    </option>
                    <option value="record_updated">
                      {t("modules.journeys.editor.triggerRecordUpdated")}
                    </option>
                    <option value="webform_submitted">
                      {t("modules.journeys.editor.triggerWebformSubmitted")}
                    </option>
                    <option value="date_reached">
                      {t("modules.journeys.editor.triggerDateReached")}
                    </option>
                    <option value="deadline_missed">
                      {t("modules.journeys.editor.triggerDeadlineMissed")}
                    </option>
                  </select>
                </div>

                {/* Trigger specifics */}
                {typeof selectedTransition.trigger === "object" &&
                  ("kind" in selectedTransition.trigger ||
                    "type" in selectedTransition.trigger) && (
                    <div className="p-3 bg-muted/30 border border-border rounded-md text-xs space-y-2">
                      {("kind" in selectedTransition.trigger
                        ? selectedTransition.trigger.kind
                        : selectedTransition.trigger.type) === "webform_submitted" && (
                        <div>
                          <label className="block text-[11px] text-muted-foreground mb-0.5">
                            Webform ID
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                              value={
                                (selectedTransition.trigger as { formId: string }).formId ?? ""
                              }
                              onChange={(e) =>
                                handleUpdateSelectedTransition({
                                  trigger: {
                                    kind: "webform_submitted",
                                    formId: e.target.value,
                                  },
                                })
                              }
                              data-testid="transition-form-id"
                            />
                          </label>
                        </div>
                      )}
                      {("kind" in selectedTransition.trigger
                        ? selectedTransition.trigger.kind
                        : selectedTransition.trigger.type) === "date_reached" && (
                        <div>
                          <label className="block text-[11px] text-muted-foreground mb-0.5">
                            Date Field
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-xs bg-background border border-border rounded text-foreground mt-0.5"
                              value={(selectedTransition.trigger as { field: string }).field ?? ""}
                              onChange={(e) =>
                                handleUpdateSelectedTransition({
                                  trigger: {
                                    kind: "date_reached",
                                    field: e.target.value,
                                  },
                                })
                              }
                              data-testid="transition-date-field"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <h2 className="font-semibold text-sm text-foreground border-b border-border pb-2">
                  {t("modules.journeys.editor.journeyOverview")}
                </h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Name</span>
                    <span className="font-semibold text-foreground">{journey.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Module</span>
                    <span className="font-semibold text-foreground">
                      {moduleNameMap[journey.module]}
                    </span>
                  </div>
                  {journey.description && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Description</span>
                      <span className="text-foreground">{journey.description}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div className="p-2.5 bg-muted/40 rounded">
                      <span className="text-muted-foreground block text-[11px]">States</span>
                      <span className="text-base font-bold text-foreground">{states.length}</span>
                    </div>
                    <div className="p-2.5 bg-muted/40 rounded">
                      <span className="text-muted-foreground block text-[11px]">Transitions</span>
                      <span className="text-base font-bold text-foreground">
                        {transitions.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-[11px] pt-2">
                    Select a state or transition on the canvas to configure its properties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onOpenChange={(open) => !open && setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t("modules.journeys.editor.deleteConfirmTitle")}
        message={t("modules.journeys.editor.deleteConfirmMessage", { name: journey.name })}
        tone="danger"
        confirmLabel={deleting ? "Deleting..." : t("modules.journeys.editor.delete")}
        cancelLabel={t("modules.journeys.dialog.cancel")}
      />
    </div>
  );
}
