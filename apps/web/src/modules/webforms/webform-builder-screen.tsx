"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  addLocation,
  fetchEligibleFields,
  fetchWebform,
  publishWebform,
  regenerateKey,
  removeLocation,
  updateDraft,
} from "./api";
import type {
  EligibleField,
  WebformDetail,
  WebformField,
  WebformLocation,
  WebformSettings,
} from "./types";

interface WebformBuilderScreenProps {
  orgSlug: string;
  formId: string;
}

export function WebformBuilderScreen({ orgSlug, formId }: WebformBuilderScreenProps) {
  const t = useUiTranslations();
  const [form, setForm] = useState<WebformDetail | null>(null);
  const [eligibleFields, setEligibleFields] = useState<EligibleField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form edit state
  const [name, setName] = useState("");
  const [fields, setFields] = useState<WebformField[]>([]);
  const [settings, setSettings] = useState<WebformSettings | null>(null);
  const [locations, setLocations] = useState<WebformLocation[]>([]);

  // UI state
  const [fieldSearch, setFieldSearch] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Location add state
  const [newOrigin, setNewOrigin] = useState("");
  const [newOriginLabel, setNewOriginLabel] = useState("");
  const [addingLocation, setAddingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Regenerate key state
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await fetchWebform(orgSlug, formId);
      setForm(detail);
      setName(detail.name);
      setLocations(detail.locations);

      const activeVersion = detail.draftVersion ?? detail.publishedVersion;
      if (activeVersion) {
        setFields(activeVersion.fields);
        setSettings(activeVersion.settings);
      }

      const eligible = await fetchEligibleFields(orgSlug, detail.module);
      setEligibleFields(eligible);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webform.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, formId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasDraft = Boolean(form?.draftVersion);
  const isReadOnly = !hasDraft;

  const handleAddField = (eligible: EligibleField) => {
    if (fields.some((f) => f.fieldApiName === eligible.apiName)) return;
    const newField: WebformField = {
      fieldApiName: eligible.apiName,
      label: eligible.label,
      required: eligible.required,
      hidden: false,
      defaultValue: "",
      helpText: "",
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (apiName: string) => {
    const isRequired = eligibleFields.find((f) => f.apiName === apiName)?.required;
    if (isRequired) return; // Cannot remove layout-required field
    setFields(fields.filter((f) => f.fieldApiName !== apiName));
  };

  const handleUpdateField = (apiName: string, updates: Partial<WebformField>) => {
    setFields(fields.map((f) => (f.fieldApiName === apiName ? { ...f, ...updates } : f)));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setFields(next);
  };

  const handleSaveDraft = async () => {
    if (!settings) return;
    try {
      setSavingDraft(true);
      setError(null);
      const updated = await updateDraft(orgSlug, formId, {
        name: name.trim(),
        fields,
        settings,
      });
      setForm(updated);
      setSuccessMessage("Draft saved successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleOpenDraftForEditing = async () => {
    if (!settings) return;
    try {
      setSavingDraft(true);
      setError(null);
      const updated = await updateDraft(orgSlug, formId, {
        fields,
        settings,
      });
      setForm(updated);
      setSuccessMessage("New draft opened for editing.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);
      // Save draft first if changes made
      if (hasDraft && settings) {
        await updateDraft(orgSlug, formId, {
          name: name.trim(),
          fields,
          settings,
        });
      }
      const updated = await publishWebform(orgSlug, formId);
      setForm(updated);
      setSuccessMessage("Form published successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish webform.");
    } finally {
      setPublishing(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newOrigin.trim()) return;
    try {
      setAddingLocation(true);
      setLocationError(null);
      const created = await addLocation(orgSlug, formId, {
        origin: newOrigin.trim(),
        label: newOriginLabel.trim(),
      });
      setLocations([...locations, created]);
      setNewOrigin("");
      setNewOriginLabel("");
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "Failed to add location.");
    } finally {
      setAddingLocation(false);
    }
  };

  const handleRemoveLocation = async (origin: string) => {
    try {
      await removeLocation(orgSlug, formId, origin);
      setLocations(locations.filter((l) => l.origin !== origin));
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "Failed to remove location.");
    }
  };

  const handleRegenerateKey = async () => {
    try {
      setRegenerating(true);
      const res = await regenerateKey(orgSlug, formId);
      setNewGeneratedKey(res.publicKey);
      setConfirmRegenerateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate public key.");
    } finally {
      setRegenerating(false);
    }
  };

  const filteredEligible = eligibleFields.filter(
    (f) =>
      f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
      f.apiName.toLowerCase().includes(fieldSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!form || !settings) {
    return <div className="p-8 text-center text-destructive">{error || "Form not found"}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/crm/${orgSlug}/settings/webforms`}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {t("modules.webforms.builder.back")}
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isReadOnly}
              className="text-base font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 text-foreground"
              placeholder={t("modules.webforms.builder.namePlaceholder")}
            />
            <Badge variant="neutral">{form.module}</Badge>
            <Badge
              variant={
                form.status === "active"
                  ? "success"
                  : form.status === "inactive"
                    ? "warning"
                    : "neutral"
              }
            >
              {form.status.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {form.draftVersion
                ? `Draft v${form.draftVersion.number}`
                : `Published v${form.publishedVersion?.number}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {successMessage && (
            <span className="text-xs text-success font-semibold animate-fade-in mr-2">
              {successMessage}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
            {t("modules.webforms.builder.preview")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            data-testid="form-settings-button"
          >
            {t("modules.webforms.builder.formSettings")}
          </Button>
          {isReadOnly ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenDraftForEditing}
              isDisabled={savingDraft}
              data-testid="edit-form-button"
            >
              {t("modules.webforms.builder.editDraft")}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                isDisabled={savingDraft}
                data-testid="save-draft-button"
              >
                {savingDraft ? (
                  <Spinner className="size-4" />
                ) : (
                  t("modules.webforms.builder.saveDraft")
                )}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublish}
                isDisabled={publishing}
                data-testid="publish-form-button"
              >
                {publishing ? (
                  <Spinner className="size-4" />
                ) : (
                  t("modules.webforms.builder.publish")
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-6 py-2 border-b border-destructive/20 shrink-0">
          {error}
        </div>
      )}

      {/* Main Builder Work Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Palette: Available Fields */}
        <div className="w-80 border-r border-border bg-muted/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex flex-col gap-2 bg-card">
            <h2 className="text-sm font-semibold text-foreground">
              {t("modules.webforms.builder.availableFields")}
            </h2>
            <div className="relative">
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder={t("modules.webforms.builder.searchFieldsPlaceholder")}
                className="w-full h-8 pl-8 pr-3 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Icons.filterSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
            {filteredEligible.map((eligible) => {
              const inForm = fields.some((f) => f.fieldApiName === eligible.apiName);
              return (
                <button
                  type="button"
                  key={eligible.apiName}
                  disabled={inForm || isReadOnly}
                  aria-label={t("modules.webforms.builder.addFieldAria", { label: eligible.label })}
                  data-testid={`add-field-${eligible.apiName}`}
                  className={`flex w-full items-center justify-between p-2.5 rounded border text-xs transition-colors text-left ${
                    inForm
                      ? "bg-muted/40 border-border/50 text-muted-foreground opacity-60 cursor-not-allowed"
                      : isReadOnly
                        ? "bg-card border-border text-muted-foreground opacity-60 cursor-not-allowed"
                        : "bg-card border-border hover:border-primary/50 text-foreground cursor-pointer"
                  }`}
                  onClick={() => handleAddField(eligible)}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-semibold truncate">{eligible.label}</span>
                    {eligible.required && (
                      <span className="text-destructive font-bold text-sm leading-none">*</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground uppercase px-1 rounded bg-muted">
                      {eligible.dataType}
                    </span>
                    {!inForm && !isReadOnly && (
                      <span className="text-primary font-bold px-1">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Canvas: Form Builder */}
        <div className="flex-1 overflow-y-auto p-8 bg-muted/5 flex justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("modules.webforms.builder.formFieldsCount", { count: fields.length })}
              </span>
              {isReadOnly && (
                <span className="text-xs text-amber-500 font-semibold">
                  {t("modules.webforms.builder.publishedReadOnly")}
                </span>
              )}
            </div>

            {/* Field Cards */}
            <div className="flex flex-col gap-3" data-testid="form-fields-list">
              {fields.map((field, idx) => {
                const eligible = eligibleFields.find((f) => f.apiName === field.fieldApiName);
                const isLayoutRequired = Boolean(eligible?.required);

                return (
                  <div
                    key={field.fieldApiName}
                    className="p-4 rounded-lg border border-border bg-card shadow-xs flex flex-col gap-3"
                    data-testid={`form-field-${field.fieldApiName}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!isReadOnly && (
                          <div className="flex flex-col gap-0.5 text-muted-foreground">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, "up")}
                              className="hover:text-foreground disabled:opacity-30 text-xs px-1"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === fields.length - 1}
                              onClick={() => handleMoveField(idx, "down")}
                              className="hover:text-foreground disabled:opacity-30 text-xs px-1"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">
                          {field.fieldApiName}
                        </span>
                        {isLayoutRequired && (
                          <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-semibold">
                            {t("modules.webforms.builder.moduleRequired")}
                          </span>
                        )}
                      </div>

                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isDisabled={isLayoutRequired}
                          onClick={() => handleRemoveField(field.fieldApiName)}
                          className="text-muted-foreground hover:text-destructive h-7 text-xs"
                        >
                          {t("modules.webforms.builder.remove")}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`field-label-${field.fieldApiName}`}
                          className="text-xs font-semibold text-foreground"
                        >
                          {t("modules.webforms.builder.fieldLabel")}
                        </label>
                        <input
                          id={`field-label-${field.fieldApiName}`}
                          type="text"
                          value={field.label}
                          disabled={isReadOnly}
                          onChange={(e) =>
                            handleUpdateField(field.fieldApiName, { label: e.target.value })
                          }
                          className="h-8 rounded border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor={`field-help-${field.fieldApiName}`}
                          className="text-xs font-semibold text-foreground"
                        >
                          {t("modules.webforms.builder.helpText")}
                        </label>
                        <input
                          id={`field-help-${field.fieldApiName}`}
                          type="text"
                          value={field.helpText || ""}
                          disabled={isReadOnly}
                          placeholder={t("modules.webforms.builder.helpTextPlaceholder")}
                          onChange={(e) =>
                            handleUpdateField(field.fieldApiName, { helpText: e.target.value })
                          }
                          className="h-8 rounded border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-1 border-t border-border/50 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          disabled={isReadOnly || isLayoutRequired}
                          onChange={(e) =>
                            handleUpdateField(field.fieldApiName, { required: e.target.checked })
                          }
                          className="size-3.5 rounded border-border"
                          data-testid={`field-required-toggle-${field.fieldApiName}`}
                        />
                        <span className="text-foreground">
                          {t("modules.webforms.builder.required")}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.hidden}
                          disabled={isReadOnly || (isLayoutRequired && !field.defaultValue)}
                          onChange={(e) =>
                            handleUpdateField(field.fieldApiName, { hidden: e.target.checked })
                          }
                          className="size-3.5 rounded border-border"
                        />
                        <span className="text-foreground">
                          {t("modules.webforms.builder.hidden")}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}

              {/* Submit Button Config */}
              <div className="p-4 rounded-lg border border-border bg-card shadow-xs flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {t("modules.webforms.builder.submitButton")}
                </span>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="submit-button-label-input"
                    className="text-xs font-semibold text-foreground"
                  >
                    {t("modules.webforms.builder.buttonLabel")}
                  </label>
                  <input
                    id="submit-button-label-input"
                    type="text"
                    value={settings.buttonLabel}
                    disabled={isReadOnly}
                    onChange={(e) => setSettings({ ...settings, buttonLabel: e.target.value })}
                    className="h-8 w-48 rounded border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewOpen && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) => !open && setPreviewOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full p-6 outline-none max-h-[90vh] overflow-y-auto">
            <AriaDialog
              aria-label={t("modules.webforms.builder.previewTitle", { name })}
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {t("modules.webforms.builder.previewTitle", { name })}
              </Heading>
              <div className="p-4 border border-border rounded-lg bg-card flex flex-col gap-4 shadow-xs">
                {fields
                  .filter((f) => !f.hidden)
                  .map((field) => (
                    <div key={field.fieldApiName} className="flex flex-col gap-1 text-sm">
                      <label
                        htmlFor={`preview-field-${field.fieldApiName}`}
                        className="font-semibold text-foreground flex items-center gap-1"
                      >
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </label>
                      <input
                        id={`preview-field-${field.fieldApiName}`}
                        type="text"
                        readOnly
                        placeholder={field.helpText || ""}
                        className="h-9 rounded-md border border-border bg-muted/20 px-3 text-sm text-muted-foreground"
                      />
                      {field.helpText && (
                        <span className="text-[11px] text-muted-foreground">{field.helpText}</span>
                      )}
                    </div>
                  ))}
                <div className="pt-2">
                  <Button variant="primary" className="w-full" isDisabled>
                    {settings?.buttonLabel || "Submit"}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                  {t("modules.webforms.builder.closePreview")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Form Settings Dialog */}
      {settingsOpen && settings && (
        <ModalOverlay
          isOpen
          onOpenChange={(open) => !open && setSettingsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
        >
          <Modal className="bg-surface border border-border rounded-lg shadow-lg max-w-lg w-full p-6 outline-none max-h-[90vh] overflow-y-auto">
            <AriaDialog
              aria-label={t("modules.webforms.builder.settingsTitle")}
              className="outline-none flex flex-col gap-4"
            >
              <Heading slot="title" className="text-lg font-semibold text-foreground">
                {t("modules.webforms.builder.settingsTitle")}
              </Heading>
              <div className="flex flex-col gap-6 py-2">
                {/* Acknowledgement */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.acknowledgement")}
                  </h4>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ackKind"
                        checked={settings.acknowledgement.kind === "message"}
                        disabled={isReadOnly}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            acknowledgement: {
                              kind: "message",
                              text: "Thank you for your submission.",
                            },
                          })
                        }
                      />
                      <span>{t("modules.webforms.builder.thankYouMessage")}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="ackKind"
                        checked={settings.acknowledgement.kind === "redirect"}
                        disabled={isReadOnly}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            acknowledgement: {
                              kind: "redirect",
                              url: locations[0]?.origin || "https://example.com/thank-you",
                            },
                          })
                        }
                      />
                      <span>{t("modules.webforms.builder.redirectToUrl")}</span>
                    </label>
                  </div>

                  {settings.acknowledgement.kind === "message" ? (
                    <textarea
                      value={settings.acknowledgement.text}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          acknowledgement: { kind: "message", text: e.target.value },
                        })
                      }
                      rows={2}
                      className="rounded border border-border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  ) : (
                    <div className="flex flex-col gap-1">
                      <input
                        type="url"
                        value={settings.acknowledgement.url}
                        disabled={isReadOnly}
                        placeholder={t("modules.webforms.builder.redirectPlaceholder")}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            acknowledgement: { kind: "redirect", url: e.target.value },
                          })
                        }
                        className="h-8 rounded border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {t("modules.webforms.builder.redirectHelp")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assignment & Notifications */}
                <div className="flex flex-col gap-3 pt-3 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.assignmentAndNotification")}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="settings-owner-kind" className="font-semibold">
                        {t("modules.webforms.builder.ownerKind")}
                      </label>
                      <select
                        id="settings-owner-kind"
                        value={settings.ownerKind}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ownerKind: e.target.value as "user" | "assignment_rule",
                          })
                        }
                        className="h-8 rounded border border-border bg-background px-2 text-xs"
                      >
                        <option value="user">{t("modules.webforms.builder.specificUser")}</option>
                        <option value="assignment_rule">
                          {t("modules.webforms.builder.assignmentRule")}
                        </option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="settings-owner-ref" className="font-semibold">
                        {settings.ownerKind === "user"
                          ? t("modules.webforms.builder.userRef")
                          : t("modules.webforms.builder.ruleRef")}
                      </label>
                      <input
                        id="settings-owner-ref"
                        type="text"
                        value={settings.ownerRef}
                        disabled={isReadOnly}
                        onChange={(e) => setSettings({ ...settings, ownerRef: e.target.value })}
                        className="h-8 rounded border border-border bg-background px-2 text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOwner}
                      disabled={isReadOnly}
                      onChange={(e) => setSettings({ ...settings, notifyOwner: e.target.checked })}
                      className="size-3.5 rounded border-border"
                    />
                    <span>{t("modules.webforms.builder.notifyOwner")}</span>
                  </label>
                </div>

                {/* Spam Prevention & Locations */}
                <div className="flex flex-col gap-3 pt-3 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.spamAndSecurity")}
                  </h4>
                  <div className="flex flex-col gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.challenge}
                        disabled={isReadOnly}
                        onChange={(e) => setSettings({ ...settings, challenge: e.target.checked })}
                        className="size-3.5 rounded border-border"
                      />
                      <span>{t("modules.webforms.builder.enableCaptcha")}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.restrictLocations}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setSettings({ ...settings, restrictLocations: e.target.checked })
                        }
                        className="size-3.5 rounded border-border"
                      />
                      <span>{t("modules.webforms.builder.restrictLocations")}</span>
                    </label>
                  </div>

                  {/* Location Allowlist */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label
                      htmlFor="new-location-input"
                      className="text-xs font-semibold text-foreground"
                    >
                      {t("modules.webforms.builder.allowedLocations")}
                    </label>
                    {locationError && (
                      <span className="text-xs text-destructive">{locationError}</span>
                    )}
                    <div className="flex gap-2">
                      <input
                        id="new-location-input"
                        type="text"
                        value={newOrigin}
                        placeholder={t("modules.webforms.builder.locationPlaceholder")}
                        onChange={(e) => setNewOrigin(e.target.value)}
                        className="h-8 flex-1 rounded border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddLocation}
                        isDisabled={!newOrigin.trim() || addingLocation}
                      >
                        {t("modules.webforms.builder.addLocation")}
                      </Button>
                    </div>

                    <div className="border border-border rounded divide-y divide-border text-xs max-h-32 overflow-y-auto">
                      {locations.length === 0 ? (
                        <div className="p-2 text-muted-foreground text-center">
                          {t("modules.webforms.builder.noLocations")}
                        </div>
                      ) : (
                        locations.map((loc) => (
                          <div
                            key={loc.origin}
                            className="flex items-center justify-between p-2 hover:bg-muted/20"
                          >
                            <span className="font-mono text-[11px]">{loc.origin}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-destructive text-xs hover:bg-destructive/10"
                              onClick={() => handleRemoveLocation(loc.origin)}
                            >
                              {t("modules.webforms.builder.remove")}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Attribution & Tracking */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border text-xs">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.attribution")}
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.captureAttribution}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        setSettings({ ...settings, captureAttribution: e.target.checked })
                      }
                      className="size-3.5 rounded border-border"
                    />
                    <span>{t("modules.webforms.builder.captureAttribution")}</span>
                  </label>
                </div>

                {/* Approval & Double Opt-in (ADR 0019 §2: stored as none/false) */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border text-xs opacity-70">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.approvals")}
                  </h4>
                  <div className="flex items-center gap-3">
                    <label htmlFor="settings-manual-approval" className="font-semibold">
                      {t("modules.webforms.builder.manualApproval")}
                    </label>
                    <select
                      id="settings-manual-approval"
                      disabled
                      value="none"
                      className="h-7 rounded border border-border bg-muted px-2 text-xs"
                    >
                      <option value="none">
                        {t("modules.webforms.builder.noneDirectCreation")}
                      </option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      className="size-3.5 rounded border-border"
                    />
                    <span>{t("modules.webforms.builder.doubleOptIn")}</span>
                  </label>
                </div>

                {/* Public Endpoint Key Management */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border text-xs">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t("modules.webforms.builder.publicKeySecurity")}
                  </h4>
                  <div className="flex items-center justify-between p-3 rounded bg-muted/20 border border-border">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {t("modules.webforms.builder.endpointPublicKey")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t("modules.webforms.builder.publicKeyDesc")}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmRegenerateOpen(true)}
                      isDisabled={regenerating}
                    >
                      {t("modules.webforms.builder.regenerateKey")}
                    </Button>
                  </div>
                  {newGeneratedKey && (
                    <div className="p-3 bg-success/10 border border-success/30 rounded text-xs flex flex-col gap-1">
                      <span className="font-semibold text-success">
                        {t("modules.webforms.builder.newPublicKey")}
                      </span>
                      <span className="font-mono bg-background p-1.5 rounded select-all break-all border border-border">
                        {newGeneratedKey}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("modules.webforms.builder.newPublicKeyWarning")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
                  {t("modules.webforms.builder.closeSettings")}
                </Button>
              </div>
            </AriaDialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Confirm Regenerate Key Dialog */}
      <ConfirmDialog
        isOpen={confirmRegenerateOpen}
        onOpenChange={setConfirmRegenerateOpen}
        title={t("modules.webforms.builder.regenerateDialog.title")}
        message={t("modules.webforms.builder.regenerateDialog.message")}
        confirmLabel={t("modules.webforms.builder.regenerateDialog.confirm")}
        cancelLabel={t("common.actions.cancel")}
        tone="danger"
        busy={regenerating}
        onConfirm={handleRegenerateKey}
      />
    </div>
  );
}
