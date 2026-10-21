import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx = { orgId: "org-1", orgSlug: "acme", orgName: "Acme", userId: "user-1", role: "admin" };

vi.mock("@crm/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
  requireOrgContext: vi.fn(async (_h: Headers, slug: string) => {
    if (slug !== "acme") {
      const { NotFoundError } = await import("@crm/core/errors");
      throw new NotFoundError();
    }
    return ctx;
  }),
}));

import { getSession } from "@crm/core";
import { GET as items } from "@/app/crm/v2.2/documents/folders/[folderId]/items/route";
import { GET as folders } from "@/app/crm/v2.2/documents/folders/route";
import { GET as item } from "@/app/crm/v2.2/documents/items/[itemId]/route";

const origin = "http://crm.test";
vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
vi.stubEnv("APP_URL", origin);
vi.stubEnv("APP_SECRET", "x".repeat(40));

const get = (path: string, headers: Record<string, string> = { "X-CRM-ORG": "acme" }) =>
  new Request(`${origin}/crm/v2.2/documents/${path}`, { headers });
const itemsOf = (folderId: string, query = "", headers?: Record<string, string>) =>
  items(get(`folders/${folderId}/items${query}`, headers), {
    params: Promise.resolve({ folderId }),
  });

describe("documents read routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 without a session", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null as never);
    expect((await folders(get("folders"), { params: Promise.resolve({}) })).status).toBe(401);
  });

  it("400 without or 404 with a wrong organization header", async () => {
    expect((await folders(get("folders", {}), { params: Promise.resolve({}) })).status).toBe(400);
    expect(
      (await folders(get("folders", { "X-CRM-ORG": "other" }), { params: Promise.resolve({}) }))
        .status,
    ).toBe(404);
  });

  it("lists root folders", async () => {
    const response = await folders(get("folders"), { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { id: string }[] };
    expect(body.data.map((f) => f.id).sort()).toEqual(["folder-my", "folder-team"]);
  });

  it("returns 200 and an empty list for an empty folder", async () => {
    const response = await itemsOf("folder-empty");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });

  it("honours sort directions and defaults to newest first", async () => {
    const ids = async (query: string) =>
      ((await (await itemsOf("folder-team", query)).json()) as { data: { id: string }[] }).data
        .map((i) => i.id)
        .filter((id) => id.startsWith("file"));
    expect(await ids("")).toEqual(["file-b", "file-a"]);
    expect(await ids("?sort_by=modifiedAt&sort_order=asc")).toEqual(["file-a", "file-b"]);
    expect(await ids("?sort_by=name&sort_order=desc")).toEqual(["file-b", "file-a"]);
  });

  it("400 for an invalid sort", async () => {
    expect((await itemsOf("folder-team", "?sort_by=size")).status).toBe(400);
    expect((await itemsOf("folder-team", "?sort_order=up")).status).toBe(400);
  });

  it("404 for unknown folder and item, same envelope", async () => {
    const folder = await itemsOf("nope");
    expect(folder.status).toBe(404);
    const missing = await item(get("items/nope"), { params: Promise.resolve({ itemId: "nope" }) });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual(await folder.json());
  });

  it("returns a single item as a one-element list", async () => {
    const response = await item(get("items/file-a"), {
      params: Promise.resolve({ itemId: "file-a" }),
    });
    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { id: string }[] }).data[0]?.id).toBe("file-a");
  });
});
