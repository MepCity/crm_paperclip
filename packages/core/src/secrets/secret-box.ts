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

const B64URL = /^[A-Za-z0-9_-]*$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

const decodeB64Url = (value: string): Buffer => {
  if (!B64URL.test(value)) throw new SecretBoxError();
  const buf = Buffer.from(value, "base64url");
  if (buf.toString("base64url") !== value) throw new SecretBoxError();
  return buf;
};

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
    const b64 = trimmed.slice(sep + 1);
    if (!B64.test(b64)) throw new Error("Secret box keys must be valid base64");
    const key = Buffer.from(b64, "base64");
    if (key.length !== KEY_BYTES) throw new Error("Secret box keys must be 32 bytes");
    keys.set(id, key);
  }
  if (keys.size === 0) throw new Error("No secret box keys configured");
  return keys;
}

export function createAesGcmSecretBox(options: AesGcmSecretBoxOptions): SecretBox {
  const { keys, activeKeyId } = options;
  if (!keys || typeof keys.entries !== "function") {
    throw new Error("Secret box keys must be provided as a Map");
  }
  const internalKeys = new Map<string, Buffer>();
  for (const [id, key] of keys) {
    if (!KEY_ID_PATTERN.test(id)) throw new Error("Invalid secret box key id");
    if (!Buffer.isBuffer(key) || key.length !== KEY_BYTES) {
      throw new Error("Secret box keys must be 32 bytes");
    }
    internalKeys.set(id, Buffer.from(key));
  }
  if (!internalKeys.has(activeKeyId))
    throw new Error("Active secret box key is not in the key ring");

  const sealWith = (keyId: string, plaintext: string, aad: SecretAad): string => {
    const key = internalKeys.get(keyId) as Buffer;
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
      const key = internalKeys.get(keyId);
      if (!key) throw new SecretBoxError();
      const iv = decodeB64Url(ivB);
      const tag = decodeB64Url(tagB);
      if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new SecretBoxError();
      const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
      decipher.setAAD(aadBuffer(aad, keyId));
      decipher.setAuthTag(tag);
      const pt = Buffer.concat([decipher.update(decodeB64Url(ctB)), decipher.final()]);
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

export const DEFAULT_SECRET_BOX_KEYS_ENV = "SECRET_BOX_KEYS";
export const DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV = "SECRET_BOX_ACTIVE_KEY_ID";

export interface SecretBoxEnvOptions {
  keysEnvVar?: string;
  activeKeyIdEnvVar?: string;
}

export function loadSecretBoxKeyRingFromEnv(
  env: Record<string, string | undefined> = process.env,
  options?: SecretBoxEnvOptions,
): AesGcmSecretBoxOptions {
  const keysVar = options?.keysEnvVar ?? DEFAULT_SECRET_BOX_KEYS_ENV;
  const activeVar = options?.activeKeyIdEnvVar ?? DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV;

  const rawKeys = env[keysVar];
  if (!rawKeys || rawKeys.trim() === "") {
    throw new Error(`${keysVar} environment variable is required`);
  }

  const rawActiveKeyId = env[activeVar];
  if (!rawActiveKeyId || rawActiveKeyId.trim() === "") {
    throw new Error(`${activeVar} environment variable is required`);
  }

  const activeKeyId = rawActiveKeyId.trim();
  if (!KEY_ID_PATTERN.test(activeKeyId)) {
    throw new Error("Invalid active secret box key id");
  }

  const keys = parseSecretBoxKeys(rawKeys);
  if (!keys.has(activeKeyId)) {
    throw new Error("Active secret box key is not in the key ring");
  }

  return { keys, activeKeyId };
}

export function loadSecretBoxFromEnv(
  env: Record<string, string | undefined> = process.env,
  options?: SecretBoxEnvOptions,
): SecretBox {
  const { keys, activeKeyId } = loadSecretBoxKeyRingFromEnv(env, options);
  return createAesGcmSecretBox({ keys, activeKeyId });
}

export const loadSecretBoxOptionsFromEnv = loadSecretBoxKeyRingFromEnv;
export const loadSecretBoxKeysFromEnv = loadSecretBoxKeyRingFromEnv;
