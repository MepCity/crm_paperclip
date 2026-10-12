"use client";

import { useState } from "react";
import { FormErrorBanner } from "./form-error-banner";
import { RecordFormShell } from "./record-form-shell";

export default function FormErrorBannerDemo() {
  const [visible, setVisible] = useState(true);
  const actionLabels = { cancel: "Cancel", saveAndNew: "Save and New", save: "Save" };
  return (
    <div className="space-y-4">
      <RecordFormShell
        title="Create Lead"
        formAriaLabel="Form error banner demo"
        actionLabels={actionLabels}
        errorBanner={visible ? <FormErrorBanner>Something went wrong.</FormErrorBanner> : null}
        onSave={() => setVisible(false)}
      >
        <p className="text-md text-text-muted">Save clears the banner in this demo.</p>
      </RecordFormShell>
      <button type="button" className="text-md" onClick={() => setVisible(true)}>
        Show banner again
      </button>
    </div>
  );
}
