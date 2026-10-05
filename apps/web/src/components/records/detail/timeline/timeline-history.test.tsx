import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { TimelineHistory } from "./timeline-history";
import { TimelineSurface } from "./timeline-surface";
import type { TimelineEvent, TimelineFilterOption } from "./types";

afterEach(cleanup);

const moduleOptions: TimelineFilterOption[] = [
  { id: "notes", label: "Notes" },
  { id: "tasks", label: "Tasks" },
];

const userOptions: TimelineFilterOption[] = [{ id: "u1", label: "Sample User" }];

const sourceOptions: TimelineFilterOption[] = [{ id: "manual", label: "Manual" }];

const baseEvents: TimelineEvent[] = [
  {
    id: "day-two-late",
    at: "2026-10-04T18:00:00.000Z",
    kind: "task",
    title: "Late event",
    actorName: "Actor A",
  },
  {
    id: "day-two-early",
    at: "2026-10-04T08:00:00.000Z",
    kind: "task",
    title: "Early event",
    actorName: "Actor A",
  },
  {
    id: "day-one",
    at: "2026-10-03T12:00:00.000Z",
    kind: "unknown",
    title: "Prior day",
    actorName: "Actor B",
  },
];

function renderHistory(initialFilterExpanded = false) {
  const onApply = vi.fn();
  render(
    <TimelineSurface subtabs={[{ id: "history", label: "History" }]} activeSubtabId="history">
      <TimelineHistory
        heading="Timeline History"
        filterButtonLabel="History filter"
        events={baseEvents}
        initialFilterExpanded={initialFilterExpanded}
        modulesLabel="Modules"
        modulesAllLabel="All Modules"
        moduleOptions={moduleOptions}
        usersLabel="Users"
        usersAllLabel="All Users"
        userOptions={userOptions}
        sourcesLabel="Sources"
        sourcesAllLabel="All Sources"
        sourceOptions={sourceOptions}
        applyLabel="Apply Filter"
        onApply={onApply}
      />
    </TimelineSurface>,
  );
  return { onApply };
}

test("subtab row exposes tab roles with History selected", () => {
  renderHistory();
  const tablist = screen.getByRole("tablist", { name: "Timeline sections" });
  const history = within(tablist).getByRole("tab", { name: "History" });
  expect(history.getAttribute("aria-selected")).toBe("true");
});

test("filter button toggles aria-expanded and panel visibility", async () => {
  const user = userEvent.setup();
  renderHistory();
  const filterButton = screen.getByRole("button", { name: "History filter" });
  expect(filterButton.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("button", { name: "Apply Filter" })).toBeNull();
  await user.click(filterButton);
  expect(filterButton.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("button", { name: "Apply Filter" })).toBeTruthy();
  await user.click(filterButton);
  expect(filterButton.getAttribute("aria-expanded")).toBe("false");
});

test("filter selectors start with default labels and Apply stays disabled until a selection", async () => {
  const user = userEvent.setup();
  const { onApply } = renderHistory(true);
  const apply = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  expect(apply.disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Modules" }).textContent).toContain("All Modules");
  expect(screen.getByRole("button", { name: "Users" }).textContent).toContain("All Users");
  expect(screen.getByRole("button", { name: "Time" }).textContent).toContain("Any Time");
  expect(screen.getByRole("button", { name: "Sources" }).textContent).toContain("All Sources");
  await user.click(screen.getByRole("button", { name: "Time" }));
  await user.click(screen.getByRole("menuitem", { name: "Today" }));
  expect(apply.disabled).toBe(false);
  await user.click(apply);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: [],
    userId: null,
    time: "today",
    sourceIds: [],
  });
});

test("groups events by day in descending day order with newest first within a day", () => {
  renderHistory();
  const titles = [...document.querySelectorAll(".timeline-event-title")].map(
    (node) => node.textContent,
  );
  expect(titles).toEqual(["Late event", "Early event", "Prior day"]);
});

test("unknown event kind still renders the generic icon track", () => {
  renderHistory();
  expect(screen.getByText("Prior day")).toBeTruthy();
  expect(document.querySelector("[data-timeline-event-track] svg")).toBeTruthy();
});
