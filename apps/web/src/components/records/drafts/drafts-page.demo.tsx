"use client";

import { useState } from "react";
import { DraftsPage } from "./drafts-page";

export default function DraftsPageDemo() {
  const [status, setStatus] = useState("No action triggered.");

  return (
    <div className="space-y-3">
      <div className="h-160 rounded-xl border border-panel-border bg-bg shadow-xs">
        <DraftsPage
          onBack={() => setStatus("Back navigation triggered.")}
          onInfo={() => setStatus("Information triggered.")}
          onHelp={() => setStatus("Help triggered.")}
          onAddCriterion={() => setStatus("Add criterion triggered.")}
        />
      </div>
      <p role="status" className="text-sm text-text-muted">
        {status}
      </p>
    </div>
  );
}
