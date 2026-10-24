// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { resolveVisitsAvailability } from "./fixture";
import { VisitDetailScreen, VisitsEnabledScreen } from "./visits-enabled-screen";

afterEach(cleanup);

describe("Visits enabled fixture", () => {
  it("separates the three states", () => {
    expect(resolveVisitsAvailability(undefined)).toBe("disconnected");
    expect(resolveVisitsAvailability("bogus")).toBe("disconnected");
    expect(resolveVisitsAvailability("enabled-empty")).toBe("enabled-empty");
    expect(resolveVisitsAvailability("populated")).toBe("populated");
    render(<VisitsEnabledScreen orgSlug="o" availability="enabled-empty" />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen.getByText("Send to Webmaster").closest("button")?.getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("switches views and shows ranking empty state for Top views", async () => {
    const user = userEvent.setup();
    render(<VisitsEnabledScreen orgSlug="o" availability="populated" />);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(4);
    await user.selectOptions(screen.getByLabelText("View"), "contacts");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText("View"), "top");
    expect(screen.getByText("Ranking criteria not available")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders detail fields and actions performed", () => {
    render(<VisitDetailScreen orgSlug="o" visitId="visit-1" />);
    for (const label of ["IP Address", "Browser", "Portal Name", "Search Engine"])
      expect(screen.getByText(label)).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("Add Note").closest("button")?.getAttribute("aria-disabled")).toBe(
      "true",
    );
  });
});
