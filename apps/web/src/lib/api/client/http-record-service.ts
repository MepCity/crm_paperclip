import type {
  ListQuery,
  ListResult,
  ListView,
  ModuleApiName,
  ModuleMetadata,
  RecordData,
  RecordId,
  RecordInput,
  RecordService,
} from "@crm/core/records";
import {
  decodeList,
  decodeModule,
  decodeRecord,
  decodeView,
  encodeCriteria,
  encodeInput,
} from "@/lib/api/wire/codec";
import { operationPath, operations } from "@/lib/api/wire/operations";
import type {
  WireBulkResponse,
  WireCountResponse,
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

function listBody(query: Pick<ListQuery, "filters" | "search">): unknown | undefined {
  const body: { filters?: ReturnType<typeof encodeCriteria>; search?: string } = {};
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

function decodeViewSummaries(body: WireViewsResponse): readonly ViewSummary[] {
  return body.custom_views.map((summary) => ({
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
}: HttpRecordServiceOptions): ClientRecordService {
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

  const service: ClientRecordService = {
    getModule: loadModuleMetadata,

    async listViews(module: ModuleApiName): Promise<readonly ListView[]> {
      const path = operationPath(operations.views, { module });
      const body = (await request(
        `${path}${queryString({ module, page: "1", per_page: VIEW_PAGE_SIZE })}`,
      )) as WireViewsResponse;
      return Promise.all(body.custom_views.map((summary) => service.getView(module, summary.id)));
    },

    async listViewSummaries(module: ModuleApiName): Promise<readonly ViewSummary[]> {
      const path = operationPath(operations.views, { module });
      const body = (await request(
        `${path}${queryString({ module, page: "1", per_page: VIEW_PAGE_SIZE })}`,
      )) as WireViewsResponse;
      return decodeViewSummaries(body);
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
            page: query.page,
            perPage: query.perPage,
            moreRecords: false,
            sort,
          },
          query,
        );
      }
      return projectList(decodeList(body.data, body.info, metadata), query);
    },

    async count(
      module: ModuleApiName,
      query: Pick<ListQuery, "viewId" | "filters" | "search">,
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

    async listUsers(): Promise<readonly OrgMember[]> {
      const path = operationPath(operations.users, {});
      const body = (await request(
        `${path}${queryString({ type: "ActiveUsers", page: "1", per_page: VIEW_PAGE_SIZE })}`,
      )) as WireUsersResponse;
      return body.users.map((user) => ({
        userId: user.id,
        name: user.full_name,
        email: user.email,
      }));
    },
  };

  return service;
}
