import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type {
  AccountKpiCardData,
  KpiCardData,
  LeadSourceCardData,
  LeadTargetCardData,
  PerformanceMonitorCardData,
  ProlificRepsCardData,
  RevenueTargetCardData,
} from "./port";

/** Shared card container for dashboard regions. */
export function DashboardCard({
  title,
  onRefresh,
  children,
}: {
  title: string;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex min-h-[220px] flex-col rounded-xl border border-border bg-surface p-4 shadow-xs"
    >
      <div className="flex items-center justify-between pb-2">
        <h2
          className="truncate text-xs font-bold uppercase tracking-wider text-text-muted"
          title={title}
        >
          {title}
        </h2>
        <Button
          variant="icon"
          size="compact"
          aria-label="Refresh Component"
          onClick={onRefresh}
          className="text-text-muted hover:text-text"
        >
          <Icons.refresh className="size-3.5" aria-hidden />
        </Button>
      </div>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </section>
  );
}

/** Standard dependency-free empty-state illustration for dashboard cards. */
export function CardEmptyIllustration({ label = "No data available" }: { label?: string }) {
  return (
    <div
      data-testid="empty-illustration"
      className="flex h-full min-h-[130px] flex-col items-center justify-center p-3 text-center"
    >
      <svg
        className="mb-2 size-12 text-border"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="6" y="8" width="36" height="32" rx="4" />
        <path d="M12 32l8-10 6 6 10-12" />
        <circle cx="36" cy="16" r="2" fill="currentColor" />
        <line x1="6" y1="36" x2="42" y2="36" />
      </svg>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

/** A10.01 / A10.02 / A10.03: Standard KPI card content. */
export function KpiCardContent({ data }: { data: KpiCardData<number> }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <span className="text-3xl font-semibold tracking-tight text-text">
        {data.formatted ?? data.value ?? 0}
      </span>
    </div>
  );
}

/** A10.04: Accounts KPI card with relative change caption. */
export function AccountsKpiContent({ data }: { data: AccountKpiCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <span className="text-3xl font-semibold tracking-tight text-text">{data.value ?? 0}</span>
      {data.changePercentage && (
        <span className="mt-1 text-xs font-semibold text-success">{data.changePercentage}</span>
      )}
      {data.previousPeriodLabel && (
        <span className="mt-1 text-xs text-text-muted">
          {data.previousPeriodLabel} {data.previousPeriodValue ?? 0}
        </span>
      )}
    </div>
  );
}

/** A11.01: Lead generation target semicircular gauge. */
export function LeadTargetContent({ data }: { data: LeadTargetCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  const current = data.current ?? 0;
  const target = data.target ?? 1000;
  const remaining = data.remaining ?? Math.max(0, target - current);
  const ratio = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
  const semiCircumference = Math.PI * 65; // ~204.2
  const strokeDashoffset = semiCircumference * (1 - ratio);

  return (
    <div className="flex flex-col items-center py-1">
      <svg viewBox="0 0 200 110" className="h-28 w-48" aria-hidden="true">
        {/* Background track */}
        <path
          d="M 35 90 A 65 65 0 0 1 165 90"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 35 90 A 65 65 0 0 1 165 90"
          fill="none"
          stroke="var(--color-accent-blue)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={semiCircumference}
          strokeDashoffset={strokeDashoffset}
        />
        {/* Needle/center indicator text */}
        <text x="100" y="82" textAnchor="middle" className="fill-text text-xl font-bold">
          {current}
        </text>
        <text x="100" y="102" textAnchor="middle" className="fill-text-muted text-[10px]">
          Remaining : {remaining}
        </text>
        {/* Endpoints */}
        <text x="35" y="105" textAnchor="middle" className="fill-text-muted text-[9px]">
          0
        </text>
        <text x="165" y="105" textAnchor="middle" className="fill-text-muted text-[9px]">
          Target: {target}
        </text>
      </svg>
    </div>
  );
}

/** A11.02: Revenue target horizontal progress bar. */
export function RevenueTargetContent({ data }: { data: RevenueTargetCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  const percentage = data.percentage ?? 0;
  return (
    <div className="flex flex-col justify-center px-2 py-2">
      <div className="flex items-center justify-between text-xs text-text-muted pb-1">
        <span>{data.category ?? "Entire Org"}</span>
        <span>{data.sumMetric ?? "Sum of Amount"}</span>
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-text pb-2">
        <span>Target : {data.formattedTarget ?? "$10,000,000.00"}</span>
        <span>Achieved : {data.formattedAchieved ?? "$785,000.00"}</span>
      </div>
      <div className="relative h-6 w-full overflow-hidden rounded-md bg-border/50">
        <div
          className="h-full bg-accent-blue transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <span className="inline-block size-3 rounded-xs bg-accent-blue" aria-hidden="true" />
        <span>Achieved</span>
      </div>
    </div>
  );
}

/** A12.01: Last 3 months performance monitor table. */
export function PerformanceMonitorContent({ data }: { data: PerformanceMonitorCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  const metrics = data.metrics ?? [];
  return (
    <div className="flex flex-col px-1 py-1">
      {data.period && (
        <div className="mb-2 border-b border-border pb-1 text-xs font-semibold text-text">
          {data.period}
        </div>
      )}
      <table className="w-full text-xs">
        <tbody>
          {metrics.map((row) => (
            <tr key={row.label} className="border-b border-border/40 last:border-b-0">
              <td className="py-1.5 text-text-muted">{row.label}</td>
              <td className="py-1.5 text-right font-semibold text-text">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A12.02: Leads by source donut chart and legend. */
export function LeadsBySourceContent({ data }: { data: LeadSourceCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  const sources = data.sources ?? [];
  const total = sources.reduce((sum, s) => sum + s.count, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32

  let accumulated = 0;
  const segments = sources.map((source) => {
    const fraction = source.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulated * circumference);
    accumulated += fraction;
    return {
      ...source,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-wrap items-center justify-around gap-4 py-2">
      <svg viewBox="0 0 100 100" className="size-24 shrink-0" aria-hidden="true">
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={seg.strokeDasharray}
            strokeDashoffset={seg.strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1 text-xs text-text-muted">
        {sources.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="truncate">
              {s.label} {s.count} ({s.percentage.toFixed(2)} %)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A12.03: Prolific sales reps scorecard. */
export function ProlificRepsContent({ data }: { data: ProlificRepsCardData }) {
  if (data.state === "empty") {
    return <CardEmptyIllustration />;
  }
  const reps = data.reps ?? [];
  return (
    <div className="flex flex-col px-1 py-1">
      <div className="flex items-center justify-between border-b border-border pb-1.5 text-xs font-semibold text-text-muted">
        <span>{data.ownerColumnLabel ?? "Deal Owner"}</span>
        <span>{data.amountColumnLabel ?? "Sum of Amount"}</span>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {reps.map((rep) => (
            <tr key={rep.name} className="border-b border-border/40 last:border-b-0">
              <td className="py-2 text-text">
                {rep.rank}. {rep.name}
              </td>
              <td className="py-2 text-right font-semibold text-text">{rep.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
