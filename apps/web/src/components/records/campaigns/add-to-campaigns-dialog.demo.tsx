"use client";

import { createFixtureRecordService } from "@crm/core/records/fixture";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddToCampaignsDialog } from "./add-to-campaigns-dialog";

export default function AddToCampaignsDialogDemo() {
  const [service] = useState(() =>
    createFixtureRecordService({
      orgId: "campaign-dialog-demo",
      orgSlug: "campaign-dialog-demo",
      orgName: "Demo",
      userId: "demo-user",
      role: "admin",
    }),
  );
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  async function open() {
    const lead = await service.create("Leads", {
      Last_Name: "Demo member",
      Company: "Demo company",
    });
    setRecordIds([lead.id]);
  }
  return (
    <section>
      <Button onPress={() => void open()}>Open Add to Campaigns</Button>
      <p role="status">{message}</p>
      {recordIds.length > 0 ? (
        <AddToCampaignsDialog
          module="Leads"
          recordIds={recordIds}
          recordService={service}
          onCancel={() => setRecordIds([])}
          onDone={(count) => {
            setMessage(`${count} memberships created`);
            setRecordIds([]);
          }}
        />
      ) : null}
    </section>
  );
}
