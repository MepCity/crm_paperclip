import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AuthResult } from "@/lib/auth-client";
import { SignUpForm } from "./sign-up-form";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/lib/auth-client", () => ({
  signUp: auth.signUp,
}));

afterEach(cleanup);

beforeEach(() => {
  navigation.push.mockReset();
  navigation.refresh.mockReset();
  auth.signUp.mockReset();
});

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada Lovelace");
  await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.test");
  await user.type(screen.getByLabelText("Password"), "long-password");
}

test("empty submit shows required field errors and does not call the server", async () => {
  const user = userEvent.setup();
  render(<SignUpForm next="/" />);

  expect(screen.getByText("At least 10 characters.")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Enter your name.")).toBeTruthy();
  expect(screen.getByText("Enter your email.")).toBeTruthy();
  expect(screen.getByText("Enter your password.")).toBeTruthy();
  expect(auth.signUp).not.toHaveBeenCalled();
});

test("shows a short password on the password field", async () => {
  const user = userEvent.setup();
  render(<SignUpForm next="/" />);
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada Lovelace");
  await user.type(screen.getByRole("textbox", { name: "Email" }), "ada@example.test");
  await user.type(screen.getByLabelText("Password"), "short");

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect(await screen.findByText("Password must be at least 10 characters.")).toBeTruthy();
  expect(auth.signUp).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain("short");
});

test("shows a server field error on that field", async () => {
  const user = userEvent.setup();
  auth.signUp.mockResolvedValue({
    ok: false,
    message: "An account with this email already exists.",
    fieldErrors: { email: ["An account with this email already exists."] },
  } satisfies AuthResult);
  render(<SignUpForm next="/" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  const email = screen.getByRole("textbox", { name: "Email" });
  await waitFor(() => expect(email.getAttribute("aria-invalid")).toBe("true"));
  const describedBy = email.getAttribute("aria-describedby");
  expect(document.getElementById(describedBy as string)?.textContent).toBe(
    "An account with this email already exists.",
  );
  expect(screen.queryByRole("alert")).toBeNull();
});

test("shows a general error in an alert", async () => {
  const user = userEvent.setup();
  auth.signUp.mockResolvedValue({
    ok: false,
    message: "The request failed. Please try again.",
  } satisfies AuthResult);
  render(<SignUpForm next="/" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "The request failed. Please try again.",
  );
  expect(navigation.push).not.toHaveBeenCalled();
});

test("disables the button while submitting and blocks a second submit", async () => {
  const user = userEvent.setup();
  let release: (result: AuthResult) => void = () => {};
  const gate = new Promise<AuthResult>((resolve) => {
    release = resolve;
  });
  auth.signUp.mockReturnValue(gate);
  render(<SignUpForm next="/" />);
  await fillValid(user);

  const submit = screen.getByRole("button", { name: "Sign up" });
  await user.click(submit);
  await waitFor(() => expect(submit.getAttribute("data-pending")).toBe("true"));
  expect(submit.getAttribute("aria-disabled")).toBe("true");

  await user.click(submit);
  expect(auth.signUp).toHaveBeenCalledOnce();

  await act(async () => {
    release({ ok: true });
  });
  await waitFor(() => expect(submit.getAttribute("data-pending")).toBeNull());
});

test("navigates to next and refreshes after success", async () => {
  const user = userEvent.setup();
  auth.signUp.mockResolvedValue({ ok: true } satisfies AuthResult);
  render(<SignUpForm next="/" />);
  await fillValid(user);

  await user.click(screen.getByRole("button", { name: "Sign up" }));

  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/"));
  expect(navigation.refresh).toHaveBeenCalledOnce();
  const submitted = auth.signUp.mock.calls[0]?.[0] as { password?: string };
  expect(submitted.password).toBe("long-password");
  expect(document.body.textContent).not.toContain("long-password");
});
