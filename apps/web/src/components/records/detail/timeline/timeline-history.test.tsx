import { formatDate, formatTime } from "@crm/core/format";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { render } from "@/test/render";
import { TimelineHistory } from "./timeline-history";
import { TimelineSurface } from "./timeline-surface";
import type { TimelineEvent, TimelineFilterOption } from "./types";

afterEach(cleanup);

const IST_FORMAT = { locale: "en-US", timeZone: "Europe/Istanbul" };

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
  {
    id: "istanbul-midnight",
    at: "2026-10-04T22:30:00.000Z",
    kind: "task",
    title: "Istanbul midnight edge",
    actorName: "Actor A",
  },
];

function renderHistory(
  initialFilterExpanded = false,
  format = DEFAULT_FORMAT,
  events: TimelineEvent[] = baseEvents,
) {
  const onApply = vi.fn();
  render(
    <TimelineSurface subtabs={[{ id: "history", label: "History" }]} activeSubtabId="history">
      <TimelineHistory
        heading="Timeline History"
        filterButtonLabel="History filter"
        events={events}
        format={format}
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

test("module checkbox selection enables Apply with moduleIds", async () => {
  const user = userEvent.setup();
  const { onApply } = renderHistory(true);
  const apply = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  await user.click(screen.getByRole("button", { name: "Modules" }));
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  expect(apply.disabled).toBe(false);
  await user.click(apply);
  expect(onApply).toHaveBeenCalledWith({
    moduleIds: ["notes"],
    userId: null,
    time: "any",
    sourceIds: [],
  });
});

test("groups events by formatted day with counts per section", () => {
  renderHistory();
  const sections = document.querySelectorAll(".timeline-event-day");
  expect(sections.length).toBe(3);
  expect(sections[0]?.querySelectorAll(".timeline-event-title").length).toBe(1);
  expect(sections[1]?.querySelectorAll(".timeline-event-title").length).toBe(2);
  expect(sections[2]?.querySelectorAll(".timeline-event-title").length).toBe(1);
  const titles = [...document.querySelectorAll(".timeline-event-title")].map(
    (node) => node.textContent,
  );
  expect(titles).toEqual(["Istanbul midnight edge", "Late event", "Early event", "Prior day"]);
});

test("unknown event kind renders the generic icon marker", () => {
  renderHistory();
  expect(screen.getByText("Prior day")).toBeTruthy();
  expect(document.querySelector('[data-kind-icon="generic"]')).toBeTruthy();
  expect(document.querySelector('[data-kind-icon="pencil"]')).toBeNull();
});

test("formats istanbul midnight event on the next calendar day", () => {
  renderHistory(false, IST_FORMAT);
  const sections = [...document.querySelectorAll(".timeline-event-day")];
  const oct5Label = formatDate("2026-10-04T22:30:00.000Z", IST_FORMAT);
  const oct5Section = sections.find((section) =>
    section.querySelector(".timeline-event-date-badge")?.textContent?.includes(oct5Label),
  );
  expect(oct5Section).toBeTruthy();
  expect(
    within(oct5Section as HTMLElement).getByText(
      formatTime("2026-10-04T22:30:00.000Z", IST_FORMAT),
    ),
  ).toBeTruthy();
  expect(screen.getByText("Istanbul midnight edge")).toBeTruthy();
});

test("shows visible filter field labels", () => {
  renderHistory(true);
  const labels = [...document.querySelectorAll(".timeline-history-filter-field-label")].map(
    (node) => node.textContent,
  );
  expect(labels).toEqual(["Modules", "Users", "Time", "Sources"]);
});
