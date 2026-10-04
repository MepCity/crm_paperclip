import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AuthResult } from "@/lib/auth-client";
import { SignInForm } from "./sign-in-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/lib/auth-client", () => ({
  signIn: auth.signIn,
}));

afterEach(cleanup);

beforeEach(() => {
  navigation.push.mockReset();
  navigation.refresh.mockReset();
  auth.signIn.mockReset();
});

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.test");
  await user.type(screen.getByLabelText("Password"), "long-password");
}

test("empty submit shows required field errors and does not call the server", async () => {
  const user = userEvent.setup();
  render(<SignInForm next="/" />);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Enter your email.")).toBeTruthy();
  expect(screen.getByText("Enter your password.")).toBeTruthy();
  expect(auth.signIn).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-invalid")).toBe("true");
});

test("shows a server field error on that field", async () => {
  const user = userEvent.setup();
  auth.signIn.mockResolvedValue({
    ok: false,
    message: "Enter a valid email address.",
    fieldErrors: { email: ["Enter a valid email address."] },
  } satisfies AuthResult);
  render(<SignInForm next="/" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  const email = screen.getByRole("textbox", { name: "Email" });
  await waitFor(() => expect(email.getAttribute("aria-invalid")).toBe("true"));
  const describedBy = email.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy as string)?.textContent).toBe(
    "Enter a valid email address.",
  );
  expect(screen.queryByRole("alert")).toBeNull();
});

test("shows a general error in an alert and keeps the password off the page", async () => {
  const user = userEvent.setup();
  auth.signIn.mockResolvedValue({
    ok: false,
    message: "Invalid email or password.",
  } satisfies AuthResult);
  render(<SignInForm next="/" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect((await screen.findByRole("alert")).textContent).toContain("Invalid email or password.");
  expect(document.body.textContent).not.toContain("long-password");
  expect(navigation.push).not.toHaveBeenCalled();
});

test("disables the button while submitting and blocks a second submit", async () => {
  const user = userEvent.setup();
  let release: (result: AuthResult) => void = () => {};
  const gate = new Promise<AuthResult>((resolve) => {
    release = resolve;
  });
  auth.signIn.mockReturnValue(gate);
  render(<SignInForm next="/" />);
  await fillValid(user);

  const submit = screen.getByRole("button", { name: "Sign in" });
  await user.click(submit);
  await waitFor(() => expect(submit.getAttribute("data-pending")).toBe("true"));
  expect(submit.getAttribute("aria-disabled")).toBe("true");

  await user.click(submit);
  expect(auth.signIn).toHaveBeenCalledOnce();

  await act(async () => {
    release({ ok: true });
  });
  await waitFor(() => expect(submit.getAttribute("data-pending")).toBeNull());
});

test("navigates to next and refreshes after success", async () => {
  const user = userEvent.setup();
  auth.signIn.mockResolvedValue({ ok: true } satisfies AuthResult);
  render(<SignInForm next="/dev/ui" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dev/ui"));
  expect(navigation.refresh).toHaveBeenCalledOnce();
});

test("submits from the keyboard", async () => {
  const user = userEvent.setup();
  auth.signIn.mockResolvedValue({ ok: true } satisfies AuthResult);
  render(<SignInForm next="/" />);

  await user.tab();
  await user.keyboard("user@example.test");
  await user.tab();
  await user.keyboard("long-password");
  await user.keyboard("{Enter}");

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/"));
  expect(auth.signIn).toHaveBeenCalledWith({
    email: "user@example.test",
    password: "long-password",
  });
});
