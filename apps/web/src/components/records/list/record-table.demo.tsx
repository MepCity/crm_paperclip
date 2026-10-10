"use client";

import type { FieldDefinition, RecordData, SortSpec } from "@crm/core/records";
import { useState } from "react";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { RecordTable } from "./record-table";

const columns: FieldDefinition[] = [
  {
    apiName: "Full_Name",
    views: { view: true, create: false, edit: false, quickCreate: false },
    label: "Name",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Company",
    views: { view: true, create: true, edit: true, quickCreate: true },
    label: "Company",
    dataType: "text",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Email",
    views: { view: true, create: true, edit: true, quickCreate: true },
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Phone",
    views: { view: true, create: true, edit: true, quickCreate: true },
    label: "Phone",
    dataType: "phone",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Lead_Source",
    views: { view: true, create: true, edit: true, quickCreate: false },
    label: "Source",
    dataType: "picklist",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    picklist: [{ displayValue: "Web", storedValue: "web" }],
  },
  {
    apiName: "Owner",
    views: { view: true, create: true, edit: true, quickCreate: false },
    label: "Owner",
    dataType: "ownerlookup",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
  {
    apiName: "Created_Time",
    views: { view: true, create: false, edit: false, quickCreate: false },
    label: "Created",
    dataType: "datetime",
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
  },
];

const ownerNames = { "user-1": "Owner One" };

/** `Created` stays outside the sortable set, so its header draws no options button. */
const sortableFields = new Set(
  columns.filter((field) => field.apiName !== "Created_Time").map((field) => field.apiName),
);

function sortRecords(records: readonly RecordData[], sort: SortSpec | null) {
  if (!sort) return records;
  const text = (record: RecordData) => {
    const value = record.fields[sort.field];
    return typeof value === "string" ? value : String(value ?? "");
  };
  const factor = sort.order === "desc" ? -1 : 1;
  return [...records].sort((a, b) => factor * text(a).localeCompare(text(b)));
}

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
  const [sort, setSort] = useState<SortSpec | null>(null);
  return (
    <RecordTable
      columns={columns}
      records={sortRecords(records, sort)}
      linkField="Full_Name"
      rowHref={(record) => `/records/${record.id}`}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      sortableFields={sortableFields}
      onSortChange={setSort}
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
