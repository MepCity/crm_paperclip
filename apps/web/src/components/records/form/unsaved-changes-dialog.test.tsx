import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

afterEach(cleanup);

test("unsaved changes dialog shows copy and both actions", () => {
  render(<UnsavedChangesDialog isOpen onOpenChange={() => {}} onLeave={() => {}} />);
  expect(
    screen.getByRole("alertdialog", { name: "You have not saved your changes." }),
  ).toBeTruthy();
  expect(screen.getByText("Are you sure you want to move away from this page?")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Stay Here" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Yes, Leave Page" })).toBeTruthy();
});

test("Stay Here closes without leaving", async () => {
  const onOpenChange = vi.fn();
  const onLeave = vi.fn();
  render(<UnsavedChangesDialog isOpen onOpenChange={onOpenChange} onLeave={onLeave} />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Stay Here" }));
  expect(onLeave).not.toHaveBeenCalled();
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("Yes, Leave Page calls onLeave", async () => {
  const onLeave = vi.fn();
  render(<UnsavedChangesDialog isOpen onOpenChange={() => {}} onLeave={onLeave} />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Yes, Leave Page" }));
  expect(onLeave).toHaveBeenCalledTimes(1);
});

test("Escape closes the dialog", async () => {
  const onOpenChange = vi.fn();
  render(<UnsavedChangesDialog isOpen onOpenChange={onOpenChange} onLeave={() => {}} />);
  await userEvent.setup().keyboard("{Escape}");
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

test("focus stays inside the dialog while open", async () => {
  render(<UnsavedChangesDialog isOpen onOpenChange={() => {}} onLeave={() => {}} />);
  const dialog = screen.getByRole("alertdialog");
  await userEvent.setup().tab();
  expect(dialog.contains(document.activeElement)).toBe(true);
});
