import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AuthResult } from "@/lib/auth-client";
import { SignOutButton } from "./sign-out-button";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/lib/auth-client", () => ({
  signOut: auth.signOut,
}));

afterEach(cleanup);

beforeEach(() => {
  navigation.push.mockReset();
  navigation.refresh.mockReset();
  auth.signOut.mockReset();
});

test("signs out and opens the sign-in page", async () => {
  const user = userEvent.setup();
  auth.signOut.mockResolvedValue({ ok: true } satisfies AuthResult);
  render(<SignOutButton />);

  await user.click(screen.getByRole("button", { name: "Sign out" }));

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/sign-in"));
  expect(navigation.refresh).toHaveBeenCalledOnce();
});

test("shows a general error and stays put when sign-out fails", async () => {
  const user = userEvent.setup();
  auth.signOut.mockResolvedValue({
    ok: false,
    message: "The request failed. Please try again.",
  } satisfies AuthResult);
  render(<SignOutButton />);

  await user.click(screen.getByRole("button", { name: "Sign out" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "The request failed. Please try again.",
  );
  expect(navigation.push).not.toHaveBeenCalled();
});
