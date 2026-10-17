import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { OrganizationSwitcher, type ShellOrganization } from "./organization-switcher";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("OrganizationSwitcher", () => {
  const organizations: readonly ShellOrganization[] = [
    { name: "Acme Corp", slug: "acme" },
    { name: "Beta Industries", slug: "beta" },
    { name: "Create team", slug: "create" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays the active organization name on the trigger button", () => {
    render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

    const trigger = screen.getByRole("button", {
      name: "Organization switcher: Acme Corp",
    });
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain("Acme Corp");
  });

  it("lists other organizations and marks the active organization when opened", async () => {
    const user = userEvent.setup();
    render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

    const trigger = screen.getByRole("button", {
      name: "Organization switcher: Acme Corp",
    });
    await user.click(trigger);

    expect(screen.getByRole("menu")).toBeTruthy();

    const activeItem = screen.getByRole("menuitemradio", {
      name: "Acme Corp",
    });
    expect(activeItem.getAttribute("aria-checked")).toBe("true");

    const betaItem = screen.getByRole("menuitemradio", {
      name: "Beta Industries",
    });
    expect(betaItem.getAttribute("aria-checked")).toBe("false");

    await user.click(betaItem);
    expect(navigation.push).toHaveBeenCalledWith("/crm/beta");
  });

  it("navigates to create organization route when create option is selected", async () => {
    const user = userEvent.setup();
    render(<OrganizationSwitcher organizations={organizations} currentSlug="acme" />);

    const trigger = screen.getByRole("button", {
      name: "Organization switcher: Acme Corp",
    });
    await user.click(trigger);

    const createOption = screen.getByRole("menuitemradio", {
      name: "Create organization",
    });
    await user.click(createOption);
    expect(navigation.push).toHaveBeenCalledWith("/orgs/new");
  });

  it("handles a single organization correctly", async () => {
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

    // Only one organization radio plus the create organization action are present
    const orgRadios = screen.getAllByRole("menuitemradio");
    expect(orgRadios).toHaveLength(2);
    expect(screen.getByRole("menuitemradio", { name: "Create organization" })).toBeTruthy();
  });

  it("falls back to default label when currentSlug does not match any organization", () => {
    render(<OrganizationSwitcher organizations={organizations} currentSlug="non-existent" />);

    expect(screen.getByRole("button", { name: "Organization switcher" })).toBeTruthy();
  });
});
