"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { ExportDialog } from "./export-dialog";

export default function ExportDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <ToastProvider>
      <Button onPress={() => setOpen(true)}>Export Leads</Button>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        module="Leads"
        moduleLabel="Leads"
        views={[
          { id: "all", name: "All Leads" },
          { id: "mine", name: "My Leads" },
        ]}
        fields={[
          { apiName: "Last_Name", label: "Last Name" },
          { apiName: "Email", label: "Email" },
          { apiName: "Company", label: "Company" },
        ]}
        historyHref="/import-export/history"
        onExport={async () => ({
          id: "e1",
          module: "Leads",
          scope: "All Leads",
          createdBy: { id: "u1", name: "Demo" },
          createdAt: new Date().toISOString(),
          status: "completed",
          rowCount: 3,
          fileName: "leads.csv",
        })}
      />
    </ToastProvider>
  );
}
