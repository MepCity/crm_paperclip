"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { shouldRetryQuery } from "./fetch";
import { type ClientRecordService, createHttpRecordService } from "./http-record-service";

const ServiceContext = createContext<ClientRecordService | null>(null);
const OrgSlugContext = createContext<string | null>(null);

export function useClientRecordService(): ClientRecordService {
  const service = useContext(ServiceContext);
  if (!service) throw new Error("Wrap the screen in ApiProvider.");
  return service;
}

export function useOrgSlug(): string {
  const orgSlug = useContext(OrgSlugContext);
  if (!orgSlug) throw new Error("Wrap the screen in ApiProvider.");
  return orgSlug;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export type ApiProviderProps = {
  orgSlug: string;
  service?: ClientRecordService;
  children: ReactNode;
};

function ApiProviderSubtree({
  orgSlug,
  service,
  children,
}: {
  orgSlug: string;
  service: ClientRecordService;
  children: ReactNode;
}) {
  return (
    <OrgSlugContext.Provider value={orgSlug}>
      <ServiceContext.Provider value={service}>{children}</ServiceContext.Provider>
    </OrgSlugContext.Provider>
  );
}

export function ApiProvider({ orgSlug, service, children }: ApiProviderProps) {
  const [clientState, setClientState] = useState(() => ({
    orgSlug,
    queryClient: createQueryClient(),
  }));

  let activeQueryClient = clientState.queryClient;
  if (clientState.orgSlug !== orgSlug) {
    activeQueryClient = createQueryClient();
    setClientState({
      orgSlug,
      queryClient: activeQueryClient,
    });
  }

  const resolved = useMemo(
    () => service ?? createHttpRecordService({ orgSlug }),
    [orgSlug, service],
  );
  return (
    <QueryClientProvider client={activeQueryClient}>
      <ApiProviderSubtree key={orgSlug} orgSlug={orgSlug} service={resolved}>
        {children}
      </ApiProviderSubtree>
    </QueryClientProvider>
  );
}
