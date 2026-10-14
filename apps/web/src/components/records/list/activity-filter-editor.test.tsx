import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import {
  ACTIVITY_CHOICES,
  ACTIVITY_DUE_RANGES,
  ActivityFilterEditor,
  type ActivityFilterValue,
} from "./activity-filter-editor";

afterEach(cleanup);

function ControlledActivityFilterEditor({
  initialValue = { choice: "activity_due", range: "today_overdue" },
  onChange,
}: {
  initialValue?: ActivityFilterValue;
  onChange?: (val: ActivityFilterValue) => void;
}) {
  const [value, setValue] = useState<ActivityFilterValue>(initialValue);

  return (
    <ActivityFilterEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("ActivityFilterEditor", () => {
  test("renders 5 radio choices in exact screen order with correct labels", () => {
    const onChange = vi.fn();
    render(
      <ActivityFilterEditor value={{ choice: "without_open_activity" }} onChange={onChange} />,
    );

    const radiogroup = screen.getByRole("radiogroup", { name: "Activities" });
    expect(radiogroup).toBeTruthy();

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(5);

    const expectedLabels = [
      "Without Open Activity",
      "Overdue",
      "Activity Due",
      "Without Any Activity",
      "Activity Done",
    ];

    radios.forEach((radio, index) => {
      const label = expectedLabels[index] as string;
      expect(radio.value).toBe(ACTIVITY_CHOICES[index]?.value);
      // Accessible name check via RTL
      expect(screen.getByRole("radio", { name: label })).toBe(radio);
      // Visible label container check
      const labelContainer = radio.closest("label");
      expect(labelContainer?.textContent).toContain(label);
    });
  });

  test("calls onChange with correct payload when each radio choice is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <ActivityFilterEditor value={{ choice: "without_open_activity" }} onChange={onChange} />,
    );

    // Click Overdue
    await user.click(screen.getByRole("radio", { name: "Overdue" }));
    expect(onChange).toHaveBeenLastCalledWith({ choice: "overdue" });

    // Update prop and click Activity Due -> defaults range to today_overdue
    rerender(<ActivityFilterEditor value={{ choice: "overdue" }} onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "Activity Due" }));
    expect(onChange).toHaveBeenLastCalledWith({
      choice: "activity_due",
      range: "today_overdue",
    });

    // Update prop to activity_due and click Without Any Activity
    rerender(
      <ActivityFilterEditor
        value={{ choice: "activity_due", range: "today_overdue" }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "Without Any Activity" }));
    expect(onChange).toHaveBeenLastCalledWith({ choice: "without_any_activity" });

    // Update prop to without_any_activity and click Activity Done
    rerender(
      <ActivityFilterEditor value={{ choice: "without_any_activity" }} onChange={onChange} />,
    );
    await user.click(screen.getByRole("radio", { name: "Activity Done" }));
    expect(onChange).toHaveBeenLastCalledWith({ choice: "activity_done" });

    // Update prop to activity_done and click Without Open Activity
    rerender(<ActivityFilterEditor value={{ choice: "activity_done" }} onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "Without Open Activity" }));
    expect(onChange).toHaveBeenLastCalledWith({ choice: "without_open_activity" });
  });

  test("shows range selector only when Activity Due is selected", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ActivityFilterEditor value={{ choice: "without_open_activity" }} onChange={onChange} />,
    );

    // Range selector should NOT be visible
    expect(screen.queryByRole("button", { name: /Activity Due range/ })).toBeNull();

    // Re-render with Activity Due
    rerender(
      <ActivityFilterEditor
        value={{ choice: "activity_due", range: "today_overdue" }}
        onChange={onChange}
      />,
    );

    // Range selector trigger button should now be visible
    const rangeTrigger = screen.getByRole("button", { name: /Activity Due range/ });
    expect(rangeTrigger).toBeTruthy();
    expect(rangeTrigger.textContent).toContain("Today + Overdue");

    // Re-render with Overdue
    rerender(<ActivityFilterEditor value={{ choice: "overdue" }} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: /Activity Due range/ })).toBeNull();
  });

  test("displays four range menu rows in order with selected mark and handles range change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ControlledActivityFilterEditor
        initialValue={{ choice: "activity_due", range: "today_overdue" }}
        onChange={onChange}
      />,
    );

    const rangeTrigger = screen.getByRole("button", { name: /Activity Due range/ });
    expect(rangeTrigger.textContent).toContain("Today + Overdue");

    // Open the range menu
    await user.click(rangeTrigger);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeTruthy();

    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(4);

    const expectedRanges = ["Today", "Tomorrow", "Next 7 days", "Today + Overdue"];
    options.forEach((opt, idx) => {
      expect(opt.textContent).toContain(expectedRanges[idx]);
      expect(opt.getAttribute("data-key")).toBe(ACTIVITY_DUE_RANGES[idx]?.id);
    });

    // Check that 'Today + Overdue' is initially selected
    const todayOverdueOpt = screen.getByRole("option", { name: /Today \+ Overdue/ });
    expect(todayOverdueOpt.getAttribute("aria-selected")).toBe("true");
    expect(within(todayOverdueOpt).getByTestId("selected-check")).toBeTruthy();

    // Select 'Next 7 days'
    const next7DaysOpt = screen.getByRole("option", { name: /Next 7 days/ });
    await user.click(next7DaysOpt);

    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "next_7_days",
    });

    // Re-open listbox and verify 'Next 7 days' is now selected
    await user.click(screen.getByRole("button", { name: /Activity Due range/ }));
    const updatedNext7DaysOpt = screen.getByRole("option", { name: /Next 7 days/ });
    expect(updatedNext7DaysOpt.getAttribute("aria-selected")).toBe("true");
    expect(within(updatedNext7DaysOpt).getByTestId("selected-check")).toBeTruthy();

    // Select 'Today'
    await user.click(screen.getByRole("option", { name: /Today$/ }));
    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "today",
    });

    // Re-open and select 'Tomorrow'
    await user.click(screen.getByRole("button", { name: /Activity Due range/ }));
    await user.click(screen.getByRole("option", { name: /Tomorrow/ }));
    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "tomorrow",
    });
  });

  test("defaults to today_overdue range when transitioning to Activity Due", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ControlledActivityFilterEditor initialValue={{ choice: "overdue" }} onChange={onChange} />,
    );

    // Range selector is hidden
    expect(screen.queryByRole("button", { name: /Activity Due range/ })).toBeNull();

    // Click Activity Due
    await user.click(screen.getByRole("radio", { name: "Activity Due" }));

    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "today_overdue",
    });

    const rangeTrigger = screen.getByRole("button", { name: /Activity Due range/ });
    expect(rangeTrigger).toBeTruthy();
    expect(rangeTrigger.textContent).toContain("Today + Overdue");
  });

  test("supports arrow keys navigation across radio options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ControlledActivityFilterEditor
        initialValue={{ choice: "without_open_activity" }}
        onChange={onChange}
      />,
    );

    const firstRadio = screen.getByRole("radio", {
      name: "Without Open Activity",
    }) as HTMLInputElement;
    firstRadio.focus();
    expect(document.activeElement).toBe(firstRadio);

    // ArrowDown -> Overdue
    await user.keyboard("{ArrowDown}");
    const overdueRadio = screen.getByRole("radio", { name: "Overdue" }) as HTMLInputElement;
    expect(overdueRadio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ choice: "overdue" });

    // ArrowDown -> Activity Due
    await user.keyboard("{ArrowDown}");
    const activityDueRadio = screen.getByRole("radio", {
      name: "Activity Due",
    }) as HTMLInputElement;
    expect(activityDueRadio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "today_overdue",
    });

    // ArrowDown -> Without Any Activity
    await user.keyboard("{ArrowDown}");
    const withoutAnyRadio = screen.getByRole("radio", {
      name: "Without Any Activity",
    }) as HTMLInputElement;
    expect(withoutAnyRadio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ choice: "without_any_activity" });

    // ArrowDown -> Activity Done
    await user.keyboard("{ArrowDown}");
    const activityDoneRadio = screen.getByRole("radio", {
      name: "Activity Done",
    }) as HTMLInputElement;
    expect(activityDoneRadio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ choice: "activity_done" });

    // ArrowUp -> Without Any Activity
    await user.keyboard("{ArrowUp}");
    expect(withoutAnyRadio.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ choice: "without_any_activity" });
  });

  test("supports keyboard interaction inside the range selector", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ControlledActivityFilterEditor
        initialValue={{ choice: "activity_due", range: "today" }}
        onChange={onChange}
      />,
    );

    const rangeTrigger = screen.getByRole("button", { name: /Activity Due range/ });
    rangeTrigger.focus();
    expect(document.activeElement).toBe(rangeTrigger);

    // Open select with Enter
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeTruthy();

    // Move down and select with Enter
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).toHaveBeenCalledWith({
      choice: "activity_due",
      range: "tomorrow",
    });
    expect(rangeTrigger.textContent).toContain("Tomorrow");
  });
});
