"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { KanbanSettingsDialog, type KanbanViewInput } from "./kanban-settings-dialog";

const initial: KanbanViewInput = {
  name: "STAGEVIEW",
  categorizeBy: "Stage",
  aggregateBy: "Amount",
  headerStyle: "mono_color",
  fields: ["Deal_Name", "Stage", "Account_Name", "Owner", "Contact_Name", "Amount", "Closing_Date"],
};
const fieldOptions = [
  { apiName: "Deal_Name", label: "Deal Name", required: true },
  { apiName: "Stage", label: "Stage" },
  { apiName: "Account_Name", label: "Account Name" },
  { apiName: "Owner", label: "Deal Owner" },
  { apiName: "Contact_Name", label: "Contact Name" },
  { apiName: "Amount", label: "Amount" },
  { apiName: "Closing_Date", label: "Closing Date" },
  { apiName: "Campaign_Source", label: "Campaign Source" },
  { apiName: "Description", label: "Description" },
];
export default function KanbanSettingsDialogDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Kanban settings</Button>
      <KanbanSettingsDialog
        open={open}
        mode="edit"
        initial={value}
        categorizeOptions={[{ value: "Stage", label: "Stage" }]}
        aggregateOptions={[{ value: "Amount", label: "Amount" }]}
        headerStyleOptions={[{ value: "mono_color", label: "Mono Color" }]}
        fieldOptions={fieldOptions}
        onCancel={() => setOpen(false)}
        onSave={async (input) => {
          setValue(input);
          setOpen(false);
        }}
      />
    </>
  );
}
