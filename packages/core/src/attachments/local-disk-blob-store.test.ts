import { mkdtemp, readdir, rm, stat, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BlobNotFoundError, InvalidBlobKeyError } from "./blob-store";
import { createBlobKey, defaultAttachmentsRoot, LocalDiskBlobStore } from "./local-disk-blob-store";

const limits = { maxBytes: 1024 };

function body(content: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(content);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
  }
  return chunks.join("");
}

let root: string;
let store: LocalDiskBlobStore;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "mep-blob-unit-"));
  store = new LocalDiskBlobStore(root);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("LocalDiskBlobStore", () => {
  it("round-trips a blob through stage, publish, read and delete", async () => {
    const key = createBlobKey("org_1");
    await store.stage(key, body("payload"), limits, { fileName: "a.txt" });
    await store.publish(key);
    expect(await readAll(await store.read(key))).toBe("payload");
    await store.delete(key);
    await expect(store.read(key)).rejects.toBeInstanceOf(BlobNotFoundError);
  });

  it("rejects reading a key that was never published", async () => {
    await expect(store.read({ orgId: "org_1", attachmentId: "missing" })).rejects.toBeInstanceOf(
      BlobNotFoundError,
    );
  });

  it("treats deleting a missing key as a no-op", async () => {
    await expect(
      store.delete({ orgId: "org_1", attachmentId: "missing" }),
    ).resolves.toBeUndefined();
  });

  it("fails to publish a key that was never staged", async () => {
    await expect(store.publish({ orgId: "org_1", attachmentId: "missing" })).rejects.toBeInstanceOf(
      BlobNotFoundError,
    );
  });

  it("keeps blobs of different orgs with the same attachment id apart", async () => {
    const a = { orgId: "org_a", attachmentId: "same" };
    const b = { orgId: "org_b", attachmentId: "same" };
    for (const [key, text] of [
      [a, "from a"],
      [b, "from b"],
    ] as const) {
      await store.stage(key, body(text), limits, { fileName: "a.txt" });
      await store.publish(key);
    }
    expect(await readAll(await store.read(a))).toBe("from a");
    await store.delete(a);
    expect(await readAll(await store.read(b))).toBe("from b");
  });

  it("rejects invalid keys on every operation", async () => {
    const bad = { orgId: "org_1", attachmentId: "../escape" };
    await expect(store.publish(bad)).rejects.toBeInstanceOf(InvalidBlobKeyError);
    await expect(store.delete(bad)).rejects.toBeInstanceOf(InvalidBlobKeyError);
    await expect(store.stage(bad, body("x"), limits, { fileName: "a.txt" })).rejects.toBeInstanceOf(
      InvalidBlobKeyError,
    );
    await expect(store.read({ orgId: "../org", attachmentId: "x" })).rejects.toBeInstanceOf(
      InvalidBlobKeyError,
    );
    await expect(
      store.read({ orgId: 1 as unknown as string, attachmentId: "x" }),
    ).rejects.toBeInstanceOf(InvalidBlobKeyError);
  });

  it("purges only staged files older than the cutoff", async () => {
    const oldKey = { orgId: "org_1", attachmentId: "old" };
    const freshKey = { orgId: "org_1", attachmentId: "fresh" };
    await store.stage(oldKey, body("o"), limits, { fileName: "a.txt" });
    await store.stage(freshKey, body("f"), limits, { fileName: "a.txt" });
    const past = new Date(Date.now() - 3_600_000);
    await utimes(path.join(root, ".staging", "org_1", "old"), past, past);
    expect(await store.purgeStaging(60_000)).toBe(1);
    expect(await readdir(path.join(root, ".staging", "org_1"))).toEqual(["fresh"]);
  });

  it("returns 0 when purging with no staging directory", async () => {
    expect(await store.purgeStaging(0)).toBe(0);
  });

  it("creates the root lazily", async () => {
    const nested = path.join(root, "nested", "dir");
    const lazy = new LocalDiskBlobStore(nested);
    await expect(stat(nested)).rejects.toThrow();
    await lazy.stage({ orgId: "o", attachmentId: "a" }, body("x"), limits, { fileName: "a.txt" });
    expect((await stat(nested)).isDirectory()).toBe(true);
  });
});

describe("createBlobKey", () => {
  it("keeps the org and makes a 32-char hex attachment id", () => {
    const key = createBlobKey("org_1");
    expect(key.orgId).toBe("org_1");
    expect(key.attachmentId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generates unique ids", () => {
    expect(createBlobKey("o").attachmentId).not.toBe(createBlobKey("o").attachmentId);
  });
});

describe("defaultAttachmentsRoot", () => {
  const original = process.env.MEP_ATTACHMENTS_DIR;
  afterEach(() => {
    if (original === undefined) delete process.env.MEP_ATTACHMENTS_DIR;
    else process.env.MEP_ATTACHMENTS_DIR = original;
  });

  it("uses MEP_ATTACHMENTS_DIR when set", () => {
    process.env.MEP_ATTACHMENTS_DIR = "/custom/attachments";
    expect(defaultAttachmentsRoot()).toBe("/custom/attachments");
  });

  it("falls back to .data/attachments under the cwd", () => {
    delete process.env.MEP_ATTACHMENTS_DIR;
    expect(defaultAttachmentsRoot()).toBe(path.resolve(".data/attachments"));
  });
});
