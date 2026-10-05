import type { OrgContext } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { decodeError, encodeError } from "@/lib/api/wire/errors";
import type { Operation, OperationDeps } from "@/lib/api/wire/operations";
import { operationPath, operations } from "@/lib/api/wire/operations";
import type { ApiFetchOptions } from "./fetch";
import { createHttpRecordService } from "./http-record-service";

type RecordedRequest = {
  method: string;
  pathname: string;
  queryKeys: readonly string[];
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
    members: [{ userId: ctx.userId, name: "Request User", email: "req@example.test" }],
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
    const bulkCalls = log.filter((entry) => entry.pathname.includes("/bulk"));
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
    const countCalls = log.filter((entry) => entry.pathname.includes("/actions/count"));
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
    const createCall = log.find(
      (entry) => entry.method === "POST" && !entry.pathname.includes("/bulk"),
    );
    if (!createCall) throw new Error("Expected create request.");
    expectQueryKeys(createCall, []);

    log.length = 0;
    await service.update(module, recordId, { Last_Name: "Updated" });
    const updateCall = log.find((entry) => entry.method === "PUT");
    if (!updateCall) throw new Error("Expected update request.");
    expectQueryKeys(updateCall, []);

    log.length = 0;
    await service.delete(module, [recordId]);
    const deleteCall = log.find((entry) => entry.method === "DELETE");
    if (!deleteCall) throw new Error("Expected delete request.");
    expectQueryKeys(deleteCall, ["ids"]);

    log.length = 0;
    await service.listUsers();
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.users, {});
    expectQueryKeys(logEntry(log, 0), ["page", "per_page", "type"]);
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
    const bulkRequests = log.filter((entry) => entry.pathname.endsWith("/bulk"));
    expect(metadataRequests).toHaveLength(3);
    expect(bulkRequests).toHaveLength(2);

    log.length = 0;
    await service.create(module, { Last_Name: "Count", Company: "Count Co" });
    expect(log.filter((entry) => metadataPaths.has(entry.pathname))).toHaveLength(0);
    expect(
      log.filter((entry) => entry.method === "POST" && entry.pathname.endsWith(`/${module}`)),
    ).toHaveLength(1);
    expect(
      log.filter((entry) => entry.method === "GET" && entry.pathname.includes(`/${module}/`)),
    ).toHaveLength(1);

    log.length = 0;
    await service.listViewSummaries(module);
    expect(log).toHaveLength(1);
    expectPath(logEntry(log, 0), operations.views, { module });
  });
});
