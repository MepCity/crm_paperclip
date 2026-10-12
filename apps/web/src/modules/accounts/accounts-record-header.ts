import type { RecordData } from "@crm/core/records";
import { type ComponentType, createElement, type SVGProps } from "react";

/**
 * Original building vector placeholder for Account portrait; no reference CRM image
 * assets or vendor iconography are copied.
 */
export function AccountBuildingPlaceholder(props: SVGProps<SVGSVGElement>) {
  return createElement(
    "svg",
    {
      role: "img",
      "aria-label": props["aria-label"] ?? "Account building placeholder",
      viewBox: "0 0 48 48",
      fill: "currentColor",
      ...props,
    },
    createElement("path", {
      d: "M8 42V14l16-8 16 8v28H8Zm4-4h24V16.5L24 10.5 12 16.5V38Zm4-4h4v-4h-4v4Zm0-8h4v-4h-4v4Zm0-8h4v-4h-4v4Zm12 16h4v-4h-4v4Zm0-8h4v-4h-4v4Zm0-8h4v-4h-4v4Zm-6 16h4v-6h-4v6Z",
    }),
  );
}

/** Prepend https:// protocol when absent for valid web links. */
export function formatWebsiteUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Record header identity: Account_Name title and Website link (AD-99) beside it.
 * Building placeholder icon is returned for account portrait rendering.
 * Contacts Account link (D-03) does not exist.
 */
export function accountsRecordHeaderIdentity(record: RecordData): {
  title: string;
  subtitle?: string;
  subtitleHref?: string;
  portraitIcon?: ComponentType<SVGProps<SVGSVGElement>>;
} {
  const text = (name: string) =>
    typeof record.fields[name] === "string" ? (record.fields[name] as string) : "";
  const title = text("Account_Name");
  const website = text("Website").trim();
  const subtitle = website.length > 0 ? website : undefined;
  const subtitleHref = formatWebsiteUrl(website);

  return {
    title,
    ...(subtitle ? { subtitle, subtitleHref } : {}),
    portraitIcon: AccountBuildingPlaceholder,
  };
}
