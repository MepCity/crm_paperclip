import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailSettingsScreen } from "./email-settings-screen";
import { fixtureEmailSettings, fixtureEmailSettingsPort } from "./fixture-port";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EmailSettingsScreen", () => {
  it("loads compose defaults and keeps unobserved writes disabled", async () => {
    render(<EmailSettingsScreen orgSlug="demo" />);
    expect(screen.getByRole("status").textContent).toContain("Loading");
    await screen.findByRole("heading", { name: "Compose Settings" });
    for (const label of [
      "Default Font Family",
      "Default Font Size",
      "Default From Address",
      "Default Reply-To Address",
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label) }).getAttribute("disabled"),
      ).not.toBeNull();
    }
    expect(screen.getByRole("button", { name: "Add New Signature" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Email" }).getAttribute("aria-disabled")).toBe("true");
    expect(Object.keys(fixtureEmailSettingsPort)).toEqual(["readSettings"]);
  });

  it("switches configuration tabs, updates routes and filters invented users locally", async () => {
    const user = userEvent.setup();
    render(<EmailSettingsScreen orgSlug="demo" />);
    await screen.findByRole("heading", { name: "Compose Settings" });
    await user.click(screen.getByRole("tab", { name: "Email Sharing" }));
    expect(push).toHaveBeenLastCalledWith("/crm/demo/settings/email-configuration/email-sharing");
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Mass Update" })).toHaveProperty("disabled", true);
    await user.type(screen.getByRole("searchbox", { name: "Search User, Profile" }), "two");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Demo User Two")).toBeDefined();
    await user.clear(screen.getByRole("searchbox", { name: "Search User, Profile" }));
    await user.type(screen.getByRole("searchbox", { name: "Search User, Profile" }), "no-match");
    expect(screen.getByText("No users found.")).toBeDefined();
    await user.click(screen.getByRole("tab", { name: "Organization Emails" }));
    expect(screen.getByRole("button", { name: "Add Email Address" })).toHaveProperty(
      "disabled",
      true,
    );
    await user.click(screen.getByRole("tab", { name: "Custom Email Fields" }));
    expect(push).toHaveBeenLastCalledWith(
      "/crm/demo/settings/email-configuration/custom-email-fields-preference",
    );
    expect(
      (screen.getByRole("switch", { name: "Custom email preferences" }) as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(screen.getByRole("switch", { name: "Custom email preferences" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("supports keyboard tab navigation and skips unresearched Email setup", async () => {
    const user = userEvent.setup();
    render(<EmailSettingsScreen orgSlug="demo" />);
    await screen.findByRole("heading", { name: "Compose Settings" });
    screen.getByRole("tab", { name: "Compose" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Email Sharing" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("shows explicit parser/BCC gaps without generating an address", async () => {
    const user = userEvent.setup();
    render(<EmailSettingsScreen orgSlug="demo" />);
    await screen.findByRole("heading", { name: "Compose Settings" });
    await user.click(screen.getByRole("tab", { name: "Email Parser" }));
    expect(screen.queryByRole("tablist", { name: "Email configuration" })).toBeNull();
    expect(screen.getByText(/Email Parser data is unavailable/)).toBeDefined();
    await user.click(screen.getByRole("tab", { name: "BCC Dropbox" }));
    expect(screen.getByText(/No address has been generated/)).toBeDefined();
    expect(push).toHaveBeenLastCalledWith("/crm/demo/settings/bcc-dropbox");
    expect(screen.queryByRole("button", { name: "Regenerate" })).toBeNull();
  });

  it("shows an empty sharing table and a load error without showing defaults", async () => {
    const view = render(
      <EmailSettingsScreen
        orgSlug="demo"
        initialTab="email-sharing"
        port={{ readSettings: async () => ({ ...fixtureEmailSettings, sharingUsers: [] }) }}
      />,
    );
    await screen.findByText("No users found.");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    view.rerender(
      <EmailSettingsScreen
        orgSlug="demo"
        port={{
          readSettings: async () => {
            throw new Error("unavailable");
          },
        }}
      />,
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Email settings could not be loaded.",
    );
    expect(screen.queryByRole("heading", { name: "Compose Settings" })).toBeNull();
  });
});
