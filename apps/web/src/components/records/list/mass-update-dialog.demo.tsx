"use client";

import type { FieldDefinition } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MassUpdateDialog } from "./mass-update-dialog";

const demoFields: FieldDefinition[] = [
  {
    apiName: "Lead_Source",
    label: "Lead Source",
    dataType: "picklist",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: false },
    picklist: [
      { storedValue: "Advertisement", displayValue: "Advertisement" },
      { storedValue: "Web", displayValue: "Web" },
    ],
  },
];

export default function MassUpdateDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="secondary" onPress={() => setOpen(true)}>Open Mass Update</Button>
      <MassUpdateDialog
        isOpen={open}
        onOpenChange={setOpen}
        module="Leads"
        recordIds={["demo-1", "demo-2"]}
        fields={demoFields}
        users={[{ id: "u1", name: "Demo User", email: "demo@example.test" }]}
        onSuccess={() => setOpen(false)}
      />
    </div>
  );
}
