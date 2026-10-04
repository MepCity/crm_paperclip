import type { ReactNode } from "react";
import { Icons } from "./icon";

const alertStyles = {
  // The primary token measures 4.39:1 on its own 5% tint, below the 4.5:1 ADR 0003
  // requires, so only the icon carries the primary colour.
  info: "bg-primary/5 text-text",
  success: "bg-success/5 text-success",
  warning: "bg-warning/5 text-warning",
  danger: "bg-danger/5 text-danger",
} as const;

const alertIconStyles = {
  info: "text-primary",
  success: "",
  warning: "",
  danger: "",
} as const;

const alertIcons = {
  info: Icons.info,
  success: Icons.success,
  warning: Icons.warning,
  danger: Icons.error,
} as const;

const alertBase = "p-4 rounded-md flex gap-3";
const alertIconBase = "w-5 h-5 shrink-0";

export function Alert({
  children,
  variant = "info",
  title,
}: {
  children: ReactNode;
  variant?: keyof typeof alertStyles;
  title?: string;
}) {
  const Icon = alertIcons[variant];

  return (
    <div className={`${alertBase} ${alertStyles[variant]}`} role="alert">
      <Icon className={`${alertIconBase} ${alertIconStyles[variant]}`} aria-hidden="true" />
      <div>
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
