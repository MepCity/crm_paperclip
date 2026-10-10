"use client";

import { useState } from "react";
import { SelectionBar } from "./selection-bar";

const sampleActions = [
  { id: "tag", label: "Add Tags", onAction: () => undefined },
  { id: "owner", label: "Change Owner", onAction: () => undefined },
];

export default function SelectionBarDemo() {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-6">
      <SelectionBar
        selectedCount={1}
        onClear={() => setMessage("Cleared one")}
        onDelete={() => setMessage("Delete one")}
      />
      <SelectionBar
        selectedCount={3}
        onClear={() => setMessage("Cleared three")}
        onDelete={() => setMessage("Delete three")}
        actions={sampleActions}
      />
      <p role="status">{message}</p>
    </div>
  );
}
