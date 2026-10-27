import { expect, it } from "vitest";
import { InMemoryCustomizationAdapter } from "../customization/memory";
import { fixtureMetadataBaselines } from "../records/fixture/metadata-projection";
import { context, definitionContract, reportInput, unwrap } from "./contract-suite";
import { createMemoryDefinitionRepository } from "./memory";
import { createDefinitionPorts } from "./service";

const setup = async () => ({
  repository: createMemoryDefinitionRepository(),
  customization: new InMemoryCustomizationAdapter(fixtureMetadataBaselines()),
  canManageReports: async () => false,
});
definitionContract("unit-test memory twin", setup);
it("does not leak repository failures", async () => {
  const deps = await setup();
  deps.repository.create = async () => {
    throw new Error("private database detail");
  };
  expect(
    await createDefinitionPorts(deps).reports.create(context, reportInput, {
      idempotencyKey: "outage",
    }),
  ).toEqual({ ok: false, error: { code: "unavailable" } });
});
it("does not alias mutable report columns", async () => {
  const p = createDefinitionPorts(await setup());
  const r = unwrap(await p.reports.create(context, reportInput, { idempotencyKey: "clone" }));
  (r.columns as string[]).push("Unknown_Field");
  expect(unwrap(await p.reports.get(context, r.id)).columns).toEqual(["Last_Name"]);
});

it("validates against current customization, including retired fields", async () => {
  const deps = await setup();
  const current = await deps.customization.readEffective(context.orgId, "Leads");
  const p = createDefinitionPorts({
    ...deps,
    customization: {
      readEffective: async () => ({
        ...current,
        fields: current.fields.map((f) =>
          f.apiName === "Last_Name" ? { ...f, lifecycle: "retired" as const } : f,
        ),
      }),
    },
  });
  expect(await p.reports.create(context, reportInput, { idempotencyKey: "retired" })).toEqual({
    ok: false,
    error: { code: "validation" },
  });
});
