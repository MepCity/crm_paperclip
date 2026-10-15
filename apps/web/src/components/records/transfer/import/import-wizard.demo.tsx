"use client";
import { ImportWizard } from "./import-wizard";
import type { ImportJob, ImportWizardClient } from "./types";

const client: ImportWizardClient = {
  sampleCsvUrl: "#sample.csv",
  async preview(file, charset) {
    return {
      uploadId: "demo-upload",
      fileName: file.name,
      charset,
      headers: ["Last Name", "Email"],
      sampleRows: [["Doe", "doe@example.test"]],
      rowCount: 1,
      suggestedMapping: [
        { column: 0, field: "Last_Name" },
        { column: 1, field: "Email" },
      ],
      fields: [
        { apiName: "Last_Name", label: "Last Name", required: true, type: "text" },
        { apiName: "Email", label: "Email", required: false, type: "email" },
      ],
      matchFields: [
        { field: "Email", label: "Email" },
        { field: "id", label: "Record Id" },
      ],
    };
  },
  async run() {
    const job: ImportJob = {
      id: "demo-job",
      module: "Leads",
      fileName: "demo.csv",
      createdBy: { id: "u1", name: "Demo User" },
      createdAt: "2026-01-01T00:00:00Z",
      status: "completed_with_errors",
      counts: { created: 1, updated: 0, skipped: 0, errors: 1 },
      undoable: true,
      rows: [{ row: 3, outcome: "error", code: "required_missing", field: "Last Name" }],
    };
    return job;
  },
};

export default function ImportWizardDemo() {
  return (
    <ImportWizard
      module="Leads"
      moduleLabel="Leads"
      client={client}
      onCancel={() => {}}
      onDone={() => {}}
      historyHref="#history"
    />
  );
}
