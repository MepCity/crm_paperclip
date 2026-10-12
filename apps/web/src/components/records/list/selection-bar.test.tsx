import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SelectionBar } from "./selection-bar";

afterEach(cleanup);

test("renders singular and plural selection counts with the measured trailing period", () => {
  const { rerender } = render(<SelectionBar selectedCount={1} onClear={() => {}} />);
  expect(screen.getByText("1 Record Selected.")).toBeTruthy();

  rerender(<SelectionBar selectedCount={3} onClear={() => {}} />);
  expect(screen.getByText("3 Records Selected.")).toBeTruthy();
});

test("renders nothing when no records are selected", () => {
  render(<SelectionBar selectedCount={0} onClear={() => {}} />);
  expect(screen.queryByText(/Record.*Selected/)).toBeNull();
});

test("Clear and the record-action buttons call their handlers", async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  const onSendEmail = vi.fn();
  const onTags = vi.fn();
  const onMassUpdate = vi.fn();
  render(
    <SelectionBar
      selectedCount={2}
      onClear={onClear}
      onSendEmail={onSendEmail}
      onTags={onTags}
      onMassUpdate={onMassUpdate}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(onClear).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Send Email" }));
  expect(onSendEmail).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Tags" }));
  expect(onTags).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Mass Update" }));
  expect(onMassUpdate).toHaveBeenCalledTimes(1);
});

test("omits the Actions trigger when the action list is empty", () => {
  render(<SelectionBar selectedCount={1} onClear={() => {}} />);
  expect(screen.queryByRole("button", { name: "Actions" })).toBeNull();
});

test("Actions opens the measured operations in screen order", async () => {
  const user = userEvent.setup();
  const onAction = vi.fn();
  const actions = [
    { id: "run-macro", label: "Run Macro", onAction },
    { id: "create-task", label: "Create Task", onAction },
    { id: "change-owner", label: "Change Owner", onAction },
    { id: "cadences", label: "Cadences", onAction },
    { id: "add-to-campaigns", label: "Add to Campaigns", onAction },
    { id: "print-mailing-labels", label: "Print Mailing Labels", onAction },
    { id: "print-using-canvas", label: "Print Using Canvas", onAction },
    { id: "mail-merge", label: "Mail Merge", onAction },
    { id: "mass-convert", label: "Mass Convert", onAction },
    { id: "delete", label: "Delete", onAction },
    { id: "export-selected", label: "Export Selected Records", onAction },
  ];
  render(<SelectionBar selectedCount={1} onClear={() => {}} actions={actions} />);

  await user.click(screen.getByRole("button", { name: "Actions" }));
  const items = screen.getAllByRole("menuitem").map((item) => item.textContent?.trim());
  expect(items).toEqual(actions.map((action) => action.label));

  await user.click(screen.getByRole("menuitem", { name: "Delete" }));
  expect(onAction).toHaveBeenCalledTimes(1);
});
