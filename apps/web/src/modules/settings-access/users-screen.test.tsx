import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { ActionState } from "@/lib/action";
import { render } from "@/test/render";
import { splitName, type UserAccessInfo, type UserRow, UsersScreen } from "./users-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/crm/acme/settings/users",
}));

const ada: UserRow = {
  userId: "ada",
  name: "Ada Admin",
  email: "ada@example.test",
  role: "admin",
  joinedAt: "Oct 4, 2026",
};
const bea: UserRow = {
  userId: "bea",
  name: "Bea Member",
  email: "bea@example.test",
  role: "member",
  joinedAt: "Oct 5, 2026",
};

const access: UserAccessInfo = {
  orgSlug: "acme",
  profiles: [
    { id: "p-admin", name: "Administrator" },
    { id: "p-std", name: "Standard" },
  ],
  roles: [
    { id: "r-ceo", name: "CEO" },
    { id: "r-mgr", name: "Manager" },
  ],
  byUser: {
    ada: { profileId: "p-admin", roleId: "r-ceo", isOwner: true },
    bea: { profileId: "p-std", roleId: "r-mgr", isOwner: false },
  },
};

const localization = { locale: "en-US", timeZone: "UTC" };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderScreen(props: Partial<Parameters<typeof UsersScreen>[0]> = {}) {
  return render(
    <UsersScreen
      orgSlug="acme"
      users={[ada, bea]}
      currentUserId="ada"
      canManage
      access={access}
      groupsByUser={{ bea: ["Sales Team"] }}
      localization={localization}
      inviteAction={vi.fn()}
      onChangeRole={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />,
  );
}

test("splitName keeps the last word as the last name", () => {
  expect(splitName("Ada Lovelace King")).toEqual({ first: "Ada Lovelace", last: "King" });
  expect(splitName("Cher")).toEqual({ first: "Cher", last: "" });
});

test("the list shows tabs, status count, role and profile lines and the super admin pill", () => {
  renderScreen();
  const tabs = screen.getByRole("navigation", { name: "Users and groups" });
  expect(within(tabs).getByRole("link", { name: "Users" }).getAttribute("aria-current")).toBe(
    "page",
  );
  expect(within(tabs).getByRole("link", { name: "Groups" })).toBeTruthy();
  expect(within(tabs).getByRole("link", { name: "Activate Users" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /User status/ }).textContent).toContain(
    "Active Users (2)",
  );
  const list = screen.getByRole("list", { name: "Users" });
  const items = within(list).getAllByRole("listitem");
  expect(items[0]?.textContent).toContain("CEO,");
  expect(items[0]?.textContent).toContain("Super Admin");
  expect(items[1]?.textContent).toContain("Manager, Standard");
  // The owner row has no selection checkbox.
  expect(screen.queryByRole("checkbox", { name: "Select Ada Admin" })).toBeNull();
  expect(screen.getByRole("checkbox", { name: "Select Bea Member" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "New User" })).toBeTruthy();
});

test("selecting a user shows the detail sections; search filters the list", async () => {
  const user = userEvent.setup();
  renderScreen();
  expect(screen.getByRole("article", { name: "User details: Ada Admin" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Bea Member/ }));
  const detail = screen.getByRole("article", { name: "User details: Bea Member" });
  for (const title of [
    "User Information",
    "Address Information",
    "Audit Information",
    "Localization",
    "Groups",
  ]) {
    expect(within(detail).getByRole("heading", { name: title })).toBeTruthy();
  }
  expect(detail.textContent).toContain("Sales Team");
  await user.click(within(detail).getByRole("button", { name: /Hide details/ }));
  expect(within(detail).queryByRole("heading", { name: "Address Information" })).toBeNull();

  await user.type(screen.getByRole("searchbox", { name: "Search users" }), "bea");
  expect(within(screen.getByRole("list", { name: "Users" })).getAllByRole("listitem")).toHaveLength(
    1,
  );
});

test("a member sees no edit, invite or selection controls", () => {
  renderScreen({ canManage: false, access: undefined, currentUserId: "bea" });
  expect(screen.queryByRole("button", { name: "New User" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit user" })).toBeNull();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByRole("link", { name: "Groups" })).toBeNull();
  expect(screen.getByText("You")).toBeTruthy();
});

test("edit mode changes the membership role once and removes through the confirm dialog", async () => {
  const user = userEvent.setup();
  const onChangeRole = vi.fn(
    async (_userId: string, _previous: ActionState, _formData: FormData) => ({
      status: "success" as const,
    }),
  );
  const onRemove = vi.fn(async () => ({ status: "success" as const }));
  renderScreen({ onChangeRole, onRemove });
  await user.click(screen.getByRole("button", { name: /Bea Member/ }));
  await user.click(screen.getByRole("button", { name: "Edit user" }));
  expect(screen.getByRole("button", { name: /Profile of Bea Member/ }).textContent).toContain(
    "Standard",
  );
  expect(screen.getByRole("button", { name: /Access role of Bea Member/ }).textContent).toContain(
    "Manager",
  );
  await user.click(screen.getByRole("button", { name: /Role for Bea Member/ }));
  await user.click(screen.getByRole("option", { name: "Admin" }));
  await waitFor(() => expect(onChangeRole).toHaveBeenCalledTimes(1));
  expect(onChangeRole.mock.calls[0]?.[2].get("role")).toBe("admin");

  await user.click(screen.getByRole("button", { name: "Remove Bea Member" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  expect(onRemove).toHaveBeenCalledWith("bea", { status: "idle" }, expect.any(FormData));
});

test("a failed role change shows one warning above the split view", async () => {
  const user = userEvent.setup();
  const onChangeRole = vi.fn(async () => ({
    status: "error" as const,
    message: "An organization must have an admin.",
  }));
  renderScreen({ onChangeRole });
  await user.click(screen.getByRole("button", { name: "Edit user" }));
  await user.click(screen.getByRole("button", { name: /Role for Ada Admin/ }));
  await user.click(screen.getByRole("option", { name: "Member" }));
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("An organization must have an admin.");
});
