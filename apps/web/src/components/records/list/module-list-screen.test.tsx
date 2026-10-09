import { NotFoundError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { recordListContextKey } from "@/lib/records/record-list-context";
import { LEADS_LIST_CURRENCY_CODE, leadsListPageConfig } from "@/modules/leads/list-config";
import { buildLeadsFilterGroups } from "@/modules/leads/list-filters";
import { ModuleListScreen } from "./module-list-screen";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn((href: string) => {
    const url = new URL(href, "http://test");
    navigation.params = url.searchParams;
  }),
  refresh: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.params,
}));

function wrapper(service: ReturnType<typeof createClientRecordService>) {
  return function Provider({ children }: { children: ReactNode }) {
    return (
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        {children}
      </ApiProvider>
    );
  };
}

async function leadsConfigWithFilters(service: ReturnType<typeof createFixtureRecordService>) {
  const module = await service.getModule("Leads");
  return {
    ...leadsListPageConfig,
    filterGroups: buildLeadsFilterGroups({
      fields: module.fields,
      users: [{ userId: ctx.userId, name: "User" }],
      linkField: leadsListPageConfig.linkField,
      currencyCode: LEADS_LIST_CURRENCY_CODE,
    }),
  };
}

afterEach(() => {
  cleanup();
  navigation.params = new URLSearchParams();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("ModuleListScreen", () => {
  it("shows empty state and zero total for an empty view", async () => {
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "list").mockResolvedValue({
      records: [],
      page: 1,
      perPage: 30,
      moreRecords: false,
      sort: { field: "id", order: "desc" },
    });
    vi.spyOn(records, "count").mockResolvedValue(0);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={leadsListPageConfig}
        viewId="converted-leads"
      />,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(screen.getByText(/No Leads found\./)).toBeTruthy();
    });
    expect(screen.getByText("Total Records")).toBeTruthy();
    expect(document.querySelector("[data-part=total-value]")?.textContent).toBe("0");
  });

  it("refresh re-fetches list and count without reloading module metadata", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const getModuleSpy = vi.spyOn(service, "getModule");
    const listSpy = vi.spyOn(service, "list");
    const countSpy = vi.spyOn(service, "count");
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
      expect(getModuleSpy.mock.calls.length).toBeGreaterThan(0);
    });
    const listCallsBefore = listSpy.mock.calls.length;
    const countCallsBefore = countSpy.mock.calls.length;
    const moduleCallsBefore = getModuleSpy.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Refresh Custom View" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.length).toBe(listCallsBefore + 1);
      expect(countSpy.mock.calls.length).toBe(countCallsBefore + 1);
    });
    expect(getModuleSpy.mock.calls.length).toBe(moduleCallsBefore);
    const lastListQuery = listSpy.mock.calls.at(-1)?.[1];
    const priorListQuery = listSpy.mock.calls.at(-2)?.[1];
    expect(lastListQuery).toEqual(priorListQuery);
  });

  it("shows not found for an unknown view id", async () => {
    const records = createFixtureRecordService(ctx);
    const broken = {
      ...records,
      getView: async () => {
        throw new NotFoundError();
      },
    };
    const service = createClientRecordService(broken, {
      listUsers: async () => [],
    });
    render(
      <ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} viewId="missing-view" />,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(screen.getByText(/could not be found/i)).toBeTruthy();
    });
  });

  it("applies a filter to list and count and resets to page 1", async () => {
    navigation.params = new URLSearchParams("page=2");
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const listSpy = vi.spyOn(records, "list");
    const countSpy = vi.spyOn(records, "count");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      const listQuery = listSpy.mock.calls.at(-1)?.[1];
      const countQuery = countSpy.mock.calls.at(-1)?.[1];
      expect(listQuery?.filters).toEqual({
        field: "Company",
        comparator: "contains",
        value: "Example",
      });
      expect(countQuery?.filters).toEqual(listQuery?.filters);
      expect(listQuery?.page).toBe(1);
    });
    expect(navigation.push).toHaveBeenCalled();
  });

  it("clears applied filters from list and count queries", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const listSpy = vi.spyOn(records, "list");
    const countSpy = vi.spyOn(records, "count");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.filters).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.filters).toBeUndefined();
      expect(countSpy.mock.calls.at(-1)?.[1]?.filters).toBeUndefined();
    });
  });

  it("resets applied filter, selection, and panel draft when the view changes", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const listSpy = vi.spyOn(records, "list");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <ModuleListScreen orgSlug={ctx.orgSlug} config={config} viewId="all-leads" />,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.filters).toBeTruthy();
    });
    rerender(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} viewId="converted-leads" />);
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.viewId).toBe("converted-leads");
      expect(listSpy.mock.calls.at(-1)?.[1]?.filters).toBeUndefined();
    });
    const panel = screen.getByRole("region", { name: "Filter Leads by" });
    const companyCheckbox = within(panel).getByRole("checkbox", { name: "Company" });
    expect(companyCheckbox.getAttribute("aria-checked")).not.toBe("true");
    expect(within(panel).queryByRole("textbox", { name: "Company value" })).toBeNull();
  });

  it("shows a validation message and keeps rows when list rejects filters", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const originalList = records.list.bind(records);
    vi.spyOn(records, "list").mockImplementation(async (module, query) => {
      if (query.filters) {
        throw new ValidationError({ filters: ["Invalid filter."] });
      }
      return originalList(module, query);
    });
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const rowsBefore = screen.getAllByRole("row").length;
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid filter.");
    });
    expect(screen.getAllByRole("row").length).toBe(rowsBefore);
  });

  it("shows a validation message and keeps rows and total when count rejects filters", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const originalCount = records.count.bind(records);
    vi.spyOn(records, "count").mockImplementation(async (module, query) => {
      if (query.filters) {
        throw new ValidationError({ filters: ["Invalid count filter."] });
      }
      return originalCount(module, query);
    });
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const rowsBefore = screen.getAllByRole("row").length;
    const totalBefore = document.querySelector("[data-part=total-value]")?.textContent;
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid count filter.");
    });
    expect(screen.getAllByRole("row").length).toBe(rowsBefore);
    expect(document.querySelector("[data-part=total-value]")?.textContent).toBe(totalBefore);
  });

  it("keeps the prior snapshot when list rejects filters after count would succeed", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const originalList = records.list.bind(records);
    const originalCount = records.count.bind(records);
    vi.spyOn(records, "list").mockImplementation(async (module, query) => {
      if (query.filters) {
        throw new ValidationError({ filters: ["Invalid list filter."] });
      }
      return originalList(module, query);
    });
    vi.spyOn(records, "count").mockImplementation(async (module, query) => {
      if (query.filters) return 42;
      return originalCount(module, query);
    });
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const totalBefore = document.querySelector("[data-part=total-value]")?.textContent;
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid list filter.");
    });
    expect(document.querySelector("[data-part=total-value]")?.textContent).toBe(totalBefore);
    expect(document.querySelector("[data-part=total-value]")?.textContent).not.toBe("42");
  });

  it("resets to page 1 when Clear is pressed while the address is on page 2", async () => {
    navigation.params = new URLSearchParams("page=2");
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const listSpy = vi.spyOn(records, "list");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} viewId="all-leads" />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
      expect(listSpy.mock.calls.at(-1)?.[1]?.page).toBe(2);
    });
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.page).toBe(1);
    });
    expect(navigation.push).toHaveBeenCalled();
  });

  it("writes session list context for record detail navigation", async () => {
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const raw = sessionStorage.getItem(recordListContextKey(ctx.orgSlug, "Leads"));
    expect(raw).not.toBeNull();
    if (!raw) throw new Error("Expected list context in session storage.");
    const parsed = JSON.parse(raw) as { listHref: string; recordIds: string[]; viewId: string };
    expect(parsed.viewId).toBe("all-leads");
    expect(parsed.recordIds.length).toBeGreaterThan(0);
    expect(parsed.listHref).toContain("/tab/Leads/list");
  });

  it("passes list query fields and paging from the address", async () => {
    navigation.params = new URLSearchParams("page=2&per_page=10&sort_by=Company&sort_order=asc");
    const records = createFixtureRecordService(ctx);
    const listSpy = vi.spyOn(records, "list");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      const query = listSpy.mock.calls.at(-1)?.[1];
      expect(query?.viewId).toBe("all-leads");
      expect(query?.page).toBe(2);
      expect(query?.perPage).toBe(10);
      expect(query?.sort).toEqual({ field: "Company", order: "asc" });
      expect(query?.fields).toEqual([
        "Full_Name",
        "Company",
        "Email",
        "Phone",
        "Lead_Source",
        "Owner",
      ]);
    });
  });
});
