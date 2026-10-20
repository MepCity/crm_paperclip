import { randomUUID } from "node:crypto";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { beforeEach, expect, it, vi } from "vitest";
import { readRecordTagsAction, removeRecordTagAction, saveRecordTagsAction } from "./actions";

const session = vi.hoisted(() => ({
  ctx: {
    orgId: "",
    orgSlug: "synthetic",
    orgName: "Example",
    userId: "actor",
    role: "admin" as const,
  },
}));
vi.mock("@/lib/session", () => ({ requireOrgContext: vi.fn(async () => session.ctx) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected fixture item");
  return value;
}

beforeEach(() => {
  session.ctx.orgId = randomUUID();
});

it.each(["Leads", "Contacts", "Accounts", "Deals"])(
  "saves, reads and removes module-scoped %s memberships through the fixture service",
  async (module) => {
    const service = createFixtureRecordService(session.ctx);
    const view = required((await service.listViews(module))[0]);
    const record = required(
      (await service.list(module, { viewId: view.id, page: 1, perPage: 10 })).records[0],
    );
    const initial = await readRecordTagsAction("synthetic", module, record.id);
    expect(initial).toMatchObject({ status: "success", tags: [] });
    const saved = await saveRecordTagsAction("synthetic", module, record.id, [
      " Zebra ",
      "Alpha",
      "alpha",
    ]);
    expect(saved.status).toBe("success");
    if (saved.status !== "success") throw new Error("Save failed");
    expect(saved.tags.map((tag) => tag.name)).toEqual(["Alpha", "Zebra"]);
    expect(required(saved.tags[0]).color).toBeNull();
    expect(await readRecordTagsAction("synthetic", module, record.id)).toMatchObject({
      tags: saved.tags,
    });
    expect(
      await removeRecordTagAction("synthetic", module, record.id, required(saved.tags[0]).id),
    ).toMatchObject({ status: "success", tags: [saved.tags[1]] });
  },
);

it("returns service field validation and checks a missing record before creating tags", async () => {
  const service = createFixtureRecordService(session.ctx);
  const record = required(
    (
      await service.list("Leads", {
        viewId: required((await service.listViews("Leads"))[0]).id,
        page: 1,
        perPage: 10,
      })
    ).records[0],
  );
  expect(
    await saveRecordTagsAction("synthetic", "Leads", record.id, ["x".repeat(51)]),
  ).toMatchObject({ status: "error", fieldErrors: { name: expect.any(Array) } });
  expect(await saveRecordTagsAction("synthetic", "Leads", "missing", ["Unused"])).toMatchObject({
    status: "error",
  });
  expect(await service.tags.listTags("Leads")).toEqual([]);
});

it("rejects locked-record writes without creating catalogue entries", async () => {
  const service = createFixtureRecordService(session.ctx);
  const view = required((await service.listViews("Leads"))[0]);
  const record = required(
    (await service.list("Leads", { viewId: view.id, page: 1, perPage: 100 })).records.find(
      (item) => item.fields.Locked__s === true,
    ),
  );
  expect(await saveRecordTagsAction("synthetic", "Leads", record.id, ["Blocked"])).toMatchObject({
    status: "error",
  });
  expect(await service.tags.listTags("Leads")).toEqual([]);
});

it("does not expose or remove another organization's tag", async () => {
  const original = createFixtureRecordService(session.ctx);
  const view = required((await original.listViews("Leads"))[0]);
  const record = required(
    (await original.list("Leads", { viewId: view.id, page: 1, perPage: 10 })).records[0],
  );
  const saved = await saveRecordTagsAction("synthetic", "Leads", record.id, ["Private"]);
  if (saved.status !== "success") throw new Error("Save failed");
  const tag = required(saved.tags[0]);
  session.ctx = { ...session.ctx, orgId: randomUUID() };
  expect(await readRecordTagsAction("synthetic", "Leads", record.id)).toMatchObject({
    status: "success",
    tags: [],
    catalogue: [],
  });
  expect(await removeRecordTagAction("synthetic", "Leads", record.id, tag.id)).toMatchObject({
    status: "error",
  });
  expect(await original.tags.listRecordTags("Leads", record.id)).toHaveLength(1);
});

it.each(["Leads", "Contacts", "Accounts", "Deals"])(
  "manages %s catalogue and keeps record projections consistent",
  async (module) => {
    const { readTagCatalogueAction, mutateTagCatalogueAction } = await import("./actions");
    expect(await readTagCatalogueAction("synthetic", module)).toMatchObject({
      status: "success",
      tags: [],
      capacity: 100,
      canManage: true,
    });
    const created = await mutateTagCatalogueAction("synthetic", module, {
      kind: "create",
      name: "Example",
    });
    if (created.status !== "success") throw new Error("Create failed");
    const tag = required(created.tags[0]);
    const service = createFixtureRecordService(session.ctx);
    const record = required(
      (
        await service.list(module, {
          viewId: required((await service.listViews(module))[0]).id,
          page: 1,
          perPage: 10,
        })
      ).records[0],
    );
    await service.tags.addTags(module, record.id, [tag.id]);
    expect(
      await mutateTagCatalogueAction("synthetic", module, {
        kind: "rename",
        id: tag.id,
        name: "Renamed",
      }),
    ).toMatchObject({ tags: [{ id: tag.id, name: "Renamed" }] });
    expect(await readRecordTagsAction("synthetic", module, record.id)).toMatchObject({
      tags: [{ id: tag.id, name: "Renamed" }],
    });
    expect(
      await mutateTagCatalogueAction("synthetic", module, { kind: "delete", id: tag.id }),
    ).toMatchObject({ tags: [] });
    expect(await readRecordTagsAction("synthetic", module, record.id)).toMatchObject({
      tags: [],
      catalogue: [],
    });
    expect(
      await mutateTagCatalogueAction("synthetic", module, { kind: "create", name: "x".repeat(51) }),
    ).toMatchObject({ status: "error", fieldErrors: { name: expect.any(Array) } });
  },
);
