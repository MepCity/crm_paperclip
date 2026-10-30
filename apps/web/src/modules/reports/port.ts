/** Read-only report definitions; execution and preferences have no contract yet. */
export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  folder: string | null;
  lastAccessedDate: string | null;
  createdBy: string | null;
}

/** Result table of one report; the heading list is per report type. */
export interface ReportDetail extends ReportDefinition {
  headings: readonly string[];
  rows: readonly (readonly string[])[];
  updatedAt: string;
}

export interface ReportsPort {
  getReport(id: string): Promise<ReportDetail | null>;
  listReports(): Promise<readonly ReportDefinition[]>;
}
