import { NotFoundError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { resetPreferenceStoreForTests } from "@/lib/preferences";
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

/** Opens View Settings and one of its submenus from the keyboard. */
async function openViewSubmenu(user: UserEvent, name: string) {
  const trigger = screen.getByRole("button", { name: "View Settings" });
  trigger.focus();
  await user.keyboard("{Enter}");
  const item = screen.getByRole("menuitem", { name });
  item.focus();
  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(screen.getByRole("menu", { name })).toBeTruthy());
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

  it("stores a page-size choice, puts it in the address and starts at page 1", async () => {
    const user = userEvent.setup();
    navigation.params = new URLSearchParams("page=2&sort_by=Company&sort_order=asc");
    const { perPageSizesRequested } = screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());

    await openViewSubmenu(user, "Records Per Page");
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
    await openViewSubmenu(user, "Records Per Page");
    await user.click(screen.getByRole("menuitemradio", { name: "20" }));

    cleanup();
    navigation.params = new URLSearchParams();
    const again = screenWithFixture();
    await waitFor(() => expect(screen.getByRole("table", { name: "Records" })).toBeTruthy());
    expect(again.perPageSizesRequested()).toContain(20);

    await openViewSubmenu(user, "Records Per Page");
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

    await openViewSubmenu(user, "View Mode");
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
