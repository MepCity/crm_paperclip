export interface BlobKey {
  orgId: string;
  attachmentId: string;
}

export interface StagedBlob {
  key: BlobKey;
  size: number;
  sha256: string;
  mediaType: string;
}

export interface BlobStore {
  /** Counts bytes while streaming; stops and removes the staging file past `maxBytes` or on a policy failure. */
  stage(
    key: BlobKey,
    body: ReadableStream<Uint8Array>,
    limits: { maxBytes: number },
    declared: { fileName: string; mediaType?: string },
  ): Promise<StagedBlob>;
  /** Atomic rename staging → final. */
  publish(key: BlobKey): Promise<void>;
  read(key: BlobKey): Promise<ReadableStream<Uint8Array>>;
  /** Idempotent: a missing blob is a success. */
  delete(key: BlobKey): Promise<void>;
  /** Removes staging files older than the given age; returns how many were removed. */
  purgeStaging(olderThanMs: number): Promise<number>;
}

export class BlobNotFoundError extends Error {
  constructor() {
    super("Blob not found");
    this.name = "BlobNotFoundError";
  }
}

export class InvalidBlobKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBlobKeyError";
  }
}
