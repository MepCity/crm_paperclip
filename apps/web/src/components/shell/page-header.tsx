import type { ReactNode } from "react";

export function PageHeader({
  description,
  actions,
}: {
  description?: ReactNode;
  actions?: ReactNode;
}) {
  if (!description && !actions) return null;
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      {description && <div className="text-md text-text-muted">{description}</div>}
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
