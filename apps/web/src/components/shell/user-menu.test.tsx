import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { type ShellUser, UserMenu } from "./user-menu";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("UserMenu", () => {
  const testUser: ShellUser = {
    id: "user-1",
    name: "Jane Doe",
    email: "jane.doe@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays user initials on the avatar trigger button", () => {
    render(<UserMenu user={testUser} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toBe("JD");
  });

  it("displays fallback initial when user name is empty", () => {
    render(<UserMenu user={{ id: "user-2", name: "", email: "anonymous@example.com" }} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    expect(trigger.textContent).toBe("?");
  });

  it("displays user name, email and sign out menu item when menu opens", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={testUser} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    await user.click(trigger);

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("jane.doe@example.com")).toBeTruthy();

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    expect(signOutItem).toBeTruthy();
  });

  it("calls onSignOut and redirects on successful sign out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn(async () => ({ ok: true as const }));

    render(<UserMenu user={testUser} onSignOut={onSignOut} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    await user.click(trigger);

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    await user.click(signOutItem);

    await waitFor(() => {
      expect(onSignOut).toHaveBeenCalledOnce();
    });
    expect(navigation.replace).toHaveBeenCalledWith("/sign-in");
    expect(navigation.refresh).toHaveBeenCalledOnce();
  });

  it("displays an error alert when sign out returns ok: false", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn(async () => ({
      ok: false as const,
      message: "Session expired.",
    }));

    render(<UserMenu user={testUser} onSignOut={onSignOut} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    await user.click(trigger);

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    await user.click(signOutItem);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Session expired.");
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("displays fallback error alert when sign out rejects", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn(async () => {
      throw new Error("Network crash");
    });

    render(<UserMenu user={testUser} onSignOut={onSignOut} />);

    const trigger = screen.getByRole("button", { name: "User menu" });
    await user.click(trigger);

    const signOutItem = screen.getByRole("menuitem", { name: "Sign out" });
    await user.click(signOutItem);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Sign out failed. Please try again.");
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
