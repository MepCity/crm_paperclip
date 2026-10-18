"use client";

import { useState } from "react";
import { TagEntry } from "./tag-entry";

export default function TagEntryDemo() {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  return (
    <div className="w-96 space-y-3">
      <TagEntry
        value={value}
        onChange={setValue}
        onAdd={(name) => {
          setPending([...pending, name]);
          setValue("");
        }}
        suggestions={[{ id: "a", name: "Example" }]}
        disabled={false}
      />
      <p className="text-sm text-text-muted">Pending: {pending.join(", ") || "None"}</p>
      <TagEntry value="" onChange={() => {}} onAdd={() => {}} suggestions={[]} disabled />
    </div>
  );
}
