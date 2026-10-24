// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fixturePersonalSettingsPort } from "./fixture-port";
import { SettingsPersonalScreen } from "./settings-personal-screen";

afterEach(cleanup);
const user = { name: "Ada Lovelace", email: "ada@example.test" };

describe("SettingsPersonalScreen", () => {
  it("renders the seven locale rows from the port", async () => {
    const port = {
      async getPersonalSettings(u: typeof user) {
        const base = await fixturePersonalSettingsPort.getPersonalSettings(u);
        return {
          ...base,
          locale: {
            language: "L1",
            countryLocale: "L2",
            dateFormat: "L3",
            timeFormat: "L4",
            timeZone: "L5",
            distanceUnit: "L6",
            numberFormat: "L7",
          },
        };
      },
    };
    render(<SettingsPersonalScreen user={user} port={port} />);
    await screen.findByText("Locale Information");
    for (const l of ["L1", "L2", "L3", "L4", "L5", "L6", "L7"])
      expect(screen.getByText(l)).toBeDefined();
    expect(document.querySelectorAll("[data-locale-row]")).toHaveLength(7);
  });

  it("enables locale editing while keeping unrelated settings inert", async () => {
    render(<SettingsPersonalScreen user={user} />);
    await screen.findByText("Locale Information");
    expect(screen.getByRole("tab", { name: "Accessibility" })).toHaveProperty("disabled", true);
    for (const n of ["Edit profile", "Add group"])
      expect(screen.getByRole("button", { name: n })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Edit locale information" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByLabelText("Name Format")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Sort order")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Email value")).toHaveProperty("disabled", true);
  });
});
