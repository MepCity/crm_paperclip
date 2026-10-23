import { randomUUID } from "node:crypto";
import {
  type CustomizationSnapshot,
  InMemoryCustomizationAdapter,
  resolveEffectiveModule,
} from "@crm/core/customization";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { fixtureMetadataBaselines } from "@crm/core/records/fixture/metadata-projection";
import { describe, expect, it } from "vitest";
import { encodeField, encodeLayout, encodeModule, encodeView } from "./codec";
import { type OperationDeps, operations } from "./operations";

const context = () => ({
  orgId: randomUUID(),
  orgSlug: "metadata-test",
  orgName: "Metadata Test",
  userId: "reader",
  role: "admin" as const,
});
const json = (value: unknown) => JSON.parse(JSON.stringify(value));
const request = (module: string, viewId?: string) => ({
  params: { module, ...(viewId ? { viewId } : {}) },
  query: { module },
});
function present<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test fixture");
  return value;
}
const baselines = fixtureMetadataBaselines();
const service = (
  port = new InMemoryCustomizationAdapter(baselines.filter((entry) => entry.apiName === "Leads")),
) => createFixtureRecordService(context(), { customization: port });
const deps = (records: ReturnType<typeof service>): OperationDeps => ({
  records,
  members: async () => [],
});

/** Remove precisely the additive keys, preserving every other property and array order. */
function legacy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(legacy);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          key !== "revision" &&
          key !== "custom_field" &&
          !(key === "id" && ("api_name" in value || "sections" in value)) &&
          !(key === "default" && "sections" in value),
      )
      .map(([key, child]) => [key, legacy(child)]),
  );
}

describe("effective metadata wire projection", () => {
  it.each(baselines)(
    "preserves all baseline response keys and ordering for $apiName",
    async (baseline) => {
      expect(() => resolveEffectiveModule(baseline)).not.toThrow();
      const records = service(new InMemoryCustomizationAdapter([baseline]));
      const module = baseline.apiName;
      const metadata = await records.getModule(module);
      const views = await records.listViews(module);
      const d = deps(records);
      const moduleBody = json(await operations.module.run(d, request(module))).body;
      expect(legacy(moduleBody)).toEqual({ modules: [encodeModule(metadata)] });
      const fields = json(await operations.fields.run(d, request(module)));
      expect(legacy(fields.body)).toEqual(legacy({ fields: metadata.fields.map(encodeField) }));
      const layouts = json(await operations.layouts.run(d, request(module)));
      expect(legacy(layouts.body)).toEqual(legacy({ layouts: [encodeLayout(metadata)] }));
      const list = json(await operations.views.run(d, request(module)));
      if (!views.length) {
        expect(list.status).toBe(204);
        return;
      }
      expect(legacy(list.body)).toEqual({
        custom_views: views.map(({ id, name, systemDefined, isDefault }) => ({
          id,
          name,
          system_defined: systemDefined,
          default: isDefault,
        })),
        info: {
          per_page: 200,
          count: views.length,
          page: 1,
          more_records: false,
          ...(views.find((view) => view.isDefault)
            ? { default: views.find((view) => view.isDefault)?.id }
            : {}),
        },
      });
      for (const view of views) {
        const body = json(await operations.view.run(d, request(module, view.id))).body;
        expect(legacy(body)).toEqual({ custom_views: [encodeView(view)] });
      }
      expect(fields.body.revision).toBe(moduleBody.revision);
      expect(layouts.body.revision).toBe(moduleBody.revision);
      expect(list.body.info.revision).toBe(moduleBody.revision);
      expect(moduleBody.revision).toMatch(/^[A-Za-z0-9._:-]{1,64}$/);
    },
  );

  it("publishes one new revision to all five reads and projects custom fields and placement", async () => {
    const port = new InMemoryCustomizationAdapter(
      baselines.filter((entry) => entry.apiName === "Leads"),
    );
    const ctx = context();
    const records = createFixtureRecordService(ctx, { customization: port });
    const d = deps(records);
    const read = async () =>
      Promise.all(
        [
          operations.module,
          operations.fields,
          operations.layouts,
          operations.views,
          operations.view,
        ].map(async (op) => json(await op.run(d, request("Leads", "all-leads"))).body),
      );
    const before = await read();
    expect(new Set(before.map((body) => body.revision ?? body.info.revision)).size).toBe(1);
    const effective = await port.readEffective(ctx.orgId, "Leads");
    const added = {
      ...present(effective.fields[0]),
      id: "local-custom",
      apiName: "Custom_Text",
      label: "Custom Text",
      required: false,
      readOnly: false,
      dataType: "text" as const,
      lifecycle: "active" as const,
    };
    const layouts = structuredClone(effective.layouts);
    const first = present(present(layouts[0]).sections[0]);
    const replacement = [
      {
        ...present(layouts[0]),
        sections: [
          {
            ...first,
            columns: [...first.columns.slice(0, -1), [...present(first.columns.at(-1)), added.id]],
            fields: [...first.fields, added.id],
          },
          ...present(layouts[0]).sections.slice(1),
        ],
      },
    ];
    await port.applyPatch(ctx.orgId, "Leads", 0, { addFields: [added], layouts: replacement });
    const after = await read();
    expect(new Set(after.map((body) => body.revision ?? body.info.revision)).size).toBe(1);
    expect(after[0].revision).not.toBe(before[0].revision);
    expect(after[1].fields).toContainEqual(
      expect.objectContaining({ id: added.id, api_name: added.apiName, custom_field: true }),
    );
    expect(after[2].layouts[0]).toMatchObject({
      id: present(effective.layouts[0]).id,
      default: true,
    });
    expect(after[2].layouts[0].sections[0].fields).toContainEqual(
      expect.objectContaining({ id: added.id, custom_field: true }),
    );
    expect(after[2].layouts[0].sections[0].columns.flat()).toContain(added.apiName);
    // Existing domain metadata remains the unextended RecordService contract.
    expect(await records.getModule("Leads")).not.toHaveProperty("revision");
  });

  it("uses replacement Calls placement even when identical to its sanitized baseline", async () => {
    const port = new InMemoryCustomizationAdapter(
      baselines.filter((entry) => entry.apiName === "Calls"),
    );
    const ctx = context();
    const records = createFixtureRecordService(ctx, { customization: port });
    const before = await records.getModuleProjection("Calls");
    expect(
      before.layout.filter((section) => section.columns.flat().includes("Description")),
    ).toHaveLength(2);
    const effective = await port.readEffective(ctx.orgId, "Calls");
    await port.applyPatch(ctx.orgId, "Calls", 0, { layouts: effective.layouts });
    const after = await records.getModuleProjection("Calls");
    expect(
      after.layout.filter((section) => section.columns.flat().includes("Description")),
    ).toHaveLength(1);
    expect(
      after.layout.find((section) => section.label === "Reason For Incoming Call")?.fields,
    ).toEqual(["Description"]);
  });

  it("omits retired fields and keeps baseline identities stable across tenants and services", async () => {
    const a = service();
    const b = service();
    expect((await a.getModuleProjection("Leads")).fields.map((field) => field.id)).toEqual(
      (await b.getModuleProjection("Leads")).fields.map((field) => field.id),
    );
    const baseline = present(baselines.find((entry) => entry.apiName === "Leads"));
    const overlay: CustomizationSnapshot = {
      baselineVersion: baseline.version,
      revision: 1,
      fields: [
        {
          ...present(resolveEffectiveModule(baseline).fields[0]),
          id: "retired-id",
          apiName: "Retired_Text",
          dataType: "text",
          lifecycle: "retired",
          required: false,
        },
      ],
      fieldPatches: {},
    };
    const effective = resolveEffectiveModule(baseline, overlay);
    const records = createFixtureRecordService(context(), {
      customization: { readEffective: async () => effective, applyPatch: async () => effective },
    });
    const response = json(await operations.fields.run(deps(records), request("Leads"))).body;
    expect(response.fields.some((field: { id: string }) => field.id === "retired-id")).toBe(false);
    expect(
      response.fields.every((field: { custom_field: boolean }) => field.custom_field === false),
    ).toBe(true);
  });
});
