import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as core from "@crm/core";
import { removeMember } from "@crm/core";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getRecordService } from "@/lib/records";
import { encodeInput, MAX_CRITERIA_GROUP_SIZE, MAX_CRITERIA_NODES } from "./codec";
import { type Operation, operationPath, operations } from "./operations";

const handlers = [
  [operations.search, () => import("@/app/crm/v2.2/actions/search/route")],
  [
    operations.duplicateGroups,
    () => import("@/app/crm/v2.2/[module]/actions/duplicate_groups/route"),
  ],
  [operations.merge, () => import("@/app/crm/v2.2/[module]/actions/merge/route")],
  [
    operations.convertLead,
    () => import("@/app/crm/v2.2/[module]/[recordId]/actions/convert/route"),
  ],
  [operations.deduplicate, () => import("@/app/crm/v2.2/[module]/actions/deduplicate/route")],
  [operations.currencies, () => import("@/app/crm/v2.2/org/currencies/route")],
  [operations.module, () => import("@/app/crm/v2.2/settings/modules/[module]/route")],
  [operations.fields, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.layouts, () => import("@/app/crm/v2.1/settings/layouts/route")],
  [operations.views, () => import("@/app/crm/v9/settings/custom_views/route")],
  [operations.view, () => import("@/app/crm/v9/settings/custom_views/[viewId]/route")],
  [operations.kanbanViews, () => import("@/app/crm/v9/settings/kanban_views/route")],
  [operations.createKanbanView, () => import("@/app/crm/v9/settings/kanban_views/route")],
  [operations.kanbanView, () => import("@/app/crm/v9/settings/kanban_views/[viewId]/route")],
  [operations.updateKanbanView, () => import("@/app/crm/v9/settings/kanban_views/[viewId]/route")],
  [operations.bulk, () => import("@/app/crm/v2.2/[module]/bulk/route")],
  [operations.summarize, () => import("@/app/crm/v2.2/[module]/actions/grouped_counts/route")],
  [operations.count, () => import("@/app/crm/v2.2/[module]/actions/count/route")],
  [operations.record, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.users, () => import("@/app/crm/v9/users/route")],
  [operations.create, () => import("@/app/crm/v2.2/[module]/route")],
  [operations.update, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.delete, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.massDelete, () => import("@/app/crm/v2.2/[module]/actions/mass_delete/route")],
  [operations.massUpdate, () => import("@/app/crm/v2.2/[module]/actions/mass_update/route")],
  [operations.changeOwner, () => import("@/app/crm/v2.2/[module]/actions/change_owner/route")],
] as const;
type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
const params = { module: "Leads", viewId: "all-leads", recordId: "missing" };
async function call(
  op: Operation,
  org?: Organization,
  options: {
    module?: string;
    recordId?: string;
    viewId?: string;
    query?: Record<string, string>;
    body?: unknown;
    origin?: string | null;
    orgHeader?: string | null;
  } = {},
) {
  const entry = handlers.find(([candidate]) => candidate === op);
  if (!entry) throw new Error("Missing handler");
  const route = await entry[1]();
  const handler = (
    route as unknown as Record<
      string,
      (request: Request, context: { params?: Promise<Record<string, string>> }) => Promise<Response>
    >
  )[op.method];
  if (!handler) throw new Error("Missing method");
  const moduleName = options.module ?? params.module;
  const boundParams = {
    ...params,
    module: moduleName,
    recordId: options.recordId ?? params.recordId,
    viewId: options.viewId ?? params.viewId,
  };
  const routeParams = Object.fromEntries(
    Object.entries(boundParams).filter(([key]) => op.path.includes(`{${key}}`)),
  );
  const url = new URL(operationPath(op, boundParams), origin);
  for (const [key, value] of Object.entries({
    module: moduleName,
    cvid: options.viewId ?? (moduleName === "Contacts" ? "all-contacts" : "all-leads"),
    ...(op === operations.summarize ? { group_by: "Lead_Status" } : {}),
    ...options.query,
  }))
    url.searchParams.set(key, value);
  const headers = new Headers();
  if (options.origin !== null) headers.set("Origin", options.origin ?? origin);
  if (org) {
    const cookie = org.admin.headers.get("cookie");
    if (!cookie) throw new Error("Missing test cookie");
    headers.set("cookie", cookie);
    if (options.orgHeader !== null) headers.set("X-CRM-ORG", options.orgHeader ?? org.org.slug);
  }
  return handler(
    new Request(url, {
      method: op.method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    }),
    Object.keys(routeParams).length ? { params: Promise.resolve(routeParams) } : {},
  );
}

// Root plus 20 child groups; leaves fill each group up to the sibling limit.
function criteriaTree(nodes: number) {
  let leaves = nodes - 21;
  return {
    group_operator: "AND",
    group: Array.from({ length: 20 }, () => {
      const size = Math.min(leaves, MAX_CRITERIA_GROUP_SIZE);
      leaves -= size;
      return {
        group_operator: "OR",
        group: Array.from({ length: size }, () => ({
          field: { api_name: "Converted__s" },
          comparator: "equal",
          value: false,
        })),
      };
    }),
  };
}

describe("operation routes", () => {
  it.each([operations.bulk, operations.count, operations.summarize])(
    "bounds criteria arrays and total nodes on $path",
    async (op) => {
      const values = Array.from({ length: MAX_CRITERIA_GROUP_SIZE }, () => "Synthetic Status");
      const leaf = { field: { api_name: "Lead_Status" }, comparator: "equal", value: values };
      for (const [accepted, rejected] of [
        [leaf, { ...leaf, value: [...values, "extra"] }],
        [criteriaTree(MAX_CRITERIA_NODES), criteriaTree(MAX_CRITERIA_NODES + 1)],
      ]) {
        const response = await call(op, a, { body: { filters: rejected } });
        expect(response.status).toBe(400);
        const error = await response.json();
        expect(Object.keys(error).sort()).toEqual(["code", "details", "message", "status"]);
        expect(error).toMatchObject({
          code: "INVALID_DATA",
          status: "error",
          details: { fields: { filters: expect.any(Array) } },
        });
        const boundary = await call(op, a, { body: { filters: accepted } });
        expect([200, 204]).toContain(boundary.status);
      }
    },
  );

  let a: Organization;
  let b: Organization;
  beforeAll(async () => {
    a = await createTestOrganization();
    b = await createTestOrganization();
  });
  it.each([operations.bulk, operations.count, operations.summarize])(
    "validates system filters through authenticated $path",
    async (op) => {
      const query = { group_by: "Lead_Status" };
      for (const system_filters of [
        { unknown: {} },
        { locked: { locked: "true" } },
        {
          touched: {
            actor_ids: ["foreign-user"],
            period: { from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z" },
          },
        },
        { record_action: { action: "created", period: { from: "invalid", to: "invalid" } } },
      ]) {
        const response = await call(op, a, { query, body: { system_filters } });
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          code: "INVALID_DATA",
          details: { fields: expect.any(Object) },
        });
      }
      const response = await call(op, a, {
        query,
        body: { system_filters: { locked: { locked: false } } },
      });
      expect([200, 204]).toContain(response.status);
    },
  );

  it("preserves requested activity summaries and validates filters on authenticated routes", async () => {
    const service = getRecordService(a.ctx);
    const lead = await service.create("Leads", {
      Last_Name: "Route Activity",
      Company: "Route Company",
    });
    const task = await service.create("Tasks", {
      Subject: "Route Task",
      Who_Id: { module: "Leads", id: lead.id },
    });
    const filters = { field: { api_name: "id" }, comparator: "equal", value: lead.id };
    const body = {
      filters,
      activity_filter: { choice: "without_open_activity" },
      include_activity_summary: true,
    };
    const empty = await call(operations.bulk, a, { body });
    expect(empty.status).toBe(200);
    expect(await empty.json()).toMatchObject({ data: [], activity_summaries: {} });
    const populated = await call(operations.bulk, a, {
      body: { filters, include_activity_summary: true },
    });
    expect(populated.status).toBe(200);
    expect(await populated.json()).toMatchObject({
      activity_summaries: { [lead.id]: { kind: "task", activity_id: task.id, date: null } },
    });
    for (const op of [operations.bulk, operations.count, operations.summarize]) {
      const response = await call(op, a, {
        query: { group_by: "Lead_Status" },
        body: { activity_filter: { choice: "activity_due", range: "invalid" } },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        details: { fields: { activityFilter: expect.any(Array) } },
      });
    }
  });
  it("authenticates the currency GET and returns exactly one configured currency", async () => {
    const anonymous = await call(operations.currencies);
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({
      code: "AUTHENTICATION_FAILURE",
      status: "error",
    });
    const response = await call(operations.currencies, a);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      currencies: [
        { symbol: "TL", iso_code: "TRY", name: "Turkish Lira - TRY", prefix_symbol: true },
      ],
    });
  });
  it("has a thin, force-dynamic wrapped route for every operation", () => {
    expect(handlers).toHaveLength(Object.keys(operations).length);
    for (const [name, op] of Object.entries(operations)) {
      const file = resolve(
        "apps/web/src/app",
        op.path.replace(/^\//, "").replace(/\{([^}]+)\}/g, "[$1]"),
        "route.ts",
      );
      const source = readFileSync(file, "utf8");
      expect(source).toContain(`export const ${op.method} = operationRoute(operations.${name});`);
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).toContain("@/lib/api/operation-route");
      expect(source).not.toMatch(/listMembers|getRecordService|@crm\/core/);
      expect(source).not.toMatch(/request\.json|X-CRM-ORG|\.list\(|\.create\(|\.count\(|\/crm\/v/);
    }
  });
  it.each([operations.module, operations.fields, operations.count])(
    "does not load members for $path",
    async (op) => {
      const members = vi.spyOn(core, "listMembers");
      try {
        const response = await call(op, a);
        expect(response.status).toBe(200);
        expect(members).not.toHaveBeenCalled();
      } finally {
        members.mockRestore();
      }
    },
  );
  it.each([operations.bulk, operations.users, operations.record])(
    "loads members once for $path",
    async (op) => {
      const record = (
        await getRecordService(a.ctx).list("Leads", {
          viewId: "all-leads",
          page: 1,
          perPage: 20,
        })
      ).records[0];
      if (!record) throw new Error("Missing fixture record");
      const members = vi.spyOn(core, "listMembers");
      try {
        const response = await call(op, a, { recordId: record.id });
        expect(response.status).toBe(200);
        expect(members).toHaveBeenCalledExactlyOnceWith(a.ctx);
      } finally {
        members.mockRestore();
      }
    },
  );
  it("does not load members for an empty bulk page or a missing record", async () => {
    const members = vi.spyOn(core, "listMembers");
    try {
      const empty = await call(operations.bulk, a, {
        body: { search: "No_Record_Can_Match_This" },
      });
      expect(empty.status).toBe(204);
      expect(await empty.text()).toBe("");
      expect((await call(operations.record, a)).status).toBe(404);
      expect(members).not.toHaveBeenCalled();
    } finally {
      members.mockRestore();
    }
  });
  it("checks Owner against actual tenant membership on create and update routes", async () => {
    const member = await addTestMember(a.ctx, "member");
    const service = getRecordService(a.ctx);
    const metadata = await service.getModule("Leads");
    const body = (fields: Parameters<typeof encodeInput>[0]) => ({
      data: [encodeInput(fields, metadata)],
    });
    const response = await call(operations.create, a, {
      body: body({ Last_Name: "Owner Test", Company: "Synthetic Status", Owner: member.user.id }),
    });
    expect(response.status).toBe(200);
    const id = (await response.json()).data[0].details.id as string;
    expect((await service.get("Leads", id)).fields).toMatchObject({
      Owner: member.user.id,
      Created_By: a.ctx.userId,
    });
    const updated = await call(operations.update, a, {
      recordId: id,
      body: body({ Owner: a.ctx.userId }),
    });
    expect(updated.status).toBe(200);
    expect((await service.get("Leads", id)).fields.Owner).toBe(a.ctx.userId);
    // Opening an authorized fixture context must not override the live membership source.
    getRecordService(member.ctx);
    await removeMember(a.ctx, { userId: member.user.id });
    for (const Owner of [member.user.id, b.ctx.userId]) {
      for (const [op, fields] of [
        [operations.create, { Last_Name: "Owner Test", Company: "Synthetic Status", Owner }],
        [operations.update, { Owner, Company: "Rejected Change" }],
      ] as const) {
        const rejected = await call(op, a, { recordId: id, body: body(fields) });
        expect(rejected.status).toBe(400);
        expect(await rejected.json()).toMatchObject({
          details: { fields: { Owner: expect.any(Array) } },
        });
      }
    }
    expect((await service.get("Leads", id)).fields).toMatchObject({
      Owner: a.ctx.userId,
      Company: "Synthetic Status",
    });
  });
  it("serves discovery handlers through organization and origin checks", async () => {
    const service = getRecordService(a.ctx);
    const master = await service.create("Contacts", { Last_Name: "Route Discovery Marker" });
    const duplicate = await service.create("Contacts", { Last_Name: "Route Discovery Marker" });
    const query = { text: "route discovery marker", modules: ["Contacts"] };
    for (const op of [
      operations.search,
      operations.duplicateGroups,
      operations.merge,
      operations.deduplicate,
    ]) {
      expect((await call(op, a, { origin: "http://foreign.example" })).status).toBe(403);
      expect((await call(op, a, { orgHeader: b.org.slug })).status).toBe(404);
    }
    const found = await call(operations.search, a, { body: query });
    expect(found.status).toBe(200);
    expect(await found.json()).toMatchObject([{ module: "Contacts", total: 2 }]);
    const hidden = await call(operations.search, b, { body: query });
    expect(hidden.status).toBe(200);
    expect(await hidden.json()).toEqual([]);
    const groups = await call(operations.duplicateGroups, a, {
      module: "Contacts",
      body: { fields: ["Last_Name"] },
    });
    expect(groups.status).toBe(200);
    expect(await groups.json()).toMatchObject([
      { records: [{ id: master.id }, { id: duplicate.id }], conflictFields: [] },
    ]);
    const merged = await call(operations.merge, a, {
      module: "Contacts",
      body: { masterId: master.id, duplicateIds: [duplicate.id], values: {} },
    });
    expect(merged.status).toBe(200);
    expect(await merged.json()).toMatchObject({ id: master.id });
    expect(
      (await call(operations.record, a, { module: "Contacts", recordId: duplicate.id })).status,
    ).toBe(404);
    const deduplicated = await call(operations.deduplicate, a, {
      module: "Contacts",
      body: { fields: ["Last_Name"] },
    });
    expect(deduplicated.status).toBe(200);
    expect(await deduplicated.json()).toEqual({
      mergedGroups: 0,
      removedRecords: 0,
      conflicts: [],
    });
  });
  it("passes every operation through session authentication", async () => {
    for (const [op] of handlers) {
      const response = await call(op);
      expect(response.status, `${op.method} ${op.path}`).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toMatchObject({ code: "AUTHENTICATION_FAILURE" });
    }
  });
  it("serves every authenticated read handler with its envelope", async () => {
    const created = await getRecordService(a.ctx).create("Leads", {
      Last_Name: "Handler Example",
      Company: "Handler Company",
    });
    for (const [op] of handlers.filter(
      ([op]) =>
        ![
          operations.search,
          operations.duplicateGroups,
          operations.merge,
          operations.convertLead,
          operations.deduplicate,
          operations.create,
          operations.update,
          operations.delete,
          operations.massDelete,
          operations.massUpdate,
          operations.changeOwner,
          operations.createKanbanView,
          operations.updateKanbanView,
          operations.kanbanView,
          operations.kanbanViews,
        ].includes(op as typeof operations.create),
    )) {
      const response = await call(op, a, { recordId: created.id });
      expect(response.status, op.path).toBe(200);
      const body = await response.json();
      expect(typeof body).toBe("object");
      if (op === operations.record)
        expect(body.data[0]).toMatchObject({ id: created.id, Last_Name: "Handler Example" });
    }
  });
  it("converts a lead through the authenticated route and rejects bad requests", async () => {
    const lead = await getRecordService(a.ctx).create("Leads", {
      Last_Name: "Route Convert",
      Company: "Route Co",
    });
    const anonymous = await call(operations.convertLead, undefined, { recordId: lead.id });
    expect(anonymous.status).toBe(401);
    const invalid = await call(operations.convertLead, a, {
      recordId: lead.id,
      body: { account: { create: {} } },
    });
    expect(invalid.status).toBe(400);
    const response = await call(operations.convertLead, a, {
      recordId: lead.id,
      body: { contact: { create: {} } },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accountId: null, dealId: null });
    const again = await call(operations.convertLead, a, {
      recordId: lead.id,
      body: { contact: { create: {} } },
    });
    expect(again.status).toBe(400);
  });
  it("serves, creates and updates Kanban views through the routes", async () => {
    const list = await call(operations.kanbanViews, a, { module: "Deals" });
    expect(list.status).toBe(200);
    const seed = (await list.json()).kanban_views[0];
    expect(seed.name).toBe("STAGEVIEW");
    const { id: _id, created_by: _c, modified_by: _m, shared_to: _s, ...input } = seed;
    expect(seed.shared_to).toBe("everyone");
    const created = await call(operations.createKanbanView, a, {
      module: "Deals",
      body: { kanban_views: [{ ...input, name: "Route board" }] },
    });
    expect(created.status).toBe(200);
    const id = (await created.json()).kanban_views[0].id;
    const updated = await call(operations.updateKanbanView, a, {
      module: "Deals",
      viewId: id,
      body: { kanban_views: [{ ...input, name: "Route board 2" }] },
    });
    expect((await updated.json()).kanban_views[0].name).toBe("Route board 2");
    const read = await call(operations.kanbanView, a, { module: "Deals", viewId: id });
    expect((await read.json()).kanban_views[0].name).toBe("Route board 2");
  });
  it.each([
    { op: operations.fields, envelope: "fields" },
    { op: operations.layouts, envelope: "layouts" },
    { op: operations.views, envelope: "custom_views" },
    { op: operations.users, envelope: "users" },
  ] as const)("serves $envelope without context params", async ({ op, envelope }) => {
    const response = await call(op, a);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body[envelope].length).toBeGreaterThan(0);
    if (op === operations.fields)
      expect(body.fields).toContainEqual(
        expect.objectContaining({ api_name: "Company", field_label: "Company" }),
      );
    if (op === operations.layouts)
      expect(
        body.layouts[0].sections.flatMap((section: { fields: unknown[] }) => section.fields),
      ).toContainEqual(expect.objectContaining({ api_name: "Company" }));
    if (op === operations.views)
      expect(body.custom_views).toContainEqual(
        expect.objectContaining({ id: "all-leads", default: true }),
      );
    if (op === operations.users)
      expect(body.users).toContainEqual(
        expect.objectContaining({ id: a.ctx.userId, full_name: expect.any(String) }),
      );
  });
  it("serves observed token values and applied sort to an authenticated caller", async () => {
    const myView = await call(operations.view, a, { viewId: "my-leads" });
    expect(myView.status).toBe(200);
    expect((await myView.json()).custom_views[0].criteria).toEqual({
      group_operator: "AND",
      group: [
        { field: { api_name: "Owner" }, comparator: "equal", value: { name: `\${CURRENTUSER}` } },
        { field: { api_name: "Converted__s" }, comparator: "equal", value: false },
      ],
    });
    const recentView = await call(operations.view, a, { viewId: "recently-created-leads" });
    expect(recentView.status).toBe(200);
    expect((await recentView.json()).custom_views[0].criteria.group[1]).toEqual({
      field: { api_name: "Created_Time" },
      comparator: "less_equal",
      value: `\${AGEINDAYS}+31`,
    });
    for (const cvid of ["my-leads", "recently-created-leads"]) {
      for (const [sort, expected] of [
        [{}, { sort_by: "id", sort_order: "desc" }],
        [
          { sort_by: "Company", sort_order: "asc" },
          { sort_by: "Company", sort_order: "asc" },
        ],
      ] as [Record<string, string>, Record<string, string>][]) {
        const response = await call(operations.bulk, a, { query: { cvid, ...sort } });
        expect(response.status).toBe(200);
        expect((await response.json()).info).toMatchObject(expected);
      }
      const count = await call(operations.count, a, { query: { cvid } });
      expect(count.status).toBe(200);
      expect((await count.json()).count).toBeGreaterThan(0);
    }
  });
  it("rejects unknown reference keys on every reference write path", async () => {
    const service = getRecordService(a.ctx);
    const record = await service.create("Leads", { Company: "Wire Bounds", Last_Name: "Example" });
    for (const op of [
      operations.create,
      operations.update,
      operations.massUpdate,
      operations.changeOwner,
    ]) {
      const owner = { id: a.ctx.userId, unexpected: true };
      const response = await call(op, a, {
        recordId: record.id,
        body:
          op === operations.changeOwner
            ? { ids: [record.id], owner }
            : {
                ids: [record.id],
                data: [{ Company: "Wire Bounds", Last_Name: "Example", Owner: owner }],
              },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        code: "INVALID_DATA",
        status: "error",
        message: "Check the highlighted fields.",
        details: { fields: { Owner: ["Unknown reference key."] } },
      });
    }
  });
  it("retains search and group boundaries on bulk and count with the existing error envelope", async () => {
    const leaf = { field: { api_name: "Company" }, comparator: "equal", value: "Example" };
    const group = (size: number) => ({
      group_operator: "AND",
      group: Array.from({ length: size }, () => leaf),
    });
    for (const op of [operations.bulk, operations.count]) {
      for (const [body, key, message] of [
        [{ search: "x".repeat(2001) }, "search", "Send at most 2000 characters."],
        [{ filters: group(501) }, "filters", "Send at most 500 criteria per group."],
        [
          { filters: { group_operator: "OR", group: [group(501)] } },
          "filters",
          "Send at most 500 criteria per group.",
        ],
      ] as const) {
        const response = await call(op, a, { body });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
          code: "INVALID_DATA",
          status: "error",
          message: "Check the highlighted fields.",
          details: { fields: { [key]: [message] } },
        });
      }
      for (const body of [{ search: "x".repeat(2000) }, { filters: group(500) }, { search: "" }]) {
        expect((await call(op, a, { body })).status).toBe(
          op === operations.count || ("search" in body && body.search === "") ? 200 : 204,
        );
      }
    }
  });
  it("answers unknown comparators with a filters-keyed 400", async () => {
    for (const op of [operations.bulk, operations.count]) {
      const response = await call(op, a, {
        body: {
          filters: { field: { api_name: "Company" }, comparator: "unknown", value: "Example" },
        },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: "INVALID_DATA",
        status: "error",
        details: { fields: { filters: expect.any(Array) } },
      });
    }
  });
  it("enforces tenant isolation in list, count and single-record reads", async () => {
    const created = await getRecordService(a.ctx).create("Leads", {
      Last_Name: "Private Test Record",
      Company: "Private Test Company",
    });
    const filter = {
      filters: { field: { api_name: "id" }, comparator: "equal", value: created.id },
    };
    const listA = await call(operations.bulk, a, { body: filter });
    const listB = await call(operations.bulk, b, { body: filter });
    expect(listA.status).toBe(200);
    expect((await listA.json()).data.map((row: { id: string }) => row.id)).toEqual([created.id]);
    expect(listB.status).toBe(204);
    expect(await listB.text()).toBe("");
    expect(await (await call(operations.count, a, { body: filter })).json()).toEqual({ count: 1 });
    expect(await (await call(operations.count, b, { body: filter })).json()).toEqual({ count: 0 });
    expect((await call(operations.record, a, { recordId: created.id })).status).toBe(200);
    expect((await call(operations.record, b, { recordId: created.id })).status).toBe(404);
  });
  it("removes collection DELETE and its ids query route", async () => {
    const route = await import("@/app/crm/v2.2/[module]/route");
    expect(route).not.toHaveProperty("DELETE");
  });
  it.each([operations.massDelete, operations.massUpdate, operations.changeOwner])(
    "guards Origin and X-CRM-ORG for $path",
    async (op) => {
      for (const supplied of [null, "https://other.example"]) {
        const response = await call(op, a, { origin: supplied });
        expect(response.status).toBe(403);
        expect(await response.json()).toMatchObject({ code: "NO_PERMISSION", status: "error" });
      }
      const missing = await call(op, a, { orgHeader: null });
      expect(missing.status).toBe(400);
      expect(await missing.json()).toMatchObject({
        details: { fields: { organization: expect.any(Array) } },
      });
      expect((await call(op, a, { orgHeader: b.org.slug })).status).toBe(404);
    },
  );
  it("rejects locked targets with RECORD_LOCKED on every write route", async () => {
    const service = getRecordService(a.ctx);
    const locked = (
      await service.list("Leads", {
        viewId: "all-leads",
        page: 1,
        perPage: 10,
        filters: { field: "Locked__s", comparator: "equal", value: true },
      })
    ).records[0];
    if (!locked) throw new Error("Expected a locked seed lead.");
    const unlocked = await service.create("Leads", {
      Last_Name: "Unlocked",
      Company: "Synthetic Status",
    });
    const ids = [unlocked.id, locked.id];
    for (const [op, body] of [
      [operations.update, { data: [{ Company: "Rejected" }] }],
      [operations.delete, undefined],
      [operations.massUpdate, { ids, data: [{ Company: "Rejected" }] }],
      [operations.changeOwner, { ids, owner: { id: a.ctx.userId } }],
      [operations.massDelete, { ids }],
    ] as const) {
      const response = await call(op, a, { recordId: locked.id, body });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: "RECORD_LOCKED",
        status: "error",
        details: {},
      });
      expect(await service.get("Leads", locked.id)).toEqual(locked);
      expect(await service.get("Leads", unlocked.id)).toEqual(unlocked);
    }
  });

  it("serves ordered action results and rejects removed owners and foreign batch targets atomically", async () => {
    const service = getRecordService(a.ctx);
    const first = await service.create("Leads", { Company: "Action Example", Last_Name: "First" });
    const second = await service.create("Leads", {
      Company: "Action Example",
      Last_Name: "Second",
    });
    const ids = [second.id, first.id];
    const member = await addTestMember(a.ctx, "member");
    for (const [op, body, message] of [
      [operations.massUpdate, { ids, data: [{ Company: "Action Changed" }] }, "record updated"],
      [
        operations.changeOwner,
        { ids, owner: { id: member.user.id } },
        "owner is successfully updated",
      ],
    ] as const) {
      const response = await call(op, a, { body });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: ids.map((id) => ({ code: "SUCCESS", details: { id }, message, status: "success" })),
      });
    }
    await removeMember(a.ctx, { userId: member.user.id });
    const rejected = await call(operations.changeOwner, a, {
      body: { ids, owner: { id: member.user.id } },
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({
      code: "INVALID_DATA",
      details: { fields: { Owner: expect.any(Array) } },
    });
    const before = await service.get("Leads", first.id);
    let foreign = await getRecordService(b.ctx).create("Leads", {
      Company: "Foreign",
      Last_Name: "Record",
    });
    while (
      await service.get("Leads", foreign.id).then(
        () => true,
        () => false,
      )
    )
      foreign = await getRecordService(b.ctx).create("Leads", {
        Company: "Foreign",
        Last_Name: "Record",
      });
    for (const [op, body] of [
      [operations.massUpdate, { ids: [first.id, foreign.id], data: [{ Company: "Rejected" }] }],
      [operations.changeOwner, { ids: [first.id, foreign.id], owner: { id: a.ctx.userId } }],
      [operations.massDelete, { ids: [first.id, foreign.id] }],
    ] as const) {
      expect((await call(op, a, { body })).status).toBe(404);
      expect(await service.get("Leads", first.id)).toEqual(before);
    }
    const removed = await call(operations.massDelete, a, { body: { ids } });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({
      data: ids.map((id) => ({
        code: "SUCCESS",
        details: { id },
        message: "record is deleted",
        status: "success",
      })),
    });
  });
  it("runs create, update and delete handlers and retains field validation", async () => {
    const create = await call(operations.create, a, {
      body: { data: [{ Company: "Route CRUD", Last_Name: "Original" }] },
    });
    expect(create.status).toBe(200);
    const body = await create.json();
    const id = body.data[0].details.id;
    expect(body).toMatchObject({
      data: [{ code: "SUCCESS", details: { id }, message: "record added", status: "success" }],
    });
    const update = await call(operations.update, a, {
      recordId: id,
      body: { data: [{ Last_Name: "Updated" }] },
    });
    expect(await update.json()).toMatchObject({
      data: [{ code: "SUCCESS", details: { id }, message: "record updated", status: "success" }],
    });
    expect(
      (await (await call(operations.record, a, { recordId: id })).json()).data[0].Last_Name,
    ).toBe("Updated");
    const invalid = await call(operations.update, a, {
      recordId: id,
      body: { data: [{ Last_Name: null }] },
    });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      details: { fields: { Last_Name: expect.any(Array) } },
    });
    expect(await (await call(operations.delete, a, { recordId: id })).json()).toEqual({
      data: [{ code: "SUCCESS", details: { id }, message: "record deleted", status: "success" }],
    });
    expect((await call(operations.record, a, { recordId: id })).status).toBe(404);
  });
  it("runs Contacts create, list, read, update and delete handlers", async () => {
    const create = await call(operations.create, a, {
      module: "Contacts",
      body: { data: [{ Last_Name: "Route Contact" }] },
    });
    expect(create.status).toBe(200);
    const body = await create.json();
    const id = body.data[0].details.id;
    const list = await call(operations.bulk, a, {
      module: "Contacts",
      query: { cvid: "all-contacts" },
      body: {
        filters: { field: { api_name: "id" }, comparator: "equal", value: id },
      },
    });
    expect(list.status).toBe(200);
    expect((await list.json()).data.map((row: { id: string }) => row.id)).toEqual([id]);
    expect((await call(operations.record, a, { module: "Contacts", recordId: id })).status).toBe(
      200,
    );
    const update = await call(operations.update, a, {
      module: "Contacts",
      recordId: id,
      body: { data: [{ Last_Name: "Updated Contact" }] },
    });
    expect(update.status).toBe(200);
    expect(
      (await (await call(operations.record, a, { module: "Contacts", recordId: id })).json())
        .data[0].Last_Name,
    ).toBe("Updated Contact");
    expect((await call(operations.delete, a, { module: "Contacts", recordId: id })).status).toBe(
      200,
    );
    expect((await call(operations.record, a, { module: "Contacts", recordId: id })).status).toBe(
      404,
    );
  });
  it("runs Accounts create, list, read, update and delete handlers", async () => {
    const create = await call(operations.create, a, {
      module: "Accounts",
      body: { data: [{ Account_Name: "Route Account" }] },
    });
    expect(create.status).toBe(200);
    const body = await create.json();
    const id = body.data[0].details.id;
    const list = await call(operations.bulk, a, {
      module: "Accounts",
      query: { cvid: "all-accounts" },
      body: {
        filters: { field: { api_name: "id" }, comparator: "equal", value: id },
      },
    });
    expect(list.status).toBe(200);
    expect((await list.json()).data.map((row: { id: string }) => row.id)).toEqual([id]);
    expect((await call(operations.record, a, { module: "Accounts", recordId: id })).status).toBe(
      200,
    );
    const update = await call(operations.update, a, {
      module: "Accounts",
      recordId: id,
      body: { data: [{ Account_Name: "Updated Account" }] },
    });
    expect(update.status).toBe(200);
    expect(
      (await (await call(operations.record, a, { module: "Accounts", recordId: id })).json())
        .data[0].Account_Name,
    ).toBe("Updated Account");
    expect((await call(operations.delete, a, { module: "Accounts", recordId: id })).status).toBe(
      200,
    );
    expect((await call(operations.record, a, { module: "Accounts", recordId: id })).status).toBe(
      404,
    );
  });
  it("runs Tasks CRUD, JSON objects and module-qualified related queries through existing handlers", async () => {
    const reminder = { opaque: ["synthetic", null, 3, { enabled: true }] };
    const recurrence = { opaque: { nested: [false, 2] } };
    const ref = { module: "Leads", id: "100000000000000000" };
    const create = await call(operations.create, a, {
      module: "Tasks",
      body: {
        data: [
          {
            Subject: "Route Task",
            Who_Id: ref,
            Remind_At: reminder,
            Recurring_Activity: recurrence,
          },
        ],
      },
    });
    expect(create.status).toBe(200);
    const id = (await create.json()).data[0].details.id;
    const read = await call(operations.record, a, { module: "Tasks", recordId: id });
    expect(read.status).toBe(200);
    expect((await read.json()).data[0]).toMatchObject({
      Subject: "Route Task",
      Who_Id: { ...ref, name: "Sample 001 Lead 001" },
      Remind_At: reminder,
      Recurring_Activity: recurrence,
    });
    const list = await call(operations.bulk, a, {
      module: "Tasks",
      viewId: "all-tasks",
      body: { filters: { field: { api_name: "id" }, comparator: "equal", value: id } },
    });
    expect(list.status).toBe(200);
    expect((await list.json()).data.map((row: { id: string }) => row.id)).toEqual([id]);
    const update = await call(operations.update, a, {
      module: "Tasks",
      recordId: id,
      body: {
        data: [
          {
            Subject: "Updated Task",
            Remind_At: { replacement: true },
            What_Id: { module: "Vendors", id: "synthetic-vendor" },
          },
        ],
      },
    });
    expect(update.status).toBe(200);
    expect(
      (await (await call(operations.record, a, { module: "Tasks", recordId: id })).json()).data[0],
    ).toMatchObject({
      Subject: "Updated Task",
      Remind_At: { replacement: true },
      What_Id: { module: "Vendors", id: "synthetic-vendor" },
    });
    const related = await call(operations.count, a, {
      module: "Tasks",
      viewId: "all-tasks",
      body: { filters: { field: { api_name: "Who_Id" }, comparator: "equal", value: ref } },
    });
    expect(related.status).toBe(200);
    for (const data of [
      { Who_Id: { module: "Accounts", id: "500000000000000000" } },
      { Remind_At: [] },
      { Recurring_Activity: "text" },
    ]) {
      expect(
        (
          await call(operations.update, a, {
            module: "Tasks",
            recordId: id,
            body: { data: [data] },
          })
        ).status,
      ).toBe(400);
    }
    expect((await call(operations.delete, a, { module: "Tasks", recordId: id })).status).toBe(200);
    expect((await call(operations.record, a, { module: "Tasks", recordId: id })).status).toBe(404);
  });
  it("publishes Tasks multi-target metadata and all translated saved views", async () => {
    const settings = await call(operations.fields, a, { module: "Tasks" });
    expect(settings.status).toBe(200);
    const fields = (await settings.json()).fields;
    expect(fields).toHaveLength(20);
    expect(
      fields.find((field: { api_name: string }) => field.api_name === "Who_Id").lookup,
    ).toEqual({
      module: { api_name: "Contacts" },
      modules: [{ api_name: "Contacts" }, { api_name: "Leads" }],
    });
    const views = await call(operations.views, a, { module: "Tasks", viewId: "all-tasks" });
    expect(views.status).toBe(200);
    expect((await views.json()).custom_views).toHaveLength(17);
  });
  it("runs Deals create, list, read, update and delete handlers", async () => {
    const create = await call(operations.create, a, {
      module: "Deals",
      body: {
        data: [
          {
            Deal_Name: "Route Deal",
            Stage: "Qualification",
            Closing_Date: "2026-12-15",
            Account_Name: { id: "500000000000000000" },
          },
        ],
      },
    });
    expect(create.status).toBe(200);
    const body = await create.json();
    const id = body.data[0].details.id;
    const list = await call(operations.bulk, a, {
      module: "Deals",
      query: { cvid: "all-deals" },
      body: {
        filters: { field: { api_name: "id" }, comparator: "equal", value: id },
      },
    });
    expect(list.status).toBe(200);
    expect((await list.json()).data.map((row: { id: string }) => row.id)).toEqual([id]);
    expect((await call(operations.record, a, { module: "Deals", recordId: id })).status).toBe(200);
    const update = await call(operations.update, a, {
      module: "Deals",
      recordId: id,
      body: { data: [{ Deal_Name: "Updated Deal" }] },
    });
    expect(update.status).toBe(200);
    expect(
      (await (await call(operations.record, a, { module: "Deals", recordId: id })).json()).data[0]
        .Deal_Name,
    ).toBe("Updated Deal");
    expect((await call(operations.delete, a, { module: "Deals", recordId: id })).status).toBe(200);
    expect((await call(operations.record, a, { module: "Deals", recordId: id })).status).toBe(404);
  });
  it("serves Accounts module, fields, layouts and custom view settings", async () => {
    for (const op of [operations.module, operations.fields, operations.layouts, operations.views]) {
      const response = await call(op, a, { module: "Accounts", viewId: "all-accounts" });
      expect(response.status).toBe(200);
      const body = await response.json();
      if (op === operations.fields) expect(body.fields).toHaveLength(51);
      if (op === operations.views) expect(body.custom_views).toHaveLength(8);
      if (op === operations.layouts) expect(body.layouts[0].sections).toHaveLength(4);
      if (op === operations.module) expect(body.modules[0].api_name).toBe("Accounts");
    }
  });
  it("serves Deals settings and stage metadata without changing Leads options", async () => {
    for (const op of [
      operations.module,
      operations.fields,
      operations.layouts,
      operations.views,
      operations.view,
    ]) {
      const response = await call(op, a, { module: "Deals", viewId: "all-deals" });
      expect(response.status).toBe(200);
      const body = await response.json();
      if (op === operations.fields) {
        expect(body.fields).toHaveLength(29);
        for (const apiName of [
          "Last_Activity_Time",
          "Lead_Conversion_Time",
          "Sales_Cycle_Duration",
          "Overall_Sales_Duration",
          "Stage_Modified_Time",
        ]) {
          expect(
            body.fields.find((field: { api_name: string }) => field.api_name === apiName).read_only,
          ).toBe(true);
        }
        expect(
          body.fields.find((field: { api_name: string }) => field.api_name === "Owner").read_only,
        ).toBe(false);
        for (const apiName of ["Closing_Date", "Account_Name"]) {
          expect(
            body.fields.find((field: { api_name: string }) => field.api_name === apiName)
              .system_mandatory,
          ).toBe(true);
        }
        const stages = body.fields.find(
          (field: { api_name: string }) => field.api_name === "Stage",
        ).pick_list_values;
        expect(stages).toHaveLength(9);
        expect(stages[0]).toEqual({
          display_value: "Qualification",
          actual_value: "Qualification",
          probability: 10,
          forecast_category: { name: "Pipeline" },
          deal_category: "Open",
        });
      }
      if (op === operations.views) expect(body.custom_views).toHaveLength(11);
      if (op === operations.layouts) expect(body.layouts[0].sections).toHaveLength(3);
      if (op === operations.module) expect(body.modules[0].api_name).toBe("Deals");
    }
    const leads = await (await call(operations.fields, a)).json();
    for (const option of leads.fields.find(
      (field: { api_name: string }) => field.api_name === "Lead_Status",
    ).pick_list_values) {
      expect(option).not.toHaveProperty("probability");
      expect(option).not.toHaveProperty("forecast_category");
      expect(option).not.toHaveProperty("deal_category");
    }
  });
});
