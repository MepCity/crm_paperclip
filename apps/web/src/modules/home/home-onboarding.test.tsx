import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { HomeOnboarding } from "./home-onboarding";

afterEach(cleanup);

describe("HomeOnboarding", () => {
  it("greets the user and lists five choices with the first selected", () => {
    render(<HomeOnboarding orgSlug="acme" userName="Ada Lovelace" />);
    expect(screen.getByText(/Ada Lovelace/)).toBeTruthy();
    expect(screen.getByText("Skip")).toBeTruthy();
    expect(screen.getByText("Book Now")).toBeTruthy();
    expect(screen.getByTestId("home-intro-video")).toBeTruthy();
    const options = screen.getAllByRole("button", { pressed: false });
    expect(options.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("button", { name: "Invite your team", pressed: true })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Invite users" }).getAttribute("href")).toBe(
      "/crm/acme/settings/members",
    );
  });

  it("switches the selected choice and its detail panel locally", () => {
    render(<HomeOnboarding orgSlug="acme" userName="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Migrate your existing data" }));
    expect(
      screen.getByRole("button", { name: "Migrate your existing data", pressed: true }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start migration" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Invite users" })).toBeNull();
  });
});
