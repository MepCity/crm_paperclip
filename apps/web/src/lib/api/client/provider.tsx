"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { shouldRetryQuery } from "./fetch";
import { type ClientRecordService, createHttpRecordService } from "./http-record-service";

const ServiceContext = createContext<ClientRecordService | null>(null);

export function useClientRecordService(): ClientRecordService {
  const service = useContext(ServiceContext);
  if (!service) throw new Error("Wrap the screen in ApiProvider.");
  return service;
}

export type ApiProviderProps = {
  orgSlug: string;
  service?: ClientRecordService;
  children: ReactNode;
};

export function ApiProvider({ orgSlug, service, children }: ApiProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const resolved = useMemo(
    () => service ?? createHttpRecordService({ orgSlug }),
    [orgSlug, service],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ServiceContext.Provider value={resolved}>{children}</ServiceContext.Provider>
    </QueryClientProvider>
  );
}
