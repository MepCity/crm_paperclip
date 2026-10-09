import { NotFoundError, ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { resetPreferenceStoreForTests } from "@/lib/preferences";
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
  resetPreferenceStoreForTests();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function screenWithFixture() {
  const records = createFixtureRecordService(ctx);
  const listSpy = vi.spyOn(records, "list");
  const service = createClientRecordService(records, {
    listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
  });
  render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
    wrapper: wrapper(service),
  });
  return {
    listSpy,
    /** The query the screen last used for the default view, whatever id the fixture gives it. */
    perPageSizesRequested: () => listSpy.mock.calls.map(([, query]) => query?.perPage),
  };
}

/** Opens View Settings and one of its submenus from the keyboard. `rowName` is the parent
 * row's label plus the value in effect, which is also the submenu's accessible name. */
async function openViewSubmenu(user: UserEvent, rowName: string) {
  const trigger = screen.getByRole("button", { name: "View Settings" });
  trigger.focus();
  await user.keyboard("{Enter}");
  const item = screen.getByRole("menuitem", { name: rowName });
  item.focus();
  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(screen.getByRole("menu", { name: rowName })).toBeTruthy());
}

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
    const rowSelect = screen.getAllByRole("checkbox", { name: /Select / })[1];
    if (!rowSelect) throw new Error("Expected a row selection checkbox.");
    await user.click(rowSelect);
    await waitFor(() => {
      expect(screen.getByText("1 Record Selected")).toBeTruthy();
    });
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
    await waitFor(() => {
      expect(screen.queryByText("1 Record Selected")).toBeNull();
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
    navigation.params = new URLSearchParams("page=2&per_page=10&sort_by=Company&sort_order=asc");
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
      expect(listSpy.mock.calls.at(-1)?.[1]?.page).toBe(2);
      expect(listSpy.mock.calls.at(-1)?.[1]?.perPage).toBe(10);
      expect(listSpy.mock.calls.at(-1)?.[1]?.sort).toEqual({ field: "Company", order: "asc" });
    });
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    const rowSelect = screen.getAllByRole("checkbox", { name: /Select / })[1];
    if (!rowSelect) throw new Error("Expected a row selection checkbox.");
    await user.click(rowSelect);
    await waitFor(() => {
      expect(screen.getByText("1 Record Selected")).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(listSpy.mock.calls.at(-1)?.[1]?.filters).toBeTruthy();
      expect(listSpy.mock.calls.at(-1)?.[1]?.page).toBe(1);
    });
    await waitFor(() => {
      expect(screen.queryByText("1 Record Selected")).toBeNull();
    });
    rerender(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} viewId="converted-leads" />);
    await waitFor(() => {
      const query = listSpy.mock.calls.at(-1)?.[1];
      expect(query?.viewId).toBe("converted-leads");
      expect(query?.filters).toBeUndefined();
      expect(query?.page).toBe(1);
      expect(query?.perPage).toBe(10);
      expect(query?.sort).toEqual({ field: "Company", order: "asc" });
    });
    const panel = screen.getByRole("region", { name: "Filter Leads by" });
    const companyCheckbox = within(panel).getByRole("checkbox", { name: "Company" });
    expect(companyCheckbox.getAttribute("aria-checked")).not.toBe("true");
    expect(within(panel).queryByRole("textbox", { name: "Company value" })).toBeNull();
    rerender(<ModuleListScreen orgSlug={ctx.orgSlug} config={config} viewId="all-leads" />);
    await waitFor(() => {
      const query = listSpy.mock.calls.at(-1)?.[1];
      expect(query?.viewId).toBe("all-leads");
      expect(query?.filters).toBeUndefined();
    });
    const panelAgain = screen.getByRole("region", { name: "Filter Leads by" });
    expect(within(panelAgain).queryByRole("textbox", { name: "Company value" })).toBeNull();
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
    let releaseList: () => void = () => {};
    const listGate = new Promise<void>((resolve) => {
      releaseList = resolve;
    });
    vi.spyOn(records, "list").mockImplementation(async (module, query) => {
      if (query.filters) {
        await listGate;
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
    const rowsBefore = screen.getAllByRole("row").length;
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(document.querySelector("[data-part=total-value]")?.textContent).not.toBe("42");
    });
    expect(screen.getAllByRole("row").length).toBe(rowsBefore);
    releaseList();
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid list filter.");
    });
    expect(document.querySelector("[data-part=total-value]")?.textContent).toBe(totalBefore);
    expect(document.querySelector("[data-part=total-value]")?.textContent).not.toBe("42");
    expect(screen.getAllByRole("row").length).toBe(rowsBefore);
  });

  it("keeps the prior snapshot when count rejects filters after list would succeed", async () => {
    const records = createFixtureRecordService(ctx);
    const config = await leadsConfigWithFilters(records);
    const originalList = records.list.bind(records);
    const originalCount = records.count.bind(records);
    let releaseCount: () => void = () => {};
    const countGate = new Promise<void>((resolve) => {
      releaseCount = resolve;
    });
    vi.spyOn(records, "list").mockImplementation(async (module, query) => {
      if (query.filters) {
        return {
          records: [],
          page: 1,
          perPage: 30,
          moreRecords: false,
          sort: { field: "id", order: "desc" },
        };
      }
      return originalList(module, query);
    });
    vi.spyOn(records, "count").mockImplementation(async (module, query) => {
      if (query.filters) {
        await countGate;
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
    const totalBefore = document.querySelector("[data-part=total-value]")?.textContent;
    const rowsBefore = screen.getAllByRole("row").length;
    await user.click(screen.getByRole("checkbox", { name: "Company" }));
    await user.type(screen.getByRole("textbox", { name: "Company value" }), "Example");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBe(rowsBefore);
    });
    releaseCount();
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Invalid count filter.");
    });
    expect(document.querySelector("[data-part=total-value]")?.textContent).toBe(totalBefore);
    expect(screen.getAllByRole("row").length).toBe(rowsBefore);
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

  it("shows the selection bar and restores the toolbar after Clear", async () => {
    navigation.params = new URLSearchParams("per_page=10");
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const rowBoxes = screen.getAllByRole("checkbox", { name: /Select / });
    const firstRow = rowBoxes[1];
    if (!firstRow) throw new Error("Expected a row checkbox.");
    await user.click(firstRow);
    expect(screen.getByText("1 Record Selected")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
  });

  it("clears selection when the list page changes", async () => {
    navigation.params = new URLSearchParams("per_page=10");
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    const { rerender } = render(
      <ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />,
      { wrapper: wrapper(service) },
    );
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const firstRow = screen.getAllByRole("checkbox", { name: /Select / })[1];
    if (!firstRow) throw new Error("Expected a row checkbox.");
    await user.click(firstRow);
    expect(screen.getByText("1 Record Selected")).toBeTruthy();
    navigation.params = new URLSearchParams("page=2&per_page=10");
    rerender(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />);
    await waitFor(() => {
      expect(screen.queryByText(/Record Selected/)).toBeNull();
      expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    });
  });

  it("deletes selected records after confirmation with the selected ids", async () => {
    navigation.params = new URLSearchParams("per_page=10");
    const records = createFixtureRecordService(ctx);
    const deleteSpy = vi.spyOn(records, "delete");
    const listSpy = vi.spyOn(records, "list");
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const listQuery = listSpy.mock.calls.at(-1)?.[1];
    if (!listQuery) throw new Error("Expected list query.");
    const page = await records.list("Leads", listQuery);
    const selected = page.records.slice(0, 2);
    const expectedIds = selected.map((record) => record.id);
    const deletedNames = selected.map((record) => String(record.fields.Full_Name ?? ""));
    const listCallsBefore = listSpy.mock.calls.length;
    const rows = screen.getAllByRole("checkbox", { name: /Select / });
    const first = rows[1];
    const second = rows[2];
    if (!first || !second) throw new Error("Expected row checkboxes.");
    await user.click(first);
    await user.click(second);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("Leads", expectedIds);
    });
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    await waitFor(() => {
      expect(listSpy.mock.calls.length).toBeGreaterThan(listCallsBefore);
    });
    for (const name of deletedNames) {
      if (!name) continue;
      expect(screen.queryByRole("link", { name })).toBeNull();
    }
  });

  it("keeps the delete dialog open and selection when delete fails", async () => {
    navigation.params = new URLSearchParams("per_page=10");
    const records = createFixtureRecordService(ctx);
    vi.spyOn(records, "delete").mockRejectedValueOnce(new Error("Server error"));
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    const firstRow = screen.getAllByRole("checkbox", { name: /Select / })[1];
    if (!firstRow) throw new Error("Expected a row checkbox.");
    await user.click(firstRow);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("Server error");
    });
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("1 Record Selected")).toBeTruthy();
  });

  it("navigates to the previous page when every row on the page is deleted", async () => {
    navigation.params = new URLSearchParams("page=2&per_page=10");
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const user = userEvent.setup();
    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />, {
      wrapper: wrapper(service),
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Records" })).toBeTruthy();
    });
    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalled();
    });
    const lastHref = navigation.push.mock.calls.at(-1)?.[0] as string;
    expect(lastHref).toContain("page=1");
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

  it("stores a page-size choice, puts it in the address and starts at page 1", async () => {
    const user = userEvent.setup();
    navigation.params = new URLSearchParams("page=2&sort_by=Company&sort_order=asc");
    const { perPageSizesRequested } = screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());

    await openViewSubmenu(user, "Records Per Page 30");
    await user.click(screen.getByRole("menuitemradio", { name: "10" }));

    const href = navigation.push.mock.calls.at(-1)?.[0] ?? "";
    const params = new URLSearchParams(String(href).split("?")[1] ?? "");
    expect(params.get("per_page")).toBe("10");
    expect(params.get("page")).toBeNull();
    expect(params.get("sort_by")).toBe("Company");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(perPageSizesRequested()).toContain(10);
  });

  it("uses the stored page size when the address carries no per_page", async () => {
    const user = userEvent.setup();
    screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());
    await openViewSubmenu(user, "Records Per Page 30");
    await user.click(screen.getByRole("menuitemradio", { name: "20" }));

    cleanup();
    navigation.params = new URLSearchParams();
    const again = screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());
    expect(again.perPageSizesRequested()).toContain(20);

    await openViewSubmenu(user, "Records Per Page 20");
    expect(screen.getByRole("menuitemradio", { name: "20" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("truncates cell text when Wrap Text is switched off", async () => {
    const user = userEvent.setup();
    screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());

    const wrapped = document.querySelector("[data-part=row] [data-part=value]");
    expect(wrapped?.className).toContain("whitespace-normal");

    await openViewSubmenu(user, "View Mode Wrap Text");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Wrap Text" }));
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    const truncated = document.querySelector("[data-part=row] [data-part=value]");
    expect(truncated?.className).toContain("truncate");
    expect(truncated?.className).not.toContain("whitespace-normal");

    cleanup();
    screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());
    expect(document.querySelector("[data-part=row] [data-part=value]")?.className).toContain(
      "truncate",
    );
  });
});
