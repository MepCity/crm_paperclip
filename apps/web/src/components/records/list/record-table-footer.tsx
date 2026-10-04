"use client";

import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";

export interface RecordTableFooterProps {
  /** Matching record count. `null` when the count has not arrived yet. */
  total: number | null;
  /** One-based page index. */
  page: number;
  pageSize: number;
  /** How many records are on this page. */
  recordCount: number;
  moreRecords: boolean;
  previousHref: string | null;
  nextHref: string | null;
}

/**
 * List footer: total on the left, the page range and previous/next on the right.
 * Both controls are disabled on a single page.
 */
export function RecordTableFooter({
  total,
  page,
  pageSize,
  recordCount,
  moreRecords,
  previousHref,
  nextHref,
}: RecordTableFooterProps) {
  const from = recordCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = recordCount === 0 ? 0 : from + recordCount - 1;
  const previous = page > 1 ? previousHref : null;
  const next = moreRecords ? nextHref : null;

  return (
    <fieldset
      data-part="footer"
      aria-label="Records summary"
      className="m-0 box-content flex h-(--size-list-footer-height) w-full min-w-0 items-center justify-between border-x-0 border-y border-panel-border bg-surface px-(--size-list-cell-inset) py-0 text-13 text-text"
    >
      <span className="inline-flex items-center gap-1">
        <span data-part="total-label">Total Records</span>
        {total !== null && (
          <span data-part="total-value" className="font-semibold">
            {total}
          </span>
        )}
      </span>
      <span className="inline-flex items-center gap-3">
        <span data-part="range">
          <span data-part="range-end" className="font-semibold">
            {from}
          </span>
          <span data-part="range-to-word"> to </span>
          <span data-part="range-end" className="font-semibold">
            {to}
          </span>
        </span>
        <PageControl label="Previous" href={previous} icon="before" />
        <PageControl label="Next" href={next} icon="after" />
      </span>
    </fieldset>
  );
}

function PageControl({
  label,
  href,
  icon,
}: {
  label: string;
  href: string | null;
  icon: "before" | "after";
}) {
  const glyph =
    icon === "before" ? (
      <Icons.chevronLeft className="size-(--text-13) shrink-0" aria-hidden />
    ) : (
      <Icons.chevronRight className="size-(--text-13) shrink-0" aria-hidden />
    );
  const content = (
    <>
      {icon === "before" && glyph}
      {label}
      {icon === "after" && glyph}
    </>
  );

  if (href === null) {
    return (
      <span aria-disabled="true" className="inline-flex items-center gap-1 text-text-disabled">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} variant="body" prefetch={false} className="inline-flex items-center gap-1">
      {content}
    </Link>
  );
}
