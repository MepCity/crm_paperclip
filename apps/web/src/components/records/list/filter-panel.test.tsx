import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FilterPanel, type FilterPanelProps } from "./filter-panel";

afterEach(cleanup);

const props: FilterPanelProps = {
  title: "Filter samples by",
  searchLabel: "Search filter choices",
  searchPlaceholder: "Search",
  groups: [
    {
      id: "system",
      label: "System Defined Filters",
      items: [
        { id: "recent", label: "Recent samples" },
        { id: "disabled", label: "Archived samples", disabled: true },
      ],
    },
    {
      id: "fields",
      label: "Filter By Fields",
      items: [
        { id: "code", label: "Sample Code" },
        { id: "title", label: "Sample title" },
      ],
    },
    {
      id: "related",
      label: "Filter By Related Modules",
      items: [{ id: "links", label: "Sample links" }],
    },
  ],
  selectedIds: [],
  onSelectionChange: () => {},
};

test("groups start expanded and toggle with pointer, Enter and Space", async () => {
  const user = userEvent.setup();
  render(<FilterPanel {...props} />);
  for (const button of screen.getAllByRole("button")) {
    expect(button.getAttribute("aria-expanded")).toBe("true");
  }
  const trigger = screen.getByRole("button", { name: "System Defined Filters" });
  const panelId = trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  expect(document.getElementById(panelId ?? "")).not.toBeNull();
  await user.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("checkbox", { name: "Recent samples" })).toBeNull();
  await user.keyboard("{Enter}");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("checkbox", { name: "Recent samples" })).toBeTruthy();
  await user.keyboard(" ");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

test("selection is controlled and sends the next full array without dropping hidden IDs", async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  const view = render(
    <FilterPanel
      {...props}
      selectedIds={["recent", "outside"]}
      onSelectionChange={onSelectionChange}
    />,
  );
  const recent = screen.getByRole("checkbox", { name: "Recent samples" }) as HTMLInputElement;
  expect(recent.checked).toBe(true);
  const code = screen.getByRole("checkbox", { name: "Sample Code" }) as HTMLInputElement;
  code.focus();
  await user.keyboard(" ");
  expect(onSelectionChange).toHaveBeenLastCalledWith(["recent", "outside", "code"]);
  expect(code.checked).toBe(false);
  view.rerender(
    <FilterPanel
      {...props}
      selectedIds={["recent", "outside", "code"]}
      onSelectionChange={onSelectionChange}
    />,
  );
  expect(code.checked).toBe(true);
  await user.click(recent);
  expect(onSelectionChange).toHaveBeenLastCalledWith(["outside", "code"]);
});

test("disabled rows do not change selection with pointer or keyboard", async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(<FilterPanel {...props} onSelectionChange={onSelectionChange} />);
  const disabled = screen.getByRole("checkbox", { name: "Archived samples" }) as HTMLInputElement;
  expect(disabled.disabled).toBe(true);
  await user.click(disabled);
  disabled.focus();
  await user.keyboard(" ");
  expect(disabled.checked).toBe(false);
  expect(onSelectionChange).not.toHaveBeenCalled();
});

test("search matches case-insensitive label substrings, hides nonmatching groups and restores state", async () => {
  const user = userEvent.setup();
  function ControlledPanel() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    return <FilterPanel {...props} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />;
  }
  render(<ControlledPanel />);
  await user.click(screen.getByRole("checkbox", { name: "Recent samples" }));
  await user.click(screen.getByRole("button", { name: "System Defined Filters" }));
  const search = screen.getByRole("textbox", { name: "Search filter choices" });
  await user.type(search, "cOd");
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  expect(screen.getByRole("checkbox", { name: "Sample Code" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "System Defined Filters" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Filter By Related Modules" })).toBeNull();
  await user.clear(search);
  await user.type(search, "no-match");
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  await user.clear(search);
  const system = screen.getByRole("button", { name: "System Defined Filters" });
  expect(system.getAttribute("aria-expanded")).toBe("false");
  await user.click(system);
  expect(
    (screen.getByRole("checkbox", { name: "Recent samples" }) as HTMLInputElement).checked,
  ).toBe(true);
});
