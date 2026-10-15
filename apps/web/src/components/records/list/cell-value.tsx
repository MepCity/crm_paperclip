"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import { Link } from "@/components/ui/link";
import { useOptionalOrgSlug } from "@/lib/api/client/provider";
import { formatFieldValue } from "../field-format";

export interface CellValueProps {
  laterModule?: ModuleKey;
  field: FieldDefinition;
  value: FieldValue;
  /**
   * Row address for the link column. Email stays a `mailto:` link unless this
   * column is itself the link column, in which case the row address wins.
   */
  href?: string;
  linkWebsite?: boolean;
  /**
   * User id → display name for `ownerlookup` cells. The component does not
   * resolve users; the caller supplies the map. An unknown id is shown as text.
   */
  ownerNames?: Readonly<Record<string, string>>;
  /** Locale and time zone for date and datetime cells. */
  format: FormatOptions;
  orgSlug?: string;
  /** ISO 4217 code for currency cells; plain number when omitted. */
  currencyCode?: string;
  /** Activities list cells: numeric `dd.mm.yyyy` dates. */
  numericDates?: boolean;
}

/**
 * Read-only cell text for the field types that appear as columns in the list
 * views: text, email, phone, picklist, ownerlookup, date, datetime and lookup.
 */
export function CellValue(props: CellValueProps) {
  const content = <CellContent {...props} />;
  // Activities lists (MEP-590 row 30): a module pictogram precedes the Related To record.
  if (props.numericDates && props.field.label === "Related To" && props.value) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Icons.building aria-hidden className="h-4 w-4 shrink-0 text-muted" />
        {content}
      </span>
    );
  }
  return content;
}

function CellContent({
  field,
  value,
  href,
  linkWebsite,
  ownerNames = {},
  format,
  orgSlug,
  laterModule,
  currencyCode,
  numericDates,
}: CellValueProps) {
  const contextOrgSlug = useOptionalOrgSlug();
  const effectiveOrgSlug = orgSlug ?? contextOrgSlug ?? undefined;
  // List cells retain the id fallback for references without a display name.
  if (
    field.dataType === "lookup" &&
    typeof value === "object" &&
    value &&
    "id" in value &&
    typeof value.id === "string" &&
    (typeof value.name !== "string" || !value.name.trim())
  ) {
    return value.id;
  }
  const rendered = formatFieldValue(field, value, ownerNames, format, {
    href: field.dataType === "lookup" ? undefined : href,
    linkWebsite,
    orgSlug: effectiveOrgSlug,
    currencyCode,
    numericDates,
  });
  if (rendered.kind === "empty") return null;
  if (rendered.kind === "link") {
    return (
      <Link
        href={rendered.link.href ?? "#"}
        variant="body"
        prefetch={false}
        laterModule={laterModule ?? rendered.link.laterModule}
        className="break-words"
      >
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
