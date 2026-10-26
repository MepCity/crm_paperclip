"use client";

import type { ReactNode } from "react";
import { useUiTranslations } from "@/i18n/client-provider";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const t = useUiTranslations();
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <h2 className="text-xl font-semibold text-text">
        {title === "No records found" ? t("common.empty") : title}
      </h2>
      {description ? <p className="max-w-md text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
