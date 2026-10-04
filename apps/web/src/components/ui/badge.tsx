import type { ReactNode } from "react";

const badgeStyles = {
  neutral: "bg-surface-hover text-text",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
} as const;

const badgeBase = "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof badgeStyles;
}) {
  return <span className={`${badgeBase} ${badgeStyles[variant]}`}>{children}</span>;
}
