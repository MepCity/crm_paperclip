"use client";

import type {
  CurrencyDefinition,
  ListQuery,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordId,
  RecordInput,
} from "@crm/core/records";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrgMember } from "./http-record-service";
import { useClientRecordService, useOrgSlug } from "./provider";
import { apiKeys, countQueriesPrefix, listQueriesPrefix } from "./query-keys";

export function useHomeCurrency() {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<CurrencyDefinition>({
    queryKey: apiKeys.homeCurrency(orgSlug),
    queryFn: () => service.getHomeCurrency(),
  });
}

export function useModule(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<ModuleMetadata>({
    queryKey: apiKeys.module(orgSlug, module),
    queryFn: () => service.getModule(module),
  });
}

export function useViews(module: ModuleApiName, options?: { enabled?: boolean }) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.views(orgSlug, module),
    queryFn: () => service.listViewSummaries(module),
    enabled: options?.enabled ?? true,
  });
}

export function useView(module: ModuleApiName, viewId: string) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.view(orgSlug, module, viewId),
    queryFn: () => service.getView(module, viewId),
    enabled: Boolean(viewId),
  });
}

export function useRecordList(
  module: ModuleApiName,
  query: ListQuery,
  options?: { enabled?: boolean },
) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.list(orgSlug, module, query),
    queryFn: () => service.list(module, query),
    placeholderData: (previousData, previousQuery) => {
      if (previousQuery?.queryKey?.[1] !== orgSlug) return undefined;
      return previousData;
    },
    enabled: options?.enabled ?? Boolean(query.viewId),
  });
}

export function useRecordCount(
  module: ModuleApiName,
  query: Pick<ListQuery, "viewId" | "filters" | "search">,
) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.count(orgSlug, module, query),
    queryFn: () => service.count(module, query),
  });
}

export function useRecord(module: ModuleApiName, id: RecordId) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<RecordData>({
    queryKey: apiKeys.record(orgSlug, module, id),
    queryFn: () => service.get(module, id),
    enabled: Boolean(id),
  });
}

export function useUsers() {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<readonly OrgMember[]>({
    queryKey: apiKeys.users(orgSlug),
    queryFn: () => service.listUsers(),
  });
}

function invalidateModuleLists(
  queryClient: ReturnType<typeof useQueryClient>,
  orgSlug: string,
  module: ModuleApiName,
  recordId?: RecordId,
) {
  void queryClient.invalidateQueries({ queryKey: listQueriesPrefix(orgSlug, module) });
  void queryClient.invalidateQueries({ queryKey: countQueriesPrefix(orgSlug, module) });
  if (recordId)
    void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, recordId) });
}

/** Re-requests open list and count queries for a module; does not reload module metadata. */
export function useRefreshModuleListData(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return () => invalidateModuleLists(queryClient, orgSlug, module);
}

export function useCreateRecord(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordInput) => service.create(module, input),
    onSuccess: (record) => invalidateModuleLists(queryClient, orgSlug, module, record.id),
  });
}

export function useUpdateRecord(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: RecordId; input: RecordInput }) =>
      service.update(module, id, input),
    onSuccess: async (record) => {
      await queryClient.cancelQueries({ queryKey: apiKeys.record(orgSlug, module, record.id) });
      queryClient.setQueryData(apiKeys.record(orgSlug, module, record.id), record);
      void queryClient.invalidateQueries({ queryKey: listQueriesPrefix(orgSlug, module) });
      void queryClient.invalidateQueries({ queryKey: countQueriesPrefix(orgSlug, module) });
    },
  });
}

export function useDeleteRecords(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: readonly RecordId[]) => service.delete(module, ids),
    onSuccess: (_result, ids) => {
      invalidateModuleLists(queryClient, orgSlug, module);
      for (const id of ids) {
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, id) });
      }
    },
  });
}

export function useMassUpdate(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, input }: { ids: readonly RecordId[]; input: RecordInput }) =>
      service.massUpdate(module, ids, input),
    onSuccess: (_result, { ids }) => {
      invalidateModuleLists(queryClient, orgSlug, module);
      for (const id of ids)
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, id) });
    },
  });
}

export function useChangeOwner(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, ownerId }: { ids: readonly RecordId[]; ownerId: string }) =>
      service.changeOwner(module, ids, ownerId),
    onSuccess: (_result, { ids }) => {
      invalidateModuleLists(queryClient, orgSlug, module);
      for (const id of ids)
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, id) });
    },
  });
}
