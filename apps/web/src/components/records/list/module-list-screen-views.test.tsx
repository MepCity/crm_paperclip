import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrivateViews } from "@/components/records/views/custom-view-api";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { resetPreferenceStoreForTests } from "@/lib/preferences";
import { contactsListPageConfig } from "@/modules/contacts/list-config";
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
    navigation.params = new URLSearchParams();
    navigation.push.mockClear();
    localStorage.clear();
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
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    render(<ModuleListScreen orgSlug={ctx.orgSlug} config={contactsListPageConfig} isAdmin />, {
      wrapper: wrapper(service),
    });

    await screen.findByRole("table", { name: "Records" });

    // Open Custom views menu
    const viewsBtn = screen.getByRole("button", { name: "Custom views" });
    await user.click(viewsBtn);

    // Click "Edit Current View"
    const editItem = await screen.findByRole("menuitem", { name: "Edit Current View" });
    await user.click(editItem);

    // Verify dialog opens in Edit mode
    const dialog = await screen.findByRole("dialog", { name: /^Edit Custom View/ });
    expect(dialog).toBeTruthy();
    // Default/system views show the protected banner
    expect(
      within(dialog).getByText(
        /Protected view: System and default views cannot be edited or deleted/,
      ),
    ).toBeTruthy();
  });

  it("member sees no sharing options and saves private view locally", async () => {
    const user = userEvent.setup();
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    render(
      <ModuleListScreen
        orgSlug={ctx.orgSlug}
        config={contactsListPageConfig}
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

    // Fill name and save
    const nameInput = within(dialog).getByLabelText("Enter Custom View Name");
    await user.type(nameInput, "My Member View");

    const saveBtn = within(dialog).getByRole("button", { name: "Save" });
    await user.click(saveBtn);

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New Custom View" })).toBeNull();
    });

    // Check private views
    const saved = getPrivateViews(ctx.orgSlug, "Contacts");
    expect(saved).toHaveLength(1);
    expect(saved[0]?.name).toBe("My Member View");
  });

  it("admin saves shared custom view and navigates to the new view", async () => {
    const user = userEvent.setup();
    const records = createFixtureRecordService(ctx);
    const service = createClientRecordService(records, {
      listUsers: async () => [{ userId: ctx.userId, name: "User", email: "u@example.test" }],
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ custom_views: [{ id: "new-shared-view" }] }), {
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
