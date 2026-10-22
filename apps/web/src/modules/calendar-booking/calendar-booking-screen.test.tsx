import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarBookingScreen } from "./calendar-booking-screen";

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

afterEach(() => {
  cleanup();
  routerMock.push.mockClear();
});

describe("CalendarBookingScreen", () => {
  it("displays the prerequisite modal on load with warning icon, heading, message and actions", () => {
    render(<CalendarBookingScreen orgSlug="acme" />);

    expect(screen.getByRole("heading", { name: "Business Hours Not Configured" })).toBeTruthy();
    expect(
      screen.getByText("Calendar booking needs your organization's business hours."),
    ).toBeTruthy();

    const configureButton = screen.getByRole("button", {
      name: "Configure Business Hours",
    });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    expect(configureButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
    expect(screen.getByTestId("calendar-booking-content")).toBeTruthy();
  });

  it("closes the modal on Cancel and leaves the empty content area", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<CalendarBookingScreen orgSlug="acme" onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "Business Hours Not Configured" })).toBeNull();
    expect(
      screen.queryByText("Calendar booking needs your organization's business hours."),
    ).toBeNull();
    expect(screen.getByTestId("calendar-booking-content")).toBeTruthy();
  });

  it("navigates to settings home on Configure Business Hours via router", async () => {
    const user = userEvent.setup();

    render(<CalendarBookingScreen orgSlug="acme" />);

    const configureButton = screen.getByRole("button", {
      name: "Configure Business Hours",
    });
    await user.click(configureButton);

    expect(routerMock.push).toHaveBeenCalledWith("/crm/acme/settings");
  });

  it("calls custom onConfigure callback when provided", async () => {
    const user = userEvent.setup();
    const onConfigure = vi.fn();

    render(<CalendarBookingScreen orgSlug="acme" onConfigure={onConfigure} />);

    const configureButton = screen.getByRole("button", {
      name: "Configure Business Hours",
    });
    await user.click(configureButton);

    expect(onConfigure).toHaveBeenCalledTimes(1);
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
