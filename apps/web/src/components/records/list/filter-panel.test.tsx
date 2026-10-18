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
        { id: "related-action", label: "Sample related records action" },
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

test("a wrapping row label can be selected", async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(<FilterPanel {...props} onSelectionChange={onSelectionChange} />);
  const row = screen.getByRole("checkbox", { name: "Sample related records action" });
  await user.click(row);
  expect(onSelectionChange).toHaveBeenCalledWith(["related-action"]);
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

test("later-module filter rows cannot change selection or open an editor", async () => {
  const user = userEvent.setup();
  const onSelectionChange = vi.fn();
  render(
    <FilterPanel
      {...props}
      groups={[
        {
          id: "later",
          label: "Filter By Fields",
          items: [{ id: "account", label: "Account Name", laterModule: "M3" }],
        },
      ]}
      onSelectionChange={onSelectionChange}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Account Name" }) as HTMLInputElement;
  expect(checkbox.getAttribute("aria-disabled")).toBe("true");
  expect(checkbox.getAttribute("data-later-module")).toBe("M3");
  expect(checkbox.disabled).toBe(false);
  await user.click(screen.getByText("Account Name"));
  await user.click(checkbox);
  checkbox.focus();
  await user.keyboard("{Enter} ");
  expect(checkbox.checked).toBe(false);
  expect(onSelectionChange).not.toHaveBeenCalled();
});

test("renders ActivityFilterEditor and passes activity filter criteria on apply", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClear = vi.fn();

  function ControlledActivitiesPanel() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    return (
      <FilterPanel
        {...props}
        groups={[
          {
            id: "system",
            label: "System Defined Filters",
            items: [
              { id: "Activities", label: "Activities", systemEditor: "activities" },
              { id: "recent", label: "Recent samples" },
            ],
          },
        ]}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onApply={onApply}
        onClear={onClear}
      />
    );
  }

  render(<ControlledActivitiesPanel />);

  // Ticking Activities shows the editor and action buttons
  const activitiesCheckbox = screen.getByRole("checkbox", { name: "Activities" });
  await user.click(activitiesCheckbox);

  // Editor options are visible
  expect(screen.getByRole("radio", { name: "Without Open Activity" })).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Overdue" })).toBeTruthy();
  const activityDue = screen.getByRole("radio", { name: "Activity Due" }) as HTMLInputElement;
  expect(activityDue).toBeTruthy();
  expect(activityDue.checked).toBe(true);
  expect(screen.getByRole("radio", { name: "Without Any Activity" })).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Activity Done" })).toBeTruthy();

  // Apply default selection (activity_due / today_overdue)
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(false);
  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith([], {
    choice: "activity_due",
    range: "today_overdue",
  });

  // Switch to another option
  const withoutAny = screen.getByRole("radio", { name: "Without Any Activity" });
  await user.click(withoutAny);
  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith([], {
    choice: "without_any_activity",
  });

  // Clear button resets selection and calls onClear
  const clearButton = screen.getByRole("button", { name: "Clear" });
  await user.click(clearButton);
  expect(onClear).toHaveBeenCalled();
  expect(screen.queryByRole("radio", { name: "Activity Due" })).toBeNull();
});

test("seeds ActivityFilterEditor from initialActivityFilter", async () => {
  const onApply = vi.fn();
  render(
    <FilterPanel
      {...props}
      groups={[
        {
          id: "system",
          label: "System Defined Filters",
          items: [{ id: "Activities", label: "Activities", systemEditor: "activities" }],
        },
      ]}
      selectedIds={["Activities"]}
      initialActivityFilter={{ choice: "overdue" }}
      onApply={onApply}
    />,
  );

  const overdue = screen.getByRole("radio", { name: "Overdue" }) as HTMLInputElement;
  expect(overdue.checked).toBe(true);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Apply Filter" }));
  expect(onApply).toHaveBeenCalledWith([], { choice: "overdue" });
});

test("renders CampaignFilterEditor, validates selection limit and emits campaign filter on apply", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClear = vi.fn();

  function ControlledPanel() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    return (
      <FilterPanel
        {...props}
        groups={[
          {
            id: "system",
            label: "System Defined Filters",
            items: [{ id: "Campaigns", label: "Campaigns", systemEditor: "campaigns" }],
          },
        ]}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        campaignOptions={[
          { id: "c-1", label: "Campaign Alpha" },
          { id: "c-2", label: "Campaign Beta" },
        ]}
        onApply={onApply}
        onClear={onClear}
      />
    );
  }

  render(<ControlledPanel />);

  const campaignsCheckbox = screen.getByRole("checkbox", { name: "Campaigns" });
  await user.click(campaignsCheckbox);

  // Apply button should be disabled when 0 campaigns are selected
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  // Select Campaign Alpha
  const campaignTrigger = screen.getByRole("button", { name: "Campaign Name" });
  await user.click(campaignTrigger);
  const optionAlpha = screen.getByRole("option", { name: "Campaign Alpha" });
  await user.click(optionAlpha);
  await user.keyboard("{Escape}");

  // Now Apply should be enabled
  expect(applyButton.disabled).toBe(false);

  // Select Member Status Planned
  const statusTrigger = screen.getByRole("button", { name: "Member Status" });
  await user.click(statusTrigger);
  const optionPlanned = screen.getByRole("option", { name: "Planned" });
  await user.click(optionPlanned);
  await user.keyboard("{Escape}");

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith([], undefined, {
    campaignIds: ["c-1"],
    memberStatuses: ["Planned"],
  });

  // Clear button resets selection and calls onClear
  const clearButton = screen.getByRole("button", { name: "Clear" });
  await user.click(clearButton);
  expect(onClear).toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Campaign Name" })).toBeNull();
});

test("seeds CampaignFilterEditor from initialCampaignFilter", async () => {
  const onApply = vi.fn();
  render(
    <FilterPanel
      {...props}
      groups={[
        {
          id: "system",
          label: "System Defined Filters",
          items: [{ id: "Campaigns", label: "Campaigns", systemEditor: "campaigns" }],
        },
      ]}
      selectedIds={["Campaigns"]}
      campaignOptions={[{ id: "c-1", label: "Campaign Alpha" }]}
      initialCampaignFilter={{ campaignIds: ["c-1"], memberStatuses: ["Sent"] }}
      onApply={onApply}
    />,
  );

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(false);

  const user = userEvent.setup();
  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith([], undefined, {
    campaignIds: ["c-1"],
    memberStatuses: ["Sent"],
  });
});
