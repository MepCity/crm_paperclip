import { cleanup, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { SearchableSelect } from "./searchable-select";
import { SelectItem } from "./select";

interface Choice {
  id: string;
  name: string;
}

/** Deliberately out of alphabetical order: the component must not sort what it is given. */
const choices: Choice[] = [
  { id: "none", name: "None" },
  { id: "zebra", name: "Zebra" },
  { id: "apple", name: "Apple" },
  { id: "banana", name: "Banana" },
];

function optionText(option: HTMLElement) {
  return option.textContent?.trim() ?? "";
}

async function openPanel(user: UserEvent) {
  screen.getByRole("button", { name: /Fruit/ }).focus();
  await user.keyboard("{Enter}");
  return screen.findByRole("listbox", { name: "Fruit options" });
}

function Picker({
  selectedId = "none",
  onSelect = vi.fn(),
  hideLabel = false,
  variant = "default",
}: {
  selectedId?: string;
  onSelect?: (option: Choice) => void;
  hideLabel?: boolean;
  variant?: "default" | "sort";
}) {
  return (
    <SearchableSelect
      label="Fruit"
      variant={variant}
      hideLabel={hideLabel}
      panelTitle="Fruit panel"
      searchLabel="Search fruits"
      valueText={choices.find((choice) => choice.id === selectedId)?.name ?? "None"}
      options={choices}
      optionKey={(choice) => choice.id}
      optionText={(choice) => choice.name}
      selectedKey={selectedId}
      onSelect={onSelect}
    >
      {(choice) => <SelectItem id={choice.id}>{choice.name}</SelectItem>}
    </SearchableSelect>
  );
}

afterEach(cleanup);

test("the panel lists the options in the given order, with the search field above them", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  expect(screen.getByRole("button", { name: /Fruit/ }).textContent).toContain("None");
  const list = await openPanel(user);
  expect(within(list).getAllByRole("option").map(optionText)).toEqual([
    "None",
    "Zebra",
    "Apple",
    "Banana",
  ]);
  expect(screen.getByRole("textbox", { name: "Search fruits" })).toBeTruthy();
});

test("the search field matches the option text case-insensitively", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  const list = await openPanel(user);
  await user.type(screen.getByRole("textbox", { name: "Search fruits" }), "app");
  expect(within(list).getAllByRole("option").map(optionText)).toEqual(["Apple"]);
});

test("a search with no match leaves the list empty", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  const list = await openPanel(user);
  await user.type(screen.getByRole("textbox", { name: "Search fruits" }), "kiwi");
  expect(within(list).queryAllByRole("option")).toEqual([]);
});

test("choosing an option reports it and closes the panel", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<Picker onSelect={onSelect} />);
  const list = await openPanel(user);
  within(list).getByRole("option", { name: "Banana" }).focus();
  await user.keyboard("{Enter}");
  expect(onSelect.mock.calls).toEqual([[{ id: "banana", name: "Banana" }]]);
  expect(screen.queryByRole("listbox", { name: "Fruit options" })).toBeNull();
});

test("the search starts empty on every opening", async () => {
  const user = userEvent.setup();
  render(<Picker />);
  await openPanel(user);
  await user.type(screen.getByRole("textbox", { name: "Search fruits" }), "apple");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox", { name: "Fruit options" })).toBeNull();
  const reopened = await openPanel(user);
  const search = screen.getByRole("textbox", { name: "Search fruits" }) as HTMLInputElement;
  expect(search.value).toBe("");
  expect(within(reopened).getAllByRole("option")).toHaveLength(4);
});

test("the selected option is marked, and an option hidden by search is not", async () => {
  const user = userEvent.setup();
  render(<Picker selectedId="banana" />);
  const list = await openPanel(user);
  expect(within(list).getByRole("option", { name: "Banana" }).getAttribute("data-selected")).toBe(
    "true",
  );
  await user.type(screen.getByRole("textbox", { name: "Search fruits" }), "app");
  // React Aria writes data-selected only on the selected row, so absence is the unmarked state.
  expect(within(list).getByRole("option", { name: "Apple" }).hasAttribute("data-selected")).toBe(
    false,
  );
});

test("hideLabel keeps the accessible name and removes the visible label", async () => {
  userEvent.setup();
  render(<Picker hideLabel />);
  expect(screen.getByText("Fruit").className).toContain("sr-only");
  expect(screen.getByRole("button", { name: /Fruit/ }).textContent).toContain("None");
});

test("the sort variant marks the trigger with the sort text role, the default does not", () => {
  render(<Picker variant="sort" />);
  const trigger = screen.getByRole("button", { name: /Fruit/ });
  // list-chrome.css only reaches the measured size and weight through this class.
  expect(trigger.className).toContain("record-control-sort");
  expect(trigger.className).toContain("record-control");
  cleanup();
  render(<Picker />);
  expect(screen.getByRole("button", { name: /Fruit/ }).className).not.toContain(
    "record-control-sort",
  );
});
