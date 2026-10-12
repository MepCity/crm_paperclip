import { describe, expect, it, vi } from "vitest";
import { createHttpRecordService } from "./http-record-service";

const methods = ["listViews", "listViewSummaries", "listUsers"] as const;

function view(index: number) {
  return {
    id: `view-${index}`,
    name: `View ${index}`,
    system_defined: true,
    default: index === 1,
    fields: [{ api_name: "Last_Name" }],
    criteria: null,
    sort_by: null,
    sort_order: null,
  };
}

describe.each(methods)("%s collection responses", (method) => {
  it("collects every page including item 201 and follows more_records", async () => {
    const fetch = vi.fn(async (path: string) => {
      const url = new URL(path, "http://test.local");
      const page = Number(url.searchParams.get("page"));
      if (!page) {
        const index = Number(url.pathname.split("/").at(-1)?.replace("view-", ""));
        return { custom_views: [view(index)] };
      }
      expect(url.searchParams.get("per_page")).toBe("200");
      const indexes = page === 1 ? Array.from({ length: 200 }, (_, i) => i + 1) : [201];
      return {
        custom_views: indexes.map(view),
        users: indexes.map((i) => ({
          id: `user-${i}`,
          full_name: `User ${i}`,
          email: `user${i}@example.test`,
        })),
        info: { page, per_page: 200, count: indexes.length, more_records: page === 1 },
      };
    });
    const service = createHttpRecordService({ orgSlug: "test", fetch });
    const result =
      method === "listUsers" ? await service.listUsers() : await service[method]("Leads");
    expect(result).toHaveLength(201);
    expect(result.at(-1)).toMatchObject(
      method === "listUsers" ? { userId: "user-201" } : { id: "view-201" },
    );
    const pages = fetch.mock.calls
      .map(([path]) => new URL(path, "http://test.local").searchParams.get("page"))
      .filter(Boolean);
    expect(pages).toEqual(["1", "2"]);
  });

  it("returns an empty collection for a bodyless 204", async () => {
    const fetch = vi.fn(async () => null);
    const service = createHttpRecordService({ orgSlug: "test", fetch });
    const result = method === "listUsers" ? service.listUsers() : service[method]("Leads");
    await expect(result).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps collected entries when a subsequent page returns 204", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        custom_views: [view(1)],
        users: [{ id: "user-1", full_name: "User 1", email: "user1@example.test" }],
        info: { page: 1, per_page: 200, count: 1, more_records: true },
      })
      .mockResolvedValueOnce(null);
    const service = createHttpRecordService({ orgSlug: "test", fetch });
    vi.spyOn(service, "getView").mockResolvedValue({
      id: "view-1",
      name: "View 1",
      systemDefined: true,
      isDefault: true,
      columns: ["Last_Name"],
      criteria: null,
      sort: null,
    });
    const result =
      method === "listUsers" ? await service.listUsers() : await service[method]("Leads");
    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
