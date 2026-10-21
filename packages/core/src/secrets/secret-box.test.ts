import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createAesGcmSecretBox,
  parseSecretBoxKeys,
  type SecretAad,
  SecretBoxError,
} from "./secret-box";

const aad: SecretAad = { organizationId: "org-a", purpose: "mail-token" };
const k1 = randomBytes(32);
const k2 = randomBytes(32);
const box = (keys: Record<string, Buffer>, active: string) =>
  createAesGcmSecretBox({ keys: new Map(Object.entries(keys)), activeKeyId: active });
const plain = "refresh-token-for-user@example.com";

describe("SecretBox", () => {
  it("round-trips and embeds the key id", () => {
    const b = box({ k1 }, "k1");
    const sealed = b.seal(plain, aad);
    expect(sealed.startsWith("v1.k1.")).toBe(true);
    expect(sealed).not.toContain(plain);
    expect(b.open(sealed, aad)).toBe(plain);
  });

  it("uses a fresh IV each time", () => {
    const b = box({ k1 }, "k1");
    expect(b.seal(plain, aad)).not.toBe(b.seal(plain, aad));
  });

  it.each([2, 3, 4])("rejects tampering of part %i", (i) => {
    const b = box({ k1 }, "k1");
    const parts = b.seal(plain, aad).split(".");
    const buf = Buffer.from(parts[i] as string, "base64url");
    buf[0] = (buf[0] ?? 0) ^ 1;
    parts[i] = buf.toString("base64url");
    expect(() => b.open(parts.join("."), aad)).toThrow(SecretBoxError);
  });

  it("rejects other organization or purpose", () => {
    const b = box({ k1 }, "k1");
    const sealed = b.seal(plain, aad);
    expect(() => b.open(sealed, { ...aad, organizationId: "org-b" })).toThrow(SecretBoxError);
    expect(() => b.open(sealed, { ...aad, purpose: "other" })).toThrow(SecretBoxError);
  });

  it("rejects unknown key id and malformed input", () => {
    const sealed = box({ k1 }, "k1").seal(plain, aad);
    expect(() => box({ k2 }, "k2").open(sealed, aad)).toThrow(SecretBoxError);
    for (const bad of ["", "garbage", "v2.k1.a.b.c", "v1.k1.a.b"]) {
      expect(() => box({ k1 }, "k1").open(bad, aad)).toThrow(SecretBoxError);
    }
  });

  it("rewraps old-key ciphertext to the active key and leaves active ones alone", () => {
    const old = box({ k1 }, "k1").seal(plain, aad);
    const rotated = box({ k1, k2 }, "k2");
    const re = rotated.rewrap(old, aad);
    expect(re.startsWith("v1.k2.")).toBe(true);
    expect(box({ k2 }, "k2").open(re, aad)).toBe(plain);
    expect(rotated.rewrap(re, aad)).toBe(re);
    expect(() => rotated.rewrap(old, { ...aad, purpose: "x" })).toThrow(SecretBoxError);
  });

  it("never leaks secrets in error messages", () => {
    const b = box({ k1 }, "k1");
    const sealed = b.seal(plain, aad);
    try {
      b.open(sealed, { ...aad, organizationId: "org-b" });
      expect.unreachable();
    } catch (e) {
      const text = `${(e as Error).message} ${(e as Error).stack}`;
      expect(text).not.toContain(plain);
      expect(text).not.toContain(sealed);
      expect(text).not.toContain(k1.toString("base64"));
    }
  });
});

describe("key ring", () => {
  it("parses id:base64 lists", () => {
    const m = parseSecretBoxKeys(`a:${k1.toString("base64")}, b:${k2.toString("base64")}`);
    expect([...m.keys()]).toEqual(["a", "b"]);
    expect(m.get("a")).toEqual(k1);
  });

  it("rejects bad length, duplicates, empty and malformed entries", () => {
    const g = k1.toString("base64");
    expect(() => parseSecretBoxKeys(`a:${randomBytes(16).toString("base64")}`)).toThrow();
    expect(() => parseSecretBoxKeys(`a:${g},a:${g}`)).toThrow(/Duplicate/);
    expect(() => parseSecretBoxKeys("")).toThrow();
    expect(() => parseSecretBoxKeys(g)).toThrow();
    expect(() => parseSecretBoxKeys(`bad.id:${g}`)).toThrow();
  });

  it("rejects invalid rings in the constructor", () => {
    expect(() => box({ k1 }, "missing")).toThrow();
    expect(() => box({ k1: randomBytes(8) }, "k1")).toThrow();
  });
});
