"use client";

import { useUiTranslations } from "@/i18n/client-provider";

/**
 * The one body sentence every in-shell not-found screen shows: the organization route fallback,
 * the module list fallback and the record fallback. Keep the copy here; a screen adds its own
 * wrapper, `PageTitle` and controls around it.
 */
export function NotFoundMessage() {
  const t = useUiTranslations();
  return <p className="text-md">{t("common.notFound")}</p>;
}
