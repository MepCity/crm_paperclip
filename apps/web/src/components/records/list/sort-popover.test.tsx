import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SortPopover } from "./sort-popover";

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
  expect(screen.getByRole("button", { name: /Order/ }).textContent).toContain("Ascending");
  expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(field);
  await user.click(screen.getByRole("option", { name: "Company" }));
  expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(false);
  await user.click(screen.getByRole("button", { name: /Order/ }));
  await user.click(screen.getByRole("option", { name: "Descending" }));
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
  await user.click(screen.getByRole("button", { name: /Sort By/ }));
  await user.click(screen.getByRole("option", { name: "Lead Name" }));
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
