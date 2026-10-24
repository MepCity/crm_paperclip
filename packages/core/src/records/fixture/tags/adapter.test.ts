import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "../../../errors";
import type { FixtureModuleStore } from "../hooks";
import { fixtureTagService, removeRecordTags } from ".";

function adapter() {
  let store: FixtureModuleStore = { records: new Map(), nextId: 1n };
  let writable = true;
  let visible = true;
  let failCommit = false;
  const service = fixtureTagService({
    ctx: { orgId: "test", orgSlug: "test", orgName: "Test", userId: "actor", role: "member" },
    now: () => new Date("2026-01-01T00:00:00Z"),
    moduleStore: () => store,
    assertModule(_module, write) {
      if (write && !writable) throw new ForbiddenError();
    },
    assertRecord(_module, _id, write) {
      if (!visible) throw new NotFoundError();
      if (write && !writable) throw new ForbiddenError();
    },
    atomic(_module, write) {
      const previous = store;
      store = { ...store, records: new Map(store.records) };
      try {
        const result = write();
        if (failCommit) throw new Error("commit failure");
        return result;
      } catch (error) {
        store = previous;
        throw error;
      }
    },
  });
  return {
    service,
    store: () => store,
    deny: () => {
      writable = false;
    },
    hide: () => {
      visible = false;
    },
    fail: () => {
      failCommit = true;
    },
  };
}

describe("fixture tag adapter lifecycle and policy delegation", () => {
  it("renames only the catalogue and physically drops links on record cleanup", async () => {
    const test = adapter();
    const { service } = test;
    const tag = await service.createTag("Leads", { name: "Before" });
    await service.addTags("Leads", "record", [tag.id]);
    const links = test.store().tagLinks;
    await service.renameTag("Leads", tag.id, "After");
    expect(test.store().tagLinks).toBe(links);
    expect((await service.listRecordTags("Leads", "record"))[0]?.name).toBe("After");
    removeRecordTags(test.store(), ["record"]);
    expect(test.store().tagLinks?.has("record")).toBe(false);
    expect(await service.listTags("Leads")).toHaveLength(1);
  });

  it("keeps catalogue deletion and every affected membership atomic", async () => {
    const test = adapter();
    const { service } = test;
    const a = await service.createTag("Leads", { name: "A" });
    const b = await service.createTag("Leads", { name: "B" });
    await service.addTags("Leads", "one", [a.id, b.id]);
    await service.addTags("Leads", "two", [a.id]);
    const previous = test.store();
    test.fail();
    await expect(service.deleteTag("Leads", a.id)).rejects.toThrow("commit failure");
    expect(test.store()).toBe(previous);
    expect(await service.listTags("Leads")).toHaveLength(2);
    expect(await service.listRecordTags("Leads", "two")).toHaveLength(1);
  });

  it("delegates every write to the module policy and hides inaccessible records", async () => {
    const test = adapter();
    const { service } = test;
    const tag = await service.createTag("Leads", { name: "Protected" });
    test.deny();
    for (const operation of [
      () => service.createTag("Leads", { name: "Denied" }),
      () => service.renameTag("Leads", tag.id, "Denied"),
      () => service.recolorTag("Leads", tag.id, null),
      () => service.deleteTag("Leads", tag.id),
      () => service.addTags("Leads", "record", [tag.id]),
      () => service.removeTags("Leads", "record", [tag.id]),
    ])
      await expect(operation()).rejects.toBeInstanceOf(ForbiddenError);
    expect(await service.listTags("Leads")).toEqual([tag]);
    test.hide();
    await expect(service.listRecordTags("Leads", "record")).rejects.toBeInstanceOf(NotFoundError);
  });
});
