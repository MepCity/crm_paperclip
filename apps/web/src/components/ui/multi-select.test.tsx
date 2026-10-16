import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { MultiSelect, type MultiSelectOption, type MultiSelectProps } from "./multi-select";

const defaultOptions: MultiSelectOption[] = [
  { id: "1", label: "Alpha", detail: "First letter" },
  { id: "2", label: "Beta", detail: "Second letter" },
  { id: "3", label: "Gamma", detail: "Third letter" },
];

function TestMultiSelect(
  props: Partial<MultiSelectProps> & {
    initialValue?: readonly string[];
  },
) {
  const { initialValue, ...rest } = props;
  const [value, setValue] = useState<readonly string[]>(initialValue ?? props.value ?? []);
  return (
    <MultiSelect
      label="Letters"
      placeholder="Select letters"
      options={defaultOptions}
      value={props.value !== undefined && !initialValue ? props.value : value}
      onChange={props.onChange ?? setValue}
      {...rest}
    />
  );
}

afterEach(cleanup);

test("trigger button is named by label, shows placeholder and data-empty when empty, and selected labels in options order", () => {
  const { rerender } = render(<TestMultiSelect value={[]} onChange={vi.fn()} />);

  const trigger = screen.getByRole("button", { name: "Letters" });
  expect(trigger.textContent).toContain("Select letters");
  expect(trigger.hasAttribute("data-empty")).toBe(true);

  // Pass value in reverse order: ["3", "1"] -> should display "Alpha, Gamma" based on options order
  rerender(<TestMultiSelect value={["3", "1"]} onChange={vi.fn()} />);
  expect(trigger.textContent).toContain("Alpha, Gamma");
  expect(trigger.hasAttribute("data-empty")).toBe(false);
});

test("opening shows a 'Search <label>' field and a multi-select listbox where selected options are aria-selected", async () => {
  const user = userEvent.setup();
  render(<TestMultiSelect value={["2"]} onChange={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Letters" }));

  const search = screen.getByRole("textbox", { name: "Search Letters" });
  expect(search).toBeTruthy();

  const listbox = screen.getByRole("listbox", { name: "Letters" });
  expect(listbox).toBeTruthy();

  const beta = within(listbox).getByRole("option", { name: /^Beta/ });
  expect(beta.getAttribute("aria-selected")).toBe("true");

  const alpha = within(listbox).getByRole("option", { name: /^Alpha/ });
  expect(alpha.getAttribute("aria-selected")).toBe("false");
});

test("clicking an option calls onChange with its id added; clicking a selected one calls it without that id", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<TestMultiSelect value={["1"]} onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: "Letters" }));
  const listbox = screen.getByRole("listbox", { name: "Letters" });

  await user.click(within(listbox).getByRole("option", { name: /^Beta/ }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining(["1", "2"]));

  cleanup();
  const onDeselect = vi.fn();
  render(<TestMultiSelect value={["1", "2"]} onChange={onDeselect} />);

  await user.click(screen.getByRole("button", { name: "Letters" }));
  const openListbox = screen.getByRole("listbox", { name: "Letters" });

  await user.click(within(openListbox).getByRole("option", { name: /^Alpha/ }));
  expect(onDeselect).toHaveBeenCalledTimes(1);
  expect(onDeselect).toHaveBeenLastCalledWith(["2"]);
});

test("search matches label or detail case-insensitively, keeps hidden selected ids when toggling, and clears search on reopen", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<TestMultiSelect value={["1"]} onChange={onChange} />);

  const trigger = screen.getByRole("button", { name: "Letters" });
  await user.click(trigger);

  const search = screen.getByRole("textbox", { name: "Search Letters" });

  // Match by detail ("second")
  await user.type(search, "SECOND");
  const listbox = screen.getByRole("listbox", { name: "Letters" });
  expect(within(listbox).getAllByRole("option")).toHaveLength(1);
  expect(within(listbox).getByRole("option", { name: /^Beta/ })).toBeTruthy();

  // Toggling Beta while Alpha (id "1") is hidden by search must keep "1" in the onChange payload
  await user.click(within(listbox).getByRole("option", { name: /^Beta/ }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining(["1", "2"]));

  // Close and reopen: clears the search query
  await user.keyboard("{Escape}");
  await user.click(trigger);

  const reopenedSearch = screen.getByRole("textbox", {
    name: "Search Letters",
  }) as HTMLInputElement;
  expect(reopenedSearch.value).toBe("");
  expect(screen.getAllByRole("option")).toHaveLength(3);
});

test("variant='users' renders a 'Users' type select, the first-letter avatar, detail line, and 'Logged in User' for currentUser", async () => {
  const user = userEvent.setup();
  const userOptions: MultiSelectOption[] = [
    { id: "u1", label: "Alice Walker", detail: "Engineer", currentUser: true },
    { id: "u2", label: "Bob Smith", detail: "Designer" },
  ];

  render(
    <TestMultiSelect
      variant="users"
      label="Assignee"
      placeholder="Select assignee"
      options={userOptions}
      value={[]}
      onChange={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Assignee" }));

  // "Users" type select
  const userTypeSelect = screen.getByRole("button", { name: /Assignee user type/ });
  expect(userTypeSelect).toBeTruthy();
  expect(userTypeSelect.textContent).toContain("Users");

  const listbox = screen.getByRole("listbox", { name: "Assignee" });
  const alice = within(listbox).getByRole("option", { name: /Alice Walker/ });
  const bob = within(listbox).getByRole("option", { name: /Bob Smith/ });

  // Avatars (first letter)
  expect(alice.querySelector(".filter-user-avatar")?.textContent).toBe("A");
  expect(bob.querySelector(".filter-user-avatar")?.textContent).toBe("B");

  // Detail lines: currentUser displays "Logged in User", other displays detail
  expect(alice.textContent).toContain("Logged in User");
  expect(alice.textContent).not.toContain("Engineer");
  expect(bob.textContent).toContain("Designer");
});
