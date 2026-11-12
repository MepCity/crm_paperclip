"use client";

import {
  isPortalExposable,
  moduleFields,
  PORTAL_MODULE_RULES,
  PORTAL_MODULES,
  type PortalModule,
  type PortalModules,
  type PortalUserTypeSettings,
} from "@crm/core/portals/matrix";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { useUiTranslations } from "@/i18n/client-provider";
import type { MemberOption, PortalUserType } from "./types";

interface UserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    modules: PortalModules;
    settings: PortalUserTypeSettings;
  }) => Promise<void>;
  initialData?: PortalUserType | null;
  members: MemberOption[];
}

export function UserTypeModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  members,
}: UserTypeModalProps) {
  const t = useUiTranslations();
  const [name, setName] = useState(initialData?.name ?? "");
  const [caseOwnerUserId, setCaseOwnerUserId] = useState<string>(
    initialData?.settings.caseOwner?.kind === "user" ? initialData.settings.caseOwner.userId : "",
  );

  // Initialize modules configuration
  const [modules, setModules] = useState<PortalModules>(() => {
    if (initialData?.modules) return JSON.parse(JSON.stringify(initialData.modules));
    // Default config: Contacts and Cases enabled
    return {
      Contacts: {
        enabled: true,
        scope: "contact",
        actions: { view: true, edit: true },
        fields: [
          { apiName: "First_Name", mode: "edit" },
          { apiName: "Last_Name", mode: "read" },
          { apiName: "Email", mode: "read" },
          { apiName: "Phone", mode: "edit" },
        ],
      },
      Cases: {
        enabled: true,
        scope: "contact",
        actions: { view: true, create: true },
        fields: [
          { apiName: "Subject", mode: "edit" },
          { apiName: "Description", mode: "edit" },
          { apiName: "Status", mode: "read" },
          { apiName: "Priority", mode: "read" },
        ],
      },
      Accounts: {
        enabled: false,
        scope: "contact",
        actions: { view: true },
        fields: [{ apiName: "Account_Name", mode: "read" }],
      },
      Deals: {
        enabled: false,
        scope: "contact",
        actions: { view: true },
        fields: [{ apiName: "Deal_Name", mode: "read" }],
      },
      Quotes: {
        enabled: false,
        scope: "contact",
        actions: { view: true },
        fields: [{ apiName: "Subject", mode: "read" }],
      },
      Invoices: {
        enabled: false,
        scope: "contact",
        actions: { view: true },
        fields: [{ apiName: "Subject", mode: "read" }],
      },
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<PortalModule | null>("Contacts");

  const handleModuleToggle = (mod: PortalModule, enabled: boolean) => {
    setModules((prev) => {
      const current = prev[mod] ?? {
        enabled: false,
        scope: "contact",
        actions: { view: true },
        fields: [],
      };
      return {
        ...prev,
        [mod]: {
          ...current,
          enabled,
          actions: {
            ...current.actions,
            view: true,
          },
        },
      };
    });
  };

  const handleScopeChange = (mod: PortalModule, scope: "contact" | "account") => {
    setModules((prev) => {
      const current = prev[mod];
      if (!current) return prev;
      return {
        ...prev,
        [mod]: { ...current, scope },
      };
    });
  };

  const handleActionToggle = (mod: PortalModule, action: "create" | "edit", allowed: boolean) => {
    setModules((prev) => {
      const current = prev[mod];
      if (!current) return prev;
      return {
        ...prev,
        [mod]: {
          ...current,
          actions: {
            ...current.actions,
            [action]: allowed,
          },
        },
      };
    });
  };

  const handleFieldToggle = (mod: PortalModule, fieldApiName: string, selected: boolean) => {
    setModules((prev) => {
      const current = prev[mod];
      if (!current) return prev;
      let fields = [...current.fields];
      if (selected) {
        if (!fields.some((f) => f.apiName === fieldApiName)) {
          fields.push({ apiName: fieldApiName, mode: "read" });
        }
      } else {
        fields = fields.filter((f) => f.apiName !== fieldApiName);
      }
      return {
        ...prev,
        [mod]: { ...current, fields },
      };
    });
  };

  const handleFieldModeChange = (
    mod: PortalModule,
    fieldApiName: string,
    mode: "read" | "edit",
  ) => {
    setModules((prev) => {
      const current = prev[mod];
      if (!current) return prev;
      const fields = current.fields.map((f) => (f.apiName === fieldApiName ? { ...f, mode } : f));
      return {
        ...prev,
        [mod]: { ...current, fields },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a user type name.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const settings: PortalUserTypeSettings = {
        caseOwner: caseOwnerUserId ? { kind: "user", userId: caseOwnerUserId } : null,
      };

      // Filter out disabled modules or keep them clean
      const cleanedModules: PortalModules = {};
      for (const mod of PORTAL_MODULES) {
        const conf = modules[mod];
        if (conf?.enabled) {
          cleanedModules[mod] = {
            enabled: true,
            scope: conf.scope,
            actions: {
              view: true,
              ...(conf.actions.create ? { create: true } : {}),
              ...(conf.actions.edit ? { edit: true } : {}),
            },
            fields: conf.fields,
          };
        }
      }

      await onSave({
        name: name.trim(),
        modules: cleanedModules,
        settings,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user type.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t("modules.portals.editUserType") : t("modules.portals.newUserType")}
      className="max-w-3xl"
      testId="user-type-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="user-type-name-input"
              className="block text-sm font-semibold text-foreground mb-1"
            >
              {t("modules.portals.userTypeName")} *
            </label>
            <input
              id="user-type-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Customers"
              data-testid="user-type-name-input"
            />
          </div>

          <div>
            <label
              htmlFor="case-owner-select"
              className="block text-sm font-semibold text-foreground mb-1"
            >
              {t("modules.portals.caseOwner")}
            </label>
            <select
              id="case-owner-select"
              value={caseOwnerUserId}
              onChange={(e) => setCaseOwnerUserId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              data-testid="case-owner-select"
            >
              <option value="">{t("modules.portals.caseOwnerDefault")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Module & Field Permissions Matrix */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              {t("modules.portals.matrixTitle")}
            </h3>
          </div>

          <div className="divide-y divide-border">
            {PORTAL_MODULES.map((mod) => {
              const rule = PORTAL_MODULE_RULES[mod];
              const conf = modules[mod] ?? {
                enabled: false,
                scope: "contact",
                actions: { view: true },
                fields: [],
              };
              const isExpanded = expandedModule === mod;
              const exposable = moduleFields(mod).filter(isPortalExposable);
              const allowsCreate = (rule.actions as readonly string[]).includes("create");
              const allowsEdit = (rule.actions as readonly string[]).includes("edit");

              return (
                <div key={mod} className="p-4" data-testid={`matrix-module-${mod}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`module-toggle-${mod}`}
                        checked={conf.enabled}
                        onChange={(e) => handleModuleToggle(mod, e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary/40 size-4"
                        data-testid={`module-toggle-${mod}`}
                      />
                      <label
                        htmlFor={`module-toggle-${mod}`}
                        className="font-semibold text-sm text-foreground cursor-pointer select-none"
                      >
                        {mod}
                      </label>
                    </div>

                    {conf.enabled && (
                      <div className="flex items-center gap-4 text-sm">
                        {/* Scope selector */}
                        {rule.accountLookup && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {t("modules.portals.scope")}:
                            </span>
                            <select
                              value={conf.scope}
                              onChange={(e) =>
                                handleScopeChange(mod, e.target.value as "contact" | "account")
                              }
                              className="px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                              data-testid={`module-scope-${mod}`}
                            >
                              <option value="contact">{t("modules.portals.scopeContact")}</option>
                              <option value="account">{t("modules.portals.scopeAccount")}</option>
                            </select>
                          </div>
                        )}

                        {/* Create action */}
                        {allowsCreate && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!conf.actions.create}
                              onChange={(e) => handleActionToggle(mod, "create", e.target.checked)}
                              className="rounded border-border text-primary size-3.5"
                              data-testid={`action-create-${mod}`}
                            />
                            <span>{t("modules.portals.actionCreate")}</span>
                          </label>
                        )}

                        {/* Edit action */}
                        {allowsEdit && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={!!conf.actions.edit}
                              onChange={(e) => handleActionToggle(mod, "edit", e.target.checked)}
                              className="rounded border-border text-primary size-3.5"
                              data-testid={`action-edit-${mod}`}
                            />
                            <span>{t("modules.portals.actionEdit")}</span>
                          </label>
                        )}

                        {/* Expand fields button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onPress={() => setExpandedModule(isExpanded ? null : mod)}
                          className="text-xs px-2 py-1 h-7 text-primary hover:underline inline-flex items-center gap-1"
                          data-testid={`toggle-fields-${mod}`}
                        >
                          <span>
                            {t("modules.portals.projectedFields")} ({conf.fields.length})
                          </span>
                          <Icons.chevronDown
                            className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Fields Selector */}
                  {conf.enabled && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 pl-7 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("modules.portals.projectedFields")}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                        {exposable.map((f) => {
                          const isProjected = conf.fields.some((pf) => pf.apiName === f.apiName);
                          const fieldConfig = conf.fields.find((pf) => pf.apiName === f.apiName);
                          const isEditableModule =
                            (mod === "Contacts" && conf.actions.edit) ||
                            (mod === "Cases" && conf.actions.create);

                          return (
                            <div
                              key={f.apiName}
                              className="flex items-center justify-between p-1.5 rounded hover:bg-muted/30 text-xs"
                            >
                              <label className="flex items-center gap-1.5 cursor-pointer truncate max-w-[150px]">
                                <input
                                  type="checkbox"
                                  checked={isProjected}
                                  onChange={(e) =>
                                    handleFieldToggle(mod, f.apiName, e.target.checked)
                                  }
                                  className="rounded border-border text-primary size-3.5"
                                  data-testid={`field-toggle-${mod}-${f.apiName}`}
                                />
                                <span className="truncate" title={f.apiName}>
                                  {f.label || f.apiName}
                                </span>
                              </label>

                              {isProjected && isEditableModule && (
                                <select
                                  value={fieldConfig?.mode ?? "read"}
                                  onChange={(e) =>
                                    handleFieldModeChange(
                                      mod,
                                      f.apiName,
                                      e.target.value as "read" | "edit",
                                    )
                                  }
                                  className="px-1.5 py-0.5 text-[11px] border border-border rounded bg-background"
                                  data-testid={`field-mode-${mod}-${f.apiName}`}
                                >
                                  <option value="read">{t("modules.portals.modeRead")}</option>
                                  <option value="edit">{t("modules.portals.modeEdit")}</option>
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onPress={onClose}
            isDisabled={saving}
            data-testid="cancel-user-type-button"
          >
            {t("modules.portals.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving}
            data-testid="save-user-type-button"
          >
            {saving ? t("modules.portals.saving") : t("modules.portals.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
