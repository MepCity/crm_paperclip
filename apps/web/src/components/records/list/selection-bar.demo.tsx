"use client";

import { useState } from "react";
import { SelectionBar } from "./selection-bar";

/** Interim menu: the measured 11 operations in screen order. Only the counter, Clear and the
 *  four record-action buttons are wired here; the operations themselves are no-ops in the demo. */
const sampleActions = [
  { id: "run-macro", label: "Run Macro", onAction: () => undefined },
  { id: "create-task", label: "Create Task", onAction: () => undefined },
  { id: "change-owner", label: "Change Owner", onAction: () => undefined },
  { id: "cadences", label: "Cadences", onAction: () => undefined },
  { id: "add-to-campaigns", label: "Add to Campaigns", onAction: () => undefined },
  { id: "print-mailing-labels", label: "Print Mailing Labels", onAction: () => undefined },
  { id: "print-using-canvas", label: "Print Using Canvas", onAction: () => undefined },
  { id: "mail-merge", label: "Mail Merge", onAction: () => undefined },
  { id: "mass-convert", label: "Mass Convert", onAction: () => undefined },
  { id: "delete", label: "Delete", onAction: () => undefined },
  { id: "export-selected", label: "Export Selected Records", onAction: () => undefined },
];

export default function SelectionBarDemo() {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-6">
      <SelectionBar selectedCount={1} onClear={() => setMessage("Cleared one")} />
      <SelectionBar
        selectedCount={3}
        onClear={() => setMessage("Cleared three")}
        onSendEmail={() => setMessage("Send Email")}
        onTags={() => setMessage("Tags")}
        onMassUpdate={() => setMessage("Mass Update")}
        actions={sampleActions}
      />
      <p role="status">{message}</p>
    </div>
  );
}
