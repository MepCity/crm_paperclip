import { ValidationError } from "@crm/core/errors";
import type { Criteria, OrgContext } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it, vi } from "vitest";
import { decodeError, encodeError } from "@/lib/api/wire/errors";
import type { Operation, OperationDeps } from "@/lib/api/wire/operations";
import { operationPath, operations } from "@/lib/api/wire/operations";
import type { ApiFetchOptions } from "./fetch";
import { createHttpRecordService } from "./http-record-service";

type RecordedRequest = {
  method: string;
  pathname: string;
  queryKeys: readonly string[];
  body?: unknown;
};

function resolveOperation(
  method: string,
  pathname: string,
): { op: Operation; params: Record<string, string> } | null {
  for (const op of Object.values(operations)) {
    if (op.method !== method) continue;
    const keys = [...op.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
    const pattern = `^${op.path.replace(/\{[^}]+\}/g, "([^/]+)")}$`;
    const match = new RegExp(pattern).exec(pathname);
    if (!match) continue;
    const params: Record<string, string> = {};
    for (const [index, key] of keys.entries()) {
      if (!key) continue;
      const value = match[index + 1];
      if (!value) throw new Error(`Missing path parameter: ${key}`);
      params[key] = value;
    }
    return { op, params };
  }
  return null;
}

function createOperationFetch(deps: OperationDeps): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const resolved = resolveOperation(request.method, new URL(request.url).pathname);
    if (!resolved) return new Response("Not found", { status: 404 });
    const query: Record<string, string> = {};
    new URL(request.url).searchParams.forEach((value, key) => {
      query[key] = value;
    });
    const text = await request.text();
    const body = text ? JSON.parse(text) : undefined;
    try {
      const result = await resolved.op.run(deps, {
        params: resolved.params,
        query,
        body,
      });
      if (result.status === 204) return new Response(null, { status: 204 });
      return new Response(JSON.stringify(result.body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const encoded = encodeError(error);
      return new Response(JSON.stringify(encoded.body), {
        status: encoded.status,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

async function operationApiFetch(
  deps: OperationDeps,
  path: string,
  options: ApiFetchOptions = {},
): Promise<unknown> {
  const response = await createOperationFetch(deps)(`http://test.local${path}`, {
    method: options.method,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    signal: options.signal,
  });
  if (response.status === 204) return null;
  const parsed: unknown = JSON.parse(await response.text());
  if (response.ok) return parsed;
  throw decodeError(response.status, parsed);
}

const ctx: OrgContext = {
  orgId: "req-org",
  orgSlug: "req-org",
  orgName: "Request Org",
  userId: "req-user",
  role: "admin",
};

function deps(): OperationDeps {
  return {
    records: createFixtureRecordService(ctx),
    members: async () => [{ userId: ctx.userId, name: "Request User", email: "req@example.test" }],
  };
}

function createTrackedService(onRequest: (entry: RecordedRequest) => void) {
  const operationDeps = deps();
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => {
      const url = new URL(path, "http://test.local");
      onRequest({
        method: requestOptions?.method ?? "GET",
        pathname: url.pathname,
        queryKeys: [...url.searchParams.keys()].sort(),
        body: requestOptions?.body,
      });
      return operationApiFetch(operationDeps, path, requestOptions);
    },
  });
}

function expectPath(
  entry: RecordedRequest,
  operation: Operation,
  params: Record<string, string>,
): void {
  expect(entry.method).toBe(operation.method);
  expect(entry.pathname).toBe(operationPath(operation, params));
}

function expectQueryKeys(entry: RecordedRequest, expected: readonly string[]): void {
  expect(entry.queryKeys).toEqual([...expected].sort());
}

function logEntry(log: readonly RecordedRequest[], index: number): RecordedRequest {
  const entry = log[index];
  if (!entry) throw new Error(`Expected request at index ${index}.`);
  return entry;
}

function entriesForOperation(
  log: readonly RecordedRequest[],
  operation: Operation,
  params: Record<string, string>,
): RecordedRequest[] {
  const path = operationPath(operation, params);
  return log.filter((entry) => entry.method === operation.method && entry.pathname === path);
}

function entriesMatchingOperation(
  log: readonly RecordedRequest[],
  operation: Operation,
): RecordedRequest[] {
  return log.filter((entry) => resolveOperation(entry.method, entry.pathname)?.op === operation);
}

function onRequestLogged(log: RecordedRequest[], url: URL, requestOptions?: ApiFetchOptions): void {
  log.push({
    method: requestOptions?.method ?? "GET",
    pathname: url.pathname,
    queryKeys: [...url.searchParams.keys()].sort(),
    body: requestOptions?.body,
  });
}

describe("http record service requests", () => {
  it("matches ADR query names per port call", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const module = "Leads";

    log.length = 0;
    await service.getModule(module);
    expect(log).toHaveLength(3);
    expectPath(logEntry(log, 0), operations.module, { module });
    expectQueryKeys(logEntry(log, 0), []);
    expectPath(logEntry(log, 1), operations.fields, { module });
    expectQueryKeys(logEntry(log, 1), ["module"]);
    expectPath(logEntry(log, 2), operations.layouts, { module });
    expectQueryKeys(logEntry(log, 2), ["module"]);

    log.length = 0;
    const summaries = await service.listViewSummaries(module);
    expect(summaries.length).toBeGreaterThan(0);
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.views, { module });
    expectQueryKeys(logEntry(log, 0), ["module", "page", "per_page"]);

    const defaultSummary = summaries.find((view) => view.isDefault) ?? summaries[0];
    if (!defaultSummary) throw new Error("Missing view summary.");
    const viewId = defaultSummary.id;
    log.length = 0;
    await service.getView(module, viewId);
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.view, { module, viewId });
    expectQueryKeys(logEntry(log, 0), ["module"]);

    log.length = 0;
    await service.list(module, {
      viewId,
      page: 1,
      perPage: 10,
      sort: { field: "Last_Name", order: "asc" },
      fields: ["Last_Name", "Company"],
    });
    const bulkCalls = entriesForOperation(log, operations.bulk, { module });
    expect(bulkCalls).toHaveLength(1);
    expectQueryKeys(logEntry(bulkCalls, 0), [
      "cvid",
      "fields",
      "page",
      "per_page",
      "sort_by",
      "sort_order",
    ]);

    log.length = 0;
    await service.count(module, { viewId });
    const countCalls = entriesForOperation(log, operations.count, { module });
    expect(countCalls).toHaveLength(1);
    expectQueryKeys(logEntry(countCalls, 0), ["cvid"]);

    const records = await service.list(module, {
      viewId,
      page: 1,
      perPage: 10,
      fields: ["Last_Name", "Company"],
    });
    const recordId = records.records[0]?.id;
    if (!recordId) throw new Error("Missing fixture record.");

    log.length = 0;
    await service.get(module, recordId);
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.record, { module, recordId });
    expectQueryKeys(logEntry(log, 0), []);

    log.length = 0;
    await service.create(module, { Last_Name: "Wire", Company: "Wire Co" });
    const createCalls = entriesForOperation(log, operations.create, { module });
    expect(createCalls).toHaveLength(1);
    expectQueryKeys(logEntry(createCalls, 0), []);

    log.length = 0;
    await service.update(module, recordId, { Last_Name: "Updated" });
    const updateCalls = entriesForOperation(log, operations.update, { module, recordId });
    expect(updateCalls).toHaveLength(1);
    expectQueryKeys(logEntry(updateCalls, 0), []);

    log.length = 0;
    await service.delete(module, [recordId]);
    const deleteCalls = entriesForOperation(log, operations.delete, { module, recordId });
    expect(deleteCalls).toHaveLength(1);
    expectQueryKeys(logEntry(deleteCalls, 0), []);

    log.length = 0;
    await service.listUsers();
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.users, {});
    expectQueryKeys(logEntry(log, 0), ["page", "per_page", "type"]);
  });

  it("sends exact documented write methods, paths and bodies", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const module = "Leads";
    await service.getModule(module);
    log.length = 0;
    const created = await service.create(module, { Company: "Payload Test", Last_Name: "Example" });
    expect(log[0]).toEqual({
      method: "POST",
      pathname: "/crm/v2.2/Leads",
      queryKeys: [],
      body: { data: [{ Company: "Payload Test", Last_Name: "Example" }] },
    });
    expect(log[1]?.pathname).toBe(`/crm/v2.2/Leads/${created.id}`);
    log.length = 0;
    await service.update(module, created.id, { Phone: "123" });
    expect(log[0]).toEqual({
      method: "PUT",
      pathname: `/crm/v2.2/Leads/${created.id}`,
      queryKeys: [],
      body: { data: [{ Phone: "123" }] },
    });
    expect(log[1]?.pathname).toBe(`/crm/v2.2/Leads/${created.id}`);
    const other = await service.create(module, { Company: "Payload Test", Last_Name: "Other" });
    const ids = [other.id, created.id];
    for (const [action, body, run] of [
      [
        "mass_update",
        { data: [{ Company: "Batch" }], ids },
        () => service.massUpdate(module, ids, { Company: "Batch" }),
      ],
      [
        "change_owner",
        { ids, owner: { id: ctx.userId } },
        () => service.changeOwner(module, ids, ctx.userId),
      ],
      [
        "change_owner",
        { ids: [created.id], owner: { id: ctx.userId } },
        () => service.changeOwner(module, [created.id], ctx.userId),
      ],
      ["mass_delete", { ids }, () => service.delete(module, ids)],
    ] as const) {
      log.length = 0;
      await run();
      expect(log).toEqual([
        { method: "POST", pathname: `/crm/v2.2/Leads/actions/${action}`, queryKeys: [], body },
      ]);
    }
    const single = await service.create(module, { Company: "Payload Test", Last_Name: "Single" });
    log.length = 0;
    await service.delete(module, [single.id]);
    expect(log).toEqual([
      {
        method: "DELETE",
        pathname: `/crm/v2.2/Leads/${single.id}`,
        queryKeys: [],
        body: undefined,
      },
    ]);
  });

  it("sends panel filters in exact POST bulk and count JSON bodies", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const view = (await service.listViews("Leads")).find((view) => view.isDefault);
    if (!view) throw new Error("Missing default view.");
    const filters: Criteria = {
      groupOperator: "and",
      group: [
        { field: "Annual_Revenue", comparator: "between", value: [10, 20] },
        {
          groupOperator: "and",
          group: [
            {
              field: "Created_Time",
              comparator: "equal",
              value: { token: "PERIOD", name: "THIS_WEEK" },
            },
            {
              field: "Created_Time",
              comparator: "less_equal",
              value: { token: "DUEINDAYS", offset: 3 },
            },
          ],
        },
      ],
    };
    const body = {
      filters: {
        group_operator: "AND",
        group: [
          { field: { api_name: "Annual_Revenue" }, comparator: "between", value: [10, 20] },
          {
            group_operator: "AND",
            group: [
              {
                field: { api_name: "Created_Time" },
                comparator: "equal",
                value: `\${PERIOD.THIS_WEEK}`,
              },
              {
                field: { api_name: "Created_Time" },
                comparator: "less_equal",
                value: `\${DUEINDAYS}+3`,
              },
            ],
          },
        ],
      },
    };
    log.length = 0;
    await service.list("Leads", { viewId: view.id, page: 1, perPage: 10, filters });
    expect(entriesForOperation(log, operations.bulk, { module: "Leads" })).toEqual([
      {
        method: "POST",
        pathname: "/crm/v2.2/Leads/bulk",
        queryKeys: ["cvid", "fields", "page", "per_page"],
        body,
      },
    ]);
    log.length = 0;
    await service.count("Leads", { viewId: view.id, filters });
    expect(log).toEqual([
      { method: "POST", pathname: "/crm/v2.2/Leads/actions/count", queryKeys: ["cvid"], body },
    ]);
  });

  it("sends bulk paging query names without sort when sort is omitted", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const module = "Leads";
    const summaries = await service.listViewSummaries(module);
    const defaultSummary = summaries.find((view) => view.isDefault) ?? summaries[0];
    if (!defaultSummary) throw new Error("Missing view summary.");
    const viewId = defaultSummary.id;

    log.length = 0;
    await service.list(module, { viewId, page: 1, perPage: 10 });
    const bulkCalls = entriesForOperation(log, operations.bulk, { module });
    expect(bulkCalls).toHaveLength(1);
    expectQueryKeys(logEntry(bulkCalls, 0), ["cvid", "fields", "page", "per_page"]);
  });

  it("loads module metadata once and keeps create to one write and one read", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const module = "Leads";
    const summaries = await service.listViewSummaries(module);
    const defaultSummary = summaries.find((view) => view.isDefault) ?? summaries[0];
    if (!defaultSummary) throw new Error("Missing view summary.");
    const viewId = defaultSummary.id;

    log.length = 0;
    await service.list(module, { viewId, page: 1, perPage: 10 });
    await service.list(module, { viewId, page: 2, perPage: 10 });

    const metadataPaths = new Set([
      operationPath(operations.module, { module }),
      operationPath(operations.fields, { module }),
      operationPath(operations.layouts, { module }),
    ]);
    const metadataRequests = log.filter((entry) => metadataPaths.has(entry.pathname));
    const bulkRequests = entriesForOperation(log, operations.bulk, { module });
    expect(metadataRequests).toHaveLength(3);
    expect(bulkRequests).toHaveLength(2);

    log.length = 0;
    await service.create(module, { Last_Name: "Count", Company: "Count Co" });
    expect(log.filter((entry) => metadataPaths.has(entry.pathname))).toHaveLength(0);
    expect(entriesForOperation(log, operations.create, { module })).toHaveLength(1);
    expect(entriesMatchingOperation(log, operations.record)).toHaveLength(1);

    log.length = 0;
    await service.listViewSummaries(module);
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.views, { module });
  });

  it("shares one module metadata load across concurrent port calls", async () => {
    const log: RecordedRequest[] = [];
    const probe = createTrackedService((entry) => log.push(entry));
    const module = "Leads";
    const summaries = await probe.listViewSummaries(module);
    const defaultSummary = summaries.find((view) => view.isDefault) ?? summaries[0];
    if (!defaultSummary) throw new Error("Missing view summary.");
    const viewId = defaultSummary.id;
    const seeded = await probe.list(module, { viewId, page: 1, perPage: 10 });
    const recordId = seeded.records[0]?.id;
    if (!recordId) throw new Error("Missing fixture record.");

    log.length = 0;
    const service = createTrackedService((entry) => log.push(entry));
    await Promise.all([
      service.getModule(module),
      service.list(module, { viewId, page: 1, perPage: 10, fields: ["Last_Name"] }),
      service.get(module, recordId),
    ]);

    expect(entriesForOperation(log, operations.module, { module })).toHaveLength(1);
    expect(entriesForOperation(log, operations.fields, { module })).toHaveLength(1);
    expect(entriesForOperation(log, operations.layouts, { module })).toHaveLength(1);
  });

  it("does not cache module metadata after a failed load", async () => {
    const log: RecordedRequest[] = [];
    const module = "Leads";
    const operationDeps = deps();
    const fieldsPath = operationPath(operations.fields, { module });
    let rejectFieldsOnce = true;

    const service = createHttpRecordService({
      orgSlug: ctx.orgSlug,
      fetch: (path, requestOptions) => {
        const url = new URL(path, "http://test.local");
        onRequestLogged(log, url, requestOptions);
        if (rejectFieldsOnce && url.pathname === fieldsPath) {
          rejectFieldsOnce = false;
          return Promise.reject(new Error("network"));
        }
        return operationApiFetch(operationDeps, path, requestOptions);
      },
    });

    await expect(service.getModule(module)).rejects.toThrow("network");
    log.length = 0;
    await service.getModule(module);
    expect(entriesForOperation(log, operations.module, { module })).toHaveLength(1);
    expect(entriesForOperation(log, operations.fields, { module })).toHaveLength(1);
    expect(entriesForOperation(log, operations.layouts, { module })).toHaveLength(1);
  });

  it("loads an empty page without view fetch when sort is provided", async () => {
    const log: RecordedRequest[] = [];
    const service = createTrackedService((entry) => log.push(entry));
    const module = "Leads";
    const summaries = await service.listViewSummaries(module);
    const defaultSummary = summaries.find((view) => view.isDefault) ?? summaries[0];
    if (!defaultSummary) throw new Error("Missing view summary.");
    const viewId = defaultSummary.id;
    await service.getModule(module);

    const sort = { field: "Last_Name", order: "asc" as const };
    log.length = 0;
    const withSort = await service.list(module, {
      viewId,
      page: 1000,
      perPage: 10,
      sort,
    });
    expect(entriesForOperation(log, operations.bulk, { module })).toHaveLength(1);
    expect(entriesMatchingOperation(log, operations.view)).toHaveLength(0);
    expect(withSort.records).toEqual([]);
    expect(withSort.sort).toEqual(sort);

    log.length = 0;
    await service.list(module, { viewId, page: 1000, perPage: 10 });
    expect(entriesForOperation(log, operations.bulk, { module })).toHaveLength(1);
    expect(entriesMatchingOperation(log, operations.view)).toHaveLength(1);
  });

  it("listViewSummaries matches fixture view flags", async () => {
    const service = createTrackedService(() => {});
    const module = "Leads";
    const fixtureViews = await deps().records.listViews(module);
    const expected = fixtureViews.map((view) => ({
      id: view.id,
      name: view.name,
      systemDefined: view.systemDefined,
      isDefault: view.isDefault,
    }));
    await expect(service.listViewSummaries(module)).resolves.toEqual(expected);
  });
});

it("requests home currency by GET without module metadata or query parameters", async () => {
  const fetch = vi.fn().mockResolvedValue({
    currencies: [
      { symbol: "TL", iso_code: "TRY", name: "Turkish Lira - TRY", prefix_symbol: true },
    ],
  });
  const service = createHttpRecordService({ orgSlug: "currency-test", fetch });
  expect(await service.getHomeCurrency()).toEqual({
    isoCode: "TRY",
    symbol: "TL",
    name: "Turkish Lira - TRY",
    prefixSymbol: true,
  });
  expect(fetch).toHaveBeenCalledExactlyOnceWith("/crm/v2.2/org/currencies", { method: "GET" });
});

it("reports a missing or malformed currencies list as a validation error", async () => {
  for (const body of [null, {}, { currencies: null }, { currencies: "TL" }]) {
    const fetch = vi.fn().mockResolvedValue(body);
    const service = createHttpRecordService({ orgSlug: "currency-test", fetch });
    const error = await service.getHomeCurrency().catch((cause: unknown) => cause);
    expect(error, JSON.stringify(body)).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({ currencies: ["Invalid value."] });
  }
});
