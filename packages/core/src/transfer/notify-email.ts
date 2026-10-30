import { ValidationError } from "../errors";
import type { ImportJob } from "./types";

export const IMPORT_NOTIFY_TEXT = {
  subject: {
    completed: "Import completed",
    completed_with_warnings: "Import completed with warnings",
    completed_with_errors: "Import completed with errors",
    failed: "Import failed",
  },
  greeting: (name?: string) => (name ? `Hello ${name},` : "Hello,"),
  intro: "Your CSV import has finished.",
  module: "Module",
  file: "File",
  started: "Started",
  created: "Created",
  updated: "Updated",
  skipped: "Skipped",
  errors: "Errors",
  link: "View import history",
} as const;

export interface ImportNotifyEmail {
  to: { address: string; name?: string }[];
  subject: string;
  text: string;
}

export function buildImportNotifyEmail(
  job: ImportJob,
  recipient: { address: string; name?: string },
  links: { historyUrl: string },
): ImportNotifyEmail {
  if (job.status === "undone") {
    throw new ValidationError({}, "No notification mail is sent for an undone import.");
  }
  const t = IMPORT_NOTIFY_TEXT;
  const kind =
    job.status === "completed_with_errors" &&
    job.counts.errors === 0 &&
    (job.counts.warnings ?? 0) > 0
      ? "completed_with_warnings"
      : job.status;
  const text = [
    t.greeting(recipient.name),
    "",
    t.intro,
    "",
    `${t.module}: ${job.module}`,
    `${t.file}: ${job.fileName}`,
    `${t.started}: ${new Date(job.createdAt).toISOString()}`,
    "",
    `${t.created}: ${job.counts.created}`,
    `${t.updated}: ${job.counts.updated}`,
    `${t.skipped}: ${job.counts.skipped}`,
    `${t.errors}: ${job.counts.errors}`,
    "",
    `${t.link}: ${links.historyUrl}`,
    "",
  ].join("\n");
  return {
    to: [recipient],
    subject: `${t.subject[kind]}: ${job.fileName}`,
    text,
  };
}
