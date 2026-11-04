"use client";

import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";

export interface ModuleListEmptyStateProps {
  heading: string;
  text: string;
  onCreate: () => void;
  onImport: () => void;
}

/** Whole-list empty state of a module with no records: heading, text, Create and Import. */
export function ModuleListEmptyState({
  heading,
  text,
  onCreate,
  onImport,
}: ModuleListEmptyStateProps) {
  const t = useUiTranslations();
  return (
    <div className="flex flex-col items-start gap-3 p-8" data-testid="module-list-empty-state">
      <h2 className="text-lg font-semibold text-text">{heading}</h2>
      <p className="max-w-xl text-md text-text-muted">{text}</p>
      <div className="flex gap-2">
        <Button variant="primary" onPress={onCreate}>
          {t("common.actions.create")}
        </Button>
        <Button variant="primary" onPress={onImport}>
          {t("common.actions.import")}
        </Button>
      </div>
    </div>
  );
}
