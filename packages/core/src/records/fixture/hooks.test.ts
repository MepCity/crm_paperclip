import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import { createFixtureRecordService } from "./index";

const hooks = vi.hoisted(() => ({
  applyRules: vi.fn(),
  afterWrite: vi.fn(),
  afterDelete: vi.fn(),
  afterSeed: vi.fn(),
  orderRows: vi.fn(),
}));

vi.mock("./registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("./registry")>();
  const base = original.fixtureModules.Contacts;
  if (!base) throw new Error("Missing fixture module.");
  return {
    ...original,
    fixtureModules: {
      ...original.fixtureModules,
      Plain: { ...base, generateSeed: () => [] },
      Hooked: { ...base, generateSeed: () => [], ...hooks },
    },
  };
});

const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "hook-tests",
  orgName: "Hook Tests",
  userId: "member",
  role: "admin",
});

beforeEach(() => vi.clearAllMocks());

describe.each(["Plain", "Hooked"])("%s fixture lifecycle", (module) => {
  it.each(["create", "update", "massUpdate", "changeOwner", "merge"] as const)(
    "preserves %s and dispatches only the target module's hooks",
    async (operation) => {
      const service = createFixtureRecordService(context());
      const first = await service.create(module, { Last_Name: "First" });
      const second = await service.create(module, { Last_Name: "Second" });
      vi.clearAllMocks();
      let id = first.id;
      let input: Record<string, string>;
      switch (operation) {
        case "create": {
          input = { Last_Name: "Created" };
          id = (await service.create(module, input)).id;
          break;
        }
        case "update":
          input = { Last_Name: "Updated" };
          await service.update(module, id, input);
          break;
        case "massUpdate":
          input = { Department: "Operations" };
          await service.massUpdate(module, [id], input);
          break;
        case "changeOwner":
          input = { Owner: "member" };
          await service.changeOwner(module, [id], "member");
          break;
        case "merge":
          input = { Last_Name: "Merged" };
          await service.merge(module, {
            masterId: id,
            duplicateIds: [second.id],
            values: input,
          });
          await expect(service.get(module, second.id)).rejects.toThrow(NotFoundError);
          break;
      }
      const record = await service.get(module, id);
      expect(record.fields).toMatchObject(input);
      const calls = module === "Hooked" ? 1 : 0;
      expect(hooks.applyRules).toHaveBeenCalledTimes(calls);
      expect(hooks.afterWrite).toHaveBeenCalledTimes(calls);
      expect(hooks.afterDelete).not.toHaveBeenCalled();
      if (module === "Hooked") {
        expect(hooks.applyRules).toHaveBeenCalledWith(
          record.fields,
          input,
          ...(operation === "create" ? [] : [first.fields]),
        );
        expect(hooks.afterWrite).toHaveBeenCalledWith(
          record,
          operation === "create" ? undefined : first,
          { registeredModules: expect.any(Array), moduleStore: expect.any(Function) },
        );
      }
    },
  );

  it("dispatches delete hooks only after a successful deletion", async () => {
    const service = createFixtureRecordService(context());
    const record = await service.create(module, { Last_Name: "Deleted" });
    vi.clearAllMocks();
    await service.delete(module, [record.id]);
    await expect(service.get(module, record.id)).rejects.toThrow(NotFoundError);
    expect(hooks.afterDelete).toHaveBeenCalledTimes(module === "Hooked" ? 1 : 0);
    if (module === "Hooked")
      expect(hooks.afterDelete).toHaveBeenCalledWith([record.id], {
        registeredModules: expect.any(Array),
        moduleStore: expect.any(Function),
      });
    expect(hooks.afterWrite).not.toHaveBeenCalled();
    expect(hooks.applyRules).not.toHaveBeenCalled();
  });
});

it("runs seed hooks once per store and row ordering only for the selected bundle", async () => {
  const ctx = context();
  const service = createFixtureRecordService(ctx);
  createFixtureRecordService(ctx);
  expect(hooks.afterSeed).toHaveBeenCalledTimes(1);
  expect(hooks.afterSeed).toHaveBeenCalledWith({
    registeredModules: expect.any(Array),
    moduleStore: expect.any(Function),
  });
  await service.list("Plain", { viewId: "all-contacts", page: 1, perPage: 10 });
  expect(hooks.orderRows).not.toHaveBeenCalled();
  await service.list("Hooked", { viewId: "all-contacts", page: 1, perPage: 10 });
  expect(hooks.orderRows).toHaveBeenCalledExactlyOnceWith([]);
});

it("does not dispatch write hooks for invalid input", async () => {
  const service = createFixtureRecordService(context());
  const record = await service.create("Hooked", { Last_Name: "Unchanged" });
  vi.clearAllMocks();
  await expect(service.update("Hooked", record.id, { Last_Name: null })).rejects.toThrow(
    ValidationError,
  );
  expect(hooks.applyRules).not.toHaveBeenCalled();
  expect(hooks.afterWrite).not.toHaveBeenCalled();
  expect((await service.get("Hooked", record.id)).fields.Last_Name).toBe("Unchanged");
});
