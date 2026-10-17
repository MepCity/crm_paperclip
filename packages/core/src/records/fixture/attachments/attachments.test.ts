import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ATTACHMENT_CARD_MODULES, ATTACHMENT_PARENT_MODULES } from "../../../attachments/modules";
import { ForbiddenError, NotFoundError, RecordLockedError, ValidationError } from "../../../errors";
import type { OrgContext } from "../../../tenancy/types";
import type { RecordData, RecordInput } from "../../contract";
import type { FixtureModuleStore } from "../hooks";
import { createFixtureAttachmentLifecycle, createFixtureRecordService } from "../index";
import { fixtureModules, supportedModules } from "../registry";
import { attachmentParentModules, attachmentsMetadata } from "./metadata";
import { generateFixtureAttachments } from "./seed";

function requireValue<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing fixture value.");
  return value;
}

function make() {
  const context: OrgContext = {
    orgId: randomUUID(),
    orgSlug: "attachment-test",
    orgName: "Fixture Organization",
    userId: "test-user",
    role: "admin",
  };
  return {
    service: createFixtureRecordService(context),
    lifecycle: createFixtureAttachmentLifecycle(context),
    context,
  };
}
const file = (module: string, id: string, extra: RecordInput = {}): RecordInput => ({
  File_Name: "example.pdf",
  Size: "12",
  Parent_Id: { module, id },
  ...extra,
});
const link = (module: string, id: string, url = "https://example.test/document"): RecordInput =>
  file(module, id, { File_Name: url, Size: "0", $type: "link", $link_url: url });
const published = {
  storageKey: "opaque-key",
  checksum: "test-checksum",
  mediaType: "application/pdf",
};
const listQuery = { viewId: "all-attachments", page: 1, perPage: 10 };
async function lead(service: ReturnType<typeof createFixtureRecordService>, name = "Example") {
  return service.create("Leads", { Last_Name: name, Company: "Example Company" });
}

describe("Attachments record contract", () => {
  it("derives fixture parent validation from the shared API module definition", () => {
    expect(attachmentParentModules).toBe(ATTACHMENT_PARENT_MODULES);
    expect(
      attachmentsMetadata.fields.find((field) => field.apiName === "Parent_Id")?.lookup?.modules,
    ).toBe(ATTACHMENT_PARENT_MODULES);
    expect(attachmentParentModules).not.toContain("Calls");
    expect(ATTACHMENT_CARD_MODULES).toEqual(["Leads", "Contacts", "Accounts", "Deals"]);
    expect(attachmentParentModules).toEqual(
      expect.arrayContaining(["Tasks", "Events", "Campaigns", "Cases", "Solutions"]),
    );
  });
  it("registers evidenced metadata with empty seeds and hides internal fields", async () => {
    const { service } = make();
    expect(generateFixtureAttachments()).toEqual([]);
    expect(await service.getModule("Attachments")).toEqual(attachmentsMetadata);
    const fields = attachmentsMetadata.fields;
    expect(fields.find((field) => field.apiName === "File_Name")).toMatchObject({
      required: true,
      maxLength: 100,
    });
    expect(fields.find((field) => field.apiName === "Size")).toMatchObject({
      required: true,
      dataType: "bigint",
      maxLength: 100,
    });
    expect(
      fields.some((field) =>
        ["$state", "$storage_key", "$checksum", "$media_type"].includes(field.apiName),
      ),
    ).toBe(false);
    expect((await service.list("Attachments", listQuery)).records).toEqual([]);
  });
  it("excludes ready Attachments from discovery and rejects child merges", async () => {
    const { service, lifecycle } = make();
    const parent = await lead(service);
    const attachment = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(attachment.id, published);
    const linked = await service.create("Attachments", link("Leads", parent.id));
    expect((await service.get("Attachments", attachment.id)).id).toBe(attachment.id);
    expect((await service.list("Attachments", listQuery)).records).toHaveLength(2);
    for (const query of [
      { text: "example.pdf" },
      { text: "example.pdf", modules: ["Attachments"] },
      {
        text: "example.pdf",
        modules: ["Attachments"],
        filters: { field: "File_Name", comparator: "equal", value: "example.pdf" },
      },
    ] as const)
      expect(await service.search(query)).toEqual([]);
    expect(supportedModules).not.toContain("Attachments");
    expect(await service.findDuplicateGroups("Attachments", ["File_Name"])).toEqual([]);
    await expect(
      service.merge("Attachments", {
        masterId: attachment.id,
        duplicateIds: [linked.id],
        values: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it.each(attachmentParentModules)(
    "accepts %s parents and resolves Notes to their ultimate parent",
    async (module) => {
      const { service } = make();
      const [view] = await service.listViews(module);
      const parent = (await service.list(module, { ...listQuery, viewId: requireValue(view).id }))
        .records[0];
      if (!parent) throw new Error("Missing fixture parent.");
      const record = await service.create("Attachments", link(module, parent.id));
      expect((await service.get("Attachments", record.id)).fields.Parent_Id).toMatchObject({
        module,
        id: parent.id,
      });
    },
  );
  it.each(["Tasks", "Events", "Campaigns", "Cases", "Solutions"])(
    "publishes, reads and deletes %s files within their tenant",
    async (module) => {
      const { service, lifecycle } = make();
      const parent = await service.create(
        module,
        module === "Events"
          ? {
              Event_Title: "Synthetic",
              Meeting_Venue__s: "In-office",
              Start_DateTime: "2030-01-01T10:00:00Z",
              End_DateTime: "2030-01-01T11:00:00Z",
            }
          : module === "Campaigns"
            ? { Campaign_Name: "Synthetic" }
            : module === "Solutions"
              ? { Solution_Title: "Synthetic" }
              : module === "Cases"
                ? { Subject: "Synthetic", Status: "New", Case_Origin: "Phone" }
                : { Subject: "Synthetic" },
      );
      const attachment = await service.create("Attachments", file(module, parent.id));
      lifecycle.publish(attachment.id, published);
      expect((await service.get("Attachments", attachment.id)).id).toBe(attachment.id);
      const other = make();
      await expect(other.service.get("Attachments", attachment.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(
        other.service.create("Attachments", file(module, parent.id)),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(other.service.delete("Attachments", [attachment.id])).rejects.toBeInstanceOf(
        NotFoundError,
      );
      const activityPeers = [];
      for (const activity of ["Tasks", "Events", "Calls"]) {
        const view = requireValue((await service.listViews(activity))[0]);
        const rows = await service.list(activity, { ...listQuery, viewId: view.id });
        activityPeers.push({ module: activity, id: requireValue(rows.records[0]).id });
      }
      await service.delete(module, [parent.id]);
      for (const peer of activityPeers)
        expect((await service.get(peer.module, peer.id)).id).toBe(peer.id);
      await expect(service.get("Attachments", attachment.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(lifecycle.cleanupIntents()).toEqual([
        { attachmentId: attachment.id, storageKey: published.storageKey },
      ]);
    },
  );
  it.each(["Tasks", "Events", "Calls", "Campaigns"])(
    "cascades %s notes without deleting other activities",
    (module) => {
      // Model pending Notes parent support at the hook boundary, without enabling its API.
      const stores = new Map<string, FixtureModuleStore>();
      const moduleStore = (name: string): FixtureModuleStore => {
        let store = stores.get(name);
        if (!store) {
          store = { records: new Map(), nextId: 1n };
          stores.set(name, store);
        }
        return store;
      };
      for (const activity of ["Tasks", "Events", "Calls"]) {
        moduleStore(activity).records.set("retained", {
          id: "retained",
          fields: { Subject: "Synthetic" },
        });
      }
      moduleStore("Notes").records.set("note", {
        id: "note",
        fields: { Parent_Id: { module, id: "deleted" } },
      });
      for (const [id, parentModule, parentId] of [
        ["direct", module, "deleted"],
        ["nested", "Notes", "note"],
        ["retained", module, "retained"],
      ] as const) {
        moduleStore("Attachments").records.set(id, {
          id,
          fields: { Parent_Id: { module: parentModule, id: parentId }, $type: "link" },
        });
      }
      const hook = fixtureModules[module]?.afterDelete;
      expect(hook).toBeTypeOf("function");
      hook?.(["deleted"], { registeredModules: Object.keys(fixtureModules), moduleStore });
      expect(moduleStore("Notes").records.size).toBe(0);
      expect([...moduleStore("Attachments").records.keys()]).toEqual(["retained"]);
      for (const activity of ["Tasks", "Events", "Calls"])
        expect(moduleStore(activity).records.has("retained")).toBe(true);
    },
  );
  it("rejects invalid modules, malformed and absent parents and mandatory fields", async () => {
    const { service } = make();
    const parent = await lead(service);
    for (const module of ["Calls", "Attachments", "Unknown"]) {
      await expect(service.create("Attachments", file(module, parent.id))).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
    await expect(service.create("Attachments", file("Leads", "missing"))).rejects.toBeInstanceOf(
      ValidationError,
    );
    for (const field of ["File_Name", "Size", "Parent_Id"]) {
      const input = { ...file("Leads", parent.id) };
      delete input[field];
      await expect(service.create("Attachments", input)).rejects.toBeInstanceOf(ValidationError);
    }
    for (const extra of <RecordInput[]>[
      { File_Name: "x".repeat(101) },
      { Size: "-1" },
      { Size: 12 },
      { $state: "ready" },
      { $storage_key: "forged" },
      { $type: "other" },
    ]) {
      await expect(
        service.create("Attachments", file("Leads", parent.id, extra)),
      ).rejects.toBeInstanceOf(ValidationError);
    }
  });
  it("hides pending from get, list, search and exposes only ready public fields", async () => {
    const { service, lifecycle } = make();
    const parent = await lead(service);
    const record = await service.create("Attachments", file("Leads", parent.id));
    expect(record.fields.$state).toBeUndefined();
    expect(lifecycle.isReady(record.id)).toBe(false);
    expect(lifecycle.mediaType(record.id)).toBeNull();
    expect(lifecycle.isReady("unknown-id")).toBe(false);
    expect(lifecycle.mediaType("unknown-id")).toBeNull();
    await expect(service.get("Attachments", record.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await service.list("Attachments", listQuery)).records.length).toBe(0);
    expect(await service.search({ text: "example.pdf", modules: ["Attachments"] })).toEqual([]);
    expect(() =>
      lifecycle.publish(record.id, { ...published, storageKey: "../private-file" }),
    ).toThrow(ValidationError);
    lifecycle.publish(record.id, published);
    expect(lifecycle.isReady(record.id)).toBe(true);
    expect(lifecycle.mediaType(record.id)).toBe("application/pdf");
    expect((await service.get("Attachments", record.id)).fields.$link_url).toBeUndefined();
    expect((await service.list("Attachments", listQuery)).records.length).toBe(1);
    expect((await service.get("Attachments", record.id)).fields).toMatchObject({
      $type: "file",
      File_Name: "example.pdf",
      Size: "12",
    });
    expect(JSON.stringify(await service.get("Attachments", record.id))).not.toContain("opaque-key");
    expect((await service.get("Attachments", record.id)).fields.$checksum).toBeUndefined();
    await expect(
      service.update("Attachments", record.id, {
        Parent_Id: { module: "Contacts", id: parent.id },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.update("Attachments", record.id, {
        $type: "link",
        $link_url: "https://example.test/file",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(() => lifecycle.publish(record.id, published)).toThrow(ValidationError);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/plain,text",
    "ftp://example.test/file",
    "file:///document",
    "invalid",
  ])("rejects unsafe link %s", async (url) => {
    const { service } = make();
    const parent = await lead(service);
    await expect(
      service.create("Attachments", link("Leads", parent.id, url)),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it.each(["http://example.test/file", "https://example.test/file"])(
    "uses URL as link title without blob cleanup: %s",
    async (url) => {
      const { service, lifecycle } = make();
      const parent = await lead(service);
      const record = await service.create("Attachments", {
        ...link("Leads", parent.id, url),
        File_Name: "Ignored title",
      });
      expect((await service.get("Attachments", record.id)).fields.File_Name).toBe(url);
      await service.delete("Attachments", [record.id]);
      expect(lifecycle.cleanupIntents()).toEqual([]);
    },
  );
  it("cascades direct and note attachments after full parent batch validation", async () => {
    const { service, lifecycle } = make();
    const parent = await lead(service);
    const other = await lead(service, "Other");
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: parent.id } });
    const direct = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(direct.id, published);
    const nested = await service.create("Attachments", file("Notes", note.id));
    lifecycle.publish(nested.id, { ...published, storageKey: "note-key" });
    const pending = await service.create("Attachments", file("Leads", parent.id));
    const retained = await service.create("Attachments", link("Leads", other.id));
    await expect(service.delete("Leads", [parent.id, "missing"])).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(lifecycle.cleanupIntents()).toEqual([]);
    expect((await service.get("Attachments", direct.id)).id).toBe(direct.id);
    const bundle = requireValue(fixtureModules.Leads);
    const original = bundle.createDefaults;
    bundle.createDefaults = (stamp) => ({ ...original(stamp), Locked__s: true });
    let locked: RecordData;
    try {
      locked = await lead(service, "Locked");
    } finally {
      bundle.createDefaults = original;
    }
    await expect(service.delete("Leads", [parent.id, locked.id])).rejects.toBeInstanceOf(
      RecordLockedError,
    );
    expect(lifecycle.cleanupIntents()).toEqual([]);
    await service.delete("Leads", [parent.id]);
    await expect(service.get("Notes", note.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(
      (await service.list("Attachments", listQuery)).records.map((record) => record.id),
    ).toEqual([retained.id]);
    expect(lifecycle.cleanupIntents()).toEqual(
      expect.arrayContaining([
        { attachmentId: direct.id, storageKey: "opaque-key" },
        { attachmentId: nested.id, storageKey: "note-key" },
        { attachmentId: pending.id, storageKey: null },
      ]),
    );
    expect(lifecycle.cleanupIntents()).toHaveLength(3);
    expect(() => lifecycle.publish(pending.id, published)).toThrow(NotFoundError);
    lifecycle.acknowledgeCleanup(direct.id);
    expect(lifecycle.cleanupIntents()).toHaveLength(2);
  });
  it("keeps cleanup intents across store replacements and rolls back failed cascades", async () => {
    const { service, lifecycle, context } = make();
    const parent = await lead(service);
    const first = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(first.id, published);
    await service.delete("Attachments", [first.id]);
    const second = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(second.id, { ...published, storageKey: "second-key" });
    const expected = [{ attachmentId: first.id, storageKey: "opaque-key" }];
    expect(lifecycle.cleanupIntents()).toEqual(expected);
    const failingService = createFixtureRecordService(context, {
      beforeHistoryAppend() {
        throw new Error("History unavailable");
      },
    });
    await expect(failingService.delete("Leads", [parent.id])).rejects.toThrow(
      "History unavailable",
    );
    expect(lifecycle.cleanupIntents()).toEqual(expected);
    expect((await service.get("Attachments", second.id)).id).toBe(second.id);
    const freshLifecycle = createFixtureAttachmentLifecycle(context);
    freshLifecycle.acknowledgeCleanup(first.id);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    await service.delete("Leads", [parent.id]);
    expect(freshLifecycle.cleanupIntents()).toEqual([
      { attachmentId: second.id, storageKey: "second-key" },
    ]);
  });
  it("rolls back attachment deletion and cleanup when parent history cannot commit", async () => {
    const { context, lifecycle } = make();
    let rejectHistory = false;
    const service = createFixtureRecordService(context, {
      beforeHistoryAppend() {
        if (rejectHistory) throw new Error("History unavailable");
      },
    });
    const parent = await lead(service);
    const attachment = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(attachment.id, published);
    rejectHistory = true;
    await expect(service.delete("Leads", [parent.id])).rejects.toThrow("History unavailable");
    expect((await service.get("Attachments", attachment.id)).id).toBe(attachment.id);
    expect((await service.get("Leads", parent.id)).id).toBe(parent.id);
    expect(lifecycle.cleanupIntents()).toEqual([]);
    rejectHistory = false;
    await service.delete("Leads", [parent.id]);
    expect(lifecycle.cleanupIntents()).toEqual([
      { attachmentId: attachment.id, storageKey: published.storageKey },
    ]);
    // A later transaction must retain committed cleanup until acknowledged.
    await lead(service, "Another");
    expect(lifecycle.cleanupIntents()).toHaveLength(1);
    lifecycle.acknowledgeCleanup(attachment.id);
    expect(lifecycle.cleanupIntents()).toEqual([]);
  });
  it.each(["Leads", "Contacts"])(
    "cascades campaign memberships and attachments together when deleting %s",
    async (module) => {
      const { service, lifecycle } = make();
      const parent = await service.create(module, {
        Last_Name: "Synthetic Member",
        ...(module === "Leads" ? { Company: "Synthetic Company" } : {}),
      });
      const campaign = await service.create("Campaigns", { Campaign_Name: "Synthetic Campaign" });
      const membership = await service.create("Campaign_Members", {
        Campaign: { module: "Campaigns", id: campaign.id },
        [module === "Leads" ? "Lead" : "Contact"]: { module, id: parent.id },
      });
      const attachment = await service.create("Attachments", file(module, parent.id));
      lifecycle.publish(attachment.id, published);
      await service.delete(module, [parent.id]);
      await expect(service.get("Campaign_Members", membership.id)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      await expect(service.get("Attachments", attachment.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(lifecycle.cleanupIntents()).toEqual([
        { attachmentId: attachment.id, storageKey: published.storageKey },
      ]);
      expect((await service.get("Campaigns", campaign.id)).id).toBe(campaign.id);
    },
  );
  it("removes note attachments on direct note deletion and file attachments on direct deletion", async () => {
    const { service, lifecycle } = make();
    const parent = await lead(service);
    const note = await service.create("Notes", { Parent_Id: { module: "Leads", id: parent.id } });
    const child = await service.create("Attachments", file("Notes", note.id));
    lifecycle.publish(child.id, published);
    await service.delete("Notes", [note.id]);
    await expect(service.get("Attachments", child.id)).rejects.toBeInstanceOf(NotFoundError);
    const direct = await service.create("Attachments", file("Leads", parent.id));
    lifecycle.publish(direct.id, published);
    await service.delete("Attachments", [direct.id]);
    expect(lifecycle.cleanupIntents()).toHaveLength(2);
  });
  it.each(["Leads", "Contacts", "Accounts", "Deals", "Cases", "Solutions"])(
    "cascades %s direct and note children",
    async (module) => {
      const { service, lifecycle } = make();
      const [view] = await service.listViews(module);
      const parent =
        module === "Solutions"
          ? await service.create(module, { Solution_Title: "Synthetic" })
          : requireValue(
              (
                await service.list(module, { ...listQuery, viewId: requireValue(view).id })
              ).records.find((row) => row.fields.Locked__s !== true),
            );
      const note = await service.create("Notes", { Parent_Id: { module, id: parent.id } });
      const direct = await service.create("Attachments", file(module, parent.id));
      const nested = await service.create("Attachments", file("Notes", note.id));
      lifecycle.publish(direct.id, published);
      lifecycle.publish(nested.id, published);
      await service.delete(module, [parent.id]);
      await expect(service.get("Attachments", direct.id)).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.get("Attachments", nested.id)).rejects.toBeInstanceOf(NotFoundError);
      expect(lifecycle.cleanupIntents()).toHaveLength(2);
    },
  );
  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "transfers %s attachments and notes in merge without changing child IDs or cleaning blobs",
    async (module) => {
      const { service, lifecycle } = make();
      const [view] = await service.listViews(module);
      const rows = (await service.list(module, { ...listQuery, viewId: requireValue(view).id }))
        .records;
      const [master, duplicate] = rows;
      const note = await service.create("Notes", {
        Parent_Id: { module, id: requireValue(duplicate).id },
      });
      const direct = await service.create("Attachments", file(module, requireValue(duplicate).id));
      lifecycle.publish(direct.id, published);
      const nested = await service.create("Attachments", file("Notes", note.id));
      lifecycle.publish(nested.id, published);
      await service.merge(module, {
        masterId: requireValue(master).id,
        duplicateIds: [requireValue(duplicate).id],
        values: {},
      });
      expect((await service.get("Attachments", direct.id)).fields.Parent_Id).toMatchObject({
        module,
        id: requireValue(master).id,
      });
      expect((await service.get("Notes", note.id)).fields.Parent_Id).toMatchObject({
        module,
        id: requireValue(master).id,
      });
      expect((await service.get("Attachments", nested.id)).fields.Parent_Id).toMatchObject({
        module: "Notes",
        id: note.id,
      });
      expect(lifecycle.cleanupIntents()).toEqual([]);
    },
  );
  it("isolates reads, parent validation, publication and cleanup by organization", async () => {
    const first = make();
    const second = make();
    const parent = await lead(first.service);
    await expect(
      second.service.create("Attachments", file("Leads", parent.id)),
    ).rejects.toBeInstanceOf(ValidationError);
    const attachment = await first.service.create("Attachments", file("Leads", parent.id));
    first.lifecycle.publish(attachment.id, published);
    await expect(second.service.get("Attachments", attachment.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(() => second.lifecycle.publish(attachment.id, published)).toThrow(NotFoundError);
    expect((await second.service.list("Attachments", listQuery)).records).toEqual([]);
    await first.service.delete("Leads", [parent.id]);
    expect(first.lifecycle.cleanupIntents()).toHaveLength(1);
    expect(second.lifecycle.cleanupIntents()).toEqual([]);
  });
});
