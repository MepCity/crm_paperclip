"use client";

import type { ActivityKind } from "@crm/core/records";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useRecordLabel } from "@/i18n/record-labels";
import "./activity-categories-card-body.css";

export interface ParentActivityRow {
  id: string;
  subject: string;
  href: string;
  dateText: string | null;
  ownerName: string | null;
  details: readonly { label: string; value: string }[];
}

export interface ParentActivityCategory {
  kind: ActivityKind;
  count: number;
  rows: readonly ParentActivityRow[];
}

export interface ActivityCategoriesCardBodyProps {
  variant: "open" | "closed";
  categories: readonly ParentActivityCategory[];
}

const categoryDefinitions = [
  { kind: "task", label: "Tasks", Icon: Icons.task },
  { kind: "meeting", label: "Meetings", Icon: Icons.calendar },
  { kind: "call", label: "Calls", Icon: Icons.phone },
] as const;

export function ActivityCategoriesCardBody({
  variant,
  categories,
}: ActivityCategoriesCardBodyProps) {
  const recordLabel = useRecordLabel();
  const prefix = variant === "open" ? "Open" : "Closed";

  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard focusable
    <div className="activity-categories-card-body" tabIndex={0}>
      {categoryDefinitions.map(({ kind, label, Icon }) => {
        const category = categories.find((item) => item.kind === kind);
        const count = category?.count ?? 0;
        const rows = category?.rows ?? [];
        const title = recordLabel(`${prefix} ${label}`);

        return (
          <section
            key={kind}
            aria-label={`${title} (${count})`}
            className="activity-categories-column"
          >
            <h3 aria-label={`${title} (${count})`} className="activity-categories-heading">
              <Icon size={18} aria-hidden="true" />
              <span>{title}</span>
              <span className="activity-categories-count">{count}</span>
            </h3>
            <ul className="activity-categories-rows">
              {rows.length === 0 ? (
                <li className="activity-categories-row text-text-empty">
                  {recordLabel("No records found")}
                </li>
              ) : (
                rows.map((row) => (
                  <li key={row.id} className="activity-categories-row">
                    <Link href={row.href} className="activity-categories-subject">
                      {row.subject}
                    </Link>
                    {row.dateText !== null && <div>{row.dateText}</div>}
                    {row.ownerName !== null && (
                      <div className="activity-categories-owner">
                        <Icons.userRound size={16} aria-hidden="true" />
                        <span>{row.ownerName}</span>
                      </div>
                    )}
                    {row.details.length > 0 && (
                      <dl className="activity-categories-details">
                        {row.details.map((detail) => (
                          <div key={detail.label}>
                            <dt>{detail.label}</dt>
                            <dd>: {detail.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
