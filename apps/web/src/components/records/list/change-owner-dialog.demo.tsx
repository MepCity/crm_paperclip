"use client";

import type { FieldDefinition } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChangeOwnerDialog } from "./change-owner-dialog";

const ownerField: FieldDefinition = {
  apiName: "Owner",
  label: "Lead Owner",
  dataType: "ownerlookup",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
};

const users = [
  { id: "u1", name: "Demo User", email: "demo@example.test" },
  { id: "u2", name: "Other User", email: "other@example.test" },
];

export default function ChangeOwnerDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="secondary" onPress={() => setOpen(true)}>Open Change Owner</Button>
      <ChangeOwnerDialog
        isOpen={open}
        onOpenChange={setOpen}
        module="Leads"
        recordIds={["demo-1", "demo-2"]}
        ownerField={ownerField}
        users={users}
        onSuccess={() => setOpen(false)}
      />
    </div>
  );
}
