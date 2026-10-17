"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";

export interface ManageTagsPageProps {
  /** Name of the module whose tags are being managed. Defaults to "Leads". */
  moduleName?: string;
  /** Number of tags currently used. Defaults to 0. */
  tagsUsed?: number;
  /** Total tag capacity. Defaults to 100. */
  tagsCapacity?: number;
  /** Back navigation callback (TAG-09). */
  onBack?: () => void;
  /** Help action callback (TAG-10). */
  onHelp?: () => void;
  /** New tag creation callback (TAG-11). */
  onNewTag?: () => void;
}

/**
 * Manage Tags unwired empty page component (TAG-09–TAG-11).
 * Displays module header, usage counter, and empty table with a New Tag action.
 */
export function ManageTagsPage({
  moduleName = "Leads",
  tagsUsed = 0,
  tagsCapacity = 100,
  onBack,
  onHelp,
  onNewTag,
}: ManageTagsPageProps) {
  const titleId = useId();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-surface p-6 text-text">
      {/* Header row: Back arrow, Title, Module badge, Help */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Icons.arrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <h1 id={titleId} className="text-xl font-bold text-text-strong">
            Manage Tags
          </h1>
          <span className="rounded border border-border px-2 py-0.5 text-xs font-normal text-text-muted">
            {moduleName}
          </span>
        </div>
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

      {/* Explanatory description */}
      <p className="mt-3 text-sm text-text-muted">
        Tags are keywords that help you categorize your records based on their characteristics. Tags
        help you sort your data and find it easily when you need it.
      </p>

      {/* Usage counter */}
      <div className="mt-4 text-right text-sm text-text">
        Tags used : {tagsUsed} / {tagsCapacity}
      </div>

      {/* Empty table */}
      <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <table aria-label="Tags table" className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover/50 text-xs font-semibold text-text">
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Tag Color
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Tag Name
              </th>
              <th scope="col" className="px-6 py-3 font-semibold text-text">
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-6 py-16 text-center">
                <p className="mb-4 text-sm text-text-muted">
                  There are currently no available Tags. Add new Tags by clicking the button below.
                </p>
                <Button variant="primary" onPress={onNewTag} aria-label="New Tag">
                  New Tag
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
