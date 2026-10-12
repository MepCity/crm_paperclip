"use client";

import { useState } from "react";
import { SplitButton } from "./split-button";

export default function SplitButtonDemo() {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <SplitButton
          label="Create Lead"
          onPress={() => setMessage("Create selected")}
          items={[
            { id: "example", label: "Example action", onAction: () => setMessage("Menu selected") },
          ]}
        />
        <SplitButton label="Create Lead" onPress={() => setMessage("Create selected")} />
        <SplitButton label="Open gallery" href="/dev/ui" />
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
