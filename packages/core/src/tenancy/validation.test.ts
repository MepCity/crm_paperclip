import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseInput, ValidationError } from "../errors";
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

  it.each(["v2", "v2.2", "v10"])("rejects reserved slug %s", (slug) => {
    let thrown: unknown;
    try {
      parseInput(z.object({ slug: slugInput }), { slug });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ValidationError);
    expect((thrown as ValidationError).fieldErrors).toEqual({
      slug: ["This slug is reserved."],
    });
  });

  it.each(["vx2", "v2a", "nova2"])("accepts %s", (slug) => {
    expect(slugInput.safeParse(slug).success).toBe(true);
  });

  it("does not treat a bare v as reserved", () => {
    const result = slugInput.safeParse("v");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).not.toContain(
        "This slug is reserved.",
      );
    }
  });
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
