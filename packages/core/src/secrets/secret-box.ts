import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface SecretAad {
  organizationId: string;
  purpose: string;
}

export interface SecretBox {
  seal(plaintext: string, aad: SecretAad): string;
  open(sealed: string, aad: SecretAad): string;
  rewrap(sealed: string, aad: SecretAad): string;
}

export interface AesGcmSecretBoxOptions {
  keys: Map<string, Buffer>;
  activeKeyId: string;
}

/** Single uniform error; never carries plaintext, keys or ciphertext. */
export class SecretBoxError extends Error {
  constructor() {
    super("Secret could not be processed");
    this.name = "SecretBoxError";
  }
}

const VERSION = "v1";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const aadBuffer = (aad: SecretAad, keyId: string): Buffer =>
  Buffer.from(JSON.stringify([VERSION, keyId, aad.organizationId, aad.purpose]), "utf8");

export function parseSecretBoxKeys(raw: string): Map<string, Buffer> {
  const keys = new Map<string, Buffer>();
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (trimmed === "") continue;
    const sep = trimmed.indexOf(":");
    const id = sep < 0 ? "" : trimmed.slice(0, sep);
    if (!KEY_ID_PATTERN.test(id)) throw new Error("Invalid secret box key entry");
    if (keys.has(id)) throw new Error("Duplicate secret box key id");
    const key = Buffer.from(trimmed.slice(sep + 1), "base64");
    if (key.length !== KEY_BYTES) throw new Error("Secret box keys must be 32 bytes");
    keys.set(id, key);
  }
  if (keys.size === 0) throw new Error("No secret box keys configured");
  return keys;
}

export function createAesGcmSecretBox(options: AesGcmSecretBoxOptions): SecretBox {
  const { keys, activeKeyId } = options;
  for (const [id, key] of keys) {
    if (!KEY_ID_PATTERN.test(id)) throw new Error("Invalid secret box key id");
    if (key.length !== KEY_BYTES) throw new Error("Secret box keys must be 32 bytes");
  }
  if (!keys.has(activeKeyId)) throw new Error("Active secret box key is not in the key ring");

  const sealWith = (keyId: string, plaintext: string, aad: SecretAad): string => {
    const key = keys.get(keyId) as Buffer;
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
    cipher.setAAD(aadBuffer(aad, keyId));
    const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, keyId, ...[iv, ct, tag].map((b) => b.toString("base64url"))].join(".");
  };

  const openParsed = (sealed: string, aad: SecretAad): { plaintext: string; keyId: string } => {
    try {
      const parts = typeof sealed === "string" ? sealed.split(".") : [];
      if (parts.length !== 5 || parts[0] !== VERSION) throw new SecretBoxError();
      const [, keyId, ivB, ctB, tagB] = parts as [string, string, string, string, string];
      const key = keys.get(keyId);
      if (!key) throw new SecretBoxError();
      const iv = Buffer.from(ivB, "base64url");
      const tag = Buffer.from(tagB, "base64url");
      if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new SecretBoxError();
      const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
      decipher.setAAD(aadBuffer(aad, keyId));
      decipher.setAuthTag(tag);
      const pt = Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]);
      return { plaintext: pt.toString("utf8"), keyId };
    } catch {
      throw new SecretBoxError();
    }
  };

  return {
    seal: (plaintext, aad) => sealWith(activeKeyId, plaintext, aad),
    open: (sealed, aad) => openParsed(sealed, aad).plaintext,
    rewrap(sealed, aad) {
      const { plaintext, keyId } = openParsed(sealed, aad);
      return keyId === activeKeyId ? sealed : sealWith(activeKeyId, plaintext, aad);
    },
  };
}
