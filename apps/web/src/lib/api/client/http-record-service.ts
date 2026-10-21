import type {
  DeduplicateResult,
  DuplicateGroup,
  GroupSummary,
  ListQuery,
  ListResult,
  ListView,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordHistoryPage,
  RecordHistoryQuery,
  RecordId,
  RecordInput,
  RecordService,
  SearchGroup,
} from "@crm/core/records";
import {
  decodeActivitySummaries,
  decodeCurrency,
  decodeList,
  decodeModule,
  decodeRecord,
  decodeView,
  encodeActivityFilter,
  encodeCampaignFilter,
  encodeCriteria,
  encodeInput,
  encodeRelatedModules,
  encodeSystemFilters,
  invalid,
} from "@/lib/api/wire/codec";
import {
  decodeKanbanView,
  encodeKanbanViewInput,
  type WireKanbanViewsResponse,
} from "@/lib/api/wire/kanban-views";
import { operationPath, operations } from "@/lib/api/wire/operations";
import {
  decodeTimelinesPage,
  encodeTimelineQuery,
  type WireTimelinesResponse,
} from "@/lib/api/wire/timelines";
import type {
  WireBulkResponse,
  WireCountResponse,
  WireCurrenciesResponse,
  WireField,
  WireFieldsResponse,
  WireLayout,
  WireLayoutsResponse,
  WireModuleResponse,
  WireRecordResponse,
  WireUsersResponse,
  WireViewResponse,
  WireViewsResponse,
} from "@/lib/api/wire/types";
import type { ApiFetchFn } from "./fetch";
import { apiFetch } from "./fetch";

export type OrgMember = { userId: string; name: string; email: string };

export type ViewSummary = Pick<ListView, "id" | "name" | "systemDefined" | "isDefault">;

export type ClientRecordService = RecordService & {
  listViewSummaries(module: ModuleApiName): Promise<readonly ViewSummary[]>;
  listUsers(): Promise<readonly OrgMember[]>;
  /** Optional for in-memory screen fixtures; HTTP clients always supply this reader. */
  listHistory?(
    module: ModuleApiName,
    recordId: RecordId,
    query: RecordHistoryQuery,
  ): Promise<RecordHistoryPage>;
};

export type HttpRecordService = ClientRecordService & {
  listHistory(
    module: ModuleApiName,
    recordId: RecordId,
    query: RecordHistoryQuery,
  ): Promise<RecordHistoryPage>;
};

export type HttpRecordServiceOptions = {
  orgSlug: string;
  fetch?: ApiFetchFn;
};

const VIEW_PAGE_SIZE = "200";

function queryString(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function requiredWire<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`${label} is missing from the API response.`);
  return value;
}

function listBody(
  query: Pick<
    ListQuery,
    | "filters"
    | "search"
    | "activityFilter"
    | "campaignFilter"
    | "systemFilters"
    | "relatedModules"
    | "includeActivitySummary"
  >,
): unknown | undefined {
  const body: import("../wire/types").WireRestrictions = {};
  if (query.systemFilters !== undefined)
    body.system_filters = encodeSystemFilters(query.systemFilters);
  if (query.relatedModules !== undefined)
    body.related_modules = encodeRelatedModules(query.relatedModules);
  if (query.campaignFilter !== undefined)
    body.campaign_filter = encodeCampaignFilter(query.campaignFilter);
  if (query.activityFilter !== undefined)
    body.activity_filter = encodeActivityFilter(query.activityFilter);
  if (query.includeActivitySummary !== undefined)
    body.include_activity_summary = query.includeActivitySummary;
  if (query.filters) body.filters = encodeCriteria(query.filters);
  if (query.search !== undefined) body.search = query.search;
  return Object.keys(body).length ? body : undefined;
}

function projectList(result: ListResult, query: ListQuery): ListResult {
  if (query.fields === undefined) return result;
  const allowed = new Set(query.fields.length === 0 ? ["id"] : ["id", ...query.fields]);
  return {
    ...result,
    records: result.records.map((record) => ({
      id: record.id,
      fields: Object.fromEntries(
        Object.entries(record.fields).filter(([name]) => allowed.has(name)),
      ),
    })),
  };
}

function listQueryParams(query: ListQuery): Record<string, string | undefined> {
  return {
    cvid: query.viewId,
    page: String(query.page),
    per_page: String(query.perPage),
    ...(query.sort ? { sort_by: query.sort.field, sort_order: query.sort.order } : {}),
    ...(query.fields?.length ? { fields: query.fields.join(",") } : {}),
  };
}

function decodeViewSummaries(views: WireViewsResponse["custom_views"]): readonly ViewSummary[] {
  return views.map((summary) => ({
    id: summary.id,
    name: summary.name,
    systemDefined: summary.system_defined,
    isDefault: summary.default,
  }));
}

type ModuleWireBundle = {
  module: WireModuleResponse["modules"][number];
  fields: readonly WireField[];
  layout: WireLayout;
};

type ModuleLoadState = {
  settled: ModuleWireBundle | null;
  inflight: Promise<ModuleWireBundle> | null;
};

function metadataFromWire(bundle: ModuleWireBundle): ModuleMetadata {
  // Decode surface flags, column placement and business-card selection together.
  return decodeModule(bundle.module, [...bundle.fields], bundle.layout);
}

export function createHttpRecordService({
  orgSlug,
  fetch: fetchImpl = (path, options) => apiFetch(orgSlug, path, options),
}: HttpRecordServiceOptions): HttpRecordService {
  const moduleState = new Map<ModuleApiName, ModuleLoadState>();

  const request = (
    path: string,
    options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
  ) => fetchImpl(path, options);

  function moduleLoadState(module: ModuleApiName): ModuleLoadState {
    let state = moduleState.get(module);
    if (!state) {
      state = { settled: null, inflight: null };
      moduleState.set(module, state);
    }
    return state;
  }

  async function loadModuleWire(module: ModuleApiName): Promise<ModuleWireBundle> {
    const state = moduleLoadState(module);
    if (state.settled) return state.settled;
    if (state.inflight) return state.inflight;

    state.inflight = (async () => {
      const modulePath = operationPath(operations.module, { module });
      const fieldsPath = operationPath(operations.fields, { module });
      const layoutsPath = operationPath(operations.layouts, { module });
      const [moduleBody, fieldsBody, layoutsBody] = await Promise.all([
        request(modulePath) as Promise<WireModuleResponse>,
        request(`${fieldsPath}${queryString({ module })}`) as Promise<WireFieldsResponse | null>,
        request(`${layoutsPath}${queryString({ module })}`) as Promise<WireLayoutsResponse | null>,
      ]);
      const fields = fieldsBody?.fields ?? [];
      const layout = layoutsBody?.layouts?.[0];
      if (!layout) throw new Error("Module layout is missing from the API response.");
      return {
        module: requiredWire(moduleBody.modules[0], "Module"),
        fields,
        layout,
      };
    })()
      .then((bundle) => {
        state.settled = bundle;
        state.inflight = null;
        return bundle;
      })
      .catch((error) => {
        state.inflight = null;
        throw error;
      });

    return state.inflight;
  }

  async function loadModuleMetadata(module: ModuleApiName): Promise<ModuleMetadata> {
    return metadataFromWire(await loadModuleWire(module));
  }

  const service: HttpRecordService = {
    async search(query) {
      return (await request(operationPath(operations.search), {
        method: operations.search.method,
        body: { ...query, ...(query.filters ? { filters: encodeCriteria(query.filters) } : {}) },
      })) as readonly SearchGroup[];
    },
    async findDuplicateGroups(module, fields) {
      return (await request(operationPath(operations.duplicateGroups, { module }), {
        method: operations.duplicateGroups.method,
        body: { fields },
      })) as readonly DuplicateGroup[];
    },
    async merge(module, input) {
      const metadata = await loadModuleMetadata(module);
      return (await request(operationPath(operations.merge, { module }), {
        method: operations.merge.method,
        body: { ...input, values: encodeInput(input.values, metadata) },
      })) as RecordData;
    },
    async deduplicate(module, fields) {
      return (await request(operationPath(operations.deduplicate, { module }), {
        method: operations.deduplicate.method,
        body: { fields },
      })) as DeduplicateResult;
    },
    async getHomeCurrency() {
      const body = (await request(operationPath(operations.currencies), {
        method: operations.currencies.method,
      })) as WireCurrenciesResponse | null;
      const currencies = body?.currencies;
      if (!Array.isArray(currencies)) invalid("currencies");
      return decodeCurrency(requiredWire(currencies[0], "Currency"));
    },
    getModule: loadModuleMetadata,

    async listViews(module: ModuleApiName): Promise<readonly ListView[]> {
      const summaries = await service.listViewSummaries(module);
      return Promise.all(summaries.map((summary) => service.getView(module, summary.id)));
    },

    async listViewSummaries(module: ModuleApiName): Promise<readonly ViewSummary[]> {
      const path = operationPath(operations.views, { module });
      const summaries: ViewSummary[] = [];
      for (let page = 1; ; page++) {
        const body = (await request(
          `${path}${queryString({ module, page: String(page), per_page: VIEW_PAGE_SIZE })}`,
        )) as WireViewsResponse | null;
        if (!body) break;
        summaries.push(...decodeViewSummaries(body.custom_views));
        if (!body.info.more_records) break;
      }
      return summaries;
    },

    async getView(module: ModuleApiName, viewId: string): Promise<ListView> {
      const path = operationPath(operations.view, { module, viewId });
      const body = (await request(`${path}${queryString({ module })}`)) as WireViewResponse;
      return decodeView(requiredWire(body.custom_views[0], "View"));
    },

    async list(module: ModuleApiName, query: ListQuery) {
      const metadata = await loadModuleMetadata(module);
      const wireQuery: ListQuery =
        query.fields === undefined
          ? { ...query, fields: metadata.fields.map((field) => field.apiName) }
          : query;
      const path = operationPath(operations.bulk, { module });
      const restrictions = listBody(query);
      const body = (await request(`${path}${queryString(listQueryParams(wireQuery))}`, {
        method: operations.bulk.method,
        ...(restrictions === undefined ? {} : { body: restrictions }),
      })) as WireBulkResponse | null;
      if (!body) {
        let sort = query.sort;
        if (!sort) {
          const view = await service.getView(module, query.viewId);
          sort = view.sort ?? { field: "id", order: "desc" };
        }
        return projectList(
          {
            records: [],
            ...(query.includeActivitySummary ? { activitySummaries: {} } : {}),
            page: query.page,
            perPage: query.perPage,
            moreRecords: false,
            sort,
          },
          query,
        );
      }
      return projectList(
        {
          ...decodeList(body.data, body.info, metadata),
          ...(body.activity_summaries === undefined
            ? {}
            : { activitySummaries: decodeActivitySummaries(body.activity_summaries) }),
        },
        query,
      );
    },

    async summarize(module, query) {
      const body = (await request(
        `${operationPath(operations.summarize, { module })}${queryString({ cvid: query.viewId, group_by: query.groupBy, sum: query.sum })}`,
        {
          method: operations.summarize.method,
          body: listBody(query),
        },
      )) as { groups: readonly GroupSummary[] };
      return body.groups;
    },

    async count(
      module: ModuleApiName,
      query: Pick<
        ListQuery,
        | "viewId"
        | "filters"
        | "search"
        | "activityFilter"
        | "campaignFilter"
        | "systemFilters"
        | "relatedModules"
      >,
    ): Promise<number> {
      const path = operationPath(operations.count, { module });
      const restrictions = listBody(query);
      const body = (await request(`${path}${queryString({ cvid: query.viewId })}`, {
        method: operations.count.method,
        ...(restrictions === undefined ? {} : { body: restrictions }),
      })) as WireCountResponse;
      return body.count;
    },

    async get(module: ModuleApiName, id: RecordId): Promise<RecordData> {
      const path = operationPath(operations.record, { module, recordId: id });
      const metadata = await loadModuleMetadata(module);
      const body = (await request(path)) as WireRecordResponse;
      return decodeRecord(requiredWire(body.data[0], "Record"), metadata);
    },

    async create(module: ModuleApiName, input: RecordInput): Promise<RecordData> {
      const metadata = await loadModuleMetadata(module);
      const path = operationPath(operations.create, { module });
      const write = (await request(path, {
        method: operations.create.method,
        body: { data: [encodeInput(input, metadata)] },
      })) as import("../wire/types").WireWriteResult;
      return service.get(module, requiredWire(write.data[0], "Created record").details.id);
    },

    async update(module: ModuleApiName, id: RecordId, input: RecordInput): Promise<RecordData> {
      const metadata = await loadModuleMetadata(module);
      const path = operationPath(operations.update, { module, recordId: id });
      const write = (await request(path, {
        method: operations.update.method,
        body: { data: [encodeInput(input, metadata)] },
      })) as import("../wire/types").WireWriteResult;
      return service.get(module, requiredWire(write.data[0], "Updated record").details.id);
    },

    async delete(module: ModuleApiName, ids: readonly RecordId[]): Promise<void> {
      if (ids.length === 1) {
        const path = operationPath(operations.delete, { module, recordId: ids[0] as string });
        await request(path, { method: operations.delete.method });
      } else {
        const path = operationPath(operations.massDelete, { module });
        await request(path, { method: operations.massDelete.method, body: { ids } });
      }
    },

    async massUpdate(module, ids, input) {
      const metadata = await loadModuleMetadata(module);
      const path = operationPath(operations.massUpdate, { module });
      await request(path, {
        method: operations.massUpdate.method,
        body: { data: [encodeInput(input, metadata)], ids },
      });
    },

    async changeOwner(module, ids, ownerId) {
      const path = operationPath(operations.changeOwner, { module });
      await request(path, {
        method: operations.changeOwner.method,
        body: { ids, owner: { id: ownerId } },
      });
    },

    async listKanbanViews(module) {
      const body = (await request(
        `${operationPath(operations.kanbanViews)}${queryString({ module })}`,
      )) as WireKanbanViewsResponse;
      return body.kanban_views.map(decodeKanbanView);
    },

    async getKanbanView(module, id) {
      const path = operationPath(operations.kanbanView, { viewId: id });
      const body = (await request(`${path}${queryString({ module })}`)) as WireKanbanViewsResponse;
      return decodeKanbanView(requiredWire(body.kanban_views[0], "Kanban view"));
    },

    async createKanbanView(module, input) {
      const body = (await request(
        `${operationPath(operations.createKanbanView)}${queryString({ module })}`,
        {
          method: operations.createKanbanView.method,
          body: { kanban_views: [encodeKanbanViewInput(input)] },
        },
      )) as WireKanbanViewsResponse;
      return decodeKanbanView(requiredWire(body.kanban_views[0], "Kanban view"));
    },

    async updateKanbanView(module, id, input) {
      const path = operationPath(operations.updateKanbanView, { viewId: id });
      const body = (await request(`${path}${queryString({ module })}`, {
        method: operations.updateKanbanView.method,
        body: { kanban_views: [encodeKanbanViewInput(input)] },
      })) as WireKanbanViewsResponse;
      return decodeKanbanView(requiredWire(body.kanban_views[0], "Kanban view"));
    },

    async listHistory(module, recordId, query) {
      const path = `/crm/v9/${encodeURIComponent(module)}/${encodeURIComponent(recordId)}/timelines`;
      const params = encodeTimelineQuery({
        perPage: query.perPage,
        pageToken: query.pageToken ?? null,
        modules: query.modules?.length ? [...query.modules] : undefined,
        actorId: query.actorId,
        from: query.from,
        to: query.to,
        sources: query.sources?.length ? [...query.sources] : undefined,
      });
      return decodeTimelinesPage(
        (await request(`${path}?${params}`)) as WireTimelinesResponse | null,
      );
    },

    async listUsers(): Promise<readonly OrgMember[]> {
      const path = operationPath(operations.users, {});
      const members: OrgMember[] = [];
      for (let page = 1; ; page++) {
        const body = (await request(
          `${path}${queryString({ type: "ActiveUsers", page: String(page), per_page: VIEW_PAGE_SIZE })}`,
        )) as WireUsersResponse | null;
        if (!body) break;
        members.push(
          ...body.users.map((user) => ({
            userId: user.id,
            name: user.full_name,
            email: user.email,
          })),
        );
        if (!body.info.more_records) break;
      }
      return members;
    },
  };

  return service;
}
