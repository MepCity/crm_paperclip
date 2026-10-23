import { afterEach, expect, test, vi } from "vitest";
import { apiFetch } from "@/lib/api/client/fetch";
import { inboxFixture } from "./fixture";
import { createHttpInboxLoader, loadInboxHttp } from "./http-loader";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("maps two requested folders without mixing conversations", async () => {
  const fetcher = vi.fn(async (path: string) => ({
    connected: true,
    data: inboxFixture.conversations.filter(
      (row) => row.folder === new URL(path, "https://crm.test").searchParams.get("folder"),
    ),
  }));
  const load = createHttpInboxLoader(fetcher);
  for (const folder of ["inbox", "sent"] as const) {
    expect(await load(folder)).toEqual({
      connected: true,
      conversations: inboxFixture.conversations.filter((row) => row.folder === folder),
    });
    expect(fetcher).toHaveBeenLastCalledWith(`/crm/v2.2/mail/conversations?folder=${folder}`);
  }
});

test.each([true, false])("preserves an empty response with connected=%s", async (connected) => {
  const load = createHttpInboxLoader(async () => ({ connected, data: [] }));
  expect(await load("scheduled")).toEqual({ connected, conversations: [] });
});

test.each([401, 403, 404, "network"] as const)(
  "rejects HTTP %s for the existing error state",
  async (failure) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (failure === "network") throw new TypeError("Failed to fetch");
        return Response.json({ code: "ERROR" }, { status: failure });
      }),
    );
    const load = createHttpInboxLoader((path, options) => apiFetch("example", path, options));
    await expect(load("inbox")).rejects.toThrow();
  },
);

test("the default loader uses the current organization and same-origin session", async () => {
  vi.stubGlobal("window", { location: { pathname: "/crm/example/tab/Emails" } });
  const fetcher = vi.fn(async () => Response.json({ connected: true, data: [] }));
  vi.stubGlobal("fetch", fetcher);
  expect(await loadInboxHttp("drafts")).toEqual({ connected: true, conversations: [] });
  const [path, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(path).toBe("/crm/v2.2/mail/conversations?folder=drafts");
  expect(options.method).toBe("GET");
  expect(options.credentials).toBe("same-origin");
  expect(new Headers(options.headers).get("X-CRM-ORG")).toBe("example");
});
