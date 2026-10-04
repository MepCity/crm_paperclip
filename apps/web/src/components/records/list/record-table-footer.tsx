"use client";

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
 * List footer: total on the left. When the page has records, the right side is
 * the previous chevron, the range, then the next chevron. Both controls are
 * disabled on a single page. An empty page shows only the total.
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
  const showPager = recordCount > 0;

  return (
    <fieldset
      data-part="footer"
      aria-label="Records summary"
      className="m-0 box-content flex h-(--size-list-footer-height) w-full min-w-0 items-center justify-between border-x-0 border-y border-panel-border bg-surface py-0 ps-(--size-list-inset) pe-(--size-list-footer-end) text-13 text-text"
    >
      <span className="inline-flex items-center gap-1">
        <span data-part="total-label">Total Records</span>
        {total !== null && (
          <span data-part="total-value" className="font-semibold">
            {total}
          </span>
        )}
      </span>
      {showPager && (
        <span className="inline-flex items-center">
          <PageControl
            part="previous"
            label="Previous"
            href={previous}
            direction="previous"
            className="me-(--size-list-footer-gap-before)"
          />
          <span data-part="range">
            <span data-part="range-end" className="font-semibold">
              {from}
            </span>
            <span data-part="range-to-word" className="font-normal text-text-muted">
              {" to "}
            </span>
            <span data-part="range-end" className="font-semibold">
              {to}
            </span>
          </span>
          <PageControl
            part="next"
            label="Next"
            href={next}
            direction="next"
            className="ms-(--size-list-footer-gap-after)"
          />
        </span>
      )}
    </fieldset>
  );
}

function PageControl({
  part,
  label,
  href,
  direction,
  className,
}: {
  part: "previous" | "next";
  label: string;
  href: string | null;
  direction: "previous" | "next";
  className: string;
}) {
  if (href === null) {
    return (
      <span data-part={part} className={`inline-flex text-text-disabled ${className}`}>
        <Chevron direction={direction} label={label} />
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      variant="body"
      prefetch={false}
      data-part={part}
      className={`inline-flex ${className}`}
    >
      <Chevron direction={direction} />
    </Link>
  );
}

function Chevron({ direction, label }: { direction: "previous" | "next"; label?: string }) {
  const d = direction === "previous" ? "M5.5 0.5 0.5 5.5 5.5 10.5" : "M0.5 0.5 5.5 5.5 0.5 10.5";
  return (
    <svg
      viewBox="0 0 6 11"
      data-part="chevron"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      aria-disabled={label ? true : undefined}
      className="h-(--size-list-chevron-height) w-(--size-list-chevron-width) shrink-0"
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
