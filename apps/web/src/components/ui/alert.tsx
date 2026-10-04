import type { ReactNode } from "react";
import { Icons } from "./icon";

export function Alert({
  children,
  variant = "info",
  title,
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}) {
  let classes = "p-4 rounded-md flex gap-3 ";
  let Icon = Icons.info;
  if (variant === "info") {
    classes += "bg-primary/5 text-primary ";
    Icon = Icons.info;
  }
  if (variant === "success") {
    classes += "bg-success/5 text-success ";
    Icon = Icons.success;
  }
  if (variant === "warning") {
    classes += "bg-warning/5 text-warning ";
    Icon = Icons.warning;
  }
  if (variant === "danger") {
    classes += "bg-danger/5 text-danger ";
    Icon = Icons.error;
  }

  return (
    <div className={classes} role="alert">
      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
      <div>
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
