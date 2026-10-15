"use client";

import { useState } from "react";
import { type FieldMapping, ImportMappingStep } from "./mapping-step";

export default function ImportMappingStepDemo() {
  const [mapping, setMapping] = useState<FieldMapping[]>([]);
  const [defaults, setDefaults] = useState<{ field: string; value: string }[]>([]);
  const [valid, setValid] = useState(false);
  return (
    <div className="space-y-4 p-6">
      <ImportMappingStep
        headers={["Last Name", "Email", "Source"]}
        sampleRows={[["Example", "example@example.test", "Website"]]}
        fields={[
          { apiName: "Last_Name", label: "Last Name", required: true },
          { apiName: "Email", label: "Email", required: false },
          { apiName: "Lead_Source", label: "Lead Source", required: false },
        ]}
        mapping={mapping}
        onMappingChange={setMapping}
        defaults={defaults}
        onDefaultsChange={setDefaults}
        requireAllRequired
        onValidityChange={setValid}
      />
      <p role="status">{valid ? "Ready to continue" : "Complete field mapping"}</p>
    </div>
  );
}
