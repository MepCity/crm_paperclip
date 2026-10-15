import { mkdtemp, readdir, readFile, rm, symlink, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BlobNotFoundError } from "./blob-store";
import { createBudgetCounter, FilePolicyError, selectionBudget } from "./file-policy";
import { LocalDiskBlobStore } from "./local-disk-blob-store";

const enc = new TextEncoder();
const body = (...chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
const text = (s: string) => enc.encode(s);
const bytes = (...n: number[]) => new Uint8Array(n);
const pad = (head: number[], total = 64) => {
  const out = new Uint8Array(total);
  out.set(head);
  return out;
};

function zip(names: string[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const name of names) {
    const n = enc.encode(name);
    const local = new Uint8Array(30 + n.length);
    new DataView(local.buffer).setUint32(0, 0x04034b50, true);
    new DataView(local.buffer).setUint16(26, n.length, true);
    local.set(n, 30);
    const c = new Uint8Array(46 + n.length);
    const v = new DataView(c.buffer);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(28, n.length, true);
    v.setUint32(42, offset, true);
    c.set(n, 46);
    parts.push(local);
    central.push(c);
    offset += local.length;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, names.length, true);
  ev.setUint16(10, names.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let p = 0;
  for (const part of all) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

const key = { orgId: "org_1", attachmentId: "att_1" };
const limits = { maxBytes: 1_000_000 };
let root: string;
let store: LocalDiskBlobStore;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "blob-"));
  store = new LocalDiskBlobStore(root);
});
afterEach(() => rm(root, { recursive: true, force: true }));

const stagingFiles = async () =>
  (await readdir(path.join(root, ".staging"), { recursive: true }).catch(() => [])).filter((f) =>
    f.includes("att"),
  );

describe("local disk blob store", () => {
  it("stages, publishes, reads and deletes", async () => {
    const staged = await store.stage(key, body(text("hello "), text("world")), limits, {
      fileName: "a.txt",
      mediaType: "text/plain",
    });
    expect(staged.size).toBe(11);
    expect(staged.sha256).toHaveLength(64);
    expect(staged.mediaType).toBe("text/plain");
    await expect(store.read(key)).rejects.toBeInstanceOf(BlobNotFoundError);
    await store.publish(key);
    const read = await store.read(key);
    expect(await new Response(read).text()).toBe("hello world");
    await store.delete(key);
    await store.delete(key);
    await expect(store.read(key)).rejects.toBeInstanceOf(BlobNotFoundError);
  });

  it("stops at the limit exactly and cleans staging", async () => {
    await expect(
      store.stage(key, body(text("12345"), text("6")), { maxBytes: 5 }, { fileName: "a.txt" }),
    ).rejects.toMatchObject({ code: "too_large" });
    expect(await stagingFiles()).toEqual([]);
    await store.stage(key, body(text("12345")), { maxBytes: 5 }, { fileName: "a.txt" });
  });

  it("rejects traversal in keys", async () => {
    for (const bad of ["../x", "%2e%2e", "/etc/passwd", "a/b", "a\\b", "..", "", "a".repeat(65)]) {
      await expect(store.read({ orgId: bad, attachmentId: "x" })).rejects.toThrow();
      await expect(store.read({ orgId: "o", attachmentId: bad })).rejects.toThrow();
    }
  });

  it("rejects a symbolic link escaping the root", async () => {
    const outside = await mkdtemp(path.join(tmpdir(), "outside-"));
    await symlink(outside, path.join(root, "evil"));
    await expect(
      store.stage({ orgId: "evil", attachmentId: "a" }, body(text("x")), limits, {
        fileName: "a.txt",
      }),
    ).resolves.toBeDefined();
    await expect(store.publish({ orgId: "evil", attachmentId: "a" })).rejects.toThrow();
    expect(await readdir(outside)).toEqual([]);
    await rm(outside, { recursive: true, force: true });
  });

  it("does not read across organizations", async () => {
    await store.stage(key, body(text("x")), limits, { fileName: "a.txt" });
    await store.publish(key);
    await expect(store.read({ orgId: "org_2", attachmentId: "att_1" })).rejects.toBeInstanceOf(
      BlobNotFoundError,
    );
  });

  it("purges old staging files only", async () => {
    await store.stage(key, body(text("x")), limits, { fileName: "a.txt" });
    expect(await store.purgeStaging(60_000)).toBe(0);
    const file = path.join(root, ".staging", "org_1", "att_1");
    const old = new Date(Date.now() - 120_000);
    await utimes(file, old, old);
    expect(await store.purgeStaging(60_000)).toBe(1);
    await expect(readFile(file)).rejects.toThrow();
  });
});

describe("file policy", () => {
  const png = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const accepted: [string, string, Uint8Array][] = [
    ["a.pdf", "application/pdf", pad([0x25, 0x50, 0x44, 0x46, 0x2d])],
    ["a.txt", "text/plain", text("héllo")],
    ["a.csv", "text/csv", text("a,b\n1,2")],
    ["a.png", "image/png", png],
    ["a.jpg", "image/jpeg", pad([0xff, 0xd8, 0xff])],
    ["a.jpeg", "image/jpeg", pad([0xff, 0xd8, 0xff])],
    ["a.gif", "image/gif", pad([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
    [
      "a.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      zip(["[Content_Types].xml", "word/document.xml"]),
    ],
    [
      "a.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip(["[Content_Types].xml", "xl/workbook.xml"]),
    ],
    [
      "a.pptx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      zip(["[Content_Types].xml", "ppt/presentation.xml"]),
    ],
  ];

  it.each(accepted)("accepts %s", async (fileName, mediaType, data) => {
    const staged = await store.stage(key, body(data.subarray(0, 7), data.subarray(7)), limits, {
      fileName,
      mediaType,
    });
    expect(staged.mediaType).toBe(mediaType);
  });

  const rejected: [string, string, string | undefined, Uint8Array, string][] = [
    ["fake extension", "a.pdf", "application/pdf", png, "malformed"],
    ["mismatched type", "a.png", "text/html", png, "type_not_allowed"],
    ["html", "a.html", "text/html", text("<html></html>"), "type_not_allowed"],
    ["html as txt", "a.txt", "text/plain", bytes(0x3c, 0, 0x68), "malformed"],
    ["svg", "a.svg", "image/svg+xml", text("<svg/>"), "type_not_allowed"],
    ["exe", "a.exe", undefined, pad([0x4d, 0x5a]), "type_not_allowed"],
    ["exe as png", "a.png", undefined, pad([0x4d, 0x5a]), "malformed"],
    ["invalid utf-8", "a.txt", undefined, bytes(0xff, 0xfe, 0x41), "malformed"],
    ["empty", "a.txt", undefined, new Uint8Array(0), "malformed"],
    [
      "macro docx",
      "a.docx",
      undefined,
      zip(["[Content_Types].xml", "word/document.xml", "word/vbaProject.bin"]),
      "type_not_allowed",
    ],
    ["docx without content types", "a.docx", undefined, zip(["word/document.xml"]), "malformed"],
    [
      "docx that is xlsx",
      "a.docx",
      undefined,
      zip(["[Content_Types].xml", "xl/a.xml"]),
      "malformed",
    ],
    ["truncated zip", "a.docx", undefined, pad([0x50, 0x4b, 0x03, 0x04]), "malformed"],
  ];

  it.each(rejected)("rejects %s", async (_n, fileName, mediaType, data, code) => {
    const error = await store
      .stage(key, body(data), limits, { fileName, mediaType })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FilePolicyError);
    expect((error as FilePolicyError).code).toBe(code);
    expect(await stagingFiles()).toEqual([]);
  });
});

describe("selection budget", () => {
  it("has the agreed limits", () => {
    expect(selectionBudget("record")).toEqual({ maxFiles: 10, maxBytes: 100_000_000 });
    expect(selectionBudget("note")).toEqual({ maxFiles: 5, maxBytes: 20_000_000 });
  });

  it("is inclusive at the exact byte and file limits", () => {
    const counter = createBudgetCounter(selectionBudget("note"));
    counter.add(19_999_999);
    counter.add(1);
    expect(counter.bytes).toBe(20_000_000);
    expect(() => counter.add(1)).toThrow(FilePolicyError);
    const files = createBudgetCounter(selectionBudget("record"));
    for (let i = 0; i < 10; i++) files.add(1);
    expect(() => files.add(1)).toThrow(FilePolicyError);
  });
});
