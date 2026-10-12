import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { Button } from "./button";
import { ConfirmDialog, Dialog, DialogTrigger } from "./dialog";

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

function renderDialog() {
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <Dialog title="Test Dialog">
        <p>Dialog content</p>
        <Button>Inside</Button>
      </Dialog>
    </DialogTrigger>,
  );
  return screen.getByRole("button", { name: "Open" });
}

afterEach(cleanup);

test("Dialog opens and keeps focus inside while open", async () => {
  const user = userEvent.setup();
  renderDialog();

  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = screen.getByRole("dialog", { name: "Test Dialog" });
  expect(dialog.contains(document.activeElement)).toBe(true);

  await user.tab();
  await user.tab();
  expect(dialog.contains(document.activeElement)).toBe(true);
});

test("Dialog closes on Escape and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const trigger = renderDialog();

  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Test Dialog" })).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

// The state of the swapped content lives below the Dialog, so the Dialog itself never
// re-renders: this is how the invite dialog replaces its form with the created link.
function renderSwappingDialog() {
  function Content() {
    const [created, setCreated] = useState(false);
    if (created) {
      return (
        <div className="flex flex-col gap-4">
          <p>https://example.test/invite/token</p>
        </div>
      );
    }
    return <Button onPress={() => setCreated(true)}>Create invitation</Button>;
  }

  render(
    <DialogTrigger>
      <Button>Invite member</Button>
      <Dialog title="Invite member">
        <Content />
      </Dialog>
    </DialogTrigger>,
  );
  return screen.getByRole("button", { name: "Invite member" });
}

test("Dialog keeps focus inside and still closes on Escape when its content is replaced", async () => {
  const user = userEvent.setup();
  const trigger = renderSwappingDialog();

  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Invite member" });

  // A browser focuses a button when it is clicked, jsdom does not. The created button
  // is the element the swap removes, so it has to hold focus for the real defect.
  screen.getByRole("button", { name: "Create invitation" }).focus();
  await user.click(screen.getByRole("button", { name: "Create invitation" }));

  // Focus has to be reachable again in this commit, not a frame later.
  expect(screen.getByText("https://example.test/invite/token")).toBeTruthy();
  expect(dialog.contains(document.activeElement)).toBe(true);

  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
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

test("ConfirmDialog keeps focus inside and closes on Escape and cancel", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  const dialog = screen.getByRole("alertdialog", { name: "Delete record" });
  expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  expect(dialog.contains(document.activeElement)).toBe(true);

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(onConfirm).not.toHaveBeenCalled();
  await waitFor(() => expect(document.activeElement).toBe(trigger));

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(onConfirm).not.toHaveBeenCalled();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
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

test("ConfirmDialog stays open with a pending confirm button until onConfirm settles", async () => {
  const user = userEvent.setup();
  let resolveConfirm: () => void = () => {};
  const onConfirm = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      }),
  );
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alertdialog", { name: "Delete record" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Delete" }).hasAttribute("data-pending")).toBe(true);

  resolveConfirm();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("ConfirmDialog calls onConfirm again after it is reopened", async () => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(onConfirm).toHaveBeenCalledTimes(2);
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
});

test("ConfirmDialog starts idle after a resolved confirm so Escape closes it again", async () => {
  const user = userEvent.setup();
  let resolveConfirm: () => void = () => {};
  const onConfirm = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      }),
  );
  const trigger = renderConfirm(onConfirm);

  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  resolveConfirm();
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

  await user.click(trigger);
  expect(screen.getByRole("button", { name: "Delete" }).hasAttribute("data-pending")).toBe(false);
  expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(
    false,
  );

  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test("ConfirmDialog stays open and retries when onConfirm rejects", async () => {
  const user = userEvent.setup();
  let rejectConfirm: (reason?: unknown) => void = () => {};
  const onConfirm = vi.fn(
    () =>
      new Promise<void>((_, reject) => {
        rejectConfirm = reject;
      }),
  );
  renderConfirm(onConfirm);

  await user.click(screen.getByRole("button", { name: "Delete record" }));
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  rejectConfirm(new Error("failed"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Delete" }).hasAttribute("data-pending")).toBe(false),
  );
  expect(screen.getByRole("alertdialog", { name: "Delete record" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(
    false,
  );

  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(onConfirm).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("alertdialog", { name: "Delete record" })).toBeTruthy();
});
