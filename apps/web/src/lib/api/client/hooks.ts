"use client";

import type {
  CurrencyDefinition,
  DeduplicateResult,
  DuplicateGroup,
  KanbanView,
  KanbanViewInput,
  ListQuery,
  MergeInput,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordId,
  RecordInput,
  SearchQuery,
  SummaryQuery,
} from "@crm/core/records";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { OrgMember } from "./http-record-service";
import { createHttpTransferClient, type TransferClient } from "./http-transfer-service";
import { useClientRecordService, useOrgSlug } from "./provider";
import {
  apiKeys,
  countQueriesPrefix,
  duplicateGroupsPrefix,
  listQueriesPrefix,
  summarizeQueriesPrefix,
} from "./query-keys";

export function useHomeCurrency(options?: { enabled?: boolean }) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<CurrencyDefinition>({
    queryKey: apiKeys.homeCurrency(orgSlug),
    queryFn: () => service.getHomeCurrency(),
    enabled: options?.enabled ?? true,
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
  query: Pick<ListQuery, "viewId" | "filters" | "search" | "activityFilter" | "campaignFilter">,
) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.count(orgSlug, module, query),
    queryFn: () => service.count(module, query),
  });
}

export function useRecordSummary(
  module: ModuleApiName,
  query: SummaryQuery,
  options?: { enabled?: boolean },
) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery({
    queryKey: apiKeys.summarize(orgSlug, module, query),
    queryFn: () => service.summarize(module, query),
    enabled: options?.enabled ?? (Boolean(query.viewId) && Boolean(query.groupBy)),
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

export function invalidateModuleLists(
  queryClient: ReturnType<typeof useQueryClient>,
  orgSlug: string,
  module: ModuleApiName,
  recordId?: RecordId,
) {
  void queryClient.invalidateQueries({ queryKey: listQueriesPrefix(orgSlug, module) });
  void queryClient.invalidateQueries({ queryKey: countQueriesPrefix(orgSlug, module) });
  void queryClient.invalidateQueries({ queryKey: summarizeQueriesPrefix(orgSlug, module) });
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

export function useMergeRecords(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MergeInput) => service.merge(module, input),
    onSuccess: (record, input) => {
      invalidateModuleLists(queryClient, orgSlug, module, record.id);
      void queryClient.invalidateQueries({ queryKey: duplicateGroupsPrefix(orgSlug, module) });
      for (const id of input.duplicateIds) {
        void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, id) });
        queryClient.removeQueries({ queryKey: apiKeys.record(orgSlug, module, id) });
      }
      void queryClient.invalidateQueries({ queryKey: apiKeys.record(orgSlug, module, record.id) });
    },
  });
}

/** Duplicate groups of a module for one to three match fields. */
export function useDuplicateGroups(
  module: ModuleApiName,
  fields: readonly string[],
  options?: { enabled?: boolean },
) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<readonly DuplicateGroup[]>({
    queryKey: apiKeys.duplicateGroups(orgSlug, module, fields),
    queryFn: () => service.findDuplicateGroups(module, fields),
    enabled: (options?.enabled ?? true) && fields.length > 0,
  });
}

/**
 * Runs the module-wide cleanup; the service keeps one running job per module and answers
 * with a conflict error while another one holds the lock.
 */
export function useDeduplicate(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation<DeduplicateResult, Error, readonly string[]>({
    mutationFn: (fields) => service.deduplicate(module, fields),
    onSuccess: () => {
      invalidateModuleLists(queryClient, orgSlug, module);
      void queryClient.invalidateQueries({ queryKey: duplicateGroupsPrefix(orgSlug, module) });
    },
  });
}

export function useGlobalSearch(query: SearchQuery, enabled: boolean) {
  const service = useClientRecordService();
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: [...apiKeys.root(orgSlug), "search", query],
    queryFn: () => service.search(query),
    enabled,
  });
}

export function useKanbanViews(module: ModuleApiName, options?: { enabled?: boolean }) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<readonly KanbanView[]>({
    queryKey: apiKeys.kanbanViews(orgSlug, module),
    queryFn: () => service.listKanbanViews(module),
    enabled: options?.enabled ?? true,
  });
}

export function useKanbanView(module: ModuleApiName, id: string) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  return useQuery<KanbanView>({
    queryKey: apiKeys.kanbanView(orgSlug, module, id),
    queryFn: () => service.getKanbanView(module, id),
    enabled: Boolean(id),
  });
}

/** Creates a view when `id` is omitted, otherwise updates it; refreshes the view queries. */
export function useSaveKanbanView(module: ModuleApiName) {
  const orgSlug = useOrgSlug();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  return useMutation<KanbanView, Error, { id?: string; input: KanbanViewInput }>({
    mutationFn: ({ id, input }) =>
      id ? service.updateKanbanView(module, id, input) : service.createKanbanView(module, input),
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: apiKeys.kanbanViews(orgSlug, module) });
      void queryClient.invalidateQueries({
        queryKey: apiKeys.kanbanView(orgSlug, module, view.id),
      });
    },
  });
}

export function useTransferClient(): TransferClient {
  const orgSlug = useOrgSlug();
  return useMemo(() => createHttpTransferClient(orgSlug), [orgSlug]);
}

export function useImportHistory(options?: { enabled?: boolean }) {
  const orgSlug = useOrgSlug();
  const client = useTransferClient();
  return useQuery({
    queryKey: apiKeys.imports(orgSlug),
    queryFn: () => client.listImports(),
    enabled: options?.enabled ?? true,
  });
}

export function useExportHistory(options?: { enabled?: boolean }) {
  const orgSlug = useOrgSlug();
  const client = useTransferClient();
  return useQuery({
    queryKey: apiKeys.exports(orgSlug),
    queryFn: () => client.listExports(),
    enabled: options?.enabled ?? true,
  });
}
