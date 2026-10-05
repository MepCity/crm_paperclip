import { Children, type ReactNode } from "react";

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-auto ${className}`}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="border-b border-border bg-surface-hover">{children}</thead>;
}

export function TableBody({
  children,
  columnCount = 1,
  emptyMessage = "No records to display.",
}: {
  children?: ReactNode;
  columnCount?: number;
  emptyMessage?: string;
}) {
  return (
    <tbody>
      {Children.toArray(children).length > 0 ? (
        children
      ) : (
        <tr>
          <td colSpan={columnCount} className="px-4 py-8 text-center text-text-muted">
            {emptyMessage}
          </td>
        </tr>
      )}
    </tbody>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
      {children}
    </tr>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 font-semibold text-text-muted">
      {children}
    </th>
  );
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
