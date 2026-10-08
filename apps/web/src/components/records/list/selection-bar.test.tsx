import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SelectionBar } from "./selection-bar";

afterEach(cleanup);

test("renders singular and plural selection counts", () => {
  const { rerender } = render(
    <SelectionBar
      selectedCount={1}
      recordLabelSingular="Lead"
      recordLabelPlural="Leads"
      onClear={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(screen.getByText("1 Lead Selected")).toBeTruthy();

  rerender(
    <SelectionBar
      selectedCount={3}
      recordLabelSingular="Lead"
      recordLabelPlural="Leads"
      onClear={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(screen.getByText("3 Leads Selected")).toBeTruthy();
});

test("Clear and Delete call their handlers; Actions menu renders when items exist", async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  const onDelete = vi.fn();
  const onAction = vi.fn();
  render(
    <SelectionBar
      selectedCount={2}
      recordLabelSingular="Lead"
      recordLabelPlural="Leads"
      onClear={onClear}
      onDelete={onDelete}
      actions={[{ id: "example", label: "Example", onAction }]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(onClear).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(onDelete).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Actions" }));
  await user.click(screen.getByRole("menuitem", { name: "Example" }));
  expect(onAction).toHaveBeenCalledTimes(1);
});

test("omits Actions when the action list is empty", () => {
  render(
    <SelectionBar
      selectedCount={1}
      recordLabelSingular="Lead"
      recordLabelPlural="Leads"
      onClear={() => {}}
      onDelete={() => {}}
      actions={[]}
    />,
  );
  expect(screen.queryByRole("button", { name: "Actions" })).toBeNull();
});
