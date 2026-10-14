import type { ComponentType, SVGProps } from "react";
import { Icons } from "@/components/ui/icon";
import "./activity-ribbon.css";

export type ActivityKind = "task" | "meeting" | "call";

export interface ActivityRibbonProps {
  kind: ActivityKind;
  dateText: string | null;
  overdue?: boolean;
  href?: string;
  className?: string;
}

const KIND_ICONS: Record<ActivityKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  task: Icons.check,
  meeting: Icons.calendar,
  call: Icons.phone,
};

function formatAccessibleLabel(kind: ActivityKind, dateText: string | null | undefined): string {
  const trimmed = dateText?.trim();
  if (trimmed) {
    return `Open ${kind}, due ${trimmed}`;
  }
  return `Open ${kind}`;
}

/**
 * Activity date ribbon displayed on list row (L-41 / AX-44).
 * Rendered between row checkbox and record link when an open activity exists.
 */
export function ActivityRibbon({
  kind,
  dateText,
  overdue = false,
  href,
  className,
}: ActivityRibbonProps) {
  const Icon = KIND_ICONS[kind] ?? Icons.check;
  const hasDateText = Boolean(dateText && dateText.trim().length > 0);
  const accessibleLabel = formatAccessibleLabel(kind, dateText);

  const classes = [
    "activity-ribbon",
    `activity-ribbon--${kind}`,
    hasDateText ? "" : "activity-ribbon--icon-only",
    overdue ? "activity-ribbon--overdue overdue" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Icon aria-hidden="true" className="activity-ribbon-icon" data-part="icon" data-kind={kind} />
      {hasDateText ? (
        <span className="activity-ribbon-date" data-part="date">
          {dateText}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label={accessibleLabel}
        className={classes}
        data-part="activity-ribbon"
        data-kind={kind}
        data-overdue={overdue ? "true" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={classes}
      data-part="activity-ribbon"
      data-kind={kind}
      data-overdue={overdue ? "true" : undefined}
    >
      {content}
    </span>
  );
}

export default ActivityRibbon;
