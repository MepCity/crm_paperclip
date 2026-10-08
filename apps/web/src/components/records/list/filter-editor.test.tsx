import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import type { AppliedFilter, FilterFieldType } from "@/lib/records/filter-operators";
import { render } from "@/test/render";
import { isFilterComplete } from "./filter-editor";
import { type FilterGroup, FilterPanel } from "./filter-panel";

afterEach(cleanup);
// These keyboard and pointer sequences share the machine with other issue runs.
vi.setConfig({ testTimeout: 30_000 });
const types: FilterFieldType[] = [
  "text",
  "email",
  "phone",
  "picklist",
  "currency",
  "boolean",
  "ownerlookup",
  "datetime",
];
const options = [
  { id: "one", label: "Sample One" },
  { id: "two", label: "Sample Two" },
];
const groups: FilterGroup[] = [
  {
    id: "fields",
    label: "Fields",
    items: types.map((fieldType) => ({
      id: fieldType,
      label: fieldType,
      editor: { fieldType, options, currencyCode: "TL" },
    })),
  },
];
function Panel({
  onApply = () => {},
  onClear = () => {},
  initial = [],
}: {
  onApply?: (filters: AppliedFilter[]) => void;
  onClear?: () => void;
  initial?: string[];
}) {
  const [selectedIds, setSelectedIds] = useState(initial);
  return (
    <FilterPanel
      title="Filters"
      searchLabel="Search choices"
      searchPlaceholder="Search"
      groups={groups}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      onApply={onApply}
      onClear={onClear}
    />
  );
}
const apply = () => screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
async function operator(user: ReturnType<typeof userEvent.setup>, field: string, label: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(`${field} operator$`) }));
  await user.click(screen.getByRole("option", { name: label }));
}
test("checking opens the default draft and unchecking discards it", async () => {
  const user = userEvent.setup();
  render(<Panel />);
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  expect(screen.getByRole("button", { name: /text operator$/ }).textContent).toContain("contains");
  expect(apply().disabled).toBe(true);
  await user.type(screen.getByRole("textbox", { name: "text value" }), "sample");
  expect(apply().disabled).toBe(false);
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  expect(screen.queryByRole("button", { name: /text operator$/ })).toBeNull();
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  expect(screen.getByRole("button", { name: /text operator$/ }).textContent).toContain("contains");
  expect((screen.getByRole("textbox", { name: "text value" }) as HTMLInputElement).value).toBe("");
});
test("changing operators resets values and switches the value control", async () => {
  const user = userEvent.setup();
  render(<Panel initial={["text"]} />);
  await user.type(screen.getByRole("textbox", { name: "text value" }), "sample");
  await operator(user, "text", "is empty");
  expect(screen.queryByRole("textbox", { name: "text value" })).toBeNull();
  expect(apply().disabled).toBe(false);
  await operator(user, "text", "is");
  expect((screen.getByRole("textbox", { name: "text value" }) as HTMLInputElement).value).toBe("");
  expect(apply().disabled).toBe(true);
});
for (const field of types) {
  test(`${field} emits its typed Apply value`, async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Panel onApply={onApply} />);
    await user.click(screen.getByRole("checkbox", { name: field }));
    let value: AppliedFilter["value"] = true;
    if (["text", "email", "phone"].includes(field)) {
      value = "sample";
      await user.type(screen.getByRole("textbox", { name: `${field} value` }), value);
    } else if (field === "currency" || field === "datetime") {
      value = field === "currency" ? 12.5 : 0;
      const input = screen.getByRole("textbox", { name: `${field} value` });
      await user.type(input, String(value));
      await user.tab();
    } else if (field === "picklist" || field === "ownerlookup") {
      value = ["one", "two"];
      await user.click(screen.getByRole("button", { name: `${field} value` }));
      await user.click(screen.getByRole("option", { name: "Sample One" }));
      await user.click(screen.getByRole("option", { name: "Sample Two" }));
      await user.keyboard("{Escape}");
    }
    expect(apply().disabled).toBe(false);
    await user.click(apply());
    expect(onApply).toHaveBeenCalledWith([
      {
        itemId: field,
        operatorId: field === "text" ? "contains" : field === "datetime" ? "age_in" : "equal",
        value,
      },
    ]);
  });
}
for (const label of ["between", "not between"]) {
  test(`${label} needs two numbers and emits a tuple`, async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Panel initial={["currency"]} onApply={onApply} />);
    await user.type(screen.getByRole("textbox", { name: "currency value" }), "99");
    await user.tab();
    await operator(user, "currency", label);
    expect(apply().disabled).toBe(true);
    await user.type(screen.getByRole("textbox", { name: "currency lower value" }), "0");
    await user.tab();
    expect(apply().disabled).toBe(true);
    await user.type(screen.getByRole("textbox", { name: "currency upper value" }), "10");
    await user.tab();
    await user.click(apply());
    expect(onApply).toHaveBeenCalledWith([
      {
        itemId: "currency",
        operatorId: label === "between" ? "between" : "not_between",
        value: [0, 10],
      },
    ]);
  });
}
test("Apply orders hidden checked drafts by panel order; Clear removes all selections and drafts", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClear = vi.fn();
  render(<Panel onApply={onApply} onClear={onClear} />);
  await user.click(screen.getByRole("checkbox", { name: "phone" }));
  await user.type(screen.getByRole("textbox", { name: "phone value" }), "555");
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  await user.type(screen.getByRole("textbox", { name: "text value" }), "sample");
  const search = screen.getByRole("textbox", { name: "Search choices" });
  await user.type(search, "no results");
  expect(screen.queryByRole("checkbox")).toBeNull();
  await user.click(apply());
  expect(onApply).toHaveBeenCalledWith([
    { itemId: "text", operatorId: "contains", value: "sample" },
    { itemId: "phone", operatorId: "equal", value: "555" },
  ]);
  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(onClear).toHaveBeenCalledOnce();
  await user.clear(search);
  for (const checkbox of screen.getAllByRole("checkbox"))
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  expect((screen.getByRole("textbox", { name: "text value" }) as HTMLInputElement).value).toBe("");
});
test("datetime preset and empty operators emit null; day operators require nonnegative integers", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(<Panel initial={["datetime"]} onApply={onApply} />);
  for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
    expect(isFilterComplete({ fieldType: "datetime" }, { operatorId: "age_in", value })).toBe(
      false,
    );
  await operator(user, "datetime", "due in");
  await user.type(screen.getByRole("textbox", { name: "datetime value" }), "-1");
  await user.tab();
  expect(apply().disabled).toBe(true);
  await operator(user, "datetime", "Today");
  expect(screen.queryByRole("textbox", { name: "datetime value" })).toBeNull();
  await user.click(apply());
  expect(onApply).toHaveBeenLastCalledWith([
    { itemId: "datetime", operatorId: "today", value: null },
  ]);
  await operator(user, "datetime", "is not empty");
  await user.click(apply());
  expect(onApply).toHaveBeenLastCalledWith([
    { itemId: "datetime", operatorId: "is_not_empty", value: null },
  ]);
});
test("keyboard opens operators, selects with arrows and tabs from checkbox to editor", async () => {
  const user = userEvent.setup();
  render(<Panel />);
  screen.getByRole("checkbox", { name: "text" }).focus();
  await user.keyboard(" ");
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /text operator$/ }));
  await user.keyboard("{ArrowDown}{Home}{Enter}");
  expect(screen.getByRole("button", { name: /text operator$/ }).textContent).toContain("is");
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "text value" }));
});
test("external deselection discards the draft", async () => {
  const user = userEvent.setup();
  const base = {
    title: "Filters",
    searchLabel: "Search",
    searchPlaceholder: "Search",
    groups,
    onSelectionChange: vi.fn(),
    onApply: vi.fn(),
  };
  const view = render(<FilterPanel {...base} selectedIds={["text"]} />);
  await user.type(screen.getByRole("textbox", { name: "text value" }), "discard");
  view.rerender(<FilterPanel {...base} selectedIds={[]} />);
  view.rerender(<FilterPanel {...base} selectedIds={["text"]} />);
  expect((screen.getByRole("textbox", { name: "text value" }) as HTMLInputElement).value).toBe("");
});

test("whitespace and hidden incomplete rows keep Apply disabled", async () => {
  const user = userEvent.setup();
  render(<Panel initial={["text", "email"]} />);
  await user.type(screen.getByRole("textbox", { name: "text value" }), "   ");
  expect(apply().disabled).toBe(true);
  await user.clear(screen.getByRole("textbox", { name: "text value" }));
  await user.type(screen.getByRole("textbox", { name: "text value" }), "valid");
  await user.type(screen.getByRole("textbox", { name: "Search choices" }), "text");
  expect(screen.queryByRole("textbox", { name: "email value" })).toBeNull();
  expect(apply().disabled).toBe(true);
});

test("multiple choices retain hidden selections and support arrow/Space keyboard toggles", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(<Panel initial={["picklist"]} onApply={onApply} />);
  await user.click(screen.getByRole("button", { name: "picklist value" }));
  await user.click(screen.getByRole("option", { name: "Sample One" }));
  const search = screen.getByRole("textbox", { name: "Search picklist value" });
  await user.type(search, "Two");
  expect(screen.queryByRole("option", { name: "Sample One" })).toBeNull();
  await user.tab();
  await user.keyboard("{ArrowDown}{Home} ");
  expect(screen.getByRole("option", { name: "Sample Two" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  await user.clear(search);
  expect(screen.getByRole("option", { name: "Sample One" }).getAttribute("aria-selected")).toBe(
    "true",
  );
  await user.keyboard("{Escape}");
  await user.click(apply());
  expect(onApply).toHaveBeenCalledWith([
    { itemId: "picklist", operatorId: "equal", value: ["one", "two"] },
  ]);
});

test("one checked field tabs from checkbox through editor to Apply and Clear", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const oneGroup: FilterGroup[] = [
    {
      id: "one",
      label: "Fields",
      items: [{ id: "text", label: "text", editor: { fieldType: "text" } }],
    },
  ];
  function Single() {
    const [ids, setIds] = useState<string[]>([]);
    return (
      <FilterPanel
        title="Filter"
        searchLabel="Search"
        searchPlaceholder="Search"
        groups={oneGroup}
        selectedIds={ids}
        onSelectionChange={setIds}
        onApply={onApply}
      />
    );
  }
  render(<Single />);
  screen.getByRole("checkbox", { name: "text" }).focus();
  await user.keyboard(" ");
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /text operator$/ }));
  await user.tab();
  await user.keyboard("sample");
  await user.tab();
  expect(document.activeElement).toBe(apply());
  await user.keyboard("{Enter}");
  expect(onApply).toHaveBeenCalledOnce();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Clear" }));
});

test("checkbox-only selections stay outside Apply and Clear resets both kinds of rows", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClear = vi.fn();
  function Mixed() {
    const [ids, setIds] = useState<string[]>([]);
    return (
      <FilterPanel
        title="Filters"
        searchLabel="Search"
        searchPlaceholder="Search"
        groups={[
          {
            id: "fields",
            label: "Fields",
            items: [
              { id: "legacy", label: "Checkbox only" },
              { id: "text", label: "text", editor: { fieldType: "text" } },
            ],
          },
        ]}
        selectedIds={ids}
        onSelectionChange={setIds}
        onApply={onApply}
        onClear={onClear}
      />
    );
  }
  render(<Mixed />);
  await user.click(screen.getByRole("checkbox", { name: "Checkbox only" }));
  expect(screen.queryByRole("button", { name: "Apply Filter" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Checkbox only operator$/ })).toBeNull();
  await user.click(screen.getByRole("checkbox", { name: "text" }));
  await user.type(screen.getByRole("textbox", { name: "text value" }), "sample");
  await user.click(apply());
  expect(onApply).toHaveBeenCalledWith([
    { itemId: "text", operatorId: "contains", value: "sample" },
  ]);
  expect(
    (screen.getByRole("checkbox", { name: "Checkbox only" }) as HTMLInputElement).checked,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(onClear).toHaveBeenCalledOnce();
  for (const checkbox of screen.getAllByRole("checkbox"))
    expect((checkbox as HTMLInputElement).checked).toBe(false);
});
