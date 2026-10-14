"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { laterModuleProps, useLaterModule } from "@/components/ui/later-module";

export function RelatedNotesCardBody({ notesShowMore }: { notesShowMore?: boolean }) {
  const notesLaterRef = useLaterModule<HTMLTextAreaElement>("M6");
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="secondary"
          size="compact"
          laterModule="M6"
          className="flex items-center gap-1.5"
        >
          <span>Recent Last</span>
          <Icons.chevronDown aria-hidden className="size-3 text-text-muted" />
        </Button>
      </div>
      <textarea
        ref={notesLaterRef}
        {...laterModuleProps("M6")}
        readOnly
        rows={3}
        placeholder="Add a note"
        aria-label="Add a note"
        className="w-full resize-none rounded-(--radius-md) border border-control-border bg-surface px-3 py-2 text-md text-text focus:outline-primary placeholder:text-text-placeholder"
      />
      {notesShowMore ? (
        <div className="mt-2 text-right">
          <Button variant="secondary" size="compact" laterModule="M6">
            Show More
          </Button>
        </div>
      ) : null}
    </div>
  );
}
