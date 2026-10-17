import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "../../errors";
import type { OrgContext } from "../../tenancy/types";
import type { RecordData } from "../contract";
import {
  createFixtureAttachmentLifecycle,
  createFixtureRecordService,
  type FixtureRecordServiceOptions,
} from ".";
import { fixtureModules } from "./registry";

const context = (): OrgContext => ({
  orgId: randomUUID(),
  orgSlug: "test",
  orgName: "Test",
  userId: "admin",
  role: "admin",
});
const make = (options?: FixtureRecordServiceOptions) => {
  const ctx = context();
  return { ctx, service: createFixtureRecordService(ctx, options) };
};
const lead = (service: ReturnType<typeof createFixtureRecordService>, name = "Recovery") =>
  service.create("Leads", { Last_Name: name, Company: "Example" });
const entries = async (service: ReturnType<typeof createFixtureRecordService>) =>
  (await service.recycleBin.list()).entries;
const all = (module: string) => ({
  viewId:
    (
      fixtureModules[module]?.views.find((view) => view.criteria === null) ??
      fixtureModules[module]?.views[0]
    )?.id ?? "",
  page: 1,
  perPage: 100,
});

async function target(service: ReturnType<typeof createFixtureRecordService>, module: string) {
  const seeded = (await service.list(module, all(module))).records.find(
    (row) => row.fields.Locked__s !== true,
  );
  if (seeded) return seeded;
  const parent = await lead(service);
  if (module === "Attachments")
    return service.create(module, {
      Parent_Id: { module: "Leads", id: parent.id },
      $type: "link",
      File_Name: "link",
      $link_url: "https://example.test/file",
      Size: "0",
    });
  if (module === "Campaign_Members") {
    const campaign = (await service.list("Campaigns", all("Campaigns"))).records[0];
    return service.create(module, {
      Campaign: { module: "Campaigns", id: campaign?.id ?? "" },
      Lead: { module: "Leads", id: parent.id },
    });
  }
  throw new Error(`Missing target for ${module}`);
}

describe("recoverable fixture record deletion contract", () => {
  for (const module of Object.keys(fixtureModules).filter(
    (name) => !fixtureModules[name]?.readOnly,
  )) {
    it(`${module}: hides delete from ordinary reads and restores the original identity and values`, async () => {
      const { service } = make();
      const record = await target(service, module);
      const before = await service.get(module, record.id);
      const count = await service.count(module, all(module));
      const searchable = !fixtureModules[module]?.childModule;
      const text = String(before.fields[fixtureModules[module]?.displayNameField ?? ""]);
      if (searchable)
        expect(
          (await service.search({ text, modules: [module], perPage: 100 }))
            .flatMap((group) => group.records)
            .some((row) => row.id === record.id),
        ).toBe(true);
      await service.delete(module, [record.id]);
      await expect(service.get(module, record.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(
        (await service.list(module, all(module))).records.some((row) => row.id === record.id),
      ).toBe(false);
      expect(await service.count(module, all(module))).toBe(count - 1);
      await expect(service.history.list(module, record.id, { perPage: 10 })).rejects.toBeInstanceOf(
        NotFoundError,
      );
      if (searchable)
        expect(
          (await service.search({ text, modules: [module], perPage: 100 }))
            .flatMap((group) => group.records)
            .some((row) => row.id === record.id),
        ).toBe(false);
      const bin = await entries(service);
      expect(bin).toHaveLength(1);
      expect(bin[0]).toMatchObject({ module, recordId: record.id, deletedBy: "admin" });
      await service.recycleBin.restore(bin.map((entry) => entry.id));
      expect(await service.get(module, record.id)).toEqual(before);
      expect(await service.count(module, all(module))).toBe(count);
      expect(await entries(service)).toEqual([]);
    });
  }

  it("restores the complete graph, preserves blobs and follows tag catalogue changes during retention", async () => {
    const { service, ctx } = make();
    const parent = await lead(service);
    const note = await service.create("Notes", {
      Parent_Id: { module: "Leads", id: parent.id },
      Note_Content: "Retained content",
    });
    const task = await service.create("Tasks", {
      Subject: "Retained activity",
      Who_Id: { module: "Leads", id: parent.id },
    });
    const tag = await service.tags.createTag("Leads", { name: "Before" });
    const removedTag = await service.tags.createTag("Leads", { name: "Removed" });
    await service.tags.addTags("Leads", parent.id, [tag.id, removedTag.id]);
    const direct = await service.create("Attachments", {
      Parent_Id: { module: "Leads", id: parent.id },
      File_Name: "file.txt",
      Size: "3",
      $type: "file",
    });
    const nested = await service.create("Attachments", {
      Parent_Id: { module: "Notes", id: note.id },
      File_Name: "nested.txt",
      Size: "3",
      $type: "file",
    });
    const lifecycle = createFixtureAttachmentLifecycle(ctx);
    lifecycle.publish(direct.id, {
      storageKey: "direct",
      checksum: "hash",
      mediaType: "text/plain",
    });
    lifecycle.publish(nested.id, {
      storageKey: "nested",
      checksum: "hash",
      mediaType: "text/plain",
    });
    const snapshots = await Promise.all(
      [
        ["Notes", note],
        ["Tasks", task],
        ["Attachments", direct],
        ["Attachments", nested],
      ].map(async ([module, row]) => ({
        module: module as string,
        record: await service.get(module as string, (row as RecordData).id),
      })),
    );
    await service.delete("Leads", [parent.id]);
    for (const item of snapshots)
      await expect(service.get(item.module, item.record.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(lifecycle.isReady(direct.id)).toBe(false);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    await service.tags.renameTag("Leads", tag.id, "After");
    await service.tags.deleteTag("Leads", removedTag.id);
    await service.recycleBin.restore((await entries(service)).map((entry) => entry.id));
    for (const item of snapshots)
      expect(await service.get(item.module, item.record.id)).toEqual(item.record);
    expect(lifecycle.isReady(direct.id)).toBe(true);
    expect((await service.get("Leads", parent.id)).fields.Tag).toEqual([
      { id: tag.id, name: "After" },
    ]);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    const history = await service.history.list("Leads", parent.id, { perPage: 100 });
    expect(
      history.events
        .filter((event) => ["record_deleted", "record_restored"].includes(event.kind))
        .map((event) => event.kind)
        .sort(),
    ).toEqual(["record_deleted", "record_restored"]);
    const childHistory = await service.history.list("Tasks", task.id, { perPage: 100 });
    expect(childHistory.events.some((event) => event.kind === "record_restored")).toBe(true);
  });

  it("rejects the whole restore on unique conflicts without changing live records or history", async () => {
    const { service } = make();
    const field = fixtureModules.Leads?.metadata.fields.find((field) => field.apiName === "Email");
    if (!field) throw new Error("Missing email metadata");
    const original = field.unique;
    field.unique = true;
    try {
      const a = await service.create("Leads", {
        Last_Name: "First",
        Company: "Example",
        Email: "unique@example.test",
      });
      const b = await lead(service, "Second");
      await service.delete("Leads", [a.id, b.id]);
      const bin = await entries(service);
      const replacement = await service.create("Leads", {
        Last_Name: "Replacement",
        Company: "Example",
        Email: "UNIQUE@example.test",
      });
      await expect(service.recycleBin.restore(bin.map((entry) => entry.id))).rejects.toMatchObject({
        fieldErrors: { Email: expect.any(Array) },
      });
      expect(await entries(service)).toEqual(bin);
      await expect(service.get("Leads", b.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(await service.get("Leads", replacement.id)).toEqual(replacement);
    } finally {
      field.unique = original;
    }
  });

  it("keeps independent child deletions separate and rejects a child until its parent is restored", async () => {
    const { service } = make();
    const parent = await lead(service);
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: parent.id } });
    await service.delete("Notes", [note.id]);
    const childEntry = (await entries(service))[0];
    await service.delete("Leads", [parent.id]);
    await expect(service.recycleBin.restore([childEntry?.id ?? ""])).rejects.toBeInstanceOf(
      ValidationError,
    );
    const parentEntry = (await entries(service)).find((entry) => entry.module === "Leads");
    await service.recycleBin.restore([parentEntry?.id ?? ""]);
    await expect(service.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
    await service.recycleBin.restore([childEntry?.id ?? ""]);
    expect((await service.get("Notes", note.id)).id).toBe(note.id);
  });

  it("enforces deletion-actor visibility before filters, paging and restore; purge and empty require admin", async () => {
    const { service, ctx } = make();
    const member = createFixtureRecordService({ ...ctx, userId: "member", role: "member" });
    const a = await lead(service, "Admin deletion");
    const b = await lead(service, "Member deletion");
    await service.delete("Leads", [a.id]);
    await member.delete("Leads", [b.id]);
    expect((await member.recycleBin.list({ perPage: 1 })).total).toBe(1);
    expect((await member.recycleBin.list({ deletedBy: "admin" })).total).toBe(0);
    const bin = await entries(service);
    const adminId = bin.find((entry) => entry.recordId === a.id)?.id ?? "";
    await expect(member.recycleBin.restore([adminId])).rejects.toBeInstanceOf(NotFoundError);
    await expect(member.recycleBin.purge([])).rejects.toBeInstanceOf(ForbiddenError);
    await expect(member.recycleBin.empty()).rejects.toBeInstanceOf(ForbiddenError);
    const foreign = make().service;
    expect(await entries(foreign)).toEqual([]);
    await expect(foreign.recycleBin.restore([adminId])).rejects.toBeInstanceOf(NotFoundError);
    await expect(foreign.recycleBin.purge([adminId])).rejects.toBeInstanceOf(NotFoundError);
    await service.recycleBin.restore([adminId]);
    expect(await entries(member)).toHaveLength(1);
  });

  it("hides entries at exactly 60 UTC days and never restores expired rows", async () => {
    let instant = Date.parse("2026-01-01T00:00:00Z");
    const { service } = make({ now: () => new Date(instant) });
    const record = await lead(service);
    await service.delete("Leads", [record.id]);
    const entry = (await entries(service))[0];
    expect(entry?.expiresAt).toBe("2026-03-02T00:00:00.000Z");
    instant += 60 * 86_400_000 - 1;
    expect(await entries(service)).toHaveLength(1);
    instant++;
    expect(await entries(service)).toEqual([]);
    await expect(service.recycleBin.restore([entry?.id ?? ""])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await service.recycleBin.empty();
    instant--;
    expect(await entries(service)).toHaveLength(1);
  });

  it("keeps empty selection inert and only queues blob cleanup on permanent purge", async () => {
    const { service, ctx } = make();
    const parent = await lead(service);
    const file = await service.create("Attachments", {
      Parent_Id: { module: "Leads", id: parent.id },
      File_Name: "retained.txt",
      Size: "3",
    });
    const lifecycle = createFixtureAttachmentLifecycle(ctx);
    lifecycle.publish(file.id, {
      storageKey: "retained",
      checksum: "hash",
      mediaType: "text/plain",
    });
    await service.delete("Leads", [parent.id]);
    const bin = await entries(service);
    await service.recycleBin.purge([]);
    await service.recycleBin.restore([]);
    expect(await entries(service)).toEqual(bin);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    await service.recycleBin.purge(bin.map((entry) => entry.id));
    expect(lifecycle.cleanupIntents()).toEqual([{ attachmentId: file.id, storageKey: "retained" }]);
    expect(await entries(service)).toEqual([]);
    await expect(service.recycleBin.restore(bin.map((entry) => entry.id))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("rolls back graph, bin, tags and events if delete or restore event publication fails", async () => {
    let fail = false;
    const { service } = make({
      beforeHistoryAppend: () => {
        if (fail) throw new Error("history failed");
      },
    });
    const parent = await lead(service);
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: parent.id } });
    fail = true;
    await expect(service.delete("Leads", [parent.id])).rejects.toThrow("history failed");
    expect(await entries(service)).toEqual([]);
    expect((await service.get("Notes", note.id)).id).toBe(note.id);
    fail = false;
    await service.delete("Leads", [parent.id]);
    const bin = await entries(service);
    fail = true;
    await expect(service.recycleBin.restore(bin.map((entry) => entry.id))).rejects.toThrow(
      "history failed",
    );
    expect(await entries(service)).toEqual(bin);
    await expect(service.get("Leads", parent.id)).rejects.toBeInstanceOf(NotFoundError);
    fail = false;
    await service.recycleBin.restore(bin.map((entry) => entry.id));
    expect(
      (await service.history.list("Leads", parent.id, { perPage: 100 })).events.filter(
        (event) => event.kind === "record_restored",
      ),
    ).toHaveLength(1);
  });
  it("rejects locked cascades, missing owners and revoked access without partially restoring", async () => {
    let deny = false;
    let members = ["admin"];
    const { service } = make({
      canReadRecord: () => !deny,
      listMemberIds: async () => members,
    });
    const parent = await lead(service);
    const tasks = fixtureModules.Tasks;
    if (!tasks) throw new Error("Missing Tasks metadata");
    const defaults = tasks.createDefaults;
    let locked: RecordData;
    try {
      tasks.createDefaults = (stamp) => ({ ...defaults(stamp), Locked__s: true });
      locked = await service.create("Tasks", {
        Subject: "Locked descendant",
        Who_Id: { module: "Leads", id: parent.id },
      });
    } finally {
      tasks.createDefaults = defaults;
    }
    await service.delete("Leads", [parent.id]);
    const ids = (await entries(service)).map((entry) => entry.id);
    await expect(service.recycleBin.restore(ids)).rejects.toMatchObject({
      fieldErrors: { Locked__s: expect.any(Array) },
    });
    await expect(service.get("Tasks", locked.id)).rejects.toBeInstanceOf(NotFoundError);
    const other = await lead(service, "Permission");
    await service.delete("Leads", [other.id]);
    const entry = (await entries(service)).find((item) => item.recordId === other.id);
    deny = true;
    await expect(service.recycleBin.restore([entry?.id ?? ""])).rejects.toMatchObject({
      fieldErrors: { permission: expect.any(Array) },
    });
    deny = false;
    members = [];
    await expect(service.recycleBin.restore([entry?.id ?? ""])).rejects.toMatchObject({
      fieldErrors: { Owner: expect.any(Array) },
    });
    await expect(service.get("Leads", other.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await entries(service)).toHaveLength(2);
  });

  it("rechecks a concurrent purge after asynchronous membership validation", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let hold = false;
    const { service } = make({
      listMemberIds: async () => {
        if (hold) await gate;
        return ["admin"];
      },
    });
    const parent = await lead(service);
    await service.delete("Leads", [parent.id]);
    const ids = (await entries(service)).map((entry) => entry.id);
    hold = true;
    const restoring = service.recycleBin.restore(ids);
    await service.recycleBin.purge(ids);
    release();
    await expect(restoring).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.get("Leads", parent.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await entries(service)).toEqual([]);
  });

  it("retains live shared endpoints and bytes referenced outside the purged graph", async () => {
    const { service, ctx } = make();
    const a = await lead(service, "Removed");
    const b = await lead(service, "Survivor");
    const lifecycle = createFixtureAttachmentLifecycle(ctx);
    const files = [];
    for (const parent of [a, b]) {
      const file = await service.create("Attachments", {
        Parent_Id: { module: "Leads", id: parent.id },
        File_Name: "shared.txt",
        Size: "3",
      });
      lifecycle.publish(file.id, {
        storageKey: "shared",
        checksum: "hash",
        mediaType: "text/plain",
      });
      files.push(file);
    }
    await service.delete("Leads", [a.id]);
    await service.recycleBin.empty();
    expect(await service.get("Leads", b.id)).toEqual(b);
    expect(lifecycle.isReady(files[1]?.id ?? "")).toBe(true);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    await service.delete("Leads", [b.id]);
    await service.recycleBin.empty();
    expect(lifecycle.cleanupIntents()).toEqual([
      { attachmentId: files[1]?.id, storageKey: "shared" },
    ]);
  });

  it("uses one operation for mass-delete graph events and emits no events on purge", async () => {
    const batches: import("../history").RecordHistoryEvent[][] = [];
    const { service } = make({ beforeHistoryAppend: (events) => batches.push([...events]) });
    const a = await lead(service, "Batch A");
    const b = await lead(service, "Batch B");
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: a.id } });
    batches.length = 0;
    await service.delete("Leads", [a.id, b.id]);
    expect(batches).toHaveLength(1);
    expect(batches[0]?.map((event) => event.subject.recordId).sort()).toEqual(
      [a.id, b.id, note.id].sort(),
    );
    expect(batches[0]?.every((event) => event.kind === "record_deleted")).toBe(true);
    expect(new Set(batches[0]?.map((event) => event.operationId)).size).toBe(1);
    const bin = await entries(service);
    expect(bin).toHaveLength(2);
    await service.recycleBin.restore(bin.map((entry) => entry.id));
    expect(batches).toHaveLength(2);
    expect(batches[1]?.map((event) => event.subject.recordId).sort()).toEqual(
      [a.id, b.id, note.id].sort(),
    );
    expect(batches[1]?.every((event) => event.kind === "record_restored")).toBe(true);
    await service.delete("Leads", [a.id, b.id]);
    batches.length = 0;
    await service.recycleBin.empty();
    expect(batches).toEqual([]);
  });
});
