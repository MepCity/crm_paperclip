"use client";

import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { MassUpdateDialog } from "./mass-update-dialog";

const demoCtx = {
  orgId: "demo-org",
  orgSlug: "demo-org",
  orgName: "Demo",
  userId: "demo-user",
  role: "admin" as const,
};

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

function DemoApiProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => {
    const records = createFixtureRecordService(demoCtx);
    return createClientRecordService(records, {
      listUsers: async () => [
        { userId: demoCtx.userId, name: "Demo User", email: "demo@example.test" },
      ],
    });
  }, []);
  return (
    <ApiProvider orgSlug={demoCtx.orgSlug} service={service}>
      {children}
    </ApiProvider>
  );
}

export default function MassUpdateDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <DemoApiProvider>
      <div className="flex flex-col gap-4 p-4">
        <Button variant="secondary" onPress={() => setOpen(true)}>
          Open Mass Update
        </Button>
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
    </DemoApiProvider>
  );
}
