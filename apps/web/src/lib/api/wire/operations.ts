import type {
  ConvertLeadInput,
  ConvertTarget,
  ListQuery,
  RecordService,
  SearchQuery,
  SortSpec,
} from "@crm/core/records";
import {
  decodeActivityFilter,
  decodeCampaignFilter,
  decodeCriteria,
  decodeInput,
  decodeRelatedModules,
  decodeSystemFilters,
  encodeActivitySummaries,
  encodeCurrency,
  encodeField,
  encodeInfo,
  encodeLayout,
  encodeModule,
  encodeRecord,
  encodeRecordWriteResult,
  encodeView,
  encodeWriteResult,
  invalid,
  object,
  referenceKeys,
} from "./codec";
import { kanbanViewOperations } from "./kanban-views";
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
// Match the existing long-text field limit without narrowing searches to short labels.
export const MAX_SEARCH_LENGTH = 2000;
async function restrictions(
  input: OperationRequest,
): Promise<
  Pick<
    ListQuery,
    | "filters"
    | "search"
    | "activityFilter"
    | "campaignFilter"
    | "systemFilters"
    | "relatedModules"
    | "includeActivitySummary"
  >
> {
  const value = await bodyOf(input);
  if (value === undefined) return {};
  const body = object(value, "filters");
  if (body.search !== undefined && typeof body.search !== "string") invalid("search");
  if (typeof body.search === "string" && body.search.length > MAX_SEARCH_LENGTH)
    invalid("search", "Send at most 2000 characters.");
  if (
    body.include_activity_summary !== undefined &&
    typeof body.include_activity_summary !== "boolean"
  )
    invalid("includeActivitySummary");
  return {
    ...(body.system_filters === undefined
      ? {}
      : { systemFilters: decodeSystemFilters(body.system_filters) }),
    ...(body.related_modules === undefined
      ? {}
      : { relatedModules: decodeRelatedModules(body.related_modules) }),
    ...(body.campaign_filter === undefined
      ? {}
      : { campaignFilter: decodeCampaignFilter(body.campaign_filter) }),
    ...(body.activity_filter === undefined
      ? {}
      : { activityFilter: decodeActivityFilter(body.activity_filter) }),
    ...(body.include_activity_summary === undefined
      ? {}
      : { includeActivitySummary: body.include_activity_summary as boolean }),
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

function idsOf(body: Record<string, unknown>): string[] {
  if (!Array.isArray(body.ids) || body.ids.some((id) => typeof id !== "string" || !id))
    invalid("ids");
  return [...body.ids] as string[];
}

async function convertTarget(
  records: RecordService,
  module: string,
  value: unknown,
  key: string,
): Promise<ConvertTarget | undefined> {
  if (value === undefined || value === null) return undefined;
  const target = object(value, key);
  const metadata = await records.getModule(module);
  if (typeof target.reuseId === "string" && target.reuseId)
    return {
      reuseId: target.reuseId,
      ...(target.update === undefined ? {} : { update: decodeInput(target.update, metadata) }),
    };
  if (target.create !== undefined) return { create: decodeInput(target.create, metadata) };
  return invalid(key);
}

function stringList(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item))
    invalid(key);
  return [...value] as string[];
}
function searchQuery(body: Record<string, unknown>): SearchQuery {
  if (typeof body.text !== "string") invalid("text");
  if (body.scope !== undefined && body.scope !== "all" && body.scope !== "nameOrTags")
    invalid("scope");
  for (const key of ["page", "perPage"]) {
    if (
      body[key] !== undefined &&
      (typeof body[key] !== "number" || !Number.isSafeInteger(body[key]) || Number(body[key]) < 1)
    )
      invalid(key);
  }
  let sort: SortSpec | undefined;
  if (body.sort !== undefined) {
    const value = object(body.sort, "sort");
    if (typeof value.field !== "string" || (value.order !== "asc" && value.order !== "desc"))
      invalid("sort");
    sort = { field: value.field, order: value.order };
  }
  return {
    text: body.text,
    ...(body.scope === undefined ? {} : { scope: body.scope as SearchQuery["scope"] }),
    ...(body.modules === undefined ? {} : { modules: stringList(body.modules, "modules") }),
    ...(body.fields === undefined ? {} : { fields: stringList(body.fields, "fields") }),
    ...(body.filters === undefined ? {} : { filters: decodeCriteria(body.filters) }),
    ...(body.page === undefined ? {} : { page: body.page as number }),
    ...(body.perPage === undefined ? {} : { perPage: body.perPage as number }),
    ...(sort ? { sort } : {}),
  };
}

/** The sole API path inventory, shared with the browser HTTP adapter. */
export const operations = {
  // Module 2 discovery uses local domain response DTOs, not reference request shapes.
  search: {
    method: "POST",
    path: "/crm/v2.2/actions/search",
    async run({ records }, input) {
      return ok(await records.search(searchQuery(object(await bodyOf(input), "query"))));
    },
  },
  duplicateGroups: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/duplicate_groups",
    async run({ records }, input) {
      const body = object(await bodyOf(input), "fields");
      return ok(
        await records.findDuplicateGroups(moduleOf(input), stringList(body.fields, "fields")),
      );
    },
  },
  merge: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/merge",
    async run({ records }, input) {
      const module = moduleOf(input);
      const body = object(await bodyOf(input), "merge");
      if (typeof body.masterId !== "string" || !body.masterId) invalid("masterId");
      const metadata = await records.getModule(module);
      return ok(
        await records.merge(module, {
          masterId: body.masterId,
          duplicateIds: stringList(body.duplicateIds, "duplicateIds"),
          values: decodeInput(body.values, metadata),
        }),
      );
    },
  },
  convertLead: {
    method: "POST",
    path: "/crm/v2.2/{module}/{recordId}/actions/convert",
    async run({ records }, input) {
      await records.getModule(moduleOf(input));
      if (moduleOf(input) !== "Leads") invalid("module", "Only leads can be converted.");
      const body = object(await bodyOf(input), "convert");
      const [account, contact, deal] = await Promise.all([
        convertTarget(records, "Accounts", body.account, "account"),
        convertTarget(records, "Contacts", body.contact, "contact"),
        convertTarget(records, "Deals", body.deal, "deal"),
      ]);
      const request: ConvertLeadInput = {
        ...(account ? { account } : {}),
        ...(contact ? { contact } : {}),
        ...(deal ? { deal } : {}),
      };
      return ok(await records.convertLead(recordIdOf(input), request));
    },
  },
  deduplicate: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/deduplicate",
    async run({ records }, input) {
      const body = object(await bodyOf(input), "fields");
      return ok(await records.deduplicate(moduleOf(input), stringList(body.fields, "fields")));
    },
  },
  currencies: {
    method: "GET",
    path: "/crm/v2.2/org/currencies",
    async run({ records }) {
      return ok({ currencies: [encodeCurrency(await records.getHomeCurrency())] });
    },
  },
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
      if (!result.records.length && result.activitySummaries === undefined) return empty();
      const recordMembers = await members();
      return ok({
        data: result.records.map((row) => encodeRecord(row, metadata, recordMembers)),
        info: encodeInfo(result, result.records.length),
        ...(result.activitySummaries === undefined
          ? {}
          : { activity_summaries: encodeActivitySummaries(result.activitySummaries) }),
      });
    },
  },
  summarize: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/grouped_counts",
    async run({ records }, input) {
      const groupBy = input.query.group_by || invalid("groupBy");
      return ok({
        groups: await records.summarize(moduleOf(input), {
          viewId: viewIdOf(input),
          groupBy,
          ...(input.query.sum === undefined ? {} : { sum: input.query.sum }),
          ...(await restrictions(input)),
        }),
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
    async run({ records, members }, input) {
      const module = moduleOf(input);
      const metadata = await records.getModule(module);
      const body = object(await bodyOf(input), "data");
      if (!Array.isArray(body.data) || body.data.length !== 1)
        invalid("data", "Send exactly one record.");
      const recordMembers = await members();
      const record = await records.create(module, decodeInput(body.data[0], metadata));
      return ok(encodeRecordWriteResult(record, metadata, recordMembers, "record added"));
    },
  },
  update: {
    method: "PUT",
    path: "/crm/v2.2/{module}/{recordId}",
    async run({ records, members }, input) {
      const module = moduleOf(input);
      const metadata = await records.getModule(module);
      const body = object(await bodyOf(input), "data");
      if (!Array.isArray(body.data) || body.data.length !== 1)
        invalid("data", "Send exactly one record.");
      const recordMembers = await members();
      const record = await records.update(
        module,
        recordIdOf(input),
        decodeInput(body.data[0], metadata),
      );
      return ok(encodeRecordWriteResult(record, metadata, recordMembers, "record updated"));
    },
  },
  delete: {
    method: "DELETE",
    path: "/crm/v2.2/{module}/{recordId}",
    async run({ records }, input) {
      const ids = [recordIdOf(input)];
      await records.delete(moduleOf(input), ids);
      return ok(encodeWriteResult(ids, "record deleted"));
    },
  },
  massDelete: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/mass_delete",
    async run({ records }, input) {
      const body = object(await bodyOf(input), "ids");
      const ids = idsOf(body);
      await records.delete(moduleOf(input), ids);
      return ok(encodeWriteResult(ids, "record is deleted"));
    },
  },
  massUpdate: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/mass_update",
    async run({ records }, input) {
      const module = moduleOf(input);
      const body = object(await bodyOf(input), "data");
      const ids = idsOf(body);
      if (!Array.isArray(body.data) || body.data.length !== 1)
        invalid("data", "Send exactly one record.");
      const metadata = await records.getModule(module);
      await records.massUpdate(module, ids, decodeInput(body.data[0], metadata));
      return ok(encodeWriteResult(ids, "record updated"));
    },
  },
  changeOwner: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/change_owner",
    async run({ records }, input) {
      const body = object(await bodyOf(input), "ids");
      const ids = idsOf(body);
      const owner = object(body.owner, "Owner");
      referenceKeys(owner, ["id", "name", "email"], "Owner");
      if (typeof owner.id !== "string") invalid("Owner");
      await records.changeOwner(moduleOf(input), ids, owner.id);
      return ok(encodeWriteResult(ids, "owner is successfully updated"));
    },
  },
  ...kanbanViewOperations,
} satisfies Record<string, Operation>;

export function operationPath(
  operation: Pick<Operation, "path">,
  params: Record<string, string> = {},
): string {
  return operation.path.replace(/\{([^}]+)\}/g, (_match, key: string) =>
    encodeURIComponent(params[key] || invalid(key)),
  );
}
