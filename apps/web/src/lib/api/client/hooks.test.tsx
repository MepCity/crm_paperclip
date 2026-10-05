import { NotFoundError } from "@crm/core/errors";
import type { ListQuery } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "./client-record-service";
import { useCreateRecord, useRecord, useRecordCount, useRecordList } from "./hooks";
import type { ClientRecordService } from "./http-record-service";
import { ApiProvider } from "./provider";

const ctx = {
  orgId: "hooks-org",
  orgSlug: "hooks-org",
  orgName: "Hooks Org",
  userId: "hooks-user",
  role: "admin" as const,
};

function createService(): ClientRecordService {
  return createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [
      { userId: ctx.userId, name: "Hooks User", email: "hooks@example.test" },
    ],
  });
}

function wrapper(service: ClientRecordService) {
  return function Provider({ children }: { children: ReactNode }) {
    return (
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        {children}
      </ApiProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("record hooks", () => {
  it("keeps the previous list page while the next page loads", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const base: ListQuery = { viewId: view.id, page: 1, perPage: 10 };
    const realList = service.list.bind(service);
    vi.spyOn(service, "list").mockImplementation(async (module, query) => {
      if (query.page === 2) await new Promise((resolve) => setTimeout(resolve, 60));
      return realList(module, query);
    });
    const { result, rerender } = renderHook(({ query }) => useRecordList("Leads", query), {
      wrapper: wrapper(service),
      initialProps: { query: { ...base, page: 1 } },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const firstIds = result.current.data?.records.map((row) => row.id);
    rerender({ query: { ...base, page: 2 } });
    expect(result.current.isFetching).toBe(true);
    expect(result.current.data?.records.map((row) => row.id)).toEqual(firstIds);
    await waitFor(() => expect(result.current.data?.page).toBe(2));
  });

  it("refetches list and count after a create mutation", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const query: ListQuery = { viewId: view.id, page: 1, perPage: 10 };
    const listSpy = vi.spyOn(service, "list");
    const countSpy = vi.spyOn(service, "count");
    const viewId = view.id;
    function useHarness() {
      const list = useRecordList("Leads", query);
      const count = useRecordCount("Leads", { viewId });
      const create = useCreateRecord("Leads");
      return { list, count, create };
    }
    const { result } = renderHook(() => useHarness(), { wrapper: wrapper(service) });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.count.isSuccess).toBe(true));
    const listCallsBefore = listSpy.mock.calls.length;
    const countCallsBefore = countSpy.mock.calls.length;
    await result.current.create.mutateAsync({
      Last_Name: "Hook Lead",
      Company: "Hook Co",
    });
    await waitFor(() => expect(listSpy.mock.calls.length).toBeGreaterThan(listCallsBefore));
    await waitFor(() => expect(countSpy.mock.calls.length).toBeGreaterThan(countCallsBefore));
  });

  it("surfaces NotFoundError on the record query", async () => {
    const service = createService();
    const { result } = renderHook(() => useRecord("Leads", "missing-record-id"), {
      wrapper: wrapper(service),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(NotFoundError);
  });
});
