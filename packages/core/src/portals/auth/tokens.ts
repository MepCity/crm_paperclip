import { createHash, randomBytes } from "node:crypto";

/** ADR 0019a §1.3 / §2.2: 32 random bytes, base64url; only the SHA-256 is stored. */
export function createOpaqueToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

/** A syntactically valid token: 43 base64url characters (32 bytes). Anything else is rejected. */
export function isTokenShape(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Portal slugs are public; they are stored hashed in `public_endpoint_keys` like other keys. */
export function hashPortalSlug(slug: string): string {
  return createHash("sha256").update(`portal:${slug}`, "utf8").digest("base64url");
}
