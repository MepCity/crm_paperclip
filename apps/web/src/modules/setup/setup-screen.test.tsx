// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { SetupScreen } from "./setup-screen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

describe("SetupScreen", () => {
  it("renders Setup heading, search box, customize button and category cards", () => {
    render(<SetupScreen orgSlug="demo" />);

    expect(screen.getByRole("heading", { name: "Setup", level: 1 })).toBeDefined();
    expect(screen.getByRole("searchbox", { name: "Search Setup" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Customize Setup" })).toBeDefined();

    const nav = screen.getByRole("navigation", { name: "Settings navigation" });
    expect(nav).toBeDefined();

    // Check primary category headings
    expect(screen.getByRole("heading", { name: "General" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Security Control" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Channels" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Customization" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Automation" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Data Administration" })).toBeDefined();
  });

  it("renders active links to existing settings pages", () => {
    render(<SetupScreen orgSlug="demo" />);

    const personalLink = screen.getByRole("link", { name: "Personal Settings" });
    expect(personalLink.getAttribute("href")).toBe("/crm/demo/settings/personal-settings");

    const companyLink = screen.getByRole("link", { name: "Company Details" });
    expect(companyLink.getAttribute("href")).toBe("/crm/demo/settings/company-details");

    const emailLink = screen.getByRole("link", { name: "Email" });
    expect(emailLink.getAttribute("href")).toBe("/crm/demo/settings/email-configuration");

    const modulesLink = screen.getByRole("link", { name: "Modules and Fields" });
    expect(modulesLink.getAttribute("href")).toBe("/crm/demo/settings/modules");

    const workflowLink = screen.getByRole("link", { name: "Workflow Rules" });
    expect(workflowLink.getAttribute("href")).toBe("/crm/demo/settings/workflow-rules");
  });

  it("renders passive/disabled items without link roles", () => {
    render(<SetupScreen orgSlug="demo" />);

    expect(screen.getByText("Motivator")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Motivator" })).toBeNull();

    expect(screen.getByText("Telephony")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Telephony" })).toBeNull();
  });

  it("filters categories and links by search query", () => {
    render(<SetupScreen orgSlug="demo" />);

    const searchInput = screen.getByRole("searchbox", { name: "Search Setup" });
    fireEvent.change(searchInput, { target: { value: "Personal" } });

    expect(screen.getByRole("link", { name: "Personal Settings" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "General" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Channels" })).toBeNull();

    fireEvent.change(searchInput, { target: { value: "non-existent-setting-xyz" } });
    expect(screen.getByText(/No settings found for/)).toBeDefined();

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);
    expect(screen.getByRole("heading", { name: "Channels" })).toBeDefined();
  });

  it("renders in Turkish with Ayarlar heading and localized items", () => {
    render(
      <LanguageProvider language="tr">
        <SetupScreen orgSlug="demo" />
      </LanguageProvider>,
    );

    expect(screen.getByRole("heading", { name: "Ayarlar", level: 1 })).toBeDefined();
    expect(screen.getByRole("link", { name: "Modüller ve Alanlar" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Genel" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Geliştirici Merkezi" })).toBeDefined();
  });
});
