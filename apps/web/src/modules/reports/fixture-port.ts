import type { ReportDefinition, ReportsPort } from "./port";

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

export const fixtureReportsPort: ReportsPort = {
  async listReports() {
    return reports.map((report) => ({ ...report }));
  },
};
