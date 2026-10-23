// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureModuleListPort } from "./fixture-port";
import { SettingsModulesScreen } from "./settings-modules-screen";

afterEach(cleanup);

describe("SettingsModulesScreen", () => {
  it("renders rows in order with disabled writes", async () => {
    render(<SettingsModulesScreen port={fixtureModuleListPort} />);
    expect(screen.getByText("Loading modules…")).toBeDefined();
    await screen.findAllByText("Leads");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]?.textContent).toContain("Home");
    expect(rows[1]?.textContent).toContain("Leads");
    expect(screen.getByRole("tab", { name: "Modules" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Web Tabs" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Create New Module" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "Create module using assistant" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("switch", { name: "Leads status" })).toHaveProperty("disabled", true);
  });

  it("shows icons per row, avatar only with a date, legend icons", async () => {
    render(<SettingsModulesScreen port={fixtureModuleListPort} />);
    await screen.findAllByText("Leads");
    const rows = screen.getAllByRole("row").slice(1);
    for (const r of rows) {
      expect(r.querySelectorAll('[data-testid="module-icon"]')).toHaveLength(1);
      const has = (r.querySelectorAll("td")[4]?.textContent ?? "") !== "";
      expect(r.querySelectorAll('[data-testid="modifier-avatar"]').length).toBe(has ? 1 : 0);
    }
    expect(screen.getByTestId("legend-custom")).toBeDefined();
    expect(screen.getByTestId("legend-team")).toBeDefined();
  });

  it("filters by search and shows empty state", async () => {
    render(<SettingsModulesScreen port={fixtureModuleListPort} />);
    await screen.findAllByText("Leads");
    await userEvent.type(screen.getByRole("searchbox", { name: "Search modules" }), "MEETI");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search modules" }), "zzz");
    expect(screen.getByText("No modules found")).toBeDefined();
  });

  it("shows error state", async () => {
    render(<SettingsModulesScreen port={{ listModules: () => Promise.reject(new Error("x")) }} />);
    expect((await screen.findByRole("alert")).textContent).toContain("could not be loaded");
  });
});
