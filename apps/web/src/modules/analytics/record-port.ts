import { type FormatOptions, formatCurrency } from "@crm/core/format";
import type { RecordData, RecordService } from "@crm/core/records";
import { DEFAULT_FORMAT } from "@/lib/locale";
import type { AnalyticsPort } from "./port";

const sourceColors = ["#1f6be8", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

/** Read every page through the same permission-scoped service as record lists. */
async function readRecords(service: RecordService, module: string) {
  const records: RecordData[] = [];
  // The current adapter applies its optional record-read guard to system-filtered
  // lists. Both lock partitions preserve every readable record, including locked ones.
  for (const locked of [false, true]) {
    for (let page = 1; ; page++) {
      const result = await service.list(module, {
        viewId: `all-${module.toLowerCase()}`,
        page,
        perPage: 100,
        systemFilters: { locked: { locked } },
      });
      records.push(...result.records);
      if (!result.moreRecords) break;
    }
  }
  return records;
}

export function createRecordAnalyticsPort(
  service: RecordService,
  options: {
    now?: () => Date;
    format?: FormatOptions;
    ownerNames?: ReadonlyMap<string, string>;
  } = {},
): AnalyticsPort {
  return {
    async getDashboard() {
      const format = options.format ?? DEFAULT_FORMAT;
      const monthFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: format.timeZone,
        year: "numeric",
        month: "2-digit",
      });
      const monthKey = (date: Date) => {
        const parts = monthFormatter.formatToParts(date);
        return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}`;
      };
      const currentMonth = monthKey(options.now?.() ?? new Date());
      const year = Number(currentMonth.slice(0, 4));
      const month = Number(currentMonth.slice(5, 7));
      const previousMonth = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
      const recordMonth = (value: unknown) => {
        if (typeof value !== "string") return null;
        // Closing_Date is a calendar day and must never shift with the time zone.
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : monthKey(date);
      };
      const [leads, accounts, deals, metadata, currency] = await Promise.all([
        readRecords(service, "Leads"),
        readRecords(service, "Accounts"),
        readRecords(service, "Deals"),
        service.getModule("Deals"),
        service.getHomeCurrency(),
      ]);
      const stages = new Map(
        metadata.fields
          .find((field) => field.apiName === "Stage")
          ?.picklist?.map((option) => [option.storedValue, option.stage?.category]),
      );
      const currentLeads = leads.filter(
        (row) => recordMonth(row.fields.Created_Time) === currentMonth,
      );
      const currentAccounts = accounts.filter(
        (row) => recordMonth(row.fields.Created_Time) === currentMonth,
      ).length;
      const previousAccounts = accounts.filter(
        (row) => recordMonth(row.fields.Created_Time) === previousMonth,
      ).length;
      const won = deals.filter(
        (row) =>
          stages.get(String(row.fields.Stage)) === "Closed Won" &&
          recordMonth(row.fields.Closing_Date) === currentMonth,
      );
      const pipeline = deals.filter(
        (row) => stages.get(String(row.fields.Stage)) === "Open",
      ).length;
      const cents = (row: RecordData) =>
        typeof row.fields.Amount === "number" && Number.isFinite(row.fields.Amount)
          ? Math.round(row.fields.Amount * 100)
          : 0;
      const revenue = won.reduce((sum, row) => sum + cents(row), 0) / 100;
      const money = (amount: number) => formatCurrency(amount, currency.isoCode, format);
      const sources = new Map<string, number>();
      for (const row of currentLeads) {
        const label =
          typeof row.fields.Lead_Source === "string" && row.fields.Lead_Source
            ? row.fields.Lead_Source
            : "Not Specified";
        sources.set(label, (sources.get(label) ?? 0) + 1);
      }
      const owners = new Map<string, number>();
      for (const row of won) {
        const owner = typeof row.fields.Owner === "string" ? row.fields.Owner : "";
        owners.set(owner, (owners.get(owner) ?? 0) + cents(row));
      }
      const reps = [...owners]
        .sort(([a, amountA], [b, amountB]) => amountB - amountA || a.localeCompare(b))
        .slice(0, 10)
        .map(([owner, amount], index) => ({
          rank: index + 1,
          name: options.ownerNames?.get(owner) ?? "Unknown owner",
          amount: money(amount / 100),
        }));
      return {
        overviewTitle: "Org Overview",
        scopeLabel: "All Users",
        leadsThisMonth: currentLeads.length
          ? { state: "value", value: currentLeads.length }
          : { state: "empty" },
        dealsInPipeline: pipeline ? { state: "value", value: pipeline } : { state: "empty" },
        revenueThisMonth: won.length
          ? { state: "value", value: revenue, formatted: money(revenue) }
          : { state: "empty" },
        accountsThisMonth: currentAccounts
          ? {
              state: "value",
              value: currentAccounts,
              previousPeriodValue: previousAccounts,
              previousPeriodLabel: "Last Month Relative:",
              ...(previousAccounts
                ? {
                    changePercentage: `${Number((((currentAccounts - previousAccounts) / previousAccounts) * 100).toFixed(1))}%`,
                  }
                : {}),
            }
          : { state: "empty" },
        leadTarget: { state: "empty" },
        revenueTarget: { state: "empty" },
        performanceMonitor: { state: "empty" },
        leadsBySource: currentLeads.length
          ? {
              state: "value",
              sources: [...sources]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([label, count], index) => ({
                  label,
                  count,
                  percentage: (count / currentLeads.length) * 100,
                  color: sourceColors[index % sourceColors.length] ?? "#1f6be8",
                })),
            }
          : { state: "empty" },
        prolificReps: reps.length
          ? {
              state: "value",
              ownerColumnLabel: "Deal Owner",
              amountColumnLabel: "Sum of Amount",
              reps,
            }
          : { state: "empty" },
      };
    },
  };
}
