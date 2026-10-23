/** Read-only report definitions; execution and preferences have no contract yet. */
export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  folder: string | null;
  lastAccessedDate: string | null;
  createdBy: string | null;
}

export interface ReportsPort {
  listReports(): Promise<readonly ReportDefinition[]>;
}
