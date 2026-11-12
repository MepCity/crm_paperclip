"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useUiTranslations } from "@/i18n/client-provider";
import type { Portal } from "./types";

interface PortalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    slug?: string;
    status?: "active" | "disabled";
    defaultLanguage?: "en" | "tr";
  }) => Promise<void>;
  initialData?: Portal | null;
}

export function PortalConfigModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PortalConfigModalProps) {
  const t = useUiTranslations();
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [status, setStatus] = useState<"active" | "disabled">(initialData?.status ?? "active");
  const [defaultLanguage, setDefaultLanguage] = useState<"en" | "tr">(
    initialData?.defaultLanguage ?? "en",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Portal name is required.");
      return;
    }
    if (!isEditing && !slug.trim()) {
      setError("Portal slug is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        ...(isEditing ? { status } : { slug: slug.trim().toLowerCase() }),
        defaultLanguage,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save portal settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t("modules.portals.editPortal") : t("modules.portals.create")}
      className="max-w-md"
      testId="portal-config-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-md">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="portal-name-input"
            className="block text-sm font-semibold text-foreground mb-1"
          >
            {t("modules.portals.name")} *
          </label>
          <input
            id="portal-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Customer Portal"
            data-testid="portal-name-input"
          />
        </div>

        {!isEditing && (
          <div>
            <label
              htmlFor="portal-slug-input"
              className="block text-sm font-semibold text-foreground mb-1"
            >
              {t("modules.portals.slug")} *
            </label>
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-1.5 font-mono">/portal/</span>
              <input
                id="portal-slug-input"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground font-mono focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                placeholder="customer-portal"
                data-testid="portal-slug-input"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              3-50 lowercase letters, digits, or hyphens.
            </p>
          </div>
        )}

        {isEditing && (
          <div>
            <label
              htmlFor="portal-status-select"
              className="block text-sm font-semibold text-foreground mb-1"
            >
              {t("modules.portals.status")}
            </label>
            <select
              id="portal-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "disabled")}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              data-testid="portal-status-select"
            >
              <option value="active">{t("modules.portals.statusActive")}</option>
              <option value="disabled">{t("modules.portals.statusDisabled")}</option>
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="portal-language-select"
            className="block text-sm font-semibold text-foreground mb-1"
          >
            {t("modules.portals.defaultLanguage")}
          </label>
          <select
            id="portal-language-select"
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value as "en" | "tr")}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            data-testid="portal-language-select"
          >
            <option value="en">{t("modules.portals.english")}</option>
            <option value="tr">{t("modules.portals.turkish")}</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onPress={onClose}
            isDisabled={saving}
            data-testid="cancel-portal-button"
          >
            {t("modules.portals.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving}
            data-testid="save-portal-button"
          >
            {saving ? t("modules.portals.saving") : t("modules.portals.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
