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

  it("maps field and general errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(
            { message: "Check the form.", fieldErrors: { email: ["Invalid email."] } },
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(Response.json({ message: "Please retry." }, { status: 500 })),
    );
    expect(await signUp({ name: "Test", email: "bad", password: "long-password" })).toEqual({
      ok: false,
      message: "Check the form.",
      fieldErrors: { email: ["Invalid email."] },
    });
    expect(await signOut()).toEqual({ ok: false, message: "Please retry." });
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
