"use client";

import { useUiTranslations } from "@/i18n/client-provider";

/** The in-shell denied state (403) shown by module routes and settings pages without permission. */
export function AccessDenied() {
  const t = useUiTranslations();
  return (
    <div className="p-6" role="alert" data-testid="access-denied">
      <h1 className="text-lg font-semibold">{t("common.accessDeniedTitle")}</h1>
      <p className="mt-2 text-md text-text-muted">{t("common.accessDenied")}</p>
    </div>
  );
}
