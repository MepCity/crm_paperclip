import { beforeEach, describe, expect, it, vi } from "vitest";

const { session, save, read } = vi.hoisted(() => ({
  session: vi.fn(),
  save: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@crm/core", () => ({ getSession: session }));
vi.mock("@/server/personal-settings/language", () => ({
  persistLanguage: save,
  readSavedLanguage: read,
}));

import { GET, PUT } from "./route";

const url = "http://localhost/api/personal-settings/language";
const put = (body: object, origin = "http://localhost") =>
  PUT(
    new Request(url, {
      method: "PUT",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  session.mockReset().mockResolvedValue({ user: { id: "self" } });
  save.mockReset();
  read.mockReset();
});
describe("personal language API", () => {
  it("rejects unauthenticated requests and cross-origin writes", async () => {
    session.mockResolvedValue(null);
    expect((await GET(new Request(url))).status).toBe(401);
    expect((await put({ language: "tr" })).status).toBe(401);
    expect((await put({ language: "tr" }, "http://foreign.test")).status).toBe(403);
    expect(save).not.toHaveBeenCalled();
  });
  it("accepts only canonical language and never an asserted user ID", async () => {
    for (const body of [
      { language: "tr-TR" },
      { language: "tr", userId: "foreign" },
      {},
      { language: 1 },
    ])
      expect((await put(body)).status).toBe(400);
    expect(save).not.toHaveBeenCalled();
    expect((await put({ language: "tr" })).status).toBe(200);
    expect(save).toHaveBeenCalledExactlyOnceWith("self", "tr");
  });
  it("returns safe failures and does not report a successful update", async () => {
    save.mockRejectedValue(new Error("private database detail"));
    const result = await put({ language: "tr" });
    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({ code: "SAVE_FAILED" });
  });
  it("reads only the authenticated preference and disables caching", async () => {
    read.mockResolvedValue("tr");
    const result = await GET(new Request(url));
    expect(await result.json()).toEqual({ language: "tr" });
    expect(read).toHaveBeenCalledExactlyOnceWith("self");
    expect(result.headers.get("cache-control")).toBe("private, no-store");
  });
});
