import type { ListQuery, RecordService, SortSpec } from "@crm/core/records";
import {
  decodeCriteria,
  decodeInput,
  encodeField,
  encodeInfo,
  encodeLayout,
  encodeModule,
  encodeRecord,
  encodeView,
  invalid,
  object,
} from "./codec";
import type { WireMember } from "./types";

export type OperationDeps = {
  records: RecordService;
  members: () => Promise<readonly WireMember[]>;
};
export type OperationRequest = {
  params?: Record<string, string>;
  query: Record<string, string>;
  /** The wrapper's request is used only for reading its optional JSON body. */
  request?: { text(): Promise<string> };
  body?: unknown;
};
export type OperationResult = { status: 200; body: unknown } | { status: 204; body: null };
export type Operation = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  run(deps: OperationDeps, request: OperationRequest): Promise<OperationResult>;
};
const ok = (body: unknown): OperationResult => ({ status: 200, body });
const empty = (): OperationResult => ({ status: 204, body: null });
const moduleOf = (input: OperationRequest) =>
  input.params?.module ?? input.query.module ?? invalid("module", "Choose a module.");
const viewIdOf = (input: OperationRequest) =>
  input.query.cvid || invalid("viewId", "Choose a view.");
const recordIdOf = (input: OperationRequest) => input.params?.recordId || invalid("id");
function positive(value: string | undefined, fallback: number, key: string): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)
    invalid(key);
  return Number(value);
}
function paging(input: OperationRequest, fallback: number) {
  return {
    page: positive(input.query.page, 1, "page"),
    perPage: positive(input.query.per_page, fallback, "perPage"),
  };
}
async function bodyOf(input: OperationRequest): Promise<unknown> {
  if (input.body !== undefined) return input.body;
  const text = await input.request?.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return invalid("data", "Send valid JSON.");
  }
}
async function restrictions(
  input: OperationRequest,
): Promise<Pick<ListQuery, "filters" | "search">> {
  const value = await bodyOf(input);
  if (value === undefined) return {};
  const body = object(value, "filters");
  if (body.search !== undefined && typeof body.search !== "string") invalid("search");
  return {
    ...(body.filters === undefined ? {} : { filters: decodeCriteria(body.filters) }),
    ...(body.search === undefined ? {} : { search: body.search as string }),
  };
}
function sortOf(input: OperationRequest): SortSpec | undefined {
  const { sort_by: field, sort_order: order } = input.query;
  if (field === undefined && order === undefined) return undefined;
  if (!field || (order !== "asc" && order !== "desc")) invalid("sort");
  return { field, order };
}
function collection<T>(
  rows: readonly T[],
  key: string,
  input: OperationRequest,
  fallback: number,
  extra: Record<string, unknown> = {},
): OperationResult {
  const { page, perPage } = paging(input, fallback);
  const start = (page - 1) * perPage;
  const items = rows.slice(start, start + perPage);
  if (!items.length) return empty();
  // Inventory endpoints have no applied record sort in the observed info tree.
  return ok({
    [key]: items,
    info: {
      per_page: perPage,
      count: items.length,
      page,
      more_records: start + perPage < rows.length,
      ...extra,
    },
  });
}

/** The sole API path inventory, shared with the browser HTTP adapter. */
export const operations = {
  module: {
    method: "GET",
    path: "/crm/v2.2/settings/modules/{module}",
    async run({ records }, input) {
      return ok({ modules: [encodeModule(await records.getModule(moduleOf(input)))] });
    },
  },
  fields: {
    method: "GET",
    path: "/crm/v2.2/settings/fields",
    async run({ records }, input) {
      const metadata = await records.getModule(moduleOf(input));
      return metadata.fields.length ? ok({ fields: metadata.fields.map(encodeField) }) : empty();
    },
  },
  layouts: {
    method: "GET",
    path: "/crm/v2.1/settings/layouts",
    async run({ records }, input) {
      const metadata = await records.getModule(moduleOf(input));
      return metadata.layout.length ? ok({ layouts: [encodeLayout(metadata)] }) : empty();
    },
  },
  views: {
    method: "GET",
    path: "/crm/v9/settings/custom_views",
    async run({ records }, input) {
      const views = await records.listViews(moduleOf(input));
      const defaultView = views.find((view) => view.isDefault);
      return collection(
        views.map(({ id, name, systemDefined, isDefault }) => ({
          id,
          name,
          system_defined: systemDefined,
          default: isDefault,
        })),
        "custom_views",
        input,
        200,
        defaultView ? { default: defaultView.id } : {},
      );
    },
  },
  view: {
    method: "GET",
    path: "/crm/v9/settings/custom_views/{viewId}",
    async run({ records }, input) {
      return ok({
        custom_views: [
          encodeView(
            await records.getView(moduleOf(input), input.params?.viewId || invalid("viewId")),
          ),
        ],
      });
    },
  },
  bulk: {
    method: "POST",
    path: "/crm/v2.2/{module}/bulk",
    async run({ records, members }, input) {
      const module = moduleOf(input);
      const view = await records.getView(module, viewIdOf(input));
      const metadata = await records.getModule(module);
      const sort = sortOf(input);
      const requested = input.query.fields === undefined ? [] : input.query.fields.split(",");
      const query: ListQuery = {
        viewId: view.id,
        ...paging(input, 30),
        ...(await restrictions(input)),
        fields: [...new Set([...view.columns, ...requested])],
        ...(sort ? { sort } : {}),
      };
      const result = await records.list(module, query);
      if (!result.records.length) return empty();
      const recordMembers = await members();
      return ok({
        data: result.records.map((row) => encodeRecord(row, metadata, recordMembers)),
        info: encodeInfo(result, result.records.length),
      });
    },
  },
  count: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/count",
    async run({ records }, input) {
      return ok({
        count: await records.count(moduleOf(input), {
          viewId: viewIdOf(input),
          ...(await restrictions(input)),
        }),
      });
    },
  },
  record: {
    method: "GET",
    path: "/crm/v2.2/{module}/{recordId}",
    async run({ records, members }, input) {
      const module = moduleOf(input);
      const metadata = await records.getModule(module);
      return ok({
        data: [
          encodeRecord(await records.get(module, recordIdOf(input)), metadata, await members()),
        ],
      });
    },
  },
  users: {
    method: "GET",
    path: "/crm/v9/users",
    async run({ members }, input) {
      return collection(
        (await members()).map((member) => ({
          id: member.userId,
          full_name: member.name,
          email: member.email,
        })),
        "users",
        input,
        200,
      );
    },
  },
  create: {
    method: "POST",
    path: "/crm/v2.2/{module}",
    async run({ records }, input) {
      const module = moduleOf(input);
      const metadata = await records.getModule(module);
      const body = object(await bodyOf(input), "data");
      if (!Array.isArray(body.data) || body.data.length !== 1)
        invalid("data", "Send exactly one record.");
      const record = await records.create(module, decodeInput(body.data[0], metadata));
      return ok({ data: [{ id: record.id }] });
    },
  },
  update: {
    method: "PUT",
    path: "/crm/v2.2/{module}/{recordId}",
    async run({ records }, input) {
      const module = moduleOf(input);
      const metadata = await records.getModule(module);
      const body = object(await bodyOf(input), "data");
      if (!Array.isArray(body.data) || body.data.length !== 1)
        invalid("data", "Send exactly one record.");
      const record = await records.update(
        module,
        recordIdOf(input),
        decodeInput(body.data[0], metadata),
      );
      return ok({ data: [{ id: record.id }] });
    },
  },
  delete: {
    method: "DELETE",
    path: "/crm/v2.2/{module}",
    async run({ records }, input) {
      const ids = input.query.ids?.split(",");
      if (!ids?.length || ids.some((id) => !id)) invalid("ids");
      await records.delete(moduleOf(input), ids);
      return ok({ data: ids.map((id) => ({ id })) });
    },
  },
} satisfies Record<string, Operation>;

export function operationPath(
  operation: Pick<Operation, "path">,
  params: Record<string, string> = {},
): string {
  return operation.path.replace(/\{([^}]+)\}/g, (_match, key: string) =>
    encodeURIComponent(params[key] || invalid(key)),
  );
}
