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
  WireFieldsResponse,
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

export type ClientRecordService = RecordService & {
  listUsers(): Promise<readonly OrgMember[]>;
};

export type HttpRecordServiceOptions = {
  orgSlug: string;
  fetch?: ApiFetchFn;
};

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

function listQueryParams(
  module: ModuleApiName,
  query: ListQuery,
): Record<string, string | undefined> {
  return {
    module,
    cvid: query.viewId,
    page: String(query.page),
    per_page: String(query.perPage),
    ...(query.sort ? { sort_by: query.sort.field, sort_order: query.sort.order } : {}),
    ...(query.fields?.length ? { fields: query.fields.join(",") } : {}),
  };
}

export function createHttpRecordService({
  orgSlug,
  fetch: fetchImpl = (path, options) => apiFetch(orgSlug, path, options),
}: HttpRecordServiceOptions): ClientRecordService {
  const request = (
    path: string,
    options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
  ) => fetchImpl(path, options);

  return {
    async getModule(module: ModuleApiName): Promise<ModuleMetadata> {
      const modulePath = operationPath(operations.module, { module });
      const fieldsPath = operationPath(operations.fields, { module });
      const layoutsPath = operationPath(operations.layouts, { module });
      const [moduleBody, fieldsBody, layoutsBody] = await Promise.all([
        request(
          `${modulePath}?module=${encodeURIComponent(module)}`,
        ) as Promise<WireModuleResponse>,
        request(
          `${fieldsPath}?module=${encodeURIComponent(module)}`,
        ) as Promise<WireFieldsResponse | null>,
        request(
          `${layoutsPath}?module=${encodeURIComponent(module)}`,
        ) as Promise<WireLayoutsResponse | null>,
      ]);
      const fields = fieldsBody?.fields ?? [];
      const layout = layoutsBody?.layouts?.[0];
      if (!layout) throw new Error("Module layout is missing from the API response.");
      return decodeModule(requiredWire(moduleBody.modules[0], "Module"), fields, layout);
    },

    async listViews(module: ModuleApiName): Promise<readonly ListView[]> {
      const path = operationPath(operations.views, { module });
      const body = (await request(`${path}${queryString({ module })}`)) as WireViewsResponse;
      return Promise.all(body.custom_views.map((summary) => this.getView(module, summary.id)));
    },

    async getView(module: ModuleApiName, viewId: string): Promise<ListView> {
      const path = operationPath(operations.view, { module, viewId });
      const body = (await request(`${path}${queryString({ module })}`)) as WireViewResponse;
      return decodeView(requiredWire(body.custom_views[0], "View"));
    },

    async list(module: ModuleApiName, query: ListQuery) {
      const metadata = await this.getModule(module);
      const wireQuery: ListQuery =
        query.fields === undefined
          ? { ...query, fields: metadata.fields.map((field) => field.apiName) }
          : query;
      const path = operationPath(operations.bulk, { module });
      const restrictions = listBody(query);
      const body = (await request(`${path}${queryString(listQueryParams(module, wireQuery))}`, {
        method: operations.bulk.method,
        ...(restrictions === undefined ? {} : { body: restrictions }),
      })) as WireBulkResponse | null;
      if (!body) {
        const view = await this.getView(module, query.viewId);
        const sort = query.sort ?? view.sort ?? { field: "id", order: "desc" };
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
      const body = (await request(`${path}${queryString({ module, cvid: query.viewId })}`, {
        method: operations.count.method,
        ...(restrictions === undefined ? {} : { body: restrictions }),
      })) as WireCountResponse;
      return body.count;
    },

    async get(module: ModuleApiName, id: RecordId): Promise<RecordData> {
      const path = operationPath(operations.record, { module, recordId: id });
      const metadata = await this.getModule(module);
      const body = (await request(`${path}${queryString({ module })}`)) as WireRecordResponse;
      return decodeRecord(requiredWire(body.data[0], "Record"), metadata);
    },

    async create(module: ModuleApiName, input: RecordInput): Promise<RecordData> {
      const metadata = await this.getModule(module);
      const path = operationPath(operations.create, { module });
      const write = (await request(`${path}${queryString({ module })}`, {
        method: operations.create.method,
        body: { data: [encodeInput(input, metadata)] },
      })) as { data: readonly { id: string }[] };
      return this.get(module, requiredWire(write.data[0], "Created record").id);
    },

    async update(module: ModuleApiName, id: RecordId, input: RecordInput): Promise<RecordData> {
      const metadata = await this.getModule(module);
      const path = operationPath(operations.update, { module, recordId: id });
      await request(`${path}${queryString({ module })}`, {
        method: operations.update.method,
        body: { data: [encodeInput(input, metadata)] },
      });
      return this.get(module, id);
    },

    async delete(module: ModuleApiName, ids: readonly RecordId[]): Promise<void> {
      if (!ids.length) {
        await this.getModule(module);
        return;
      }
      const path = operationPath(operations.delete, { module });
      await request(`${path}${queryString({ module, ids: ids.join(",") })}`, {
        method: operations.delete.method,
      });
    },

    async listUsers(): Promise<readonly OrgMember[]> {
      const path = operationPath(operations.users, {});
      const body = (await request(path)) as WireUsersResponse;
      return body.users.map((user) => ({
        userId: user.id,
        name: user.full_name,
        email: user.email,
      }));
    },
  };
}
