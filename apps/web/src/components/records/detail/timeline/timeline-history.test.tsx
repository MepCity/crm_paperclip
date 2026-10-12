import { formatDate } from "@crm/core/format";
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

// Five events over two days: three on 4 Oct, two on 3 Oct in every format under test.
const baseEvents: TimelineEvent[] = [
  {
    id: "day-two-late",
    at: "2026-10-04T18:00:00.000Z",
    kind: "task",
    title: "Late event",
    actorName: "Actor A",
  },
  {
    id: "day-two-middle",
    at: "2026-10-04T12:00:00.000Z",
    kind: "email",
    title: "Midday event",
    actorName: "Actor B",
  },
  {
    id: "day-two-early",
    at: "2026-10-04T08:00:00.000Z",
    kind: "task",
    title: "Early event",
    actorName: "Actor A",
  },
  {
    id: "day-one-late",
    at: "2026-10-03T16:00:00.000Z",
    kind: "unknown",
    title: "Prior day late",
    actorName: "Actor B",
  },
  {
    id: "day-one-early",
    at: "2026-10-03T08:00:00.000Z",
    kind: "unknown",
    title: "Prior day early",
    actorName: "Actor A",
  },
];

// Only the day-boundary case: 22:30Z is still 4 Oct in UTC and already 5 Oct at UTC+3.
const dayBoundaryEvents: TimelineEvent[] = [
  {
    id: "before-midnight",
    at: "2026-10-04T20:00:00.000Z",
    kind: "task",
    title: "Same UTC day",
    actorName: "Actor A",
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
        timeLabel="Time"
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
  expect(screen.getByRole("button", { name: "Modules All Modules" }).textContent).toContain(
    "All Modules",
  );
  expect(screen.getByRole("button", { name: "Users All Users" }).textContent).toContain(
    "All Users",
  );
  expect(screen.getByRole("button", { name: "Time Any Time" }).textContent).toContain("Any Time");
  expect(screen.getByRole("button", { name: "Sources All Sources" }).textContent).toContain(
    "All Sources",
  );
  await user.click(screen.getByRole("button", { name: "Time Any Time" }));
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

test("each selector name pairs its visible label with the selected value", async () => {
  const user = userEvent.setup();
  renderHistory(true);
  // While an option list is open it is modal, so its trigger leaves the accessibility tree:
  // every name below is read with the list closed.
  const modules = screen.getByRole("button", { name: "Modules All Modules" });
  const users = screen.getByRole("button", { name: "Users All Users" });
  const time = screen.getByRole("button", { name: "Time Any Time" });
  const sources = screen.getByRole("button", { name: "Sources All Sources" });

  await user.click(modules);
  await user.click(screen.getByRole("checkbox", { name: "Notes" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Modules Notes" })).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Modules Notes" }));
  await user.click(screen.getByRole("checkbox", { name: "Tasks" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Modules Notes, Tasks" })).toBeTruthy();

  await user.click(users);
  await user.click(screen.getByRole("menuitem", { name: "Sample User" }));
  expect(screen.getByRole("button", { name: "Users Sample User" })).toBeTruthy();

  await user.click(time);
  await user.click(screen.getByRole("menuitem", { name: "Today" }));
  expect(screen.getByRole("button", { name: "Time Today" })).toBeTruthy();

  await user.click(sources);
  await user.click(screen.getByRole("checkbox", { name: "Manual" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Sources Manual" })).toBeTruthy();

  expect(screen.getByRole("button", { name: "Apply Filter" })).toBeTruthy();
});

test("module checkbox selection enables Apply with moduleIds", async () => {
  const user = userEvent.setup();
  const { onApply } = renderHistory(true);
  const apply = screen.getByRole("button", { name: "Apply Filter" }) as HTMLButtonElement;
  await user.click(screen.getByRole("button", { name: "Modules All Modules" }));
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
  expect(sections.length).toBe(2);
  expect(sections[0]?.querySelectorAll(".timeline-event-title").length).toBe(3);
  expect(sections[1]?.querySelectorAll(".timeline-event-title").length).toBe(2);
  const titles = [...document.querySelectorAll(".timeline-event-title")].map(
    (node) => node.textContent,
  );
  expect(titles).toEqual([
    "Late event",
    "Midday event",
    "Early event",
    "Prior day late",
    "Prior day early",
  ]);
});

test("unknown event kind renders the generic icon marker", () => {
  renderHistory();
  expect(screen.getByText("Prior day late")).toBeTruthy();
  expect(document.querySelector('[data-kind-icon="generic"]')).toBeTruthy();
  expect(document.querySelector('[data-kind-icon="pencil"]')).toBeNull();
});

test("formats istanbul midnight event on the next calendar day", () => {
  renderHistory(false, IST_FORMAT, dayBoundaryEvents);
  const sections = [...document.querySelectorAll(".timeline-event-day")];
  expect(sections.length).toBe(2);
  const oct5Label = formatDate("2026-10-04T22:30:00.000Z", IST_FORMAT);
  const oct4Label = formatDate("2026-10-04T20:00:00.000Z", IST_FORMAT);
  const sectionFor = (label: string) =>
    sections.find((section) =>
      section.querySelector(".timeline-event-date-badge")?.textContent?.includes(label),
    );
  const oct5Section = sectionFor(oct5Label);
  const oct4Section = sectionFor(oct4Label);
  expect(oct5Section).toBeTruthy();
  expect(oct4Section).toBeTruthy();
  expect(oct5Label).not.toBe(oct4Label);
  expect(within(oct5Section as HTMLElement).getByText("1:30 AM")).toBeTruthy();
  expect(within(oct5Section as HTMLElement).getByText("Istanbul midnight edge")).toBeTruthy();
  expect(within(oct4Section as HTMLElement).getByText("11:00 PM")).toBeTruthy();
  expect(within(oct4Section as HTMLElement).getByText("Same UTC day")).toBeTruthy();
});

test("shows visible filter field labels", () => {
  renderHistory(true);
  const labels = [...document.querySelectorAll(".timeline-history-filter-field-label")].map(
    (node) => node.textContent,
  );
  expect(labels).toEqual(["Modules", "Users", "Time", "Sources"]);
});
