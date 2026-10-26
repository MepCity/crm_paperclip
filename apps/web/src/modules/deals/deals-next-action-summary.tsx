"use client";

import type { ModuleApiName } from "@crm/core/records";
import { type LinkedActivity, selectActivitySummary } from "@crm/core/records/activities";
import { Link } from "@/components/ui/link";
import { useParentActivities } from "@/lib/records/use-parent-activities";

export interface DealsNextActionSummaryProps {
  dealId: string;
  recordPath: (module: ModuleApiName, id: string) => string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateStrip(iso: string | null): { month: string; day: string } | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return null;
  return { month, day: String(Number(match[3])) };
}

/** DD-69: Next Action summary – the nearest open activity of the deal (same rule as the list ribbon). */
export function DealsNextActionSummary({ dealId, recordPath }: DealsNextActionSummaryProps) {
  const activities = useParentActivities("Deals", dealId, recordPath);
  if (activities.isLoading) return null;

  const linked: (LinkedActivity & { subject: string; href: string })[] = [];
  for (const category of activities.open) {
    for (const row of category.rows) {
      linked.push({
        kind: category.kind,
        activityId: row.id,
        date: row.date,
        state: "open",
        subject: row.subject,
        href: row.href,
      });
    }
  }
  const selected = selectActivitySummary(linked);
  if (!selected) return null;
  const row = linked.find(
    (item) => item.kind === selected.kind && item.activityId === selected.activityId,
  );
  if (!row) return null;
  const strip = dateStrip(row.date);

  return (
    <section
      aria-label="Next Action summary"
      data-deals-next-action-summary
      className="mx-3 mb-3 flex flex-col gap-2 rounded-md border border-panel-border bg-surface px-4 py-3"
    >
      <h3 className="text-md font-semibold text-text">Next Action</h3>
      <div className="flex items-center gap-3">
        <div
          data-next-action-date
          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md bg-bg text-center"
        >
          {strip ? (
            <>
              <span className="text-xs uppercase text-text-muted">{strip.month}</span>
              <span className="text-md font-semibold text-text">{strip.day}</span>
            </>
          ) : null}
        </div>
        <Link
          href={row.href}
          variant="body"
          className="min-w-0 truncate text-md font-semibold text-primary hover:underline"
        >
          {row.subject}
        </Link>
      </div>
    </section>
  );
}
