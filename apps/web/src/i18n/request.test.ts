import { beforeEach, describe, expect, it, vi } from "vitest";

const { session, read } = vi.hoisted(() => ({ session: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: session }));
vi.mock("@/server/personal-settings/language", () => ({ readSavedLanguage: read }));
vi.mock("next-intl/server", () => ({ getRequestConfig: (fn: unknown) => fn }));

import { getUiTranslations, requestLanguage } from "./request";

beforeEach(() => {
  session.mockReset();
  read.mockReset();
});
describe("request language", () => {
  it("uses English anonymously without reading preferences", async () => {
    session.mockResolvedValue(null);
    expect(await requestLanguage()).toBe("en");
    expect(read).not.toHaveBeenCalled();
  });
  it("does not share resolved preferences across users or requests", async () => {
    session
      .mockResolvedValueOnce({ user: { id: "first" } })
      .mockResolvedValueOnce({ user: { id: "second" } });
    read.mockResolvedValueOnce("tr").mockResolvedValueOnce("en");
    expect(await requestLanguage()).toBe("tr");
    expect(await requestLanguage()).toBe("en");
    expect(read.mock.calls).toEqual([["first"], ["second"]]);
  });
  it("falls back on a read failure without a write and translates on the server", async () => {
    session.mockResolvedValue({ user: { id: "first" } });
    read.mockRejectedValueOnce(new Error("Unavailable"));
    expect(await requestLanguage()).toBe("en");
    read.mockResolvedValue("tr");
    expect((await getUiTranslations())("common.actions.save")).toBe("Kaydet");
  });
});
