"use client";

import { useUiTranslations } from "@/i18n/client-provider";
import { Icons } from "./icon";

export interface SpinnerProps {
  className?: string;
  label?: string;
  "aria-hidden"?: boolean;
}

export function Spinner({ className = "", label, "aria-hidden": hidden }: SpinnerProps) {
  const t = useUiTranslations();
  const icon = <Icons.spinner className="h-full w-full animate-spin" aria-hidden="true" />;

  if (hidden) {
    return (
      <span aria-hidden className={`inline-flex ${className}`}>
        {icon}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label ?? t("common.loading")}
      className={`inline-flex ${className}`}
    >
      {icon}
    </span>
  );
}
