"use client";

import { createFixtureRecordService } from "@crm/core/records/fixture";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { dualAddressFormRules, dualAddressModuleMetadata } from "./dual-address-form-fixture";
import { RecordFormScreen } from "./record-form-screen";

const demoCtx = {
  orgId: "dual-address-form-demo",
  orgSlug: "dual-address-form-demo",
  orgName: "Dual Address Demo",
  userId: "demo-user",
  role: "admin" as const,
};

function DemoApiProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => {
    const records = createFixtureRecordService(demoCtx, {
      listMemberIds: async () => [demoCtx.userId],
    });
    const client = createClientRecordService(records, {
      listUsers: async () => [
        { userId: demoCtx.userId, name: "Demo User", email: "demo@example.test" },
      ],
    });
    const originalGetModule = client.getModule.bind(client);
    client.getModule = async (moduleName) => {
      if (moduleName === dualAddressModuleMetadata.apiName) return dualAddressModuleMetadata;
      return originalGetModule(moduleName);
    };
    return client;
  }, []);

  return (
    <ApiProvider orgSlug={demoCtx.orgSlug} service={service}>
      {children}
    </ApiProvider>
  );
}

export default function RecordFormAddressDemo() {
  return (
    <DemoApiProvider>
      <RecordFormScreen
        config={{
          module: dualAddressModuleMetadata.apiName,
          rules: dualAddressFormRules,
          paths: { detail: () => "#", create: "#", cancel: "#" },
          navigate: () => undefined,
        }}
        currentUserId={demoCtx.userId}
      />
    </DemoApiProvider>
  );
}
