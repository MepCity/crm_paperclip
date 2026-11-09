"use client";

import { formatDate } from "@crm/core/format";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { useFormat } from "@/lib/format-context";
import {
  activateWebform,
  createAutoResponseRule,
  createWebform,
  deactivateWebform,
  deleteAutoResponseRule,
  deleteWebform,
  fetchAutoResponseRules,
  fetchWebforms,
  reorderAutoResponseRules,
  updateAutoResponseRule,
} from "./api";
import type { Webform, WebformAutoResponseRule, WebformModule } from "./types";

interface WebformsListScreenProps {
  orgSlug: string;
}

export function WebformsListScreen({ orgSlug }: WebformsListScreenProps) {
  const t = useUiTranslations();
  const orgFormat = useFormat();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"webforms" | "auto-response-rules">("webforms");

  // Webforms state
  const [forms, setForms] = useState<Webform[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [formsError, setFormsError] = useState<string | null>(null);

  // Create Form Dialog state (W2)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formModule, setFormModule] = useState<WebformModule>("Leads");
  const [formLayout, setFormLayout] = useState("Standard Layout");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Form state
  const [deleteFormTarget, setDeleteFormTarget] = useState<Webform | null>(null);
  const [deletingForm, setDeletingForm] = useState(false);

  // Auto-response rules state
  const [rules, setRules] = useState<WebformAutoResponseRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleModuleFilter, setRuleModuleFilter] = useState<string>("All");
  const [rulesError, setRulesError] = useState<string | null>(null);

  // Rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WebformAutoResponseRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleModule, setRuleModule] = useState<WebformModule>("Leads");
  const [ruleActive, setRuleActive] = useState(true);
  const [savingRule, setSavingRule] = useState(false);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<WebformAutoResponseRule | null>(null);
  const [deletingRule, setDeletingRule] = useState(false);

  const loadForms = useCallback(async () => {
    try {
      setLoadingForms(true);
      setFormsError(null);
      const res = await fetchWebforms(orgSlug);
      setForms(res);
    } catch (err) {
      setFormsError(err instanceof Error ? err.message : "Failed to load webforms.");
    } finally {
      setLoadingForms(false);
    }
  }, [orgSlug]);

  const loadRules = useCallback(async () => {
    try {
      setLoadingRules(true);
      setRulesError(null);
      const mod = ruleModuleFilter === "All" ? undefined : (ruleModuleFilter as WebformModule);
      const res = await fetchAutoResponseRules(orgSlug, mod);
      setRules(res);
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to load auto-response rules.");
    } finally {
      setLoadingRules(false);
    }
  }, [orgSlug, ruleModuleFilter]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  useEffect(() => {
    if (activeTab === "auto-response-rules") {
      loadRules();
    }
  }, [activeTab, loadRules]);

  const handleCreateForm = async () => {
    if (!formName.trim()) return;
    try {
      setCreating(true);
      setCreateError(null);
      const created = await createWebform(orgSlug, {
        name: formName.trim(),
        module: formModule,
        layout: formLayout,
      });
      setCreateDialogOpen(false);
      setFormName("");
      setFormLayout("Standard Layout");
      router.push(`/crm/${orgSlug}/settings/webforms/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create webform.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActivate = async (form: Webform) => {
    try {
      if (form.status === "active") {
        await deactivateWebform(orgSlug, form.id);
      } else {
        await activateWebform(orgSlug, form.id);
      }
      await loadForms();
    } catch (err) {
      setFormsError(err instanceof Error ? err.message : "Failed to update form status.");
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteFormTarget) return;
    try {
      setDeletingForm(true);
      await deleteWebform(orgSlug, deleteFormTarget.id);
      setDeleteFormTarget(null);
      await loadForms();
    } catch (err) {
      setFormsError(err instanceof Error ? err.message : "Failed to delete webform.");
    } finally {
      setDeletingForm(false);
    }
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) return;
    try {
      setSavingRule(true);
      if (editingRule) {
        await updateAutoResponseRule(orgSlug, editingRule.id, {
          name: ruleName.trim(),
          active: ruleActive,
        });
      } else {
        await createAutoResponseRule(orgSlug, {
          name: ruleName.trim(),
          module: ruleModule,
          active: ruleActive,
        });
      }
      setRuleDialogOpen(false);
      setEditingRule(null);
      setRuleName("");
      await loadRules();
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to save rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleTarget) return;
    try {
      setDeletingRule(true);
      await deleteAutoResponseRule(orgSlug, deleteRuleTarget.id);
      setDeleteRuleTarget(null);
      await loadRules();
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : "Failed to delete rule.");
    } finally {
      setDeletingRule(false);
    }
  };

  const handleMoveRule = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    setRules(reordered);
    const mod =
      ruleModuleFilter === "All" ? ("Leads" as WebformModule) : (ruleModuleFilter as WebformModule);
    await reorderAutoResponseRules(
      orgSlug,
      mod,
      reordered.map((r) => r.id),
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">{t("modules.webforms.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("modules.webforms.description")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "webforms"}
          onClick={() => setActiveTab("webforms")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "webforms"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("modules.webforms.tabs.webforms")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "auto-response-rules"}
          onClick={() => setActiveTab("auto-response-rules")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "auto-response-rules"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("modules.webforms.tabs.rules")}
        </button>
      </div>

      {/* Webforms Tab Content */}
      {activeTab === "webforms" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {forms.length > 0 ? t("modules.webforms.list.count", { count: forms.length }) : ""}
            </span>
            <Button
              variant="primary"
              onClick={() => {
                setFormName("");
                setFormModule("Leads");
                setFormLayout("Standard Layout");
                setCreateError(null);
                setCreateDialogOpen(true);
              }}
              data-testid="new-form-button"
            >
              {t("modules.webforms.list.newForm")}
            </Button>
          </div>

          {formsError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {formsError}
            </div>
          )}

          {loadingForms ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : forms.length === 0 ? (
            /* W1 Empty Landing Page Panels */
            <div className="flex flex-col gap-6 py-6" data-testid="webforms-empty-state">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-border rounded-lg bg-card flex flex-col gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icons.fieldEdit className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t("modules.webforms.list.formBuilding")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("modules.webforms.list.formBuildingDesc")}
                  </p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-card flex flex-col gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icons.activity className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t("modules.webforms.list.analytics")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("modules.webforms.list.analyticsDesc")}
                  </p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-card flex flex-col gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icons.newspaper className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t("modules.webforms.list.abTesting")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("modules.webforms.list.abTestingDesc")}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormName("");
                    setFormModule("Leads");
                    setFormLayout("Standard Layout");
                    setCreateError(null);
                    setCreateDialogOpen(true);
                  }}
                  data-testid="empty-new-form-button"
                >
                  {t("modules.webforms.list.newForm")}
                </Button>
              </div>
            </div>
          ) : (
            /* Populated Table of Webforms */
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-left text-sm" data-testid="webforms-table">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">{t("modules.webforms.list.table.formName")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.list.table.module")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.list.table.status")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.list.table.created")}</th>
                    <th className="px-4 py-3 text-right">
                      {t("modules.webforms.list.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {forms.map((form) => (
                    <tr key={form.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">
                        <Link
                          href={`/crm/${orgSlug}/settings/webforms/${form.id}`}
                          className="text-primary hover:underline"
                        >
                          {form.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {form.module === "Leads"
                          ? t("shell.leads")
                          : form.module === "Contacts"
                            ? t("shell.contacts")
                            : t("shell.cases")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            form.status === "active"
                              ? "success"
                              : form.status === "inactive"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {form.status === "active"
                            ? t("modules.webforms.builder.statusActive")
                            : form.status === "inactive"
                              ? t("modules.webforms.builder.statusInactive")
                              : t("modules.webforms.builder.statusDraft")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(form.createdAt, orgFormat)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/crm/${orgSlug}/settings/webforms/${form.id}/analytics`)
                            }
                            data-testid={`form-analytics-${form.id}`}
                          >
                            {t("modules.webforms.list.analytics")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              router.push(`/crm/${orgSlug}/settings/webforms/${form.id}`)
                            }
                          >
                            {t("modules.webforms.list.editForm")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActivate(form)}
                          >
                            {form.status === "active"
                              ? t("modules.webforms.list.deactivate")
                              : t("modules.webforms.list.activate")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteFormTarget(form)}
                          >
                            {t("common.actions.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Auto-response Rules Tab Content */}
      {activeTab === "auto-response-rules" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="rule-module-filter" className="text-sm font-semibold text-foreground">
                {t("modules.webforms.rules.filterModule")}
              </label>
              <select
                id="rule-module-filter"
                value={ruleModuleFilter}
                onChange={(e) => setRuleModuleFilter(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All">{t("modules.webforms.rules.allModules")}</option>
                <option value="Leads">{t("shell.leads")}</option>
                <option value="Contacts">{t("shell.contacts")}</option>
                <option value="Cases">{t("shell.cases")}</option>
              </select>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingRule(null);
                setRuleName("");
                setRuleModule(
                  ruleModuleFilter === "All" ? "Leads" : (ruleModuleFilter as WebformModule),
                );
                setRuleActive(true);
                setRuleDialogOpen(true);
              }}
              data-testid="new-rule-button"
            >
              {t("modules.webforms.rules.newRule")}
            </Button>
          </div>

          {rulesError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {rulesError}
            </div>
          )}

          {loadingRules ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center border border-border rounded-lg bg-card text-muted-foreground">
              {t("modules.webforms.rules.empty")}
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-left text-sm" data-testid="rules-table">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-12">{t("modules.webforms.rules.order")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.rules.ruleName")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.rules.module")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.rules.criteria")}</th>
                    <th className="px-4 py-3">{t("modules.webforms.rules.status")}</th>
                    <th className="px-4 py-3 text-right">{t("modules.webforms.rules.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rules.map((rule, idx) => (
                    <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{rule.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.module}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {rule.criteria.kind === "all_records"
                          ? t("modules.webforms.rules.allSubmissions")
                          : t("modules.webforms.rules.customCriteria")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rule.active ? "success" : "neutral"}>
                          {rule.active
                            ? t("modules.webforms.rules.active")
                            : t("modules.webforms.rules.inactive")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            isDisabled={idx === 0}
                            onClick={() => handleMoveRule(idx, "up")}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            isDisabled={idx === rules.length - 1}
                            onClick={() => handleMoveRule(idx, "down")}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setRuleName(rule.name);
                              setRuleModule(rule.module);
                              setRuleActive(rule.active);
                              setRuleDialogOpen(true);
                            }}
                          >
                            {t("common.actions.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteRuleTarget(rule)}
                          >
                            {t("common.actions.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* W2 Initial Create Dialog */}
      {createDialogOpen && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) => !open && setCreateDialogOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={t("modules.webforms.dialogs.newFormTitle")}
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {t("modules.webforms.dialogs.newFormTitle")}
              </Heading>
              <div className="flex flex-col gap-4 py-2">
                {createError && (
                  <div className="p-2 text-sm text-destructive bg-destructive/10 rounded">
                    {createError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="form-name-input"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("modules.webforms.dialogs.formName")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="form-name-input"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("modules.webforms.dialogs.formNamePlaceholder")}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    data-testid="form-name-input"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="form-module-select"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("modules.webforms.dialogs.module")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="form-module-select"
                    value={formModule}
                    onChange={(e) => setFormModule(e.target.value as WebformModule)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    data-testid="form-module-select"
                  >
                    <option value="Leads">{t("shell.leads")}</option>
                    <option value="Contacts">{t("shell.contacts")}</option>
                    <option value="Cases">{t("shell.cases")}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="form-layout-select"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("modules.webforms.dialogs.layout")}
                  </label>
                  <select
                    id="form-layout-select"
                    value={formLayout}
                    onChange={(e) => setFormLayout(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    data-testid="form-layout-select"
                  >
                    <option value="Standard Layout">
                      {t("modules.webforms.dialogs.standardLayout")}
                    </option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setCreateDialogOpen(false)}
                  isDisabled={creating}
                >
                  {t("common.actions.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateForm}
                  isDisabled={!formName.trim() || creating}
                  data-testid="dialog-create-button"
                >
                  {creating ? <Spinner className="size-4" /> : t("common.actions.create")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Delete Form Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteFormTarget)}
        onOpenChange={(open) => !open && setDeleteFormTarget(null)}
        title={t("modules.webforms.list.deleteDialog.title")}
        message={t("modules.webforms.list.deleteDialog.message", {
          name: deleteFormTarget?.name ?? "",
        })}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.actions.cancel")}
        tone="danger"
        busy={deletingForm}
        onConfirm={handleDeleteForm}
      />

      {/* Auto-response Rule Modal */}
      {ruleDialogOpen && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) => !open && setRuleDialogOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none">
            <AriaDialog
              aria-label={
                editingRule
                  ? t("modules.webforms.dialogs.editRuleTitle")
                  : t("modules.webforms.dialogs.newRuleTitle")
              }
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {editingRule
                  ? t("modules.webforms.dialogs.editRuleTitle")
                  : t("modules.webforms.dialogs.newRuleTitle")}
              </Heading>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="rule-name-input"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("modules.webforms.dialogs.ruleName")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="rule-name-input"
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder={t("modules.webforms.dialogs.ruleNamePlaceholder")}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                {!editingRule && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="rule-module-select"
                      className="text-sm font-semibold text-foreground"
                    >
                      {t("modules.webforms.dialogs.module")}
                    </label>
                    <select
                      id="rule-module-select"
                      value={ruleModule}
                      onChange={(e) => setRuleModule(e.target.value as WebformModule)}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Leads">{t("shell.leads")}</option>
                      <option value="Contacts">{t("shell.contacts")}</option>
                      <option value="Cases">{t("shell.cases")}</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    id="rule-active"
                    type="checkbox"
                    checked={ruleActive}
                    onChange={(e) => setRuleActive(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  <label htmlFor="rule-active" className="text-sm text-foreground">
                    {t("modules.webforms.dialogs.ruleActive")}
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setRuleDialogOpen(false)}
                  isDisabled={savingRule}
                >
                  {t("common.actions.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveRule}
                  isDisabled={!ruleName.trim() || savingRule}
                >
                  {savingRule ? <Spinner className="size-4" /> : t("common.actions.save")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteRuleTarget)}
        onOpenChange={(open) => !open && setDeleteRuleTarget(null)}
        title={t("modules.webforms.rules.deleteDialog.title")}
        message={t("modules.webforms.rules.deleteDialog.message", {
          name: deleteRuleTarget?.name ?? "",
        })}
        confirmLabel={t("common.actions.delete")}
        cancelLabel={t("common.actions.cancel")}
        tone="danger"
        busy={deletingRule}
        onConfirm={handleDeleteRule}
      />
    </div>
  );
}
