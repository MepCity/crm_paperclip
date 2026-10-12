import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

/** Opens the Sort By list and returns its listbox. */
async function openFieldList(user: UserEvent) {
  screen.getByRole("button", { name: /Sort By/ }).focus();
  await user.keyboard("{Enter}");
  return screen.findByRole("listbox", { name: "Sort By options" });
}

function optionText(option: HTMLElement) {
  return option.textContent?.trim() ?? "";
}

function isDisabled(button: HTMLElement) {
  return (button as HTMLButtonElement).disabled;
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

test("Sort By lists None first, then the given fields in the given order", async () => {
  const user = userEvent.setup();
  render(
    <SortPopover
      fields={[
        { apiName: "Website", label: "Website" },
        { apiName: "Company", label: "Company" },
        { apiName: "Full_Name", label: "Lead Name" },
      ]}
      sort={null}
      onApply={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Sort" }));
  const list = await openFieldList(user);
  expect(within(list).getAllByRole("option").map(optionText)).toEqual([
    "None",
    "Website",
    "Company",
    "Lead Name",
  ]);
});

test("the search box filters labels case-insensitively", async () => {
  const user = userEvent.setup();
  render(<SortPopover fields={fields} sort={null} onApply={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  const list = await openFieldList(user);
  await user.type(screen.getByRole("textbox", { name: "Search fields" }), "comp");
  expect(within(list).getAllByRole("option").map(optionText)).toEqual(["Company"]);
});

test("a search with no match leaves the list empty", async () => {
  const user = userEvent.setup();
  render(<SortPopover fields={fields} sort={null} onApply={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  const list = await openFieldList(user);
  await user.type(screen.getByRole("textbox", { name: "Search fields" }), "converted");
  expect(within(list).queryAllByRole("option")).toEqual([]);
});

test("the search starts empty on every opening", async () => {
  const user = userEvent.setup();
  render(<SortPopover fields={fields} sort={null} onApply={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  await openFieldList(user);
  await user.type(screen.getByRole("textbox", { name: "Search fields" }), "company");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox", { name: "Sort By options" })).toBeNull();
  const reopened = await openFieldList(user);
  const search = screen.getByRole("textbox", { name: "Search fields" }) as HTMLInputElement;
  expect(search.value).toBe("");
  expect(within(reopened).getAllByRole("option")).toHaveLength(3);
});

test("choosing None keeps Apply disabled and clears a chosen field", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  render(<SortPopover fields={fields} sort={null} onApply={apply} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  await chooseOption(user, /Sort By/, "Company");
  expect(isDisabled(screen.getByRole("button", { name: "Apply" }))).toBe(false);
  await chooseOption(user, /Sort By/, "None");
  expect(isDisabled(screen.getByRole("button", { name: "Apply" }))).toBe(true);
  expect(screen.getByRole("button", { name: /Sort By/ }).textContent).toContain("None");
});

test("the applied field is marked in the list and picking one keeps the Sort dialog open", async () => {
  const user = userEvent.setup();
  const apply = vi.fn();
  render(<SortPopover fields={fields} sort={{ field: "Company", order: "asc" }} onApply={apply} />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  const dialog = screen.getByRole("dialog", { name: "Sort" });
  const list = await openFieldList(user);
  expect(within(list).getByRole("option", { name: "Company" }).getAttribute("data-selected")).toBe(
    "true",
  );
  within(list).getByRole("option", { name: "Lead Name" }).focus();
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("listbox", { name: "Sort By options" })).toBeNull();
  expect(dialog.querySelector(".record-sort-actions")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(apply.mock.calls).toEqual([[{ field: "Full_Name", order: "asc" }]]);
});
