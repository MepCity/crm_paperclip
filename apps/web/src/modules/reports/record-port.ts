import { type FormatOptions, formatDateTime, formatNumber } from "@crm/core/format";
import type { RecordData, RecordService } from "@crm/core/records";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { EMAIL_REPORT_HEADINGS } from "./fixture-port";
import type { ReportDefinition, ReportDetail, ReportsPort } from "./port";

export const MEETING_REPORT_HEADINGS = [
  "Meeting Title",
  "Host",
  "Start Time",
  "End Time",
  "Venue",
] as const;

export interface ReportColumnConfig {
  header: string;
  field?: string;
  format?: (
    value: unknown,
    record: RecordData,
    format: FormatOptions,
    options: { ownerNames?: ReadonlyMap<string, string> },
  ) => string;
}

export interface ReportConfig extends ReportDefinition {
  module: string;
  columns: readonly ReportColumnConfig[];
  criteria?: (record: RecordData, now: Date) => boolean;
}

function getField(record: RecordData, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record.fields && record.fields[key] !== undefined && record.fields[key] !== null) {
      return record.fields[key];
    }
  }
  return undefined;
}

function asNumber(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

const outreachColumns: readonly ReportColumnConfig[] = [
  {
    header: EMAIL_REPORT_HEADINGS[0],
    field: "Campaign_Name",
    format: (v, r) =>
      String(getField(r, "Template_Name", "Template Name", "Campaign_Name") ?? v ?? "-"),
  },
  {
    header: EMAIL_REPORT_HEADINGS[1],
    field: "Num_sent",
    format: (v, r, fmt) => formatNumber(asNumber(getField(r, "Sent", "Num_sent") ?? v), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[2],
    field: "Expected_Response",
    format: (v, r, fmt) =>
      formatNumber(asNumber(getField(r, "Bounced", "Expected_Response") ?? v), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[3],
    field: "Budgeted_Cost",
    format: (v, r, fmt) =>
      formatNumber(asNumber(getField(r, "Tracked", "Budgeted_Cost") ?? v), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[4],
    field: "Actual_Cost",
    format: (v, r, fmt) =>
      formatNumber(
        asNumber(getField(r, "Bounced_Among_Tracked", "Bounced Among Tracked", "Actual_Cost") ?? v),
        fmt,
      ),
  },
  {
    header: EMAIL_REPORT_HEADINGS[5],
    format: (_v, r, fmt) => formatNumber(asNumber(getField(r, "Opened")), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[6],
    format: (_v, r, fmt) => formatNumber(asNumber(getField(r, "Clicked")), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[7],
    format: (_v, r, fmt) => formatNumber(asNumber(getField(r, "Replied")), fmt),
  },
  {
    header: EMAIL_REPORT_HEADINGS[8],
    format: (_v, r, fmt) => formatNumber(asNumber(getField(r, "Received")), fmt),
  },
];

const meetingColumns: readonly ReportColumnConfig[] = [
  {
    header: MEETING_REPORT_HEADINGS[0],
    field: "Event_Title",
    format: (v, r) => String(getField(r, "Event_Title", "Subject", "Title") ?? v ?? "-"),
  },
  {
    header: MEETING_REPORT_HEADINGS[1],
    field: "Owner",
    format: (v, r, _fmt, opts) => {
      const ownerId = String(getField(r, "Owner") ?? v ?? "");
      if (!ownerId) return "-";
      return opts.ownerNames?.get(ownerId) ?? ownerId;
    },
  },
  {
    header: MEETING_REPORT_HEADINGS[2],
    field: "Start_DateTime",
    format: (v, r, fmt) => {
      const dt = getField(r, "Start_DateTime", "Start_Time") ?? v;
      if (!dt) return "-";
      return formatDateTime(String(dt), fmt) || "-";
    },
  },
  {
    header: MEETING_REPORT_HEADINGS[3],
    field: "End_DateTime",
    format: (v, r, fmt) => {
      const dt = getField(r, "End_DateTime", "End_Time") ?? v;
      if (!dt) return "-";
      return formatDateTime(String(dt), fmt) || "-";
    },
  },
  {
    header: MEETING_REPORT_HEADINGS[4],
    field: "Venue",
    format: (v, r) => String(getField(r, "Venue", "Meeting_Venue__s") ?? v ?? "-"),
  },
];

const names = [
  "Weekly outreach overview",
  "Message engagement summary",
  "Follow-up coverage",
  "Team response overview",
  "Outreach delivery summary",
  "Message volume by week",
  "Unanswered outreach",
  "Meeting attendance overview",
  "Upcoming meeting summary",
  "Meeting coverage by region",
  "Completed meeting overview",
  "Lead meeting summary",
  "Account meeting summary",
] as const;

export const REPORT_CONFIGS: readonly ReportConfig[] = names.map((name, index) => {
  const isOutreach = index < 7;
  const id = `sample-report-${index + 1}`;
  const folder = isOutreach ? "Outreach Reports" : "Meeting Reports";
  const description =
    index === 12 ? null : `Review ${isOutreach ? "outreach" : "meeting"} activity.`;
  const lastAccessedDate = index === 2 ? "2026-10-01" : null;
  const createdBy = index === 12 ? "Demo Analyst" : null;
  const module = isOutreach ? "Campaigns" : "Events";
  const columns = isOutreach ? outreachColumns : meetingColumns;

  let criteria: ((record: RecordData, now: Date) => boolean) | undefined;
  if (!isOutreach) {
    if (index === 8) {
      criteria = (record, now) => {
        const start = getField(record, "Start_DateTime", "Start_Time");
        if (!start) return true;
        const time = new Date(String(start)).getTime();
        return Number.isNaN(time) ? true : time >= now.getTime();
      };
    } else if (index === 10) {
      criteria = (record, now) => {
        const end = getField(record, "End_DateTime", "End_Time");
        if (!end) return true;
        const time = new Date(String(end)).getTime();
        return Number.isNaN(time) ? true : time < now.getTime();
      };
    } else if (index === 11) {
      criteria = (record) => {
        const who = record.fields.Who_Id;
        const what = record.fields.What_Id;
        const isWhoLead =
          typeof who === "object" &&
          who !== null &&
          "module" in who &&
          (who as { module: string }).module === "Leads";
        const isWhatLead =
          typeof what === "object" &&
          what !== null &&
          "module" in what &&
          (what as { module: string }).module === "Leads";
        return Boolean(isWhoLead || isWhatLead);
      };
    } else if (index === 12) {
      criteria = (record) => {
        const what = record.fields.What_Id;
        return Boolean(
          typeof what === "object" &&
            what !== null &&
            "module" in what &&
            (what as { module: string }).module === "Accounts",
        );
      };
    }
  }

  return {
    id,
    name,
    description,
    folder,
    lastAccessedDate,
    createdBy,
    module,
    columns,
    criteria,
  };
});

/** Read every page through the same permission-scoped service as record lists. */
async function readRecords(
  service: RecordService,
  module: string,
  definition?: Pick<import("@crm/core/definitions").ReportInput, "columns" | "criteria">,
): Promise<RecordData[]> {
  const records: RecordData[] = [];
  let viewId = module === "Events" ? "all-meetings" : `all-${module.toLowerCase()}`;
  try {
    const views = await service.listViews(module);
    const defaultView = views.find((view) => view.isDefault) ?? views[0];
    if (defaultView?.id) {
      viewId = defaultView.id;
    }
  } catch {
    // Keep fallback viewId
  }

  // The current adapter applies its optional record-read guard to system-filtered
  // lists. Both lock partitions preserve every readable record, including locked ones.
  for (const locked of [false, true]) {
    for (let page = 1; ; page++) {
      const result = await service.list(module, {
        viewId,
        page,
        perPage: 100,
        systemFilters: { locked: { locked } },
        ...(definition
          ? {
              fields: definition.columns,
              ...(definition.criteria ? { filters: definition.criteria } : {}),
            }
          : {}),
      });
      records.push(...result.records);
      if (!result.moreRecords) break;
    }
  }
  return records;
}

export function createRecordReportsPort(
  service: RecordService,
  options: {
    now?: () => Date;
    format?: FormatOptions;
    ownerNames?: ReadonlyMap<string, string>;
    definitions?: {
      list(): Promise<readonly import("@crm/core/definitions").ReportDefinition[]>;
      get(id: string): Promise<import("@crm/core/definitions").ReportDefinition | null>;
    };
  } = {},
): ReportsPort {
  return {
    async listReports(): Promise<readonly ReportDefinition[]> {
      const saved = options.definitions ? await options.definitions.list() : [];
      return [
        ...saved.map((definition) => ({
          ...definition,
          folder: null,
          lastAccessedDate: null,
          createdBy: null,
        })),
        ...REPORT_CONFIGS.map((config) => ({
          id: config.id,
          name: config.name,
          description: config.description,
          folder: config.folder,
          lastAccessedDate: config.lastAccessedDate,
          createdBy: config.createdBy,
        })),
      ];
    },

    async getReport(id: string): Promise<ReportDetail | null> {
      const config = REPORT_CONFIGS.find((item) => item.id === id);
      if (!config) {
        const definition = await options.definitions?.get(id);
        return definition ? executeReport(service, definition, options) : null;
      }

      const format = options.format ?? DEFAULT_FORMAT;
      const now = options.now?.() ?? new Date();

      const records = await readRecords(service, config.module);
      const criteria = config.criteria;
      const filtered = criteria ? records.filter((r) => criteria(r, now)) : records;

      const headings = config.columns.map((c) => c.header);
      const rows = filtered.map((record) =>
        config.columns.map((col) => {
          if (col.format) {
            return col.format(
              col.field ? record.fields[col.field] : undefined,
              record,
              format,
              options,
            );
          }
          const val = col.field ? record.fields[col.field] : undefined;
          if (val === null || val === undefined || val === "") return "-";
          return String(val);
        }),
      );

      return {
        id: config.id,
        name: config.name,
        description: config.description,
        folder: config.folder,
        lastAccessedDate: config.lastAccessedDate,
        createdBy: config.createdBy,
        headings,
        rows,
        updatedAt: now.toISOString(),
      };
    },
  };
}

/** Execute through RecordService so tenant, record guards and field projection stay authoritative. */
export async function executeReport(
  service: RecordService,
  input: import("@crm/core/definitions").ReportInput & { id?: string },
  options: { now?: () => Date; format?: FormatOptions } = {},
): Promise<ReportDetail> {
  const metadata = await service.getModule(input.module);
  const fields = new Map(metadata.fields.map((field) => [field.apiName, field]));
  if (!input.columns.length || input.columns.some((name) => !fields.has(name)))
    throw new Error("Invalid report");
  const records = await readRecords(service, input.module, input);
  const format = options.format ?? DEFAULT_FORMAT;
  return {
    id: input.id ?? "",
    name: input.name,
    description: input.description,
    folder: null,
    createdBy: null,
    lastAccessedDate: null,
    headings: input.columns.map((name) => fields.get(name)?.label ?? name),
    rows: records.map((record) =>
      input.columns.map((name) => {
        const value = record.fields[name];
        if (value === null || value === undefined || value === "") return "-";
        const field = fields.get(name);
        if (typeof value === "number") return formatNumber(value, format);
        if (field?.dataType === "date") return String(value);
        if (field?.dataType === "datetime") return formatDateTime(String(value), format);
        if (typeof value === "object") return "name" in value ? String(value.name) : "-";
        return String(value);
      }),
    ),
    updatedAt: (options.now?.() ?? new Date()).toISOString(),
  };
}
