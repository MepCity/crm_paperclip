import type { OrgContext } from "@crm/core/records";
import { describeRecordServiceContract } from "@crm/core/records/contract-suite";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { decodeError, encodeError } from "@/lib/api/wire/errors";
import type { Operation, OperationDeps } from "@/lib/api/wire/operations";
import { operations } from "@/lib/api/wire/operations";
import type { ApiFetchOptions } from "./fetch";
import { createHttpRecordService } from "./http-record-service";

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

function operationDeps(ctx: OrgContext, options?: { now?: () => Date }): OperationDeps {
  return {
    records: createFixtureRecordService(ctx, options),
    members: [
      {
        userId: ctx.userId,
        name: "Contract User",
        email: "contract@example.test",
      },
    ],
  };
}

describeRecordServiceContract("http", (ctx: OrgContext, options) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
  });
});
