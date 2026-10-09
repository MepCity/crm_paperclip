import { NotFoundError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { recordListContextKey } from "@/lib/records/record-list-context";
import { leadsListPageConfig } from "@/modules/leads/list-config";
import { ModuleListScreen } from "./module-list-screen";

const ctx = {
  orgId: "org-1",
  orgSlug: "org-1",
  orgName: "Org",
  userId: "user-1",
  role: "admin" as const,
};

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
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
    navigation.params = new URLSearchParams("page=2");
    rerender(<ModuleListScreen orgSlug={ctx.orgSlug} config={leadsListPageConfig} />);
    await waitFor(() => {
      expect(screen.queryByText(/Record Selected/)).toBeNull();
      expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    });
  });

  it("deletes selected records after confirmation with the selected ids", async () => {
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
});
