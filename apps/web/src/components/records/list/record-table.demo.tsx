"use client";

import type { FieldDefinition, RecordData } from "@crm/core/records";
import { useState } from "react";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { RecordTable } from "./record-table";

const columns: FieldDefinition[] = [
  {
    apiName: "Full_Name",
    label: "Name",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
  },
  {
    apiName: "Company",
    label: "Company",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
  },
  {
    apiName: "Email",
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    unique: false,
  },
  {
    apiName: "Phone",
    label: "Phone",
    dataType: "phone",
    required: false,
    readOnly: false,
    unique: false,
  },
  {
    apiName: "Lead_Source",
    label: "Source",
    dataType: "picklist",
    required: false,
    readOnly: false,
    unique: false,
    picklist: [{ displayValue: "Web", storedValue: "web" }],
  },
  {
    apiName: "Owner",
    label: "Owner",
    dataType: "ownerlookup",
    required: false,
    readOnly: false,
    unique: false,
  },
  {
    apiName: "Created_Time",
    label: "Created",
    dataType: "datetime",
    required: false,
    readOnly: false,
    unique: false,
  },
];

const ownerNames = { "user-1": "Owner One" };

function row(
  id: string,
  name: string,
  company: string,
  email: string | null = "lead001@example.org",
): RecordData {
  return {
    id,
    fields: {
      Full_Name: name,
      Company: company,
      Email: email,
      Phone: "555-0100",
      Lead_Source: "web",
      Owner: "user-1",
      Created_Time: "2026-03-01T08:00:00Z",
    },
  };
}

const shortRecords = [
  row("rec-001", "Lead 001", "Example Co"),
  row("rec-002", "Lead 002", "Example Org", "lead002@example.org"),
  row("rec-003", "Lead 003", "Wrapped Example Trading Partners", "lead003@example.org"),
];

const longRecords = [
  row(
    "rec-003",
    "Lead 001 with a wrapped name that takes a second line inside the name column",
    "Example Co",
    "lead001.with.a.very.long.local.part@example.org",
  ),
];

export default function RecordTableDemo() {
  return (
    <div className="space-y-8">
      <section aria-label="Populated records">
        <Demo records={shortRecords} wrapText total={3} page={1} moreRecords={false} />
      </section>
      <section aria-label="Wrapped records">
        <Demo records={longRecords} wrapText total={1} page={1} moreRecords={false} />
      </section>
      <section aria-label="Empty records">
        <Demo records={[]} wrapText={false} total={0} page={1} moreRecords={false} />
      </section>
      <section aria-label="Later page">
        <Demo
          records={shortRecords}
          wrapText={false}
          total={24}
          page={2}
          pageSize={10}
          moreRecords
          previousHref="/dev/ui?page=1"
          nextHref="/dev/ui?page=3"
        />
      </section>
    </div>
  );
}

function Demo({
  records,
  wrapText,
  total,
  page,
  pageSize = 10,
  moreRecords,
  previousHref = null,
  nextHref = null,
}: {
  records: readonly RecordData[];
  wrapText: boolean;
  total: number;
  page: number;
  pageSize?: number;
  moreRecords: boolean;
  previousHref?: string | null;
  nextHref?: string | null;
}) {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  return (
    <RecordTable
      columns={columns}
      records={records}
      linkField="Full_Name"
      rowHref={(record) => `/records/${record.id}`}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      wrapText={wrapText}
      emptyMessage="No records found."
      ownerNames={ownerNames}
      format={DEFAULT_FORMAT}
      footer={{
        total,
        page,
        pageSize,
        recordCount: records.length,
        moreRecords,
        previousHref,
        nextHref,
      }}
    />
  );
}
