import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { AppShell } from "./app-shell";
import { isNavLinkActive, type NavConfig } from "./nav";
import { Navigation } from "./navigation";
import { OrganizationSwitcher } from "./organization-switcher";
import { PageHeader } from "./page-header";
import { PageTitle } from "./page-title";
import { UserMenu } from "./user-menu";

const navigation = vi.hoisted(() => ({
  path: "/o/example",
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => navigation,
}));

const organizations = [
  { name: "Example team", slug: "example" },
  { name: "Second team", slug: "second" },
  { name: "Create team", slug: "create" },
];
const user = { name: "Example User", email: "user@example.test" };
const leadsLink = {
  id: "leads",
  label: "Leads",
  icon: Icons.building,
  href: (slug: string) => `/o/${slug}/leads`,
  match: "prefix" as const,
};
const config: NavConfig = {
  links: [
    { id: "home", label: "Home", icon: Icons.home, href: (slug) => `/o/${slug}`, match: "exact" },
  ],
  sections: [
    {
      id: "crm",
      label: "CRM Teamspace",
      groups: [
        {
          id: "sales",
          label: "Sales",
          icon: Icons.folder,
          links: [
            {
              id: "leads",
              label: "Leads",
              icon: Icons.building,
              href: (slug) => `/o/${slug}/leads`,
              match: "prefix",
            },
          ],
        },
        { id: "empty", label: "Empty group", icon: Icons.folder, links: [] },
      ],
    },
    { id: "empty-section", label: "Empty section", groups: [] },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  navigation.path = "/o/example";
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => setTimeout(() => fn(0), 0));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("Navigation renders configured links and populated groups, with correct active paths", () => {
  const view = render(<Navigation orgSlug="example" config={config} />);
  const home = screen.getByRole("link", { name: "Home" });
  expect(home.getAttribute("href")).toBe("/o/example");
  expect(home.getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Leads" }).getAttribute("aria-current")).toBeNull();
  expect(screen.queryByText("Empty group")).toBeNull();
  expect(screen.queryByText("Empty section")).toBeNull();
  navigation.path = "/o/example/leads/record";
  view.rerender(<Navigation orgSlug="example" config={config} />);
  expect(screen.getByRole("link", { name: "Leads" }).getAttribute("aria-current")).toBe("page");
  expect(home.getAttribute("aria-current")).toBeNull();
  expect(isNavLinkActive(leadsLink, "example", "/o/example/leads-other")).toBe(false);
});

test("Navigation groups collapse and expand with mouse and keyboard", async () => {
  const keyboard = userEvent.setup();
  render(<Navigation orgSlug="example" config={config} />);
  const group = screen.getByRole("button", { name: "Sales" });
  expect(group.getAttribute("aria-expanded")).toBe("true");
  await keyboard.click(group);
  expect(screen.queryByRole("link", { name: "Leads" })).toBeNull();
  await keyboard.keyboard("{Enter}");
  expect(screen.getByRole("link", { name: "Leads" })).toBeTruthy();
  await keyboard.keyboard(" ");
  expect(screen.queryByRole("link", { name: "Leads" })).toBeNull();
});

test("Default navigation omits empty teamspace containers", () => {
  render(<Navigation orgSlug="example" />);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("region")).toBeNull();
});

test("Organization switcher lists organizations, marks the current one and selects using the keyboard", async () => {
  const keyboard = userEvent.setup();
  render(<OrganizationSwitcher currentSlug="example" organizations={organizations} />);
  await keyboard.tab();
  await keyboard.keyboard("{Enter}");
  const current = screen.getByRole("menuitemradio", { name: "Example team" });
  expect(current.getAttribute("aria-checked")).toBe("true");
  expect(
    screen.getByRole("menuitemradio", { name: "Second team" }).getAttribute("aria-checked"),
  ).toBe("false");
  await keyboard.keyboard("{Home}{ArrowDown}{Enter}");
  expect(navigation.push).toHaveBeenCalledWith("/o/second");
});

test("Organization switcher creates organizations and does not confuse a slug named create", async () => {
  const keyboard = userEvent.setup();
  render(<OrganizationSwitcher currentSlug="example" organizations={organizations} />);
  const trigger = screen.getByRole("button", { name: "Organization switcher" });
  await keyboard.click(trigger);
  await keyboard.click(screen.getByRole("menuitemradio", { name: "Create team" }));
  expect(navigation.push).toHaveBeenLastCalledWith("/o/create");
  await keyboard.click(trigger);
  await keyboard.keyboard("{End}{Enter}");
  expect(navigation.push).toHaveBeenLastCalledWith("/orgs/new");
});

test("User menu shows identity and initials and signs out", async () => {
  const keyboard = userEvent.setup();
  const signOut = vi.fn(async () => ({ ok: true as const }));
  render(<UserMenu user={user} onSignOut={signOut} />);
  expect(screen.getByRole("button", { name: "User menu" }).textContent).toBe("EU");
  await keyboard.tab();
  await keyboard.keyboard("{Enter}");
  expect(screen.getByText(user.name)).toBeTruthy();
  expect(screen.getByText(user.email)).toBeTruthy();
  await keyboard.keyboard("{ArrowDown}{Enter}");
  await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
  expect(navigation.replace).toHaveBeenCalledWith("/sign-in");
  expect(navigation.refresh).toHaveBeenCalledOnce();
});

test("Failed sign out shows an error and preserves the session", async () => {
  const keyboard = userEvent.setup();
  render(
    <UserMenu
      user={user}
      onSignOut={async () => ({ ok: false, message: "Network unavailable." })}
    />,
  );
  await keyboard.click(screen.getByRole("button", { name: "User menu" }));
  await keyboard.click(screen.getByRole("menuitem", { name: "Sign out" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Network unavailable.");
  expect(navigation.replace).not.toHaveBeenCalled();
});

test("Page title appears once in the top bar and updates on page changes", () => {
  const view = render(
    <AppShell orgSlug="example" organizations={organizations} user={user}>
      <PageTitle title="Home" />
      <p>Content</p>
    </AppShell>,
  );
  expect(
    within(screen.getByRole("banner")).getByRole("heading", { level: 1, name: "Home" }),
  ).toBeTruthy();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(document.title).toBe("Home | MepCity CRM");
  view.rerender(
    <AppShell orgSlug="example" organizations={organizations} user={user}>
      <PageTitle title="Settings" />
    </AppShell>,
  );
  expect(screen.getByRole("heading", { name: "Settings", level: 1 })).toBeTruthy();
  expect(document.title).toBe("Settings | MepCity CRM");
});

test("Rail hiding and reopening transfer focus to the available control", async () => {
  const keyboard = userEvent.setup();
  render(
    <AppShell orgSlug="example" organizations={organizations} user={user}>
      <PageTitle title="Home" />
    </AppShell>,
  );
  const hide = screen.getByRole("button", { name: "Hide Menu" });
  await keyboard.click(hide);
  expect(screen.getByLabelText("Navigation rail").className).toContain("hidden");
  const show = screen.getByRole("button", { name: "Show Menu" });
  await waitFor(() => expect(document.activeElement).toBe(show));
  await keyboard.keyboard("{Enter}");
  expect(screen.getByLabelText("Navigation rail").className).not.toContain("hidden");
  await waitFor(() => expect(document.activeElement).toBe(hide));
});

test("Mobile rail starts hidden and changes with viewport width", () => {
  let onChange: (() => void) | undefined;
  const media = {
    matches: false,
    addEventListener: vi.fn((_: string, fn: () => void) => {
      onChange = fn;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => media);
  const view = render(
    <AppShell orgSlug="example" organizations={organizations} user={user}>
      <PageTitle title="Home" />
    </AppShell>,
  );
  expect(screen.getByLabelText("Navigation rail").className).toContain("hidden");
  view.unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", onChange);
});

test("PageHeader supplies description and actions without repeating a title", () => {
  const view = render(
    <PageHeader description="Organization details." actions={<Button>Invite member</Button>} />,
  );
  expect(screen.getByText("Organization details.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Invite member" })).toBeTruthy();
  expect(screen.queryByRole("heading")).toBeNull();
  view.rerender(<PageHeader />);
  expect(view.container.textContent).toBe("");
});
