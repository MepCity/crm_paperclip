"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";

export interface DraftsPageProps {
  /** Back navigation callback (PS-07). */
  onBack?: () => void;
  /** Information action callback (PS-08). */
  onInfo?: () => void;
  /** Help action callback (PS-09). */
  onHelp?: () => void;
  /** Add criterion callback (PS-15). */
  onAddCriterion?: () => void;
}

/**
 * Drafts unwired empty page component (PS-07–PS-16).
 * Displays header, collapsible Criteria card with disabled first criterion row,
 * and an empty results card.
 */
export function DraftsPage({ onBack, onInfo, onHelp, onAddCriterion }: DraftsPageProps) {
  const titleId = useId();
  const [isCriteriaExpanded, setIsCriteriaExpanded] = useState(true);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-bg p-6 text-text">
      {/* Header row: Back arrow, Title, Info icon, Help */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* PS-07: Back navigation */}
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Icons.arrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <h1 id={titleId} className="text-xl font-bold text-text-strong">
            Drafts
          </h1>
          {/* PS-08: Information icon */}
          <button
            type="button"
            aria-label="Information"
            onClick={onInfo}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Icons.info className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {/* PS-09: Help */}
        <button
          type="button"
          onClick={onHelp}
          aria-label="Help"
          className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-sm font-normal text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Icons.info className="h-4 w-4" aria-hidden />
          <span>Help</span>
        </button>
      </div>

      {/* Criteria card */}
      <div className="mt-4 rounded-lg border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Criteria</h2>
          {/* PS-10: Hide / chevron toggles local expanded state */}
          <button
            type="button"
            aria-label={isCriteriaExpanded ? "Hide criteria" : "Show criteria"}
            onClick={() => setIsCriteriaExpanded(!isCriteriaExpanded)}
            className="inline-flex items-center gap-1 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>{isCriteriaExpanded ? "Hide" : "Show"}</span>
            {isCriteriaExpanded ? (
              <Icons.chevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <Icons.chevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {isCriteriaExpanded && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* PS-11: Criteria row index box */}
              <input
                type="text"
                readOnly
                value="1"
                aria-label="Criterion index"
                className="h-8 w-8 select-none rounded border border-border bg-surface text-center text-sm font-semibold text-text focus:outline-none"
              />

              {/* PS-12: Field selector showing None */}
              <button
                type="button"
                aria-label="Field selector"
                className="flex h-8 w-52 items-center justify-between rounded border border-border bg-surface px-3 text-sm text-text transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <span>None</span>
                <Icons.chevronDown className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              </button>

              {/* PS-13: Operator selector disabled showing None */}
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Operator selector"
                className="flex h-8 w-36 cursor-not-allowed items-center justify-between rounded border border-border bg-surface-muted px-3 text-sm text-text-muted opacity-60"
              >
                <span>None</span>
                <Icons.chevronDown className="h-3.5 w-3.5 text-text-muted" aria-hidden />
              </button>

              {/* PS-14: Value textbox disabled */}
              <input
                type="text"
                disabled
                aria-disabled="true"
                aria-label="Criterion value"
                placeholder=""
                className="h-8 flex-1 min-w-[200px] max-w-md cursor-not-allowed rounded border border-border bg-surface-muted px-3 text-sm text-text-muted opacity-60 focus:outline-none"
              />

              {/* PS-15: Plus icon */}
              <button
                type="button"
                aria-label="Add criterion"
                onClick={onAddCriterion}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-success text-success transition-colors hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Icons.plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* PS-16: Search button disabled */}
            <div className="flex justify-end">
              <Button variant="primary" isDisabled aria-label="Search">
                Search
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results card: empty status */}
      <div className="mt-4 rounded-lg border border-border bg-surface p-12 text-center shadow-xs">
        <p className="text-sm text-text-muted">No records available</p>
      </div>
    </div>
  );
}
