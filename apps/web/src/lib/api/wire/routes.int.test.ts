import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { getRecordService } from "@/lib/records";
import { type Operation, operationPath, operations } from "./operations";

const handlers = [
  [operations.module, () => import("@/app/crm/v2.2/settings/modules/[module]/route")],
  [operations.fields, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.layouts, () => import("@/app/crm/v2.1/settings/layouts/route")],
  [operations.views, () => import("@/app/crm/v9/settings/custom_views/route")],
  [operations.view, () => import("@/app/crm/v9/settings/custom_views/[viewId]/route")],
  [operations.bulk, () => import("@/app/crm/v2.2/[module]/bulk/route")],
  [operations.count, () => import("@/app/crm/v2.2/[module]/actions/count/route")],
  [operations.record, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.users, () => import("@/app/crm/v9/users/route")],
  [operations.create, () => import("@/app/crm/v2.2/[module]/route")],
  [operations.update, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.delete, () => import("@/app/crm/v2.2/[module]/route")],
] as const;
type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
const params = { module: "Leads", viewId: "all-leads", recordId: "missing" };
async function call(
  op: Operation,
  org?: Organization,
  options: {
    recordId?: string;
    viewId?: string;
    query?: Record<string, string>;
    body?: unknown;
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
  const boundParams = {
    ...params,
    recordId: options.recordId ?? params.recordId,
    viewId: options.viewId ?? params.viewId,
  };
  const routeParams = Object.fromEntries(
    Object.entries(boundParams).filter(([key]) => op.path.includes(`{${key}}`)),
  );
  const url = new URL(operationPath(op, boundParams), origin);
  for (const [key, value] of Object.entries({
    module: "Leads",
    cvid: "all-leads",
    ...options.query,
  }))
    url.searchParams.set(key, value);
  const headers = new Headers({ Origin: origin });
  if (org) {
    const cookie = org.admin.headers.get("cookie");
    if (!cookie) throw new Error("Missing test cookie");
    headers.set("cookie", cookie);
    headers.set("X-CRM-ORG", org.org.slug);
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

describe("operation routes", () => {
  let a: Organization;
  let b: Organization;
  beforeAll(async () => {
    a = await createTestOrganization();
    b = await createTestOrganization();
  });
  it("has a thin, force-dynamic wrapped route for every operation", () => {
    expect(handlers).toHaveLength(Object.keys(operations).length);
    for (const op of Object.values(operations)) {
      const file = resolve(
        "apps/web/src/app",
        op.path.replace(/^\//, "").replace(/\{([^}]+)\}/g, "[$1]"),
        "route.ts",
      );
      const source = readFileSync(file, "utf8");
      expect(source).toContain(`export const ${op.method} = apiRoute`);
      expect(source).toContain('export const dynamic = "force-dynamic"');
      expect(source).toContain("@/lib/api/");
      expect(source).not.toMatch(/request\.json|X-CRM-ORG|\.list\(|\.create\(|\.count\(|\/crm\/v/);
    }
  });
  it("passes every operation through session authentication", async () => {
    for (const [op] of handlers) {
      const response = await call(op);
      expect(response.status, `${op.method} ${op.path}`).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toMatchObject({ code: "unauthenticated" });
    }
  });
  it("serves every authenticated read handler with its envelope", async () => {
    const created = await getRecordService(a.ctx).create("Leads", {
      Last_Name: "Handler Example",
      Company: "Handler Company",
    });
    for (const [op] of handlers.filter(
      ([op]) =>
        ![operations.create, operations.update, operations.delete].includes(
          op as typeof operations.create,
        ),
    )) {
      const response = await call(op, a, { recordId: created.id });
      expect(response.status, op.path).toBe(200);
      const body = await response.json();
      expect(typeof body).toBe("object");
      if (op === operations.record)
        expect(body.data[0]).toMatchObject({ id: created.id, Last_Name: "Handler Example" });
    }
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
  it("answers unknown comparators with a filters-keyed 400", async () => {
    for (const op of [operations.bulk, operations.count]) {
      const response = await call(op, a, {
        body: {
          filters: { field: { api_name: "Company" }, comparator: "unknown", value: "Example" },
        },
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        code: "validation",
        status: 400,
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
  it("runs create, update and delete handlers and retains field validation", async () => {
    const create = await call(operations.create, a, {
      body: { data: [{ Company: "Route CRUD", Last_Name: "Original" }] },
    });
    expect(create.status).toBe(200);
    const body = await create.json();
    const id = body.data[0].id;
    expect(body).toEqual({ data: [{ id }] });
    const update = await call(operations.update, a, {
      recordId: id,
      body: { data: [{ Last_Name: "Updated" }] },
    });
    expect(await update.json()).toEqual({ data: [{ id }] });
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
    expect(await (await call(operations.delete, a, { query: { ids: id } })).json()).toEqual({
      data: [{ id }],
    });
    expect((await call(operations.record, a, { recordId: id })).status).toBe(404);
  });
});
