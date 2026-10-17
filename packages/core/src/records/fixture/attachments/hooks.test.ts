import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../../../errors";
import type { RecordData } from "../../contract";
import type { FixtureHookContext, FixtureModuleStore } from "../hooks";
import {
  attachmentParent,
  attachmentsHooks,
  attachmentUltimateParent,
  fixtureAttachmentLifecycle,
  removeAttachmentIds,
  removeAttachmentsForParents,
} from "./hooks";

const rec = (id: string, fields: RecordData["fields"]): RecordData => ({ id, fields });
function ctx(
  modules: Record<string, RecordData[]>,
  registered = Object.keys(modules),
): FixtureHookContext & { stores: Record<string, FixtureModuleStore> } {
  const stores = Object.fromEntries(
    Object.entries(modules).map(([m, rs]) => [
      m,
      { records: new Map(rs.map((r) => [r.id, r])), nextId: 1n } as FixtureModuleStore,
    ]),
  );
  return {
    registeredModules: registered,
    moduleStore: (m) => stores[m] as FixtureModuleStore,
    stores,
  };
}
const parentOf = (module: string, id: string) => ({ module, id });
const base = () => ({ Parent_Id: parentOf("Leads", "l1"), Size: "5" }) as RecordData["fields"];
const input = {} as never;
const messages = (fn: () => void) => {
  try {
    fn();
  } catch (e) {
    return (e as ValidationError).fieldErrors;
  }
  return undefined;
};

describe("attachmentParent", () => {
  it("accepts only module/id string pairs", () => {
    expect(attachmentParent({ module: "Leads", id: "1", name: "x" })).toEqual({
      module: "Leads",
      id: "1",
    });
    expect(attachmentParent(undefined)).toBeUndefined();
    expect(attachmentParent("x")).toBeUndefined();
    expect(attachmentParent({ module: "Leads", id: 1 } as never)).toBeUndefined();
  });
});

describe("attachmentUltimateParent", () => {
  const c = ctx({
    Leads: [rec("l1", {})],
    Notes: [
      rec("n1", { Parent_Id: parentOf("Leads", "l1") }),
      rec("n2", { Parent_Id: parentOf("Notes", "n1") }),
      rec("n3", { Parent_Id: parentOf("Leads", "missing") }),
    ],
    Attachments: [],
  });
  it("returns a direct parent and resolves a note to its parent", () => {
    expect(attachmentUltimateParent({ Parent_Id: parentOf("Leads", "l1") }, c)).toEqual({
      module: "Leads",
      id: "l1",
    });
    expect(attachmentUltimateParent({ Parent_Id: parentOf("Notes", "n1") }, c)).toEqual({
      module: "Leads",
      id: "l1",
    });
  });
  it("rejects missing, unsupported, unregistered and nested-note parents", () => {
    for (const parent of [
      undefined,
      parentOf("Calls", "x"),
      parentOf("Contacts", "x"),
      parentOf("Notes", "n2"),
      parentOf("Notes", "n3"),
      parentOf("Leads", "nope"),
    ])
      expect(() => attachmentUltimateParent({ Parent_Id: parent as never }, c)).toThrow(
        ValidationError,
      );
  });
});

describe("attachmentsHooks.applyRules", () => {
  const c = ctx({ Leads: [rec("l1", {})], Notes: [], Attachments: [] });
  const run = (fields: RecordData["fields"], previous?: Record<string, never>) =>
    attachmentsHooks.applyRules?.(fields, input, previous as never, c);
  it("defaults to a file type", () => {
    const fields = base();
    run(fields);
    expect(fields.$type).toBe("file");
  });
  it("rejects bad size, type change, unknown type and link url on a file", () => {
    expect(messages(() => run({ ...base(), Size: "-1" }))).toHaveProperty("Size");
    expect(messages(() => run({ ...base(), Size: 5 as never }))).toHaveProperty("Size");
    expect(messages(() => run({ ...base(), $type: "blob" }))).toHaveProperty("$type");
    expect(
      messages(() =>
        run({ ...base(), $type: "link", $link_url: "https://a.test" }, { $type: "file" } as never),
      ),
    ).toHaveProperty("$type");
    expect(messages(() => run({ ...base(), $link_url: "https://a.test" }))).toHaveProperty(
      "$link_url",
    );
  });
  it("normalises a link attachment and rejects bad urls", () => {
    const fields = { ...base(), $type: "link", $link_url: "https://a.test/x", Size: "99" };
    run(fields);
    expect(fields).toMatchObject({ File_Name: "https://a.test/x", Size: "0" });
    for (const url of ["not a url", "ftp://a.test", undefined])
      expect(
        messages(() => run({ ...base(), $type: "link", $link_url: url as never })),
      ).toHaveProperty("$link_url");
  });
});

describe("attachmentsHooks.afterWrite / readRecord", () => {
  const c = ctx({});
  it("sets state by type without overriding an existing state", () => {
    const file = rec("1", { $type: "file" });
    const link = rec("2", { $type: "link" });
    const kept = rec("3", { $type: "file", $state: "ready" });
    for (const r of [file, link, kept]) attachmentsHooks.afterWrite?.(r, undefined, c);
    expect([file.fields.$state, link.fields.$state, kept.fields.$state]).toEqual([
      "pending",
      "ready",
      "ready",
    ]);
  });
  it("hides internal fields, and the link url on files only", () => {
    const secret = { $storage_key: "k", $checksum: "c", $media_type: "m", $state: "ready" };
    const file = attachmentsHooks.readRecord?.(
      rec("1", { File_Name: "a", $type: "file", $link_url: "u", ...secret }),
      new Date(),
    );
    expect(file?.fields).toEqual({ File_Name: "a", $type: "file" });
    const link = attachmentsHooks.readRecord?.(
      rec("2", { $type: "link", $link_url: "u", ...secret }),
      new Date(),
    );
    expect(link?.fields).toEqual({ $type: "link", $link_url: "u" });
  });
});

describe("attachment removal", () => {
  const seed = () =>
    ctx({
      Attachments: [
        rec("f1", { $type: "file", $storage_key: "k1", Parent_Id: parentOf("Leads", "l1") }),
        rec("f2", { $type: "file", Parent_Id: parentOf("Leads", "l1") }),
        rec("k1", { $type: "link", Parent_Id: parentOf("Leads", "l1") }),
        rec("o1", { $type: "file", $storage_key: "k9", Parent_Id: parentOf("Contacts", "l1") }),
      ],
    });
  it("records cleanup intents for files only, de-duplicating ids", () => {
    const c = seed();
    removeAttachmentIds(["f1", "f1", "f2", "k1", "ghost"], c);
    const s = c.stores.Attachments as FixtureModuleStore;
    expect([...s.records.keys()]).toEqual(["o1"]);
    expect(s.attachmentCleanupIntents).toEqual([
      { attachmentId: "f1", storageKey: "k1" },
      { attachmentId: "f2", storageKey: null },
    ]);
  });
  it("is a no-op when Attachments is not registered", () => {
    const c = ctx({ Leads: [] });
    expect(() => removeAttachmentIds(["x"], c)).not.toThrow();
    expect(() => removeAttachmentsForParents("Leads", ["l1"], c)).not.toThrow();
  });
  it("removes only children of the matching module and parent id", () => {
    const c = seed();
    removeAttachmentsForParents("Leads", ["l1"], c);
    expect([...(c.stores.Attachments as FixtureModuleStore).records.keys()]).toEqual(["o1"]);
  });
});

describe("fixtureAttachmentLifecycle", () => {
  const make = () =>
    ctx({
      Leads: [rec("l1", {})],
      Attachments: [
        rec("p", { $type: "file", $state: "pending", Parent_Id: parentOf("Leads", "l1") }),
        rec("r", { $type: "file", $state: "ready", Parent_Id: parentOf("Leads", "l1") }),
        rec("o", { $type: "file", $state: "pending", Parent_Id: parentOf("Leads", "gone") }),
      ],
    });
  const data = { storageKey: "abc_-1", checksum: "c", mediaType: "text/plain" };
  it("publishes a pending file", () => {
    const c = make();
    fixtureAttachmentLifecycle(c).publish("p", data);
    expect((c.stores.Attachments as FixtureModuleStore).records.get("p")?.fields).toMatchObject({
      $storage_key: "abc_-1",
      $checksum: "c",
      $media_type: "text/plain",
      $state: "ready",
    });
  });
  it("rejects unknown, non-pending, orphaned and bad-key publishes", () => {
    const l = fixtureAttachmentLifecycle(make());
    expect(() => l.publish("zzz", data)).toThrow(NotFoundError);
    expect(() => l.publish("r", data)).toThrow(ValidationError);
    expect(() => l.publish("o", data)).toThrow(ValidationError);
    expect(() => l.publish("p", { ...data, storageKey: "../bad" })).toThrow(ValidationError);
  });
  it("lists cloned intents and acknowledges them one by one", () => {
    const c = make();
    removeAttachmentIds(["r", "p"], c);
    const l = fixtureAttachmentLifecycle(c);
    const intents = [...l.cleanupIntents()];
    expect(intents.map((i) => i.attachmentId)).toEqual(["r", "p"]);
    intents.pop();
    expect(l.cleanupIntents()).toHaveLength(2);
    l.acknowledgeCleanup("r");
    expect(l.cleanupIntents().map((i) => i.attachmentId)).toEqual(["p"]);
    expect(fixtureAttachmentLifecycle(ctx({ Attachments: [] })).cleanupIntents()).toEqual([]);
  });
});
