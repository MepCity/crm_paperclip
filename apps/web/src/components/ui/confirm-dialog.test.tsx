import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import { DialogTrigger } from "./dialog";

declare module "vitest" {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toHaveAccessibleDescription(expected: string): R;
  }
}

function accessibleDescription(element: Element) {
  const describedBy = element.getAttribute("aria-describedby");
  if (!describedBy) return element.getAttribute("aria-description") ?? "";
  const document = element.ownerDocument;
  return describedBy
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

expect.extend({
  toHaveAccessibleDescription(received: Element, expected: string) {
    const actual = accessibleDescription(received);
    return {
      pass: actual === expected,
      message: () => `expected accessible description "${actual}" to be "${expected}"`,
    };
  },
});

function renderConfirm(onConfirm: () => void | Promise<void>) {
  render(
    <DialogTrigger>
      <Button>Delete record</Button>
      <ConfirmDialog
        title="Delete record"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={onConfirm}
      />
    </DialogTrigger>,
  );
  return screen.getByRole("button", { name: "Delete record" });
}

afterEach(cleanup);

test("ConfirmDialog focuses the cancel button and closes on Escape", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  const dialog = screen.getByRole("alertdialog", { name: "Delete record" });
  expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" })),
  );

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(onConfirm).not.toHaveBeenCalled();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("ConfirmDialog disables both buttons while busy", () => {
  render(
    <ConfirmDialog
      isOpen
      title="Delete"
      message="Sure?"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      tone="danger"
      busy
      onConfirm={() => undefined}
    />,
  );
  expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true);
});

test("ConfirmDialog shows errorMessage above the actions", () => {
  render(
    <ConfirmDialog
      isOpen
      title="Delete"
      message="Sure?"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      tone="danger"
      errorMessage="Server error"
      onConfirm={() => undefined}
    />,
  );
  expect(screen.getByRole("alert").textContent).toBe("Server error");
});

test("ConfirmDialog calls onConfirm once and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
