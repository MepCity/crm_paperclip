import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createAesGcmSecretBox,
  DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV,
  DEFAULT_SECRET_BOX_KEYS_ENV,
  loadSecretBoxFromEnv,
  loadSecretBoxKeyRingFromEnv,
  loadSecretBoxKeysFromEnv,
  loadSecretBoxOptionsFromEnv,
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

  it("rejects non-base64 characters in a key", () => {
    const g = k1.toString("base64");
    expect(() => parseSecretBoxKeys(`a:!${g}`)).toThrow();
    expect(() => parseSecretBoxKeys(`a:${g.slice(0, 10)}*${g.slice(10)}`)).toThrow();
  });

  it.each([2, 3, 4])("rejects non-canonical encoding in part %i", (i) => {
    const b = box({ a: k1 }, "a");
    for (const mutate of [(v: string) => `${v}!`, (v: string) => `${v}=`, (v: string) => `!${v}`]) {
      const parts = b.seal(plain, aad).split(".");
      parts[i] = mutate(parts[i] as string);
      expect(() => b.open(parts.join("."), aad)).toThrow(SecretBoxError);
    }
  });

  it("rejects invalid rings in the constructor", () => {
    expect(() => box({ k1 }, "missing")).toThrow();
    expect(() => box({ k1: randomBytes(8) }, "k1")).toThrow();
  });
});

describe("defensive copying", () => {
  it("isolates the key map and key buffers against caller mutation after construction", () => {
    const key = Buffer.from(k1);
    const map = new Map<string, Buffer>([["k1", key]]);
    const b = createAesGcmSecretBox({ keys: map, activeKeyId: "k1" });

    const sealedBefore = b.seal(plain, aad);

    // Caller mutates the Map
    map.delete("k1");
    map.set("k1", randomBytes(32));
    map.set("other", randomBytes(32));

    // Caller mutates the key Buffer in place
    key[0] = (key[0] ?? 0) ^ 0xff;
    key.fill(0);

    // Box remains fully functional with original keys
    expect(b.open(sealedBefore, aad)).toBe(plain);
    const sealedAfter = b.seal(plain, aad);
    expect(b.open(sealedAfter, aad)).toBe(plain);

    // Verify sealedAfter is decrypted by an independent box initialized with original k1
    const freshBox = createAesGcmSecretBox({
      keys: new Map([["k1", k1]]),
      activeKeyId: "k1",
    });
    expect(freshBox.open(sealedAfter, aad)).toBe(plain);
  });
});

describe("environment loading", () => {
  const k1Base64 = k1.toString("base64");
  const k2Base64 = k2.toString("base64");

  it("loads key ring and active key id from environment variables", () => {
    const env = {
      [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}, k2:${k2Base64}`,
      [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "k2",
    };

    const options = loadSecretBoxKeyRingFromEnv(env);
    expect(options.activeKeyId).toBe("k2");
    expect([...options.keys.keys()]).toEqual(["k1", "k2"]);
    expect(options.keys.get("k1")).toEqual(k1);
    expect(options.keys.get("k2")).toEqual(k2);

    const b = loadSecretBoxFromEnv(env);
    const sealed = b.seal(plain, aad);
    expect(sealed.startsWith("v1.k2.")).toBe(true);
    expect(b.open(sealed, aad)).toBe(plain);
  });

  it("supports aliases and custom env variable names", () => {
    const env = {
      CUSTOM_KEYS: `k1:${k1Base64}`,
      CUSTOM_ACTIVE: "k1",
    };
    const opts = { keysEnvVar: "CUSTOM_KEYS", activeKeyIdEnvVar: "CUSTOM_ACTIVE" };

    const fromOpts = loadSecretBoxOptionsFromEnv(env, opts);
    const fromKeys = loadSecretBoxKeysFromEnv(env, opts);
    expect(fromOpts.activeKeyId).toBe("k1");
    expect(fromKeys.activeKeyId).toBe("k1");

    const b = loadSecretBoxFromEnv(env, opts);
    expect(b.open(b.seal(plain, aad), aad)).toBe(plain);
  });

  it("rejects missing or empty env variables without leaking secret material", () => {
    const cases = [
      {},
      { [DEFAULT_SECRET_BOX_KEYS_ENV]: "" },
      { [DEFAULT_SECRET_BOX_KEYS_ENV]: "   " },
      { [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}` },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "",
      },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "   ",
      },
    ];

    for (const badEnv of cases) {
      try {
        loadSecretBoxFromEnv(badEnv);
        expect.unreachable("expected error");
      } catch (e) {
        const message = (e as Error).message;
        expect(message).toMatch(/required/);
        expect(message).not.toContain(k1Base64);
      }
    }
  });

  it("rejects invalid key ring or mismatched active key id without leaking secret material", () => {
    const badCases: Record<string, string>[] = [
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: "not-valid",
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "k1",
      },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}!`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "k1",
      },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${randomBytes(16).toString("base64")}`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "k1",
      },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "non_existent_key",
      },
      {
        [DEFAULT_SECRET_BOX_KEYS_ENV]: `k1:${k1Base64}`,
        [DEFAULT_SECRET_BOX_ACTIVE_KEY_ID_ENV]: "invalid.id.with.dots",
      },
    ];

    for (const badEnv of badCases) {
      try {
        loadSecretBoxFromEnv(badEnv);
        expect.unreachable("expected error");
      } catch (e) {
        const error = e as Error;
        const text = `${error.message} ${error.stack}`;
        expect(text).not.toContain(k1Base64);
        expect(text).not.toContain(k2Base64);
      }
    }
  });
});
