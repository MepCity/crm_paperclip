"use client";

import { useState } from "react";
import { ManageTagsPage } from "./manage-tags-page";

export default function ManageTagsPageDemo() {
  const [status, setStatus] = useState("No action triggered.");

  return (
    <div className="space-y-3">
      <div className="h-160 rounded-xl border border-panel-border bg-surface shadow-xs">
        <ManageTagsPage
          moduleName="Leads"
          tagsUsed={0}
          tagsCapacity={100}
          onBack={() => setStatus("Back navigation triggered.")}
          onHelp={() => setStatus("Help triggered.")}
          onNewTag={() => setStatus("New Tag creation triggered.")}
        />
      </div>
      <p role="status" className="text-sm text-text-muted">
        {status}
      </p>
    </div>
  );
}
