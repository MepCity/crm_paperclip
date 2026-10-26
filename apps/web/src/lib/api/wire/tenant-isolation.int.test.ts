import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type CustomizationSnapshot, resolveEffectiveModule } from "@crm/core/customization";
import {
  type FieldValue,
  lookupTargetModules,
  type RecordData,
  type RecordService,
} from "@crm/core/records";
import { activityRules } from "@crm/core/records/activities";
import * as contracts from "@crm/core/records/contract-suite-module";
import {
  fixtureCustomizationPort,
  fixtureMetadataBaselines,
} from "@crm/core/records/fixture/metadata-projection";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as recordsAdapter from "@/lib/records";
import { getModuleScreens } from "@/modules/registry";
import { encodeCurrency, encodeField, encodeInput } from "./codec";
import { encodeKanbanView } from "./kanban-views";
import { type Operation, operationPath, operations } from "./operations";

// Same organization/session helpers and HTTP boundary as routes.int.test.ts.
// Collection GET is absent: bulk POST is the implemented list/advanced-search route.
const handlers = [
  [operations.record, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.update, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.delete, () => import("@/app/crm/v2.2/[module]/[recordId]/route")],
  [operations.create, () => import("@/app/crm/v2.2/[module]/route")],
  [operations.bulk, () => import("@/app/crm/v2.2/[module]/bulk/route")],
  [operations.count, () => import("@/app/crm/v2.2/[module]/actions/count/route")],
  [operations.summarize, () => import("@/app/crm/v2.2/[module]/actions/grouped_counts/route")],
  [operations.search, () => import("@/app/crm/v2.2/actions/search/route")],
  [operations.massUpdate, () => import("@/app/crm/v2.2/[module]/actions/mass_update/route")],
  [operations.massDelete, () => import("@/app/crm/v2.2/[module]/actions/mass_delete/route")],
  [operations.changeOwner, () => import("@/app/crm/v2.2/[module]/actions/change_owner/route")],
  [operations.merge, () => import("@/app/crm/v2.2/[module]/actions/merge/route")],
  [operations.currencies, () => import("@/app/crm/v2.2/org/currencies/route")],
  [operations.module, () => import("@/app/crm/v2.2/settings/modules/[module]/route")],
  [operations.layouts, () => import("@/app/crm/v2.1/settings/layouts/route")],
  [operations.view, () => import("@/app/crm/v9/settings/custom_views/[viewId]/route")],
  [operations.fields, () => import("@/app/crm/v2.2/settings/fields/route")],
  [operations.views, () => import("@/app/crm/v9/settings/custom_views/route")],
  [operations.kanbanViews, () => import("@/app/crm/v9/settings/kanban_views/route")],
  [operations.kanbanView, () => import("@/app/crm/v9/settings/kanban_views/[viewId]/route")],
] as const;
type Organization = Awaited<ReturnType<typeof createTestOrganization>>;
type Actor = { org: Organization["org"]; headers: Headers };
const origin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;

async function call(
  op: Operation,
  actor: Actor,
  module: string,
  options: {
    recordId?: string;
    viewId?: string;
    query?: Record<string, string>;
    body?: unknown;
    orgSlug?: string;
  } = {},
) {
  const entry = handlers.find(([candidate]) => candidate === op);
  if (!entry) throw new Error(`Missing HTTP handler: ${op.path}`);
  const route = await entry[1]();
  const handler = (
    route as unknown as Record<
      string,
      (
        req: Request,
        context: {
          params: Promise<Record<string, string>>;
        },
      ) => Promise<Response>
    >
  )[op.method];
  if (!handler) throw new Error(`Missing HTTP method: ${op.method}`);
  const params = {
    module,
    recordId: options.recordId ?? "missing",
    viewId: options.viewId ?? "missing",
  };
  const url = new URL(operationPath(op, params), origin);
  for (const [key, value] of Object.entries({ module, ...options.query }))
    url.searchParams.set(key, value);
  const headers = new Headers(actor.headers);
  headers.set("Origin", origin);
  headers.set("X-CRM-ORG", options.orgSlug ?? actor.org.slug);
  headers.set("Content-Type", "application/json");
  return handler(
    new Request(url, {
      method: op.method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    }),
    { params: Promise.resolve(params) },
  );
}

const screens = getModuleScreens();
const moduleContracts = Object.values(contracts);
const idFilter = (id: string) => ({
  filters: { field: { api_name: "id" }, comparator: "equal", value: id },
});
async function notFound(response: Response) {
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({ code: "not_found", status: "error" });
}

describe.each(screens.map(({ apiName }) => ({ module: apiName })))(
  "HTTP tenant isolation: $module",
  ({ module }) => {
    let a: Organization;
    let b: Organization;
    let actorA: Actor;
    let actorB: Actor;
    let serviceA: RecordService;
    let serviceB: RecordService;
    let local: RecordData;
    let foreign: RecordData;
    let markerField: string;
    let marker: string;
    let massField: string;
    let massValue: FieldValue;
    let query: Record<string, string>;
    let minimal: contracts.RecordServiceContractModuleDefinition["buildMinimalValidInput"];

    beforeAll(async () => {
      a = await createTestOrganization();
      b = await createTestOrganization();
      const member = await addTestMember(a.ctx, "member");
      actorA = { org: a.org, headers: member.headers };
      actorB = { org: b.org, headers: b.admin.headers };
      serviceA = recordsAdapter.getRecordService(a.ctx);
      serviceB = recordsAdapter.getRecordService(b.ctx);
      const contract = moduleContracts.find((candidate) => candidate.apiName === module);
      if (!contract)
        throw new Error(`Add a minimal-input contract for registered module ${module}`);
      minimal = contract.buildMinimalValidInput;
      const metadata = await serviceA.getModule(module);
      // Call_Duration is a formatted mm:ss text field, so it cannot carry a marker.
      const text =
        metadata.fields.find(
          (field) =>
            field.required &&
            field.dataType === "text" &&
            !field.readOnly &&
            field.apiName !== "Call_Duration",
        ) ??
        metadata.fields.find(
          (field) => field.apiName === "Subject" && field.dataType === "text" && !field.readOnly,
        );
      const mass = metadata.fields.find(
        (field) =>
          field.massUpdate &&
          ["text", "textarea", "picklist"].includes(field.dataType) &&
          !field.readOnly,
      );
      if (!text || !mass) throw new Error(`Expected writable marker fields for ${module}`);
      markerField = text.apiName;
      massField = mass.apiName;
      massValue =
        mass.dataType === "picklist"
          ? (mass.picklist?.[0]?.storedValue ?? null)
          : "Rejected batch change";
      marker = `ForeignTenantMarker${module}`;
      local = await serviceA.create(
        module,
        minimal({ [markerField]: `LocalTenantMarker${module}` }),
      );
      // Fixture sequences start at the same ID in each tenant. Reserve the first B ID
      // so the foreign target cannot accidentally address A's own record.
      await serviceB.create(module, minimal());
      foreign = await serviceB.create(module, minimal({ [markerField]: marker }));
      await expect(serviceA.get(module, foreign.id)).rejects.toMatchObject({ code: "not_found" });
      const view = (await serviceA.listViews(module)).find((candidate) => candidate.isDefault);
      if (!view) throw new Error(`Missing default view for ${module}`);
      const group = metadata.fields.find((field) => field.dataType === "picklist");
      if (!group) throw new Error(`Missing grouping field for ${module}`);
      query = { cvid: view.id, group_by: group.apiName, fields: markerField };
    });

    it("hides foreign single-record reads, updates and deletes without changing the target", async () => {
      const own = await call(operations.record, actorB, module, { recordId: foreign.id });
      expect(own.status).toBe(200);
      expect((await own.json()).data[0]).toMatchObject({ id: foreign.id, [markerField]: marker });
      const metadata = await serviceA.getModule(module);
      for (const op of [operations.record, operations.update, operations.delete]) {
        await notFound(
          await call(op, actorA, module, {
            recordId: foreign.id,
            ...(op === operations.update
              ? { body: { data: [encodeInput({ [markerField]: "Rejected change" }, metadata)] } }
              : {}),
          }),
        );
        expect(await serviceB.get(module, foreign.id)).toEqual(foreign);
      }
    });

    it("excludes foreign records from lists, counts, grouped counts and advanced criteria", async () => {
      for (const op of [operations.bulk, operations.count, operations.summarize]) {
        const visible = await call(op, actorB, module, { query, body: idFilter(foreign.id) });
        expect(visible.status).toBe(200);
        const own = await visible.json();
        if (op === operations.bulk)
          expect(own.data.map((row: { id: string }) => row.id)).toEqual([foreign.id]);
        if (op === operations.count) expect(own).toEqual({ count: 1 });
        if (op === operations.summarize)
          expect(
            own.groups.reduce((total: number, group: { count: number }) => total + group.count, 0),
          ).toBe(1);
        const hidden = await call(op, actorA, module, { query, body: idFilter(foreign.id) });
        expect(hidden.status).toBe(op === operations.bulk ? 204 : 200);
        if (op === operations.bulk) expect(await hidden.text()).toBe("");
        if (op === operations.count) expect(await hidden.json()).toEqual({ count: 0 });
        if (op === operations.summarize) {
          const groups = (await hidden.json()).groups as { count: number }[];
          expect(groups.length).toBeGreaterThan(0);
          expect(groups.every((group) => group.count === 0)).toBe(true);
        }
      }
      // Search by a field criterion too, rather than only by ID.
      const body = {
        filters: { field: { api_name: markerField }, comparator: "equal", value: marker },
      };
      expect((await call(operations.bulk, actorB, module, { query, body })).status).toBe(200);
      const hidden = await call(operations.bulk, actorA, module, { query, body });
      expect(hidden.status).toBe(204);
      expect(await hidden.text()).toBe("");
      const list = await call(operations.bulk, actorA, module, { query });
      expect(list.status).toBe(200);
      const rows = (await list.json()).data as { id: string }[];
      expect(rows).toContainEqual(expect.objectContaining({ id: local.id }));
      expect(rows.some((row) => row.id === foreign.id)).toBe(false);
    });

    it("excludes foreign records from global search with and without advanced criteria", async () => {
      for (const filters of [undefined, idFilter(foreign.id).filters]) {
        const body = { text: marker, ...(filters ? { modules: [module], filters } : {}) };
        const visible = await call(operations.search, actorB, module, { body });
        expect(visible.status).toBe(200);
        expect(await visible.json()).toMatchObject([
          { module, total: 1, records: [{ id: foreign.id }] },
        ]);
        const hidden = await call(operations.search, actorA, module, { body });
        expect(hidden.status).toBe(200);
        expect(await hidden.json()).toEqual([]);
      }
    });

    it("rejects foreign IDs in mass update, mass delete, owner change and merge atomically", async () => {
      const ids = [local.id, foreign.id];
      const values = encodeInput({ [massField]: massValue }, await serviceA.getModule(module));
      for (const [op, body] of [
        [operations.massUpdate, { ids, data: [values] }],
        [operations.massDelete, { ids }],
        [operations.changeOwner, { ids, owner: { id: a.ctx.userId } }],
        [operations.merge, { masterId: local.id, duplicateIds: [foreign.id], values: {} }],
        [operations.merge, { masterId: foreign.id, duplicateIds: [local.id], values: {} }],
      ] as const) {
        await notFound(await call(op, actorA, module, { body }));
        expect(await serviceB.get(module, foreign.id)).toEqual(foreign);
        expect(await serviceA.get(module, local.id)).toEqual(local);
      }
    });

    it("binds currencies, fields, custom views and Kanban views to the authenticated organization", async () => {
      // Currency/field/custom-view definitions are currently immutable shared seeds;
      // verify the actual scoped adapter binding as well as rejecting a foreign slug.
      const adapter = vi.spyOn(recordsAdapter, "getRecordService");
      try {
        for (const op of [
          operations.currencies,
          operations.fields,
          operations.views,
          operations.kanbanViews,
        ]) {
          adapter.mockClear();
          const response = await call(op, actorA, module);
          expect(response.status).toBe(200);
          expect(adapter).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ orgId: a.ctx.orgId }),
          );
          const body = await response.json();
          if (op === operations.currencies)
            expect(body).toEqual({
              currencies: [encodeCurrency(await serviceA.getHomeCurrency())],
            });
          if (op === operations.fields)
            expect(body.fields).toEqual((await serviceA.getModule(module)).fields.map(encodeField));
          if (op === operations.views)
            expect(body.custom_views.map((view: { id: string }) => view.id)).toEqual(
              (await serviceA.listViews(module)).map((view) => view.id),
            );
          if (op === operations.kanbanViews)
            expect(body.kanban_views).toEqual(
              (await serviceA.listKanbanViews(module)).map(encodeKanbanView),
            );
          adapter.mockClear();
          await notFound(await call(op, actorA, module, { orgSlug: b.org.slug }));
          expect(adapter).not.toHaveBeenCalled();
        }
      } finally {
        adapter.mockRestore();
      }
    });
  },
);

it("validates the real route inventory and absence of collection GET", async () => {
  expect(screens.length).toBeGreaterThan(0);
  for (const [op] of handlers) {
    const path = resolve(
      "apps/web/src/app",
      op.path.replace(/^\//, "").replace(/\{([^}]+)\}/g, "[$1]"),
      "route.ts",
    );
    expect(readFileSync(path, "utf8")).toContain(`export const ${op.method} = operationRoute(`);
  }
  expect(await import("@/app/crm/v2.2/[module]/route")).not.toHaveProperty("GET");
});

it("hides a tenant-created Kanban view from another organization's list and direct read", async () => {
  const a = await createTestOrganization();
  const b = await createTestOrganization();
  const actorA = { org: a.org, headers: a.admin.headers };
  const actorB = { org: b.org, headers: b.admin.headers };
  const service = recordsAdapter.getRecordService(b.ctx);
  // Discover a usable Kanban definition instead of hard-coding a module inventory.
  for (const { apiName: module } of screens) {
    const [seed] = await service.listKanbanViews(module);
    if (!seed) continue;
    const foreign = await service.createKanbanView(module, {
      ...seed,
      name: "Foreign tenant board",
    });
    const visible = await call(operations.kanbanView, actorB, module, { viewId: foreign.id });
    expect(visible.status).toBe(200);
    expect(await visible.json()).toEqual({ kanban_views: [encodeKanbanView(foreign)] });
    const list = await call(operations.kanbanViews, actorA, module);
    expect(list.status).toBe(200);
    expect(
      (await list.json()).kanban_views.some((view: { id: string }) => view.id === foreign.id),
    ).toBe(false);
    await notFound(await call(operations.kanbanView, actorA, module, { viewId: foreign.id }));
    return;
  }
  throw new Error("Expected a registered Kanban-enabled module");
});

describe.each(
  screens
    .filter(({ apiName }) => Object.hasOwn(activityRules, apiName))
    .map(({ apiName }) => ({ module: apiName })),
)("HTTP activity parent isolation: $module", ({ module }) => {
  it("rejects foreign Who/What parents on create and update while accepting local parents", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const actor = { org: a.org, headers: a.admin.headers };
    const serviceA = recordsAdapter.getRecordService(a.ctx);
    const serviceB = recordsAdapter.getRecordService(b.ctx);
    const metadata = await serviceA.getModule(module);
    const contract = moduleContracts.find((candidate) => candidate.apiName === module);
    if (!contract) throw new Error(`Missing activity contract: ${module}`);
    const activity = await serviceA.create(module, contract.buildMinimalValidInput());
    const parentFields = metadata.fields.filter((field) =>
      ["Who_Id", "What_Id"].includes(field.apiName),
    );
    expect(parentFields).toHaveLength(2);
    for (const field of parentFields) {
      const targetModule = lookupTargetModules(field).find((name) =>
        screens.some((screen) => screen.apiName === name),
      );
      const target = moduleContracts.find((candidate) => candidate.apiName === targetModule);
      if (!target) throw new Error(`Missing parent contract: ${field.apiName}`);
      const local = await serviceA.create(target.apiName, target.buildMinimalValidInput());
      await serviceB.create(target.apiName, target.buildMinimalValidInput());
      const foreign = await serviceB.create(target.apiName, target.buildMinimalValidInput());
      await expect(serviceA.get(target.apiName, foreign.id)).rejects.toMatchObject({
        code: "not_found",
      });
      const reference = { [field.apiName]: { module: target.apiName, id: foreign.id } };
      for (const op of [operations.create, operations.update]) {
        const values =
          op === operations.create ? contract.buildMinimalValidInput(reference) : reference;
        const response = await call(op, actor, module, {
          recordId: activity.id,
          body: { data: [encodeInput(values, metadata)] },
        });
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          code: "INVALID_DATA",
          details: { fields: { [field.apiName]: expect.any(Array) } },
        });
        expect(await serviceA.get(module, activity.id)).toEqual(activity);
        expect(await serviceB.get(target.apiName, foreign.id)).toEqual(foreign);
      }
      const valid = await call(operations.create, actor, module, {
        body: {
          data: [
            encodeInput(
              contract.buildMinimalValidInput({
                [field.apiName]: { module: target.apiName, id: local.id },
              }),
              metadata,
            ),
          ],
        },
      });
      expect(valid.status).toBe(200);
      const id = (await valid.json()).data[0].details.id as string;
      expect((await serviceA.get(module, id)).fields[field.apiName]).toMatchObject({
        module: target.apiName,
        id: local.id,
      });
    }
  });
});

it("isolates a published metadata overlay, revision and layout at the real HTTP boundary", async () => {
  const a = await createTestOrganization();
  const b = await createTestOrganization();
  const actorA = { org: a.org, headers: a.admin.headers };
  const actorB = { org: b.org, headers: b.admin.headers };
  const port = fixtureCustomizationPort();
  const before = await Promise.all(
    [operations.fields, operations.layouts].map(async (op) =>
      (await call(op, actorB, "Leads")).json(),
    ),
  );
  const effective = await port.readEffective(a.ctx.orgId, "Leads");
  const original = effective.fields[0];
  const layout = effective.layouts[0];
  const section = layout?.sections[0];
  if (!original || !layout || !section) throw new Error("Missing baseline fixture");
  const added = {
    ...original,
    id: `custom:${a.ctx.orgId}`,
    apiName: "Tenant_Custom_Text",
    label: "Tenant Custom Text",
    dataType: "text" as const,
    required: false,
    readOnly: false,
  };
  await port.applyPatch(a.ctx.orgId, "Leads", effective.revision, {
    addFields: [added],
    layouts: [
      {
        ...layout,
        sections: [
          {
            ...section,
            fields: [...section.fields, added.id],
            columns: section.columns.map((column, index) =>
              index === 0 ? [...column, added.id] : column,
            ),
          },
          ...layout.sections.slice(1),
        ],
      },
    ],
  });
  for (const [index, op] of [operations.fields, operations.layouts].entries()) {
    const local = await call(op, actorA, "Leads", { query: { org: b.org.slug } });
    expect(local.status).toBe(200);
    const localBody = await local.json();
    expect(JSON.stringify(localBody)).toContain(added.id);
    expect(localBody.revision).not.toBe(before[index].revision);
    const foreign = await call(op, actorB, "Leads", { query: { org: a.org.slug } });
    expect(foreign.status).toBe(200);
    expect(await foreign.json()).toEqual(before[index]);
    await notFound(await call(op, actorA, "Leads", { orgSlug: b.org.slug }));
  }
  const ids = async (org: typeof a) =>
    (await recordsAdapter.getRecordService(org.ctx).getModuleProjection("Leads")).fields
      .filter((field) => !field.custom)
      .map((field) => field.id);
  expect(await ids(a)).toEqual(await ids(b));
  expect(await ids(a)).toEqual(await ids(a));
});

it("returns only INTERNAL_ERROR for invalid stored metadata on all five reads", async () => {
  const a = await createTestOrganization();
  const actor = { org: a.org, headers: a.admin.headers };
  const baseline = fixtureMetadataBaselines().find((entry) => entry.apiName === "Calls");
  if (!baseline) throw new Error("Missing Calls baseline");
  const good = resolveEffectiveModule(baseline);
  const layout = good.layouts[0];
  const first = layout?.sections.find((section) =>
    section.columns.flat().includes("field:Description"),
  );
  const repeated = layout?.sections.find((section) => section.label === "Reason For Incoming Call");
  if (!layout || !first || !repeated) throw new Error("Missing Calls sections");
  const invalid: CustomizationSnapshot = {
    baselineVersion: baseline.version,
    revision: 2,
    fields: [],
    fieldPatches: {},
    layouts: [
      {
        ...layout,
        sections: layout.sections.map((section) =>
          section.id === repeated.id ? { ...section, columns: [["field:Description"]] } : section,
        ),
      },
    ],
  };
  const port = fixtureCustomizationPort();
  const spy = vi
    .spyOn(port, "readEffective")
    .mockImplementation(async () => resolveEffectiveModule(baseline, invalid));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const op of [
      operations.module,
      operations.fields,
      operations.layouts,
      operations.views,
      operations.view,
    ]) {
      const response = await call(op, actor, "Calls", { viewId: "all-calls" });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        code: "INTERNAL_ERROR",
        details: {},
        message: "Something went wrong.",
        status: "error",
      });
    }
  } finally {
    spy.mockRestore();
    log.mockRestore();
  }
});
