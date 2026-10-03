import type { ReactNode } from "react";

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "neutral" | "success" | "warning" | "danger";
}) {
  let classes = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ";
  if (variant === "neutral") classes += "bg-surface-hover text-text ";
  if (variant === "success") classes += "bg-success/10 text-success ";
  if (variant === "warning") classes += "bg-warning/10 text-warning ";
  if (variant === "danger") classes += "bg-danger/10 text-danger ";

  return <span className={classes}>{children}</span>;
}
