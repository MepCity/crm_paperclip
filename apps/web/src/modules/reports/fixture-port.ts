import type { ReportDefinition, ReportDetail, ReportsPort } from "./port";

/** Synthetic report definitions, independent of reference data. */
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
];
const reports: readonly ReportDefinition[] = names.map((name, index) => ({
  id: `sample-report-${index + 1}`,
  name,
  description:
    index === 12
      ? null
      : `Review synthetic ${index < 7 ? "outreach" : "meeting"} activity across the demonstration team.`,
  folder: index < 7 ? "Outreach Reports" : "Meeting Reports",
  lastAccessedDate: index === 2 ? "2026-10-01" : null,
  createdBy: index === 12 ? "Demo Analyst" : null,
}));

export const EMAIL_REPORT_HEADINGS = [
  "Template Name",
  "Sent",
  "Bounced",
  "Tracked",
  "Bounced Among Tracked",
  "Opened",
  "Clicked",
  "Replied",
  "Received",
] as const;
const populatedRows = [
  ["Sample welcome note", "120", "4", "100", "2", "64", "21", "9", "7"],
  ["Sample follow-up note", "80", "1", "72", "0", "40", "12", "5", "3"],
];

export const fixtureReportsPort: ReportsPort = {
  async getReport(id) {
    const report = reports.find((item) => item.id === id);
    if (!report) return null;
    const detail: ReportDetail = {
      ...report,
      headings: EMAIL_REPORT_HEADINGS,
      rows: id === "sample-report-1" ? populatedRows : [],
      updatedAt: new Date().toISOString(),
    };
    return detail;
  },
  async listReports() {
    return reports.map((report) => ({ ...report }));
  },
};
