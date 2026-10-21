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
import { documentsAccessSource } from "@/server/documents/access";

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

  it("member with the capability off gets the unknown-id 404 on every read route", async () => {
    ctx.role = "member";
    const unknownFolder = await itemsOf("folder-missing");
    const unknownItem = await item(get("items/file-missing"), {
      params: Promise.resolve({ itemId: "file-missing" }),
    });
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled").mockResolvedValue(false);
    try {
      const calls = [
        folders(get("folders"), { params: Promise.resolve({}) }),
        itemsOf("folder-team"),
        itemsOf("folder-team", "?sort_by=name&sort_order=asc"),
        item(get("items/file-a"), { params: Promise.resolve({ itemId: "file-a" }) }),
      ];
      for (const response of await Promise.all(calls)) {
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual(await unknownFolder.clone().json());
      }
      expect(await unknownItem.json()).toEqual(await unknownFolder.json());
    } finally {
      spy.mockRestore();
      ctx.role = "admin";
    }
  });

  it("admin still reads when the capability source returns false", async () => {
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled").mockResolvedValue(false);
    try {
      expect((await folders(get("folders"), { params: Promise.resolve({}) })).status).toBe(200);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("foreign-tenant folder and file give the unknown-id 404 for admin and member", async () => {
    for (const role of ["admin", "member"]) {
      ctx.role = role;
      const unknownFolder = await itemsOf("folder-missing");
      const unknownItem = await item(get("items/file-missing"), {
        params: Promise.resolve({ itemId: "file-missing" }),
      });
      const foreignFolder = await itemsOf("folder-foreign");
      const foreignItem = await item(get("items/file-foreign"), {
        params: Promise.resolve({ itemId: "file-foreign" }),
      });
      expect(foreignFolder.status).toBe(404);
      expect(await foreignFolder.json()).toEqual(await unknownFolder.json());
      expect(foreignItem.status).toBe(404);
      expect(await foreignItem.json()).toEqual(await unknownItem.json());
      const list = (await (
        await folders(get("folders"), { params: Promise.resolve({}) })
      ).json()) as {
        data: { id: string }[];
      };
      expect(list.data.map((f) => f.id)).not.toContain("folder-foreign");
    }
    ctx.role = "admin";
  });

  it("does not evaluate the capability before the gates", async () => {
    const spy = vi.spyOn(documentsAccessSource, "documentsEnabled");
    ctx.role = "member";
    try {
      vi.mocked(getSession).mockResolvedValueOnce(null as never);
      expect((await folders(get("folders"), { params: Promise.resolve({}) })).status).toBe(401);
      expect((await folders(get("folders", {}), { params: Promise.resolve({}) })).status).toBe(400);
      expect(
        (await folders(get("folders", { "X-CRM-ORG": "other" }), { params: Promise.resolve({}) }))
          .status,
      ).toBe(404);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      ctx.role = "admin";
    }
  });

  it("404 for a tenant the session does not belong to, on every route", async () => {
    const h = { "X-CRM-ORG": "other" };
    expect((await itemsOf("folder-team", "", h)).status).toBe(404);
    expect(
      (await item(get("items/file-a", h), { params: Promise.resolve({ itemId: "file-a" }) }))
        .status,
    ).toBe(404);
  });
});
