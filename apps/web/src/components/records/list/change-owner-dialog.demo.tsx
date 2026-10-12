"use client";

import type { FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { ChangeOwnerDialog } from "./change-owner-dialog";

const demoCtx = {
  orgId: "demo-org",
  orgSlug: "demo-org",
  orgName: "Demo",
  userId: "demo-user",
  role: "admin" as const,
};

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

function DemoApiProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => {
    const records = createFixtureRecordService(demoCtx);
    return createClientRecordService(records, {
      listUsers: async () => [
        { userId: demoCtx.userId, name: "Demo User", email: "demo@example.test" },
        { userId: "u2", name: "Other User", email: "other@example.test" },
      ],
    });
  }, []);
  return (
    <ApiProvider orgSlug={demoCtx.orgSlug} service={service}>
      {children}
    </ApiProvider>
  );
}

export default function ChangeOwnerDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <DemoApiProvider>
      <div className="flex flex-col gap-4 p-4">
        <Button variant="secondary" onPress={() => setOpen(true)}>
          Open Change Owner
        </Button>
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
    </DemoApiProvider>
  );
}
