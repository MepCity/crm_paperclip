"use client";

import type { FieldDefinition } from "@crm/core/records";
import { useState } from "react";
import { InlineFieldEditor } from "./inline-field-editor";

export default function InlineFieldEditorDemo() {
  const [active, setActive] = useState<string | null>(null);
  const field: FieldDefinition = {
    apiName: "Example",
    label: "Example",
    dataType: "text",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, edit: true, create: true, quickCreate: false },
  };
  return (
    <div className="flex flex-col gap-6 p-6">
      {(["text", "picklist", "integer"] as const).map((type) => (
        <div key={type}>
          <button type="button" onClick={() => setActive(type)}>
            Edit {type}
          </button>
          {active === type && (
            <InlineFieldEditor
              field={{
                ...field,
                label: type,
                dataType: type,
                picklist: [
                  { storedValue: "Warm", displayValue: "Warm" },
                  { storedValue: "Cold", displayValue: "Cold" },
                  { storedValue: "Hot", displayValue: "Hot" },
                  { storedValue: "Active", displayValue: "Active" },
                  { storedValue: "Acquired", displayValue: "Acquired" },
                ],
              }}
              value={type === "integer" ? 12 : type === "picklist" ? null : "Example"}
              onCancel={() => setActive(null)}
              onComplete={() => setActive(null)}
              onSave={async () => {}}
            />
          )}
        </div>
      ))}
      <InlineFieldEditor
        field={{ ...field, label: "Error example" }}
        value=""
        initialError="Error example cannot be empty."
        autoFocus={false}
        onCancel={() => {}}
        onComplete={() => {}}
        onSave={async () => {}}
      />
      <InlineFieldEditor
        field={{ ...field, label: "Saving example" }}
        value="Example"
        disabled
        onCancel={() => {}}
        onComplete={() => {}}
        onSave={async () => {}}
      />
    </div>
  );
}
