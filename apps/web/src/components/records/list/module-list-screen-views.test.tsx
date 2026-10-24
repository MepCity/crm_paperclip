import type { ModuleApiName, RecordService } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { resetPreferenceStoreForTests } from "@/lib/preferences";
import { contactsListPageConfig } from "@/modules/contacts/list-config";
import { savePrivateView } from "../views/custom-view-api";
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

describe("ModuleListScreen Custom View Dialog Integration", () => {
  beforeEach(() => {
    resetPreferenceStoreForTests();
    localStorage.clear();
    navigation.params = new URLSearchParams();
    navigation.push.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens New Custom View dialog from ViewTabStrip custom views menu", async () => {
    const user = userEvent.setup();
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={contactsListPageConfig} isAdmin />, {
      wrapper: wrapper(service),
    });

    await screen.findByRole("table", { name: "Records" });

    // Click Custom views ellipsis button
    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await user.click(viewsBtn);

    // Click "New Custom View"
    const newViewItem = await screen.findByRole("menuitem", { name: "New Custom View" });
    await user.click(newViewItem);

    // Verify dialog opens
    const dialog = await screen.findByRole("dialog", { name: "New Custom View" });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "New Custom View" })).toBeTruthy();
    expect(within(dialog).getByLabelText("Enter Custom View Name")).toBeTruthy();
    expect(within(dialog).getByTestId("sharing-section")).toBeTruthy(); // Admin sees sharing
  });

  it("opens Edit Current View dialog from ViewTabStrip menu with initial view populated", async () => {
    const user = userEvent.setup();
    const customView = {
      id: "custom-1",
      name: "My Custom View",
      systemDefined: false,
      isDefault: false,
      columns: ["Full_Name", "Email"],
      criteria: null,
      sort: null,
    };
    const records = createFixtureRecordService(ctx);
    const baseService = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });
    const service = {
      ...baseService,
      listViewSummaries: async (m: ModuleApiName) => [
        ...(await records.listViews(m)),
        { id: customView.id, name: customView.name, systemDefined: false, isDefault: false },
      ],
      getView: async (m: ModuleApiName, id: string) =>
        id === customView.id ? customView : records.getView(m, id),
      list: async (m: ModuleApiName, q: Parameters<RecordService["list"]>[1]) =>
        q.viewId === customView.id
          ? records.list(m, { ...q, viewId: "all-contacts" })
          : records.list(m, q),
      count: async (m: ModuleApiName, q: Parameters<RecordService["count"]>[1]) =>
        q.viewId === customView.id
          ? records.count(m, { ...q, viewId: "all-contacts" })
          : records.count(m, q),
    };

    render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={contactsListPageConfig}
        viewId="custom-1"
        isAdmin
      />,
      {
        wrapper: wrapper(service),
      },
    );

    await screen.findByRole("table", { name: "Records" });

    // Open Custom views menu
    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await user.click(viewsBtn);

    // Click "Edit Current View"
    const editItem = await screen.findByRole("menuitem", { name: "Edit Current View" });
    await user.click(editItem);

    // Verify dialog opens in Edit mode with view populated
    const dialog = await screen.findByRole("dialog", { name: /^Edit Custom View/ });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByDisplayValue("My Custom View")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Delete View" })).toBeTruthy();
  });

  it("member saves private custom view without 403 and navigates to the new view", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={contactsListPageConfig}
        currentUserId="user-member-1"
        isAdmin={false}
        userRole="member"
      />,
      { wrapper: wrapper(service) },
    );

    await screen.findByRole("table", { name: "Records" });

    // Open Custom views menu
    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await user.click(viewsBtn);

    // Click "New Custom View"
    const newViewItem = await screen.findByRole("menuitem", { name: "New Custom View" });
    await user.click(newViewItem);

    const dialog = await screen.findByRole("dialog", { name: "New Custom View" });
    // Sharing section is omitted for members
    expect(within(dialog).queryByTestId("sharing-section")).toBeNull();

    // Fill name
    const nameInput = within(dialog).getByLabelText("Enter Custom View Name");
    await user.type(nameInput, "My Member View");

    // Add criterion
    const addCriterionBtn = within(dialog).getByRole("button", { name: "Add Criterion" });
    await user.click(addCriterionBtn);
    const criterionRow = within(dialog).getByTestId("criterion-row-0");
    const valueInput = within(criterionRow).getByPlaceholderText("Type here");
    await user.type(valueInput, "Alice");

    const saveBtn = within(dialog).getByRole("button", { name: "Save" });
    await user.click(saveBtn);

    // Dialog closes without 403 Forbidden
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New Custom View" })).toBeNull();
    });

    // fetch was NOT called because private views are stored locally, avoiding 403
    expect(fetchSpy).not.toHaveBeenCalled();

    // Navigates to custom view route
    expect(navigation.push).toHaveBeenCalledWith(expect.stringContaining("custom-view/"));
  });

  it("private view injects criteria into list and count queries and is isolated between users", async () => {
    const records = createFixtureRecordService(ctx);
    const baseService = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    const listSpy = vi.fn(async (m: ModuleApiName, q: Parameters<RecordService["list"]>[1]) => {
      return records.list(m, { ...q, viewId: "all-contacts" });
    });
    const countSpy = vi.fn(async (m: ModuleApiName, q: Parameters<RecordService["count"]>[1]) => {
      return records.count(m, { ...q, viewId: "all-contacts" });
    });

    const service = {
      ...baseService,
      list: listSpy,
      count: countSpy,
    };

    // Pre-populate private view for user-1
    const privateViewId = "custom-user1-view";
    savePrivateView(ctx.orgSlug, "user-1", "Contacts", {
      id: privateViewId,
      name: "User 1 Private View",
      columns: ["Full_Name", "Email"],
      systemDefined: false,
      isDefault: false,
      sort: null,
      criteria: {
        field: "First_Name",
        comparator: "equal",
        value: "Alice",
      },
    });

    // 1. Render as user-1 with their private view
    const { unmount } = render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={contactsListPageConfig}
        currentUserId="user-1"
        viewId={privateViewId}
        isAdmin={false}
        userRole="member"
      />,
      { wrapper: wrapper(service as unknown as ReturnType<typeof createClientRecordService>) },
    );

    await screen.findByRole("table", { name: "Records" });

    // Verify list and count were called with serverViewId ("all-contacts") and injected criteria
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        "Contacts",
        expect.objectContaining({
          viewId: "all-contacts",
          filters: {
            field: "First_Name",
            comparator: "equal",
            value: "Alice",
          },
        }),
      );
      expect(countSpy).toHaveBeenCalledWith(
        "Contacts",
        expect.objectContaining({
          viewId: "all-contacts",
          filters: {
            field: "First_Name",
            comparator: "equal",
            value: "Alice",
          },
        }),
      );
    });

    unmount();

    // 2. Render as user-2 with their view menu - user-1's private view must NOT be visible
    render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={contactsListPageConfig}
        currentUserId="user-2"
        isAdmin={false}
        userRole="member"
      />,
      { wrapper: wrapper(service as unknown as ReturnType<typeof createClientRecordService>) },
    );

    await screen.findByRole("table", { name: "Records" });

    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await userEvent.setup().click(viewsBtn);

    expect(screen.queryByText("User 1 Private View")).toBeNull();
  });

  it("admin saves shared custom view and navigates to the new view", async () => {
    const user = userEvent.setup();
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ revision: "r2", custom_views: [{ id: "new-shared-view" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={contactsListPageConfig} isAdmin />, {
      wrapper: wrapper(service),
    });

    await screen.findByRole("table", { name: "Records" });

    // Open Custom views menu
    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await user.click(viewsBtn);

    const newViewItem = await screen.findByRole("menuitem", { name: "New Custom View" });
    await user.click(newViewItem);

    const dialog = await screen.findByRole("dialog", { name: "New Custom View" });

    // Select "Everyone"
    const everyoneRadio = within(dialog).getByRole("radio", { name: "Everyone" });
    await user.click(everyoneRadio);

    // Enter name
    const nameInput = within(dialog).getByLabelText("Enter Custom View Name");
    await user.type(nameInput, "All Shared View");

    const saveBtn = within(dialog).getByRole("button", { name: "Save" });
    await user.click(saveBtn);

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New Custom View" })).toBeNull();
    });

    // Navigates to custom view route
    expect(navigation.push).toHaveBeenCalledWith(expect.stringContaining("custom-view/"));
  });
});
