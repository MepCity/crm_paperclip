"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { Link } from "@/components/ui/link";
import { formatFieldValue } from "../field-format";

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
  const rendered = formatFieldValue(field, value, ownerNames, format, { href });
  if (rendered.kind === "empty") return null;
  if (rendered.kind === "link") {
    return (
      <Link href={rendered.link.href} variant="body" prefetch={false}>
        {rendered.link.text}
      </Link>
    );
  }
  if (rendered.kind === "audit") {
    return (
      <>
        {rendered.name}
        {rendered.timestamp ? (
          <>
            <br />
            {rendered.timestamp}
          </>
        ) : null}
      </>
    );
  }
  if (rendered.kind === "multiline") return rendered.text;
  return rendered.text;
}
