"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

export default function UnsavedChangesDialogDemo() {
  const [open, setOpen] = useState(true);
  const [company, setCompany] = useState("");

  return (
    <div className="flex max-w-md flex-col gap-4">
      <TextField
        name="company"
        label="Company"
        isRequired
        isInvalid={!company}
        errorMessage={company ? undefined : "Company cannot be empty."}
        value={company}
        onChange={setCompany}
      />
      <Button variant="secondary" onPress={() => setOpen(true)}>
        Open unsaved changes dialog
      </Button>
      <UnsavedChangesDialog isOpen={open} onOpenChange={setOpen} onLeave={() => setOpen(false)} />
    </div>
  );
}
