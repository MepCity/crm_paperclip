import { NotFoundError } from "@crm/core/errors";
import type { ListQuery } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "./client-record-service";
import {
  useChangeOwner,
  useCreateRecord,
  useDeleteRecords,
  useHomeCurrency,
  useMassUpdate,
  useModule,
  useRecord,
  useRecordCount,
  useRecordList,
  useRefreshModuleListData,
  useUsers,
  useViews,
} from "./hooks";
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
  it("returns the home currency", async () => {
    const service = createService();
    const { result } = renderHook(() => useHomeCurrency(), { wrapper: wrapper(service) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(await service.getHomeCurrency());
  });
  it("leaves home currency data undefined on an error", async () => {
    const service = createService();
    vi.spyOn(service, "getHomeCurrency").mockRejectedValue(new NotFoundError());
    const { result } = renderHook(() => useHomeCurrency(), { wrapper: wrapper(service) });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
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

  it("refresh re-requests the open list and count without reloading metadata", async () => {
    const service = createService();
    const views = await service.listViews("Leads");
    const view = views.find((item) => item.isDefault);
    if (!view) throw new Error("Missing default view.");
    const viewId = view.id;
    const query: ListQuery = { viewId, page: 1, perPage: 10 };
    const listSpy = vi.spyOn(service, "list");
    const countSpy = vi.spyOn(service, "count");
    const moduleSpy = vi.spyOn(service, "getModule");
    const summariesSpy = vi.spyOn(service, "listViewSummaries");
    const usersSpy = vi.spyOn(service, "listUsers");
    function useHarness() {
      return {
        list: useRecordList("Leads", query),
        count: useRecordCount("Leads", { viewId }),
        module: useModule("Leads"),
        viewSummaries: useViews("Leads"),
        users: useUsers(),
        refresh: useRefreshModuleListData("Leads"),
      };
    }
    const { result } = renderHook(() => useHarness(), { wrapper: wrapper(service) });
    await waitFor(() =>
      expect(
        result.current.list.isSuccess &&
          result.current.count.isSuccess &&
          result.current.module.isSuccess &&
          result.current.viewSummaries.isSuccess &&
          result.current.users.isSuccess,
      ).toBe(true),
    );
    listSpy.mockClear();
    countSpy.mockClear();
    moduleSpy.mockClear();
    summariesSpy.mockClear();
    usersSpy.mockClear();
    act(() => result.current.refresh());
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);
    });
    expect(moduleSpy).not.toHaveBeenCalled();
    expect(summariesSpy).not.toHaveBeenCalled();
    expect(usersSpy).not.toHaveBeenCalled();
  });

  it.each(["massUpdate", "changeOwner", "delete"] as const)(
    "invalidates lists, counts and each selected record after %s",
    async (action) => {
      const service = createService();
      const records = await Promise.all(
        ["First", "Second"].map((Last_Name) =>
          service.create("Leads", { Last_Name, Company: "Hook Batch" }),
        ),
      );
      const ids = records.map((row) => row.id);
      const query = { viewId: "all-leads", page: 1, perPage: 10 };
      const list = vi.spyOn(service, "list");
      const count = vi.spyOn(service, "count");
      const get = vi.spyOn(service, "get");
      const { result } = renderHook(
        () => ({
          list: useRecordList("Leads", query),
          count: useRecordCount("Leads", query),
          first: useRecord("Leads", ids[0] as string),
          second: useRecord("Leads", ids[1] as string),
          mass: useMassUpdate("Leads"),
          owner: useChangeOwner("Leads"),
          remove: useDeleteRecords("Leads"),
        }),
        { wrapper: wrapper(service) },
      );
      await waitFor(() =>
        expect(
          result.current.first.isSuccess &&
            result.current.second.isSuccess &&
            result.current.list.isSuccess &&
            result.current.count.isSuccess,
        ).toBe(true),
      );
      list.mockClear();
      count.mockClear();
      get.mockClear();
      if (action === "massUpdate")
        await result.current.mass.mutateAsync({ ids, input: { Company: "Hook Changed" } });
      else if (action === "changeOwner")
        await result.current.owner.mutateAsync({ ids, ownerId: ctx.userId });
      else await result.current.remove.mutateAsync(ids);
      await waitFor(() => {
        expect(list).toHaveBeenCalled();
        expect(count).toHaveBeenCalled();
        for (const id of ids) expect(get).toHaveBeenCalledWith("Leads", id);
      });
      if (action === "massUpdate")
        await waitFor(() => expect(result.current.first.data?.fields.Company).toBe("Hook Changed"));
      if (action === "delete")
        await waitFor(() => expect(result.current.first.error).toBeInstanceOf(NotFoundError));
    },
  );

  it("surfaces NotFoundError on the record query", async () => {
    const service = createService();
    const { result } = renderHook(() => useRecord("Leads", "missing-record-id"), {
      wrapper: wrapper(service),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(NotFoundError);
  });
});
