import { fixtureCustomizationPort } from "@crm/core/records/fixture/metadata-projection";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getCustomizationCoordinator } from "@/lib/customization";
import { getRecordService } from "@/lib/records";
import { type Operation, operationPath, operations } from "./operations";

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test value");
  return value;
}

const routes = [
  [operations.createField, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.patchField, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.retireField, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.patchModule, () => import("@/app/crm/v2.2/settings/modules/[module]/route")],
  [operations.patchLayout, () => import("@/app/crm/v2.1/settings/layouts/route")],
  [operations.createSharedView, () => import("@/app/crm/v9/settings/custom_views/route")],
  [operations.patchSharedView, () => import("@/app/crm/v9/settings/custom_views/[viewId]/route")],
  [operations.deleteSharedView, () => import("@/app/crm/v9/settings/custom_views/[viewId]/route")],
] as const;
const field = {
  apiName: "Contract_Note",
  label: "Contract note",
  dataType: "text",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
let a: Organization;
let b: Organization;
let member: Awaited<ReturnType<typeof addTestMember>>;
async function call(
  op: Operation,
  body: unknown,
  options: {
    headers?: Headers;
    org?: string;
    viewId?: string;
    origin?: string;
    module?: string;
    raw?: string;
  } = {},
) {
  const entry = required(routes.find(([candidate]) => candidate === op));
  const route = await entry[1]();
  const params = { module: options.module ?? "Leads", viewId: options.viewId ?? "shared-http" };
  const url = new URL(operationPath(op, params), origin);
  url.searchParams.set("module", params.module);
  const headers = new Headers(options.headers ?? a.admin.headers);
  headers.set("X-CRM-ORG", options.org ?? a.org.slug);
  headers.set("Origin", options.origin ?? origin);
  headers.set("Content-Type", "application/json");
  const handler = (
    route as unknown as Record<
      string,
      (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
    >
  )[op.method];
  if (!handler) throw new Error("Missing route method");
  return handler(
    new Request(url, { method: op.method, headers, body: options.raw ?? JSON.stringify(body) }),
    {
      params: Promise.resolve(
        Object.fromEntries(Object.entries(params).filter(([key]) => op.path.includes(`{${key}}`))),
      ),
    },
  );
}
async function revision() {
  return (await getRecordService(a.ctx).getModuleProjection("Leads")).revision;
}
async function command(op: Operation, value: unknown, options = {}) {
  return call(op, { expectedRevision: await revision(), command: value }, options);
}

describe("customization HTTP authorization and publication", () => {
  beforeAll(async () => {
    vi.stubEnv("MEP_EPHEMERAL_CUSTOMIZATION", "1");
    a = await createTestOrganization();
    b = await createTestOrganization();
    member = await addTestMember(a.ctx, "member");
  });
  afterAll(() => vi.unstubAllEnvs());

  it.each(routes)(
    "%s rejects members, foreign organizations and unauthenticated callers",
    async (op) => {
      const before = await revision();
      const denied = await call(op, {}, { headers: member.headers, raw: "invalid json" });
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({ code: "NO_PERMISSION" });
      const foreign = await call(op, {}, { headers: b.admin.headers });
      expect(foreign.status).toBe(404);
      expect(await foreign.json()).toMatchObject({ code: "not_found" });
      const missing = await call(op, {}, { headers: new Headers() });
      expect(missing.status).toBe(401);
      const crossOrigin = await call(op, {}, { origin: "http://foreign.test" });
      expect(crossOrigin.status).toBe(403);
      expect(await revision()).toBe(before);
      expect(fixtureCustomizationPort().auditEntries(a.org.id, "Leads")).toEqual([]);
    },
  );

  it("publishes admin commands through all existing routes, preserving identity and one revision", async () => {
    const token = await revision();
    const other = await getRecordService(b.ctx).getModuleProjection("Leads");
    const created = await command(operations.createField, { type: "field.create", field });
    expect(created.status).toBe(200);
    expect(await created.json()).toEqual({ revision: await revision() });
    const metadata = await getRecordService(a.ctx).getModuleProjection("Leads");
    const id = required(metadata.fields.find((value) => value.apiName === field.apiName)).id;
    expect(metadata.revision).not.toBe(token);
    expect(await getRecordService(b.ctx).getModuleProjection("Leads")).toEqual(other);
    expect(
      (
        await command(operations.patchField, {
          type: "field.patch",
          fieldId: id,
          properties: { label: "Renamed note" },
        })
      ).status,
    ).toBe(200);
    const layout = structuredClone(
      required(getCustomizationCoordinator()).read(a.org.id, "Leads").layouts[0],
    );
    expect(
      (
        await command(operations.patchLayout, {
          type: "layout.patch",
          layout: { ...layout, label: "Main" },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command(operations.patchModule, {
          type: "module.patch",
          properties: { pluralLabel: "Prospects" },
        })
      ).status,
    ).toBe(200);
    const view = {
      id: "shared-http",
      name: "Shared",
      systemDefined: false,
      isDefault: false,
      columns: [id],
      criteria: null,
      sort: null,
    };
    expect((await command(operations.createSharedView, { type: "view.create", view })).status).toBe(
      200,
    );
    expect((await getRecordService(a.ctx).getView("Leads", view.id)).columns).toContain(
      field.apiName,
    );
    expect(
      (
        await command(operations.patchSharedView, {
          type: "view.patch",
          view: { ...view, name: "Renamed" },
        })
      ).status,
    ).toBe(200);
    const beforeDependency = await revision();
    expect(
      (await command(operations.retireField, { type: "field.retire", fieldId: id })).status,
    ).toBe(400);
    expect(await revision()).toBe(beforeDependency);
    expect((await command(operations.deleteSharedView, { type: "view.delete" })).status).toBe(200);
    expect(
      (await command(operations.retireField, { type: "field.retire", fieldId: id })).status,
    ).toBe(200);
    expect(
      (await command(operations.patchField, { type: "field.restore", fieldId: id })).status,
    ).toBe(200);
    const beforeInvalid = await revision();
    const stale = await call(operations.patchModule, {
      expectedRevision: token,
      command: { type: "module.patch", properties: { pluralLabel: "Stale" } },
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      code: "SCHEMA_REVISION_MISMATCH",
      details: { revision: beforeInvalid },
    });
    const invalid = await call(operations.patchModule, {
      expectedRevision: beforeInvalid,
      orgId: b.org.id,
      command: { type: "module.patch", properties: { pluralLabel: "Foreign" } },
    });
    expect(invalid.status).toBe(400);
    expect(await revision()).toBe(beforeInvalid);
    expect(fixtureCustomizationPort().auditEntries(a.org.id, "Leads")).toHaveLength(9);
  });

  it("exposes role/gate capabilities and blocks editing when the explicit gate is off", async () => {
    const { GET } = await import("@/app/crm/v2.2/settings/modules/[module]/route");
    const read = async (headers: Headers) => {
      const scoped = new Headers(headers);
      scoped.set("X-CRM-ORG", a.org.slug);
      const response = await GET(
        new Request(`${origin}/crm/v2.2/settings/modules/Leads`, { headers: scoped }),
        { params: Promise.resolve({ module: "Leads" }) },
      );
      return response.json();
    };
    expect((await read(a.admin.headers)).capabilities.fields).toBe(true);
    expect((await read(member.headers)).capabilities.fields).toBe(false);
    vi.stubEnv("MEP_EPHEMERAL_CUSTOMIZATION", "0");
    expect((await command(operations.createField, { type: "field.create", field })).status).toBe(
      403,
    );
    expect((await read(a.admin.headers)).capabilities.fields).toBe(false);
    vi.stubEnv("MEP_EPHEMERAL_CUSTOMIZATION", "1");
  });

  it("retains the no-create/no-delete layout route boundary", async () => {
    const route = await import("@/app/crm/v2.1/settings/layouts/route");
    expect(route).not.toHaveProperty("POST");
    expect(route).not.toHaveProperty("DELETE");
  });
});
