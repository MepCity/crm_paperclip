import {
  type FormatOptions,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatRecordAuditDateTime,
} from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";

export const EMPTY_FIELD_DISPLAY = "—";

export type FieldFormattedLink = { href: string; text: string };

export type FieldFormattedValue =
  | { kind: "empty" }
  | { kind: "text"; text: string }
  | { kind: "link"; link: FieldFormattedLink }
  | { kind: "multiline"; text: string }
  | { kind: "audit"; name: string; timestamp: string };

export function isFieldValueEmpty(field: FieldDefinition, value: FieldValue): boolean {
  if (value === null || value === "") return true;
  if (field.dataType === "boolean" && value === false) return true;
  if (field.dataType === "picklist" && typeof value === "string" && value === "") return true;
  return false;
}

export function formatFieldValue(
  field: FieldDefinition,
  value: FieldValue,
  ownerNames: Readonly<Record<string, string>>,
  format: FormatOptions,
  options?: {
    href?: string;
    auditTimestamp?: string | null;
    multiline?: boolean;
    /** Detail rows link website values; list cells keep them as plain text. */
    linkWebsite?: boolean;
    /** ISO 4217 code; when omitted, currency values use plain number formatting. */
    currencyCode?: string;
  },
): FieldFormattedValue {
  if (value === null || value === "") return { kind: "empty" };

  if (isAuditField(field) && typeof value === "string") {
    const name = ownerNames[value] ?? value;
    const timestamp =
      options?.auditTimestamp === null || options?.auditTimestamp === undefined
        ? ""
        : formatRecordAuditDateTime(options.auditTimestamp, format);
    return { kind: "audit", name, timestamp };
  }

  if (options?.href) {
    const text = valueText(field, value, ownerNames, format, options);
    if (text === null) return { kind: "empty" };
    return { kind: "link", link: { href: options.href, text } };
  }

  if (field.dataType === "email" && typeof value === "string") {
    const mail = mailHref(value);
    if (mail) return { kind: "link", link: { href: mail, text: value } };
  }

  if (options?.linkWebsite && field.dataType === "website" && typeof value === "string") {
    const href = websiteHref(value);
    if (href) return { kind: "link", link: { href, text: value } };
  }

  const text = valueText(field, value, ownerNames, format, options);
  if (text === null) return { kind: "empty" };
  if (options?.multiline || field.dataType === "textarea") {
    return { kind: "multiline", text };
  }
  return { kind: "text", text };
}

export function isAuditField(field: FieldDefinition): boolean {
  return field.apiName === "Created_By" || field.apiName === "Modified_By";
}

function valueText(
  field: FieldDefinition,
  value: FieldValue,
  ownerNames: Readonly<Record<string, string>>,
  format: FormatOptions,
  options?: {
    currencyCode?: string;
  },
): string | null {
  if (value === null || value === "") return null;

  if (field.dataType === "ownerlookup" && typeof value === "string") {
    return ownerNames[value] ?? value;
  }

  if (field.dataType === "datetime" && typeof value === "string") {
    return formatDateTime(value, format);
  }

  if (field.dataType === "picklist" && typeof value === "string") {
    const option = field.picklist?.find((candidate) => candidate.storedValue === value);
    return option?.displayValue ?? value;
  }

  if (field.dataType === "currency" && typeof value === "number") {
    if (options?.currencyCode) {
      return formatCurrency(value, options.currencyCode, format);
    }
    return formatNumber(value, format);
  }

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value !== null && "id" in value) return value.id;
  return null;
}

function mailHref(value: string): string | null {
  if (!/^[^\s<>"]+$/.test(value)) return null;
  return `mailto:${value}`;
}

function websiteHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
