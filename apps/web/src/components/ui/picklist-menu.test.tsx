import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "react-aria-components";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import {
  type PicklistGroup,
  PicklistMenu,
  type PicklistMenuProps,
  type PicklistOption,
} from "./picklist-menu";

const defaultOptions: PicklistOption[] = [
  { value: null, label: "-None-" },
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
];

function TestMenu(
  props: Partial<PicklistMenuProps> & {
    buttonText?: string;
  },
) {
  const { buttonText = "Open Stage", ...rest } = props;
  return (
    <PicklistMenu
      trigger={<Button>{buttonText}</Button>}
      label="Stage"
      searchLabel="Search stages"
      searchPlaceholder="Search stages..."
      emptyLabel="No stages found"
      options={defaultOptions}
      value="lead"
      onSelect={vi.fn()}
      appearance="stage"
      {...rest}
    />
  );
}

afterEach(cleanup);

test("closed by default, opens on trigger press, or renders open with defaultOpen", async () => {
  const user = userEvent.setup();
  render(<TestMenu />);

  expect(screen.queryByRole("dialog")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Open Stage" }));
  const dialog = screen.getByRole("dialog", { name: "Stage" });
  expect(dialog).toBeTruthy();

  const searchBox = screen.getByRole("textbox", { name: "Search stages" });
  expect(searchBox.getAttribute("placeholder")).toBe("Search stages...");
  expect(document.activeElement).toBe(searchBox);

  cleanup();
  render(<TestMenu defaultOpen />);
  expect(screen.getByRole("dialog", { name: "Stage" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Search stages" }));
});

test("renders flat options as menuitemradio, marks matching value or null, and selects null", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const { rerender } = render(<TestMenu defaultOpen value="lead" onSelect={onSelect} />);

  const items = screen.getAllByRole("menuitemradio");
  expect(items).toHaveLength(3);
  expect(screen.getByRole("menuitemradio", { name: "Lead" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(
    screen.getByRole("menuitemradio", { name: "Contacted" }).getAttribute("aria-checked"),
  ).toBe("false");
  expect(screen.getByRole("menuitemradio", { name: "-None-" }).getAttribute("aria-checked")).toBe(
    "false",
  );

  rerender(<TestMenu defaultOpen value={null} onSelect={onSelect} />);
  expect(screen.getByRole("menuitemradio", { name: "-None-" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(screen.getByRole("menuitemradio", { name: "Lead" }).getAttribute("aria-checked")).toBe(
    "false",
  );

  await user.click(screen.getByRole("menuitemradio", { name: "-None-" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith(null);
});

test("selecting an option calls onSelect once with its value and closes the menu; duplicate labels select by value", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<TestMenu defaultOpen onSelect={onSelect} />);

  await user.click(screen.getByRole("menuitemradio", { name: "Contacted" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("contacted");
  expect(screen.queryByRole("dialog")).toBeNull();

  cleanup();
  const duplicateOptions: PicklistOption[] = [
    { value: "lead-qual", label: "Qualified" },
    { value: "deal-qual", label: "Qualified" },
  ];
  const onSelectDuplicate = vi.fn();
  render(
    <TestMenu
      defaultOpen
      options={duplicateOptions}
      value="lead-qual"
      onSelect={onSelectDuplicate}
    />,
  );

  const duplicateItems = screen.getAllByRole("menuitemradio", { name: "Qualified" });
  expect(duplicateItems).toHaveLength(2);
  const secondItem = duplicateItems[1];
  expect(secondItem).toBeDefined();
  if (!secondItem) throw new Error("Expected second item to exist");
  await user.click(secondItem);
  expect(onSelectDuplicate).toHaveBeenCalledTimes(1);
  expect(onSelectDuplicate).toHaveBeenCalledWith("deal-qual");
});

test("typing filters case-insensitively, shows emptyLabel on no match, and clears query on reopen", async () => {
  const user = userEvent.setup();
  render(<TestMenu />);

  await user.click(screen.getByRole("button", { name: "Open Stage" }));
  const search = screen.getByRole("textbox", { name: "Search stages" });

  await user.type(search, "CON");
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(1);
  expect(screen.getByRole("menuitemradio", { name: "Contacted" })).toBeTruthy();

  await user.type(search, "xyz");
  expect(screen.queryAllByRole("menuitemradio")).toHaveLength(0);
  expect(screen.getByText("No stages found")).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Open Stage" }));
  const reopenedSearch = screen.getByRole("textbox", { name: "Search stages" }) as HTMLInputElement;
  expect(reopenedSearch.value).toBe("");
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(3);
});

test("groups show each heading, hide empty groups when filtered, and allow selection inside a group", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  const groups: PicklistGroup[] = [
    {
      label: "Open Stages",
      options: [
        { value: "qual", label: "Qualification" },
        { value: "prop", label: "Proposal" },
      ],
    },
    {
      label: "Closed Stages",
      options: [
        { value: "won", label: "Closed Won" },
        { value: "lost", label: "Closed Lost" },
      ],
    },
  ];

  render(<TestMenu defaultOpen groups={groups} value="qual" onSelect={onSelect} />);

  expect(screen.getByText("Open Stages")).toBeTruthy();
  expect(screen.getByText("Closed Stages")).toBeTruthy();
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(4);

  const search = screen.getByRole("textbox", { name: "Search stages" });
  await user.type(search, "won");

  expect(screen.queryByText("Open Stages")).toBeNull();
  expect(screen.getByText("Closed Stages")).toBeTruthy();
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(1);

  await user.click(screen.getByRole("menuitemradio", { name: "Closed Won" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("won");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("Escape closes without calling onSelect; ArrowDown focuses first option and ArrowUp focuses last", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<TestMenu defaultOpen onSelect={onSelect} />);

  const search = screen.getByRole("textbox", { name: "Search stages" });
  const items = screen.getAllByRole("menuitemradio");

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(items[0]);

  search.focus();
  expect(document.activeElement).toBe(search);

  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(items[items.length - 1]);

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(onSelect).not.toHaveBeenCalled();
});

test("isDisabled prevents pressing the trigger from opening the menu", async () => {
  const user = userEvent.setup();
  render(<TestMenu isDisabled />);

  await user.click(screen.getByRole("button", { name: "Open Stage" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
