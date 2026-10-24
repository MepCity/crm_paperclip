import type { ActivityKind } from "@crm/core/records";
import type { ComponentType, SVGProps } from "react";
import { Icons } from "@/components/ui/icon";
import "./activity-ribbon.css";

export interface ActivityRibbonProps {
  kind: ActivityKind;
  dateText: string | null;
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
    return kind === "task" ? `Open ${kind}, due ${trimmed}` : `Open ${kind}, ${trimmed}`;
  }
  return `Open ${kind}`;
}

/**
 * Activity date ribbon displayed on list row (L-41 / AX-44).
 * Rendered between row checkbox and record link when an open activity exists.
 */
export function ActivityRibbon({ kind, dateText, href, className }: ActivityRibbonProps) {
  const Icon = KIND_ICONS[kind] ?? Icons.check;
  const hasDateText = Boolean(dateText && dateText.trim().length > 0);
  const accessibleLabel = formatAccessibleLabel(kind, dateText);

  const classes = [
    "activity-ribbon",
    `activity-ribbon--${kind}`,
    hasDateText ? "" : "activity-ribbon--icon-only",
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
    >
      {content}
    </span>
  );
}

export default ActivityRibbon;
