"use client";

import type {
  ListQuery,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordId,
  RecordInput,
} from "@crm/core/records";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrgMember } from "./http-record-service";
import { useClientRecordService } from "./provider";
import { apiKeys, countQueriesPrefix, listQueriesPrefix } from "./query-keys";

export function useModule(module: ModuleApiName) {
  const service = useClientRecordService();
  return useQuery<ModuleMetadata>({
    queryKey: apiKeys.module(module),
    queryFn: () => service.getModule(module),
  });
}

export function useViews(module: ModuleApiName) {
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.views(module),
    queryFn: () => service.listViewSummaries(module),
  });
}

export function useView(module: ModuleApiName, viewId: string) {
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.view(module, viewId),
    queryFn: () => service.getView(module, viewId),
    enabled: Boolean(viewId),
  });
}

export function useRecordList(
  module: ModuleApiName,
  query: ListQuery,
  options?: { enabled?: boolean },
) {
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.list(module, query),
    queryFn: () => service.list(module, query),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? Boolean(query.viewId),
  });
}

export function useRecordCount(
  module: ModuleApiName,
  query: Pick<ListQuery, "viewId" | "filters" | "search">,
) {
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.count(module, query),
    queryFn: () => service.count(module, query),
  });
}

export function useRecord(module: ModuleApiName, id: RecordId) {
  const service = useClientRecordService();
  return useQuery<RecordData>({
    queryKey: apiKeys.record(module, id),
    queryFn: () => service.get(module, id),
    enabled: Boolean(id),
  });
}

export function useUsers() {
  const service = useClientRecordService();
  return useQuery<readonly OrgMember[]>({
    queryKey: apiKeys.users,
    queryFn: () => service.listUsers(),
  });
}

function invalidateModuleLists(
  queryClient: ReturnType<typeof useQueryClient>,
  module: ModuleApiName,
  recordId?: RecordId,
) {
  void queryClient.invalidateQueries({ queryKey: listQueriesPrefix(module) });
  void queryClient.invalidateQueries({ queryKey: countQueriesPrefix(module) });
  if (recordId) void queryClient.invalidateQueries({ queryKey: apiKeys.record(module, recordId) });
}

function isModuleListOrCountQuery(queryKey: readonly unknown[], module: ModuleApiName): boolean {
  return (
    queryKey.length >= 4 &&
    queryKey[0] === "crm" &&
    queryKey[1] === "module" &&
    queryKey[2] === module &&
    (queryKey[3] === "list" || queryKey[3] === "count")
  );
}

/** Re-requests open list and count queries for a module; does not reload module metadata. */
export function useRefreshModuleListData(module: ModuleApiName) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      predicate: (query) => isModuleListOrCountQuery(query.queryKey, module),
    });
  };
}

export function useCreateRecord(module: ModuleApiName) {
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordInput) => service.create(module, input),
    onSuccess: (record) => invalidateModuleLists(queryClient, module, record.id),
  });
}

export function useUpdateRecord(module: ModuleApiName) {
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: RecordId; input: RecordInput }) =>
      service.update(module, id, input),
    onSuccess: (record) => invalidateModuleLists(queryClient, module, record.id),
  });
}

export function useDeleteRecords(module: ModuleApiName) {
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: readonly RecordId[]) => service.delete(module, ids),
    onSuccess: (_result, ids) => {
      invalidateModuleLists(queryClient, module);
      for (const id of ids) {
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(module, id) });
      }
    },
  });
}

export function useMassUpdate(module: ModuleApiName) {
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, input }: { ids: readonly RecordId[]; input: RecordInput }) =>
      service.massUpdate(module, ids, input),
    onSuccess: (_result, { ids }) => {
      invalidateModuleLists(queryClient, module);
      for (const id of ids)
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(module, id) });
    },
  });
}

export function useChangeOwner(module: ModuleApiName) {
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, ownerId }: { ids: readonly RecordId[]; ownerId: string }) =>
      service.changeOwner(module, ids, ownerId),
    onSuccess: (_result, { ids }) => {
      invalidateModuleLists(queryClient, module);
      for (const id of ids)
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(module, id) });
    },
  });
}
