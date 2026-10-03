import { describe, expect, it } from "vitest";
import { createInvitationToken, hashInvitationToken, slugInput } from "./validation";

describe("organization slug", () => {
  it("accepts the length boundaries and interior hyphens", () => {
    expect(slugInput.safeParse("abc").success).toBe(true);
    expect(slugInput.safeParse("a".repeat(40)).success).toBe(true);
    expect(slugInput.safeParse("a0-b").success).toBe(true);
  });

  it.each(["ab", "a".repeat(41), "-abc", "abc-", "Abc", "a_b", "a--b", "a b"])(
    "rejects %s",
    (value) => {
      expect(slugInput.safeParse(value).success).toBe(false);
    },
  );
});

describe("invitation token", () => {
  it("uses at least 32 random bytes and a SHA-256 digest", () => {
    const first = createInvitationToken();
    const second = createInvitationToken();
    expect(Buffer.from(first.token, "base64url")).toHaveLength(32);
    expect(first.token).not.toBe(second.token);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.hash).toBe(hashInvitationToken(first.token));
    expect(first.hash).not.toBe(second.hash);
    expect(first.hash).not.toContain(first.token);
  });
});
