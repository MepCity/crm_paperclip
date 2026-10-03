import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn, signOut, signUp } from "./auth-client";

afterEach(() => vi.unstubAllGlobals());

describe("auth client", () => {
  it("returns success and calls the expected endpoint", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(
      await signUp({ name: "Test", email: "test@example.test", password: "long-password" }),
    ).toEqual({ ok: true });
    expect(fetch.mock.calls[0]?.[0]).toBe("/api/auth/sign-up/email");
    expect(await signOut()).toEqual({ ok: true });
    expect(fetch.mock.calls[1]?.[0]).toBe("/api/auth/sign-out");
  });

  it.each([
    ["PASSWORD_TOO_SHORT", "password", "Password must be at least 10 characters."],
    ["PASSWORD_TOO_LONG", "password", "Password must be at most 128 characters."],
    ["INVALID_EMAIL", "email", "Enter a valid email address."],
    [
      "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
      "email",
      "An account with this email already exists.",
    ],
  ])("maps %s to a user-facing %s error", async (code, field, message) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ code, message: "Raw library message" }, { status: 400 }),
        ),
    );
    expect(await signUp({ name: "Test", email: "bad", password: "long-password" })).toEqual({
      ok: false,
      message,
      fieldErrors: { [field]: [message] },
    });
  });

  it("maps the installed server's email validation response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { code: "VALIDATION_ERROR", message: "[body.email] Invalid email address" },
            { status: 400 },
          ),
        ),
    );
    expect(await signUp({ name: "Test", email: "bad", password: "long-password" })).toEqual({
      ok: false,
      message: "Enter a valid email address.",
      fieldErrors: { email: ["Enter a valid email address."] },
    });
  });

  it("uses a general message for an unknown error code", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ code: "UNKNOWN", message: "Raw error" }, { status: 500 }),
        ),
    );
    expect(await signOut()).toEqual({
      ok: false,
      message: "The request failed. Please try again.",
    });
  });

  it("uses the same message for unknown email and wrong password", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ code: "USER_NOT_FOUND", message: "Not found" }, { status: 401 }),
        )
        .mockResolvedValueOnce(
          Response.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Wrong" }, { status: 401 }),
        ),
    );
    const input = { email: "test@example.test", password: "wrong-password" };
    const unknown = await signIn(input);
    const wrong = await signIn(input);
    expect(unknown).toEqual(wrong);
    expect(wrong).toEqual({ ok: false, message: "Invalid email or password." });
  });

  it("turns network failure into a result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await signOut()).toEqual({ ok: false, message: "Network error. Please try again." });
  });
});
