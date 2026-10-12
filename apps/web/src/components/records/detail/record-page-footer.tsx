"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";

export function RecordPageFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="Record Management Section"
      data-record-footer
      className="detail-card flex items-center justify-between min-h-[48px] py-2 border border-panel-border"
    >
      <div className="flex items-center">
        <Button variant="secondary" size="compact" laterModule="M11">
          Add Related List
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-md text-text">
          <span>Record detail page views :</span>
          <Button
            variant="secondary"
            size="compact"
            laterModule="M11"
            className="flex items-center gap-1.5"
          >
            <span>Standard View</span>
            <Icons.chevronDown aria-hidden className="size-3 text-text-muted" />
          </Button>
        </div>
        <Button variant="secondary" size="compact" laterModule="M11">
          Create a custom record page
        </Button>
      </div>
    </footer>
  );
}
