import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SortPopover } from "./sort-popover";

/** Opens a select from the keyboard and confirms the named option. Pointer clicks on a
 * portaled listbox race the parent popover's outside-dismiss in jsdom. */
async function chooseOption(user: UserEvent, triggerName: RegExp, optionName: string) {
  const trigger = screen.getByRole("button", { name: triggerName });
  trigger.focus();
  await user.keyboard("{Enter}");
  const option = screen.getByRole("option", { name: optionName });
  option.focus();
  await user.keyboard("{Enter}");
}

const fields = [
  { apiName: "Full_Name", label: "Lead Name" },
  { apiName: "Company", label: "Company" },
];
afterEach(cleanup);

test("Sort starts at None/Ascending; choosing a field enables Apply and emits SortSpec", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  render(<SortPopover fields={fields} sort={null} onApply={apply} />);
  const trigger = screen.getByRole("button", { name: "Sort" });
  await user.click(trigger);
  const field = screen.getByRole("button", { name: /Sort By/ });
  expect(field.textContent).toContain("None");
  expect(screen.getByText("Sort By").className).not.toContain("sr-only");
  expect(screen.getByText("Order").className).toContain("sr-only");
  expect(screen.getByRole("button", { name: /Order/ }).textContent).toContain("Ascending");
  const applyButton = screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);
  expect(applyButton.className).toContain("data-disabled:bg-(--color-primary-disabled)");
  expect(applyButton.className).toContain("data-disabled:opacity-100");
  await chooseOption(user, /Sort By/, "Company");
  expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(false);
  await chooseOption(user, /Order/, "Descending");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(apply.mock.calls).toEqual([[{ field: "Company", order: "desc" }]]);
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("Cancel discards edits and reopening initializes from the current sort", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  const { rerender } = render(
    <SortPopover fields={fields} sort={{ field: "Company", order: "desc" }} onApply={apply} />,
  );
  await user.click(screen.getByRole("button", { name: "Sort" }));
  expect(screen.getByRole("button", { name: /Sort By/ }).textContent).toContain("Company");
  await chooseOption(user, /Sort By/, "Lead Name");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(apply).not.toHaveBeenCalled();
  rerender(<SortPopover fields={fields} sort={null} onApply={apply} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  expect(screen.getByRole("button", { name: /Sort By/ }).textContent).toContain("None");
  expect(screen.getByRole("button", { name: /Order/ }).textContent).toContain("Ascending");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(apply).not.toHaveBeenCalled();
});

test("Sort cannot apply a removed field", async () => {
  const user = userEvent.setup();
  render(<SortPopover fields={[]} sort={{ field: "Removed", order: "asc" }} onApply={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
});
