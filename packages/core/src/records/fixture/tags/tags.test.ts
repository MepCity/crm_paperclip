import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NotFoundError, RecordLockedError, ValidationError } from "../../../errors";
import type { OrgContext } from "../../../tenancy/types";
import type { Criteria } from "../../contract";
import { createFixtureRecordService, createFixtureTagService } from "..";

const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "tags-test",
  orgName: "Test",
  userId: "actor",
  role: "admin",
});
const setup = (ctx = context()) => {
  const records = createFixtureRecordService(ctx);
  return { ctx, records, tags: createFixtureTagService(ctx) };
};
const modules = ["Leads", "Contacts", "Accounts", "Deals"];
const first = async (records: ReturnType<typeof createFixtureRecordService>, module: string) => {
  const view = (await records.listViews(module))[0];
  if (!view) throw new Error("Missing view");
  const result = await records.list(module, { viewId: view.id, page: 1, perPage: 100 });
  const row = result.records.find((record) => record.fields.Locked__s !== true);
  if (!row) throw new Error("Missing unlocked record");
  return { row, viewId: view.id };
};

describe("organization-bound fixture tags", () => {
  it.each(modules)("%s projects stable memberships and cleans both lifecycles", async (module) => {
    const { ctx, records, tags } = setup();
    const { row, viewId } = await first(records, module);
    expect(row.fields.Tag).toBeNull();
    const z = await tags.createTag(module, { name: "Zulu" });
    const a = await tags.createTag(module, { name: " Alpha ", color: "#ABCdef" });
    expect(a).toMatchObject({
      name: "Alpha",
      color: "#ABCdef",
      module,
      createdBy: ctx.userId,
      modifiedBy: ctx.userId,
    });
    expect(z.color).toBeNull();
    await tags.addTags(module, row.id, [z.id, a.id, z.id]);
    await tags.addTags(module, row.id, [a.id]);
    expect((await tags.listRecordTags(module, row.id)).map((t) => t.id)).toEqual([a.id, z.id]);
    const before = await records.get(module, row.id);
    expect(before.fields.Tag).toEqual([
      { id: a.id, name: "Alpha" },
      { id: z.id, name: "Zulu" },
    ]);
    await tags.renameTag(module, z.id, "Aardvark");
    expect((await records.get(module, row.id)).fields.Tag).toEqual([
      { id: z.id, name: "Aardvark" },
      { id: a.id, name: "Alpha" },
    ]);
    expect((await records.get(module, row.id)).fields.Modified_Time).toEqual(
      before.fields.Modified_Time,
    );
    expect(
      (await records.list(module, { viewId, page: 1, perPage: 100, fields: ["Tag"] })).records.find(
        (r) => r.id === row.id,
      )?.fields.Tag,
    ).toEqual((await records.get(module, row.id)).fields.Tag);
    await tags.recolorTag(module, a.id, null);
    expect((await tags.listTags(module)).find((tag) => tag.id === a.id)?.color).toBeNull();
    await tags.removeTags(module, row.id, [a.id]);
    await tags.removeTags(module, row.id, [a.id]);
    expect(await tags.listTags(module)).toHaveLength(2);
    await tags.deleteTag(module, z.id);
    expect((await records.get(module, row.id)).fields.Tag).toBeNull();
    await tags.addTags(module, row.id, [a.id]);
    await records.delete(module, [row.id]);
    await expect(tags.listRecordTags(module, row.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await tags.listTags(module)).toHaveLength(1);
  });

  it("isolates tenants and modules and validates every reference before mutation", async () => {
    const a = setup();
    const b = setup();
    const lead = await a.tags.createTag("Leads", { name: "Shared" });
    const contact = await a.tags.createTag("Contacts", { name: "Shared" });
    const foreign = await b.tags.createTag("Leads", { name: "Shared" });
    expect(new Set([lead.id, contact.id, foreign.id]).size).toBe(3);
    const { row } = await first(a.records, "Leads");
    const foreignRecord = await b.records.create("Leads", {
      Last_Name: "Synthetic",
      Company: "Test",
    });
    for (const id of [contact.id, foreign.id, "unknown"]) {
      await expect(a.tags.addTags("Leads", row.id, [lead.id, id])).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(a.tags.removeTags("Leads", row.id, [id])).rejects.toBeInstanceOf(NotFoundError);
      await expect(a.tags.renameTag("Leads", id, "New")).rejects.toBeInstanceOf(NotFoundError);
      await expect(a.tags.recolorTag("Leads", id, null)).rejects.toBeInstanceOf(NotFoundError);
      await expect(a.tags.deleteTag("Leads", id)).rejects.toBeInstanceOf(NotFoundError);
    }
    await expect(a.tags.addTags("Leads", foreignRecord.id, [lead.id])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await a.tags.listRecordTags("Leads", row.id)).toEqual([]);
    const sameOrg = createFixtureTagService({ ...a.ctx, userId: "member", role: "member" });
    await sameOrg.addTags("Leads", row.id, [lead.id]);
    expect(await a.tags.listRecordTags("Leads", row.id)).toHaveLength(1);
    expect(await b.tags.listTags("Leads")).toEqual([foreign]);
  });

  it("enforces interim name, colour, uniqueness and catalogue capacity rules", async () => {
    const { tags, records } = setup();
    for (const name of ["", "   ", "x".repeat(51)])
      await expect(tags.createTag("Leads", { name })).rejects.toBeInstanceOf(ValidationError);
    const tag = await tags.createTag("Leads", { name: " Cafe\u0301 " });
    await expect(tags.createTag("Leads", { name: "CAFÉ" })).rejects.toBeInstanceOf(ValidationError);
    const other = await tags.createTag("Leads", { name: "Other" });
    await expect(tags.renameTag("Leads", other.id, "café")).rejects.toBeInstanceOf(ValidationError);
    await expect(tags.renameTag("Leads", tag.id, " ")).rejects.toBeInstanceOf(ValidationError);
    expect((await tags.renameTag("Leads", tag.id, "CAFÉ")).id).toBe(tag.id);
    for (const color of ["red", "#123", "#1234567", "#GG1234"])
      await expect(tags.recolorTag("Leads", tag.id, color)).rejects.toBeInstanceOf(ValidationError);
    await expect(tags.createTag("Leads", { name: "Invalid", color: "red" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    for (let i = 2; i < 100; i++) await tags.createTag("Leads", { name: `Tag ${i}` });
    await expect(tags.createTag("Leads", { name: "Overflow" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    const { row } = await first(records, "Leads");
    await tags.addTags(
      "Leads",
      row.id,
      (await tags.listTags("Leads")).map((tag) => tag.id),
    );
    expect(await tags.listRecordTags("Leads", row.id)).toHaveLength(100);
    await tags.deleteTag("Leads", other.id);
    await tags.createTag("Leads", { name: "Replacement" });
    expect(await tags.listTags("Leads")).toHaveLength(100);
  });

  it.each(modules)(
    "%s list/count share all membership predicates including nested groups",
    async (module) => {
      const { records, tags } = setup();
      const { row, viewId } = await first(records, module);
      const a = await tags.createTag(module, { name: "A" });
      const b = await tags.createTag(module, { name: "B" });
      const total = await records.count(module, { viewId });
      await tags.addTags(module, row.id, [a.id]);
      const cases: [Criteria, number][] = [
        [{ field: "Tag", comparator: "equal", value: [a.id, b.id] }, 1],
        [{ field: "Tag", comparator: "equal", value: a.id }, 1],
        [{ field: "Tag", comparator: "not_equal", value: [a.id, b.id] }, total - 1],
        [{ field: "Tag", comparator: "not_equal", value: b.id }, total],
        [{ field: "Tag", comparator: "is_empty", value: null }, total - 1],
        [{ field: "Tag", comparator: "is_not_empty", value: null }, 1],
      ];
      cases.push([
        {
          groupOperator: "and",
          group: [
            { field: "Tag", comparator: "equal", value: a.id },
            { field: "Tag", comparator: "is_not_empty", value: null },
          ],
        },
        1,
      ]);
      for (const [filters, expected] of cases) {
        expect(await records.count(module, { viewId, filters })).toBe(expected);
        const listed: string[] = [];
        for (let page = 1; ; page++) {
          const result = await records.list(module, { viewId, filters, page, perPage: 100 });
          listed.push(...result.records.map((r) => r.id));
          if (!result.moreRecords) break;
        }
        expect(listed).toHaveLength(expected);
      }
      for (const filters of [
        { field: "Tag", comparator: "contains", value: "A" },
        { field: "Tag", comparator: "equal", value: [] },
        { field: "Tag", comparator: "equal", value: [null] },
      ] as Criteria[])
        await expect(records.count(module, { viewId, filters })).rejects.toBeInstanceOf(
          ValidationError,
        );
    },
  );

  it.each(modules)("%s rejects direct Tag writes and enforces target locks", async (module) => {
    const { records, tags } = setup();
    const { row } = await first(records, module);
    for (const Tag of [null, [], [{ id: "fake", name: "Fake" }]]) {
      await expect(records.update(module, row.id, { Tag })).rejects.toBeInstanceOf(ValidationError);
      await expect(records.create(module, { Tag })).rejects.toBeInstanceOf(ValidationError);
      await expect(records.massUpdate(module, [row.id], { Tag })).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    const tag = await tags.createTag(module, { name: "Locked" });
    const viewId = (await records.listViews(module))[0]?.id;
    if (!viewId) throw new Error("Missing view");
    const locked = (await records.list(module, { viewId, page: 1, perPage: 100 })).records.find(
      (r) => r.fields.Locked__s === true,
    );
    if (!locked) throw new Error("Missing locked record");
    await expect(tags.addTags(module, locked.id, [tag.id])).rejects.toBeInstanceOf(
      RecordLockedError,
    );
    await expect(tags.removeTags(module, locked.id, [tag.id])).rejects.toBeInstanceOf(
      RecordLockedError,
    );
    expect(await tags.listRecordTags(module, row.id)).toEqual([]);
  });

  it("supports activity metadata generically and cleans tagged children on parent deletion", async () => {
    const { records, tags } = setup();
    const { row } = await first(records, "Leads");
    const task = await records.create("Tasks", {
      Subject: "Synthetic task",
      Who_Id: { module: "Leads", id: row.id },
    });
    const tag = await tags.createTag("Tasks", { name: "Activity" });
    await tags.addTags("Tasks", task.id, [tag.id]);
    expect((await records.get("Tasks", task.id)).fields.Tag).toEqual([
      { id: tag.id, name: "Activity" },
    ]);
    await records.delete("Leads", [row.id]);
    await expect(tags.listRecordTags("Tasks", task.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await tags.listTags("Tasks")).toEqual([tag]);
  });

  it("rolls back record and tag-link cleanup when the record transaction fails", async () => {
    const { ctx, records, tags } = setup();
    const { row } = await first(records, "Leads");
    const tag = await tags.createTag("Leads", { name: "Retained" });
    await tags.addTags("Leads", row.id, [tag.id]);
    const failing = createFixtureRecordService(ctx, {
      beforeHistoryAppend() {
        throw new Error("History failure");
      },
    });
    await expect(failing.delete("Leads", [row.id])).rejects.toThrow("History failure");
    expect((await records.get("Leads", row.id)).fields.Tag).toEqual([
      { id: tag.id, name: "Retained" },
    ]);
    await records.delete("Leads", [row.id]);
    expect(await tags.listTags("Leads")).toEqual([tag]);
  });

  it("rejects unsupported modules and uses the same write policy for members", async () => {
    const { ctx, tags } = setup();
    for (const module of ["DealHistory", "Missing"])
      await expect(tags.createTag(module, { name: "Denied" })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    const member = createFixtureTagService({ ...ctx, role: "member", userId: "member" });
    const tag = await member.createTag("Leads", { name: "Module writer" });
    expect(tag.createdBy).toBe("member");
  });
});
