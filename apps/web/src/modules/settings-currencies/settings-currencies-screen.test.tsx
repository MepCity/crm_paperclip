// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureCurrenciesPort } from "./fixture-port";
import { SettingsCurrenciesScreen } from "./settings-currencies-screen";

afterEach(cleanup);

describe("SettingsCurrenciesScreen", () => {
  it("renders start panel with proposed home currency and disabled buttons", async () => {
    render(<SettingsCurrenciesScreen port={fixtureCurrenciesPort} />);

    expect(screen.getByRole("status").textContent).toContain("Loading currency settings…");

    await screen.findByTestId("home-currency-panel");

    expect(screen.getByRole("tab", { name: "Currencies" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tab", { name: "Company Details" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("tab", { name: "Fiscal Year" })).toHaveProperty("disabled", true);

    expect(screen.getByRole("heading", { name: "Currencies" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Currencies Help" })).toHaveProperty(
      "disabled",
      true,
    );

    const featureInfo = document.getElementById("cr_content");
    expect(featureInfo?.textContent).toContain(
      "This page helps you to define the currency preferences used by your organization.",
    );

    const panel = screen.getByTestId("home-currency-panel");
    expect(panel.textContent).toContain(
      "Do you want to set Turkish Lira - TRY as your home currency? Once you confirm your home currency, you cannot change it later.",
    );

    const changeBtn = screen.getByRole("button", { name: "Change Home Currency" });
    const confirmBtn = screen.getByRole("button", { name: "Yes, Confirm Home Currency" });
    expect(changeBtn).toHaveProperty("disabled", true);
    expect(confirmBtn).toHaveProperty("disabled", true);
  });

  it("shows loading state initially while pending", () => {
    const neverResolvingPort = {
      getHomeCurrency: () => new Promise<never>(() => {}),
    };
    render(<SettingsCurrenciesScreen port={neverResolvingPort} />);
    expect(screen.getByRole("status").textContent).toContain("Loading currency settings…");
  });

  it("shows error state when port rejects", async () => {
    const failingPort = {
      getHomeCurrency: () => Promise.reject(new Error("Network failure")),
    };
    render(<SettingsCurrenciesScreen port={failingPort} />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Currency settings could not be loaded.");
  });
});
