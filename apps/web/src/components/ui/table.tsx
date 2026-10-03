import type { ReactNode } from "react";

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

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
      {children}
    </tr>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium text-text-muted">{children}</th>;
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
