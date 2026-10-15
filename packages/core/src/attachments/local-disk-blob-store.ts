import { createHash, randomBytes } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { lstat, mkdir, open, readdir, realpath, rename, rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  type BlobKey,
  BlobNotFoundError,
  type BlobStore,
  InvalidBlobKeyError,
  type StagedBlob,
} from "./blob-store";
import {
  checkSignature,
  createTextValidator,
  FilePolicyError,
  inspectOoxml,
  isOoxml,
  resolveAllowedType,
  SIGNATURE_BYTES,
} from "./file-policy";

const COMPONENT = /^[A-Za-z0-9_-]{1,64}$/;
const STAGING = ".staging";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

function isLinkError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  return code === "ELOOP" || code === "EMLINK";
}

export function defaultAttachmentsRoot(): string {
  return process.env.MEP_ATTACHMENTS_DIR || path.resolve(".data/attachments");
}

function assertKey(key: BlobKey): void {
  for (const part of [key.orgId, key.attachmentId]) {
    if (typeof part !== "string" || !COMPONENT.test(part)) {
      throw new InvalidBlobKeyError("Invalid blob key component");
    }
  }
}

export class LocalDiskBlobStore implements BlobStore {
  private readonly root: string;
  private realRoot: string | undefined;

  constructor(root: string = defaultAttachmentsRoot()) {
    this.root = path.resolve(root);
  }

  private async rootDir(): Promise<string> {
    if (!this.realRoot) {
      await mkdir(this.root, { recursive: true });
      this.realRoot = await realpath(this.root);
    }
    return this.realRoot;
  }

  /** Creates the parent directory (if asked) and returns the file path, keeping it inside the root. */
  private async resolve(base: "final" | "staging", key: BlobKey, create: boolean): Promise<string> {
    assertKey(key);
    const root = await this.rootDir();
    const dir = base === "final" ? path.join(root, key.orgId) : path.join(root, STAGING, key.orgId);
    const file = path.join(dir, key.attachmentId);
    if (path.relative(root, file).startsWith(".."))
      throw new InvalidBlobKeyError("Path escapes root");
    if (create) await mkdir(dir, { recursive: true });
    try {
      const info = await lstat(dir);
      if (info.isSymbolicLink()) throw new InvalidBlobKeyError("Symbolic link in blob path");
      const real = await realpath(dir);
      if (
        path.relative(root, real).startsWith("..") ||
        path.isAbsolute(path.relative(root, real))
      ) {
        throw new InvalidBlobKeyError("Path escapes root");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return file;
  }

  async stage(
    key: BlobKey,
    body: ReadableStream<Uint8Array>,
    limits: { maxBytes: number },
    declared: { fileName: string; mediaType?: string },
  ): Promise<StagedBlob> {
    const allowed = resolveAllowedType(declared);
    const file = await this.resolve("staging", key, true);
    let handle: Awaited<ReturnType<typeof open>>;
    try {
      handle = await open(
        file,
        fsConstants.O_RDWR | fsConstants.O_CREAT | fsConstants.O_TRUNC | NOFOLLOW,
        0o600,
      );
    } catch (error) {
      if (isLinkError(error)) throw new InvalidBlobKeyError("Symbolic link in blob path");
      throw error;
    }
    const hash = createHash("sha256");
    const text = allowed.kind === "text" ? createTextValidator() : undefined;
    let head = new Uint8Array(0);
    let size = 0;
    try {
      const reader = body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limits.maxBytes) {
          await reader.cancel().catch(() => undefined);
          throw new FilePolicyError("too_large", "File exceeds the size limit");
        }
        if (head.length < SIGNATURE_BYTES) {
          const merged = new Uint8Array(Math.min(SIGNATURE_BYTES, head.length + value.length));
          merged.set(head);
          merged.set(value.subarray(0, merged.length - head.length), head.length);
          head = merged;
          if (head.length >= SIGNATURE_BYTES) checkSignature(allowed.kind, head);
        }
        text?.write(value);
        hash.update(value);
        await handle.write(value);
      }
      if (size === 0) throw new FilePolicyError("malformed", "File is empty");
      if (head.length < SIGNATURE_BYTES) checkSignature(allowed.kind, head);
      text?.end();
      if (isOoxml(allowed.kind)) {
        await inspectOoxml(allowed.kind, size, async (start, length) => {
          const buffer = new Uint8Array(length);
          await handle.read(buffer, 0, length, start);
          return buffer;
        });
      }
      await handle.close();
    } catch (error) {
      await handle.close().catch(() => undefined);
      await rm(file, { force: true });
      throw error;
    }
    return { key, size, sha256: hash.digest("hex"), mediaType: allowed.mediaType };
  }

  async publish(key: BlobKey): Promise<void> {
    const from = await this.resolve("staging", key, false);
    const to = await this.resolve("final", key, true);
    try {
      if ((await lstat(from)).isSymbolicLink()) {
        throw new InvalidBlobKeyError("Symbolic link in blob path");
      }
      await rename(from, to);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new BlobNotFoundError();
      throw error;
    }
  }

  async read(key: BlobKey): Promise<ReadableStream<Uint8Array>> {
    const file = await this.resolve("final", key, false);
    let handle: Awaited<ReturnType<typeof open>>;
    try {
      handle = await open(file, fsConstants.O_RDONLY | NOFOLLOW);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || isLinkError(error)) throw new BlobNotFoundError();
      throw error;
    }
    try {
      if (!(await handle.stat()).isFile()) throw new BlobNotFoundError();
    } catch (error) {
      await handle.close().catch(() => undefined);
      throw error;
    }
    return Readable.toWeb(handle.createReadStream()) as unknown as ReadableStream<Uint8Array>;
  }

  async delete(key: BlobKey): Promise<void> {
    await rm(await this.resolve("final", key, false), { force: true });
    await rm(await this.resolve("staging", key, false), { force: true });
  }

  async purgeStaging(olderThanMs: number): Promise<number> {
    const dir = path.join(await this.rootDir(), STAGING);
    let removed = 0;
    let orgs: string[];
    try {
      orgs = await readdir(dir);
    } catch {
      return 0;
    }
    const cutoff = Date.now() - olderThanMs;
    for (const org of orgs) {
      const orgDir = path.join(dir, org);
      for (const name of await readdir(orgDir).catch(() => [])) {
        const file = path.join(orgDir, name);
        const info = await lstat(file).catch(() => undefined);
        if (info && info.mtimeMs <= cutoff) {
          await rm(file, { force: true });
          removed += 1;
        }
      }
    }
    return removed;
  }
}

export function createBlobKey(orgId: string): BlobKey {
  return { orgId, attachmentId: randomBytes(16).toString("hex") };
}
