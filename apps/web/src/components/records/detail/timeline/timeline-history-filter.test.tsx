import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import {
  TimelineHistoryFilterPanel,
  type TimelineHistoryFilterProps,
} from "./timeline-history-filter";
import type { TimelineFilterOption } from "./types";

afterEach(cleanup);

const sampleModules: TimelineFilterOption[] = [
  { id: "notes", label: "Notes" },
  { id: "tasks", label: "Tasks" },
  { id: "deals", label: "Deals" },
];

const sampleUsers: TimelineFilterOption[] = [
  { id: "u1", label: "User One" },
  { id: "u2", label: "User Two" },
];

const sampleSources: TimelineFilterOption[] = [
  { id: "manual", label: "Manual" },
  { id: "import", label: "Import" },
  { id: "webform", label: "Web Form" },
];

function renderFilterPanel(overrides: Partial<TimelineHistoryFilterProps> = {}) {
  const onApply = vi.fn();
  const defaultProps: TimelineHistoryFilterProps = {
    modulesLabel: "Modules",
    modulesAllLabel: "All Modules",
    moduleOptions: sampleModules,
    usersLabel: "Users",
    usersAllLabel: "All Users",
    userOptions: sampleUsers,
    timeLabel: "Time",
    sourcesLabel: "Sources",
    sourcesAllLabel: "All Sources",
    sourceOptions: sampleSources,
    applyLabel: "Apply Filter",
    onApply,
    ...overrides,
  };

  render(<TimelineHistoryFilterPanel {...defaultProps} />);
  return { onApply };
}

test("users selector: choosing a user enables Apply and sends userId; choosing all sets userId null and disables Apply", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  const usersTrigger = screen.getByRole("button", { name: "Users All Users" });
  await user.click(usersTrigger);

  await user.click(screen.getByRole("menuitem", { name: "User One" }));
  expect(applyButton.disabled).toBe(false);
  expect(screen.getByRole("button", { name: "Users User One" })).toBeTruthy();

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: "u1",
    time: "any",
    sourceIds: [],
  });

  await user.click(screen.getByRole("button", { name: "Users User One" }));
  await user.click(screen.getByRole("menuitem", { name: "All Users" }));

  expect(applyButton.disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Users All Users" })).toBeTruthy();
});

test("time selector: lists options in order, choosing Today updates trigger label and applies time preset", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  const timeTrigger = screen.getByRole("button", { name: "Time Any Time" });
  await user.click(timeTrigger);

  const menuItems = screen.getAllByRole("menuitem").map((item) => item.textContent);
  expect(menuItems).toEqual(["Any Time", "Today", "Yesterday", "Last 7 days", "Last 30 days"]);

  await user.click(screen.getByRole("menuitem", { name: "Today" }));

  const updatedTrigger = screen.getByRole("button", { name: "Time Today" });
  expect(updatedTrigger).toBeTruthy();
  expect(within(updatedTrigger).getByText("Today")).toBeTruthy();

  expect(applyButton.disabled).toBe(false);
  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: null,
    time: "today",
    sourceIds: [],
  });
});

test("sources checkbox selector: selecting two sources applies both sourceIds; unchecking all disables Apply", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(applyButton.disabled).toBe(true);

  const sourcesTrigger = screen.getByRole("button", { name: "Sources All Sources" });
  await user.click(sourcesTrigger);

  await user.click(screen.getByRole("checkbox", { name: "Manual" }));
  await user.click(screen.getByRole("checkbox", { name: "Web Form" }));
  await user.keyboard("{Escape}");

  expect(screen.getByRole("button", { name: "Sources Manual, Web Form" })).toBeTruthy();
  expect(applyButton.disabled).toBe(false);

  await user.click(applyButton);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: null,
    time: "any",
    sourceIds: ["manual", "webform"],
  });

  await user.click(screen.getByRole("button", { name: "Sources Manual, Web Form" }));
  await user.click(screen.getByRole("checkbox", { name: "Manual" }));
  await user.click(screen.getByRole("checkbox", { name: "Web Form" }));
  await user.keyboard("{Escape}");

  expect(screen.getByRole("button", { name: "Sources All Sources" })).toBeTruthy();
  expect(applyButton.disabled).toBe(true);
});

test("modules trigger label: shows joined labels with two selected options, and modulesAllLabel with none", async () => {
  const user = userEvent.setup();
  renderFilterPanel();

  const trigger = screen.getByRole("button", { name: "Modules All Modules" });
  expect(within(trigger).getByText("All Modules")).toBeTruthy();

  await user.click(trigger);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  await user.click(screen.getByRole("checkbox", { name: "Deals" }));
  await user.keyboard("{Escape}");

  const updatedTrigger = screen.getByRole("button", { name: "Modules Notes, Deals" });
  expect(updatedTrigger).toBeTruthy();
  expect(within(updatedTrigger).getByText("Notes, Deals")).toBeTruthy();

  await user.click(updatedTrigger);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  await user.click(screen.getByRole("checkbox", { name: "Deals" }));
  await user.keyboard("{Escape}");

  const resetTrigger = screen.getByRole("button", { name: "Modules All Modules" });
  expect(resetTrigger).toBeTruthy();
  expect(within(resetTrigger).getByText("All Modules")).toBeTruthy();
});

test("combined: module + user + time + source together results in one onApply call with full filter value", async () => {
  const user = userEvent.setup();
  const { onApply } = renderFilterPanel();
  const applyButton = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;

  await user.click(screen.getByRole("button", { name: "Modules All Modules" }));
  await user.click(screen.getByRole("checkbox", { name: "Tasks" }));
  await user.keyboard("{Escape}");

  await user.click(screen.getByRole("button", { name: "Users All Users" }));
  await user.click(screen.getByRole("menuitem", { name: "User Two" }));

  await user.click(screen.getByRole("button", { name: "Time Any Time" }));
  await user.click(screen.getByRole("menuitem", { name: "Last 7 days" }));

  await user.click(screen.getByRole("button", { name: "Sources All Sources" }));
  await user.click(screen.getByRole("checkbox", { name: "Import" }));
  await user.keyboard("{Escape}");

  expect(applyButton.disabled).toBe(false);
  await user.click(applyButton);

  expect(onApply).toHaveBeenCalledTimes(1);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: ["tasks"],
    userId: "u2",
    time: "last7",
    sourceIds: ["import"],
  });
});

test("keyboard: selectors open with Enter and close with Escape", async () => {
  const user = userEvent.setup();
  renderFilterPanel();

  const modulesTrigger = screen.getByRole("button", { name: "Modules All Modules" });
  modulesTrigger.focus();
  expect(document.activeElement).toBe(modulesTrigger);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("checkbox", { name: "Notes" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("checkbox", { name: "Notes" })).toBeNull();

  const usersTrigger = screen.getByRole("button", { name: "Users All Users" });
  usersTrigger.focus();
  expect(document.activeElement).toBe(usersTrigger);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menuitem", { name: "User One" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menuitem", { name: "User One" })).toBeNull();

  const timeTrigger = screen.getByRole("button", { name: "Time Any Time" });
  timeTrigger.focus();
  expect(document.activeElement).toBe(timeTrigger);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menuitem", { name: "Today" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menuitem", { name: "Today" })).toBeNull();

  const sourcesTrigger = screen.getByRole("button", { name: "Sources All Sources" });
  sourcesTrigger.focus();
  expect(document.activeElement).toBe(sourcesTrigger);
  await user.keyboard("{Enter}");
  expect(screen.getByRole("checkbox", { name: "Manual" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("checkbox", { name: "Manual" })).toBeNull();
});

test("keyboard: selectors open with Space and close with Escape", async () => {
  const user = userEvent.setup();
  renderFilterPanel();

  const modulesTrigger = screen.getByRole("button", { name: "Modules All Modules" });
  modulesTrigger.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("checkbox", { name: "Notes" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("checkbox", { name: "Notes" })).toBeNull();

  const usersTrigger = screen.getByRole("button", { name: "Users All Users" });
  usersTrigger.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("menuitem", { name: "User One" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menuitem", { name: "User One" })).toBeNull();

  const timeTrigger = screen.getByRole("button", { name: "Time Any Time" });
  timeTrigger.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("menuitem", { name: "Today" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menuitem", { name: "Today" })).toBeNull();

  const sourcesTrigger = screen.getByRole("button", { name: "Sources All Sources" });
  sourcesTrigger.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("checkbox", { name: "Manual" })).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("checkbox", { name: "Manual" })).toBeNull();
});
