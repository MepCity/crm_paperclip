"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";

export function RecordPageFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="Record Management Section"
      data-record-footer
      // Keep the floating control in a blank lane above the strip at the bottom.
      style={{
        marginTop:
          "calc(var(--size-record-scroll-top) + var(--size-record-scroll-footer-gap) - var(--space-3))",
      }}
      className="detail-card flex flex-wrap items-center justify-between gap-3 min-h-(--size-record-page-strip-height) py-3 border-t border-panel-border"
    >
      <div className="flex items-center">
        <Button variant="secondary" size="compact" laterModule="M11">
          Add Related List
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-(--size-record-page-action-gap)">
        <div className="flex items-center gap-2 text-md text-text">
          <span>Record detail page views :</span>
          <Button
            variant="recordSelector"
            size="pageSelector"
            laterModule="M11"
            className="flex items-center gap-1.5"
          >
            <span>Standard View</span>
            <Icons.chevronDown aria-hidden className="size-3 text-(--color-form-caret)" />
          </Button>
        </div>
        <Button
          variant="recordSecondary"
          size="pageAction"
          laterModule="M11"
          className="from-surface!"
        >
          Create a custom record page
        </Button>
      </div>
    </footer>
  );
}
