"use client";

import { useState } from "react";
import { RecycleBin, type RecycleBinRow } from "./recycle-bin";

const rows: RecycleBinRow[] = Array.from({ length: 24 }, (_, index) => ({
  id: `sample-${index + 1}`,
  name: `Sample record ${index + 1}`,
  type: ["Leads", "Contacts", "Accounts", "Deals", "Notes", "Calls"][index % 6] ?? "Leads",
  deletedBy: "Demo User",
  deletedTime: "Oct 15, 2026, 10:00 AM",
}));

export default function RecycleBinDemo() {
  const [action, setAction] = useState("No action requested.");
  const report = (name: string, ids: string[]) =>
    setAction(`${name}: ${ids.join(", ") || "no selected records"}`);
  return (
    <div className="space-y-3">
      <div className="h-160 bg-bg p-3">
        <RecycleBin
          rows={rows}
          onRestore={(ids) => report("Restore", ids)}
          onDelete={(ids) => report("Delete", ids)}
          onEmpty={(ids) => report("Empty", ids)}
          onHelp={() => setAction("Help requested.")}
        />
      </div>
      <p role="status" className="text-sm text-text-muted">
        {action}
      </p>
    </div>
  );
}
