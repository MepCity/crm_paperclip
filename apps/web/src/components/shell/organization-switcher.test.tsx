import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { OrganizationSwitcher, type ShellOrganization } from "./organization-switcher";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

const organizations: readonly ShellOrganization[] = [
  { name: "Acme Corp", slug: "acme" },
  { name: "Beta LLC", slug: "beta" },
];

test("button is named Organization switcher: <current name> or Organization switcher when currentSlug matches none", () => {
  const { rerender } = render(
    <OrganizationSwitcher organizations={organizations} currentSlug="acme" />,
  );
  expect(screen.getByRole("button", { name: "Organization switcher: Acme Corp" })).toBeTruthy();

  rerender(<OrganizationSwitcher organizations={organizations} currentSlug="unknown" />);
  expect(screen.getByRole("button", { name: "Organization switcher" })).toBeTruthy();
});

test("the menu Organizations lists every org and Create organization", async () => {
  const user = userEvent.setup();
  render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

  await user.click(screen.getByRole("button", { name: "Organization switcher: Acme Corp" }));

  const menu = screen.getByRole("menu");
  expect(menu).toBeTruthy();
  expect(menu.getAttribute("aria-label")).toBe("Organizations");
  const acmeItem = screen.getByRole("menuitemradio", { name: "Acme Corp" });
  expect(acmeItem.getAttribute("aria-checked")).toBe("true");

  const betaItem = screen.getByRole("menuitemradio", { name: "Beta LLC" });
  expect(betaItem.getAttribute("aria-checked")).toBe("false");

  expect(screen.getByRole("menuitemradio", { name: "Create organization" })).toBeTruthy();
});

test("choosing another organization pushes /crm/<slug>", async () => {
  const user = userEvent.setup();
  render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

  await user.click(screen.getByRole("button", { name: "Organization switcher: Acme Corp" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Beta LLC" }));

  expect(router.push).toHaveBeenCalledWith("/crm/beta");
});

test("choosing Create organization pushes /orgs/new", async () => {
  const user = userEvent.setup();
  render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

  await user.click(screen.getByRole("button", { name: "Organization switcher: Acme Corp" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Create organization" }));

  expect(router.push).toHaveBeenCalledWith("/orgs/new");
});

test("handles a single organization correctly", async () => {
  const user = userEvent.setup();
  const singleOrg: readonly ShellOrganization[] = [{ name: "Solo Workspace", slug: "solo" }];

  render(<OrganizationSwitcher organizations={singleOrg} currentSlug="solo" />);

  const trigger = screen.getByRole("button", {
    name: "Organization switcher: Solo Workspace",
  });
  expect(trigger).toBeTruthy();
  expect(trigger.textContent).toContain("Solo Workspace");

  await user.click(trigger);

  const soloItem = screen.getByRole("menuitemradio", {
    name: "Solo Workspace",
  });
  expect(soloItem.getAttribute("aria-checked")).toBe("true");

  const orgRadios = screen.getAllByRole("menuitemradio");
  expect(orgRadios).toHaveLength(2);
  expect(screen.getByRole("menuitemradio", { name: "Create organization" })).toBeTruthy();
});
