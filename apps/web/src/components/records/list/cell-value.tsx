"use client";

import { type FormatOptions, formatDateTime } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { Link } from "@/components/ui/link";

export interface CellValueProps {
  field: FieldDefinition;
  value: FieldValue;
  /**
   * Row address for the link column. Email stays a `mailto:` link unless this
   * column is itself the link column, in which case the row address wins.
   */
  href?: string;
  /**
   * User id → display name for `ownerlookup` cells. The component does not
   * resolve users; the caller supplies the map. An unknown id is shown as text.
   */
  ownerNames?: Readonly<Record<string, string>>;
  /** Locale and time zone for datetime cells. */
  format: FormatOptions;
}

/**
 * Read-only cell text for the field types that appear as columns in the list
 * views: text, email, phone, picklist, ownerlookup and datetime.
 */
export function CellValue({ field, value, href, ownerNames = {}, format }: CellValueProps) {
  const rendered = renderValue(field, value, href, ownerNames, format);
  if (rendered === null) return null;
  if (typeof rendered === "string") return rendered;
  return (
    <Link href={rendered.href} variant="body" prefetch={false}>
      {rendered.text}
    </Link>
  );
}

type Linked = { href: string; text: string };

function renderValue(
  field: FieldDefinition,
  value: FieldValue,
  href: string | undefined,
  ownerNames: Readonly<Record<string, string>>,
  format: FormatOptions,
): string | Linked | null {
  const text = valueText(field, value, ownerNames, format);
  if (text === null) return null;
  if (href) return { href, text };
  if (field.dataType === "email" && typeof value === "string") {
    const mail = mailHref(value);
    if (mail) return { href: mail, text };
  }
  return text;
}

function valueText(
  field: FieldDefinition,
  value: FieldValue,
  ownerNames: Readonly<Record<string, string>>,
  format: FormatOptions,
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

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return value.id;
}

/** A mail link only for a single address token. Anything else stays plain text. */
function mailHref(value: string): string | null {
  if (!/^[^\s<>"]+$/.test(value)) return null;
  return `mailto:${value}`;
}
