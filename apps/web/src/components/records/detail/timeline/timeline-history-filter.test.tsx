import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import {
  TimelineHistoryFilterPanel,
  type TimelineHistoryFilterProps,
} from "./timeline-history-filter";
import type { TimelineFilterOption } from "./types";

afterEach(cleanup);

const moduleOptions: readonly TimelineFilterOption[] = [
  { id: "notes", label: "Notes" },
  { id: "tasks", label: "Tasks" },
];

const userOptions: readonly TimelineFilterOption[] = [
  { id: "u1", label: "Sample User" },
  { id: "u2", label: "Second User" },
];

const sourceOptions: readonly TimelineFilterOption[] = [
  { id: "manual", label: "Manual" },
  { id: "api", label: "API" },
];

function renderFilterPanel(overrides?: Partial<TimelineHistoryFilterProps>) {
  const onApply = vi.fn();
  const props: TimelineHistoryFilterProps = {
    modulesLabel: "Modules",
    modulesAllLabel: "All Modules",
    moduleOptions,
    usersLabel: "Users",
    usersAllLabel: "All Users",
    userOptions,
    timeLabel: "Time",
    sourcesLabel: "Sources",
    sourcesAllLabel: "All Sources",
    sourceOptions,
    applyLabel: "Apply Filter",
    onApply,
    ...overrides,
  };

  render(<TimelineHistoryFilterPanel {...props} />);
  return { onApply, props };
}

test("four selectors show the given labels with initial placeholder or default values", () => {
  renderFilterPanel();

  const fieldLabels = [...document.querySelectorAll(".timeline-history-filter-field-label")].map(
    (node) => node.textContent,
  );
  expect(fieldLabels).toEqual(["Modules", "Users", "Time", "Sources"]);

  expect(screen.getByRole("button", { name: "Modules All Modules" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Users All Users" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Time Any Time" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sources All Sources" })).toBeTruthy();
});

test("apply button is initially disabled", () => {
  renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);
});

test("choosing a time preset enables apply and pressing it calls onApply with preset value", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  await user.click(screen.getByRole("button", { name: "Time Any Time" }));
  await user.click(screen.getByRole("menuitem", { name: "Last 7 days" }));

  expect(screen.getByRole("button", { name: "Time Last 7 days" })).toBeTruthy();
  expect(applyButton.disabled).toBe(false);

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: null,
    time: "last7",
    sourceIds: [],
  });
});

test("selecting one module option enables apply and passes that id in moduleIds", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;

  await user.click(screen.getByRole("button", { name: "Modules All Modules" }));
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));

  expect(applyButton.disabled).toBe(false);

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: ["notes"],
    userId: null,
    time: "any",
    sourceIds: [],
  });
});

test("selecting a user passes its id as userId", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;

  await user.click(screen.getByRole("button", { name: "Users All Users" }));
  await user.click(screen.getByRole("menuitem", { name: "Sample User" }));

  expect(screen.getByRole("button", { name: "Users Sample User" })).toBeTruthy();
  expect(applyButton.disabled).toBe(false);

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: "u1",
    time: "any",
    sourceIds: [],
  });
});

test("isDirty behavior: selecting a user then re-selecting all users resets dirty and disables apply", async () => {
  const user = userEvent.setup();
  renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  // Select a user -> dirty, apply enabled
  await user.click(screen.getByRole("button", { name: "Users All Users" }));
  await user.click(screen.getByRole("menuitem", { name: "Sample User" }));
  expect(applyButton.disabled).toBe(false);
  expect(screen.getByRole("button", { name: "Users Sample User" })).toBeTruthy();

  // Select the "all" user entry -> userId becomes null, state is no longer dirty, apply disabled
  await user.click(screen.getByRole("button", { name: "Users Sample User" }));
  await user.click(screen.getByRole("menuitem", { name: "All Users" }));
  expect(screen.getByRole("button", { name: "Users All Users" })).toBeTruthy();
  expect(applyButton.disabled).toBe(true);
});

test("isDirty behavior: toggling checkboxes or time preset restores clean state and disables apply", async () => {
  const user = userEvent.setup();
  renderFilterPanel();

  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;

  // Toggle module checkbox on and off
  await user.click(screen.getByRole("button", { name: "Modules All Modules" }));
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  expect(applyButton.disabled).toBe(false);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  expect(applyButton.disabled).toBe(true);
  await user.keyboard("{Escape}");

  // Toggle source checkbox on and off
  await user.click(screen.getByRole("button", { name: "Sources All Sources" }));
  await user.click(screen.getByRole("checkbox", { name: "Manual" }));
  expect(applyButton.disabled).toBe(false);
  await user.click(screen.getByRole("checkbox", { name: "Manual" }));
  expect(applyButton.disabled).toBe(true);
  await user.keyboard("{Escape}");

  // Change time preset and reset to "Any Time"
  await user.click(screen.getByRole("button", { name: "Time Any Time" }));
  await user.click(screen.getByRole("menuitem", { name: "Today" }));
  expect(applyButton.disabled).toBe(false);
  await user.click(screen.getByRole("button", { name: "Time Today" }));
  await user.click(screen.getByRole("menuitem", { name: "Any Time" }));
  expect(applyButton.disabled).toBe(true);
});
