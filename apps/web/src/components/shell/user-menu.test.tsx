import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { type ShellUser, UserMenu } from "./user-menu";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

const defaultUser: ShellUser = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.test",
};

test("button User menu shows uppercase initials for two words, and ? for blank names", () => {
  const { rerender } = render(<UserMenu user={defaultUser} />);
  expect(screen.getByRole("button", { name: "User menu" }).textContent).toBe("AL");

  rerender(<UserMenu user={{ id: "user-2", name: "grace hopper", email: "grace@example.test" }} />);
  expect(screen.getByRole("button", { name: "User menu" }).textContent).toBe("GH");

  rerender(<UserMenu user={{ id: "user-3", name: "", email: "blank@example.test" }} />);
  expect(screen.getByRole("button", { name: "User menu" }).textContent).toBe("?");

  rerender(<UserMenu user={{ id: "user-4", name: "   ", email: "spaces@example.test" }} />);
  expect(screen.getByRole("button", { name: "User menu" }).textContent).toBe("?");
});

test("opening the menu shows the user name, email, and a Sign out item", async () => {
  const user = userEvent.setup();
  render(<UserMenu user={defaultUser} />);

  await user.click(screen.getByRole("button", { name: "User menu" }));

  expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  expect(screen.getByText("ada@example.test")).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
});

test("signing out with ok: true redirects to /sign-in and refreshes", async () => {
  const user = userEvent.setup();
  const onSignOut = vi.fn(async () => ({ ok: true as const }));

  render(<UserMenu user={defaultUser} onSignOut={onSignOut} />);

  await user.click(screen.getByRole("button", { name: "User menu" }));
  await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

  await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
  expect(router.replace).toHaveBeenCalledWith("/sign-in");
  expect(router.refresh).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alert")).toBeNull();
});

test("signing out with ok: false displays the returned error message and does not redirect", async () => {
  const user = userEvent.setup();
  const onSignOut = vi.fn(async () => ({
    ok: false as const,
    message: "Invalid session token.",
  }));

  render(<UserMenu user={defaultUser} onSignOut={onSignOut} />);

  await user.click(screen.getByRole("button", { name: "User menu" }));
  await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Invalid session token.");
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});

test("signing out when onSignOut throws displays a generic error message and does not redirect", async () => {
  const user = userEvent.setup();
  const onSignOut = vi.fn(async () => {
    throw new Error("Network crash");
  });

  render(<UserMenu user={defaultUser} onSignOut={onSignOut} />);

  await user.click(screen.getByRole("button", { name: "User menu" }));
  await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Sign out failed. Please try again.");
  expect(router.replace).not.toHaveBeenCalled();
  expect(router.refresh).not.toHaveBeenCalled();
});
