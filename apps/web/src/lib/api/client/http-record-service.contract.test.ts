import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "@crm/core/errors";
import type { OrgContext } from "@crm/core/records";
import { describeCampaignMembershipContract } from "@crm/core/records/campaign-contract-suite";
import {
  describeActivityReadContract,
  describeNotesContract,
  describeRecordServiceContract,
} from "@crm/core/records/contract-suite";
import * as systemDefinitions from "@crm/core/records/contract-suite-module";
import {
  campaignsRecordServiceContractModule,
  eventsRecordServiceContractModule,
  leadsRecordServiceContractModule,
  tasksRecordServiceContractModule,
} from "@crm/core/records/contract-suite-module";
import { describeDiscoveryContract } from "@crm/core/records/discovery-contract-suite";
import {
  createFixtureRecordService,
  type FixtureRecordServiceOptions,
} from "@crm/core/records/fixture";
import { describeKanbanViewContract } from "@crm/core/records/kanban-contract-suite";
import { describeSystemFiltersContract } from "@crm/core/records/system-filters-contract-suite";
import { describe, expect, it } from "vitest";
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
      return new Response(JSON.stringify(withMetadataRevision(result.body)), {
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

function operationDeps(ctx: OrgContext, options?: FixtureRecordServiceOptions): OperationDeps {
  return {
    records: createFixtureRecordService(ctx, options),
    members: async () => [
      {
        userId: ctx.userId,
        name: "Contract User",
        email: "contract@example.test",
      },
    ],
  };
}

describeRecordServiceContract(
  "http",
  (ctx: OrgContext, options) => {
    const deps = operationDeps(ctx, options);
    return createHttpRecordService({
      orgSlug: ctx.orgSlug,
      fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
    });
  },
  leadsRecordServiceContractModule,
);

describeDiscoveryContract("http", (ctx, options) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
  });
});

describeRecordServiceContract(
  "http Tasks",
  (ctx: OrgContext, options) => {
    const deps = operationDeps(ctx, options);
    return createHttpRecordService({
      orgSlug: ctx.orgSlug,
      fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
    });
  },
  tasksRecordServiceContractModule,
);

describeActivityReadContract("http", (ctx, options) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
  });
});

describeRecordServiceContract(
  "http Events",
  (ctx: OrgContext, options) => {
    const deps = operationDeps(ctx, options);
    return createHttpRecordService({
      orgSlug: ctx.orgSlug,
      fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
    });
  },
  eventsRecordServiceContractModule,
);

describe("Events HTTP participants and opaque reminders", () => {
  it("round trips field opt-ins, arbitrary arrays and CURRENTTIME through generic endpoints", async () => {
    const ctx: OrgContext = {
      orgId: randomUUID(),
      orgSlug: "http-events",
      orgName: "HTTP Events",
      userId: "http-event-member",
      role: "admin",
    };
    const deps = operationDeps(ctx, { now: () => new Date("2026-01-15T12:00:00.000Z") });
    const service = createHttpRecordService({
      orgSlug: ctx.orgSlug,
      fetch: (path, options) => operationApiFetch(deps, path, options),
    });
    const metadata = await service.getModule("Events");
    expect(metadata.fields.filter((f) => f.acceptsJsonArray).map((f) => f.apiName)).toEqual([
      "Remind_At",
      "Participants",
      "Tag",
      "Remind_Participants",
    ]);
    const arrays = {
      Remind_At: [{ arbitrary: [true, null, 2] }],
      Remind_Participants: [],
      Participants: [{ type: "email", id: null, name: "Guest", email: "guest@example.test" }],
    };
    const created = await service.create(
      "Events",
      eventsRecordServiceContractModule.buildMinimalValidInput(arrays),
    );
    expect(created.fields).toMatchObject(arrays);
    expect((await service.get("Events", created.id)).fields).toMatchObject(arrays);
    expect(
      (
        await service.update("Events", created.id, {
          Participants: [{ type: "user", id: "member", name: "Member", email: null }],
          Remind_At: [],
        })
      ).fields,
    ).toMatchObject({
      Participants: [{ type: "user", id: "member", name: "Member", email: null }],
      Remind_At: [],
    });
    for (const invalid of [
      [null],
      [{}],
      [{ type: "email", id: null, name: "Guest", email: null }],
      Array.from({ length: 51 }, () => ({
        type: "email",
        id: null,
        name: "Guest",
        email: "guest@example.test",
      })),
    ]) {
      await expect(
        service.update("Events", created.id, { Participants: invalid }),
      ).rejects.toMatchObject({
        code: "validation",
        fieldErrors: { Participants: [expect.any(String)] },
      });
    }
    const filters = {
      field: "End_DateTime",
      comparator: "greater_equal",
      value: { token: "CURRENTTIME" },
    } as const;
    const list = await service.list("Events", {
      viewId: "all-meetings",
      page: 1,
      perPage: 100,
      filters,
    });
    expect(list.records.some((r) => r.id === created.id)).toBe(true);
    const views = await service.listViews("Events");
    expect(views.find((v) => v.id === "upcoming-meetings")?.criteria).toEqual(filters);
    await expect(service.update("Events", created.id, { Tag: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await service.delete("Events", [created.id]);
    await expect(service.get("Events", created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describeKanbanViewContract("http", (ctx, options) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
  });
});

const campaignHttpFactory = (ctx: OrgContext, options?: FixtureRecordServiceOptions) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, options) => operationApiFetch(deps, path, options),
  });
};
describeRecordServiceContract(
  "http Campaigns",
  campaignHttpFactory,
  campaignsRecordServiceContractModule,
);
describeCampaignMembershipContract("http", campaignHttpFactory);

describeNotesContract("http", (ctx, options) => {
  const deps = operationDeps(ctx, options);
  return createHttpRecordService({
    orgSlug: ctx.orgSlug,
    fetch: (path, requestOptions) => operationApiFetch(deps, path, requestOptions),
  });
});

for (const definition of Object.values(systemDefinitions)) {
  describeSystemFiltersContract(
    "http",
    (ctx, now) => {
      const deps = operationDeps(ctx, { now });
      return createHttpRecordService({
        orgSlug: ctx.orgSlug,
        fetch: (path, options) => operationApiFetch(deps, path, options),
      });
    },
    definition,
  );
}

// Slice B is delivered separately; operation fixtures supply its additive envelope key.
function withMetadataRevision(body: unknown): unknown {
  if (
    body &&
    typeof body === "object" &&
    ("modules" in body || "fields" in body || "layouts" in body)
  ) {
    return { revision: "fixture:1", ...body };
  }
  return body;
}
