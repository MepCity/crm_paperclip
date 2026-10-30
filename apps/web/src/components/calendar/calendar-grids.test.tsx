import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { CalendarMonthGrid } from "./calendar-month-grid";
import { CalendarTimeGrid } from "./calendar-time-grid";
import type { CalendarEvent } from "./layout-timed-events";

afterEach(cleanup);
const date = "2026-10-22";
const meeting: CalendarEvent = {
  id: "meeting",
  title: "Planning",
  start: `${date}T09:15`,
  end: `${date}T10:45`,
};

test("day grid exposes 48 slots, keyboard event activation, day and slot callbacks", async () => {
  const user = userEvent.setup();
  const onEventClick = vi.fn();
  const onSlotClick = vi.fn();
  const onDayClick = vi.fn();
  render(
    <CalendarTimeGrid
      date={date}
      view="day"
      events={[meeting]}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
      onDayClick={onDayClick}
      now={`${date}T09:20`}
    />,
  );
  expect(screen.getByRole("grid")).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /^Create event/ })).toHaveLength(48);
  const eventButton = screen.getByRole("button", {
    name: `Planning, ${meeting.start} to ${meeting.end}`,
  });
  eventButton.focus();
  await user.keyboard("{Enter}");
  expect(onEventClick).toHaveBeenCalledWith(meeting);
  expect(eventButton.style.top).toBe("50%");
  expect(eventButton.style.height).toBe("300%");
  await user.click(screen.getByRole("button", { name: `Create event ${date}T11:30` }));
  expect(onSlotClick).toHaveBeenCalledWith(`${date}T11:30`);
  await user.click(screen.getByRole("button", { name: `Open day ${date}` }));
  expect(onDayClick).toHaveBeenCalledWith(date);
  expect(screen.getByRole("img", { name: `Current time ${date}T09:20` })).toBeTruthy();
});
test("week includes all-day events across days with exclusive end and clips timed events", () => {
  const all: CalendarEvent = {
    id: "all",
    title: "Workshop",
    start: "2026-10-19T00:00",
    end: "2026-10-21T00:00",
    allDay: true,
  };
  render(
    <CalendarTimeGrid
      date={date}
      view="week"
      weekStartsOn={1}
      events={[all, { ...meeting, start: "2026-10-21T23:00", end: `${date}T01:00` }]}
    />,
  );
  expect(screen.getAllByRole("button", { name: /^Open day/ })).toHaveLength(7);
  expect(screen.getAllByRole("button", { name: /^Create event/ })).toHaveLength(336);
  expect(screen.getAllByRole("button", { name: /^Workshop,/ })).toHaveLength(2);
  const timed = screen.getAllByRole("button", { name: /^Planning,/ });
  expect(timed).toHaveLength(2);
  expect(timed.map((button) => button.style.height)).toEqual(["200%", "200%"]);
  expect(screen.queryByRole("img")).toBeNull();
});
test("month has six weeks, overflow opens day, event and empty day callbacks work", async () => {
  const user = userEvent.setup();
  const onDayClick = vi.fn();
  const onEventClick = vi.fn();
  const onSlotClick = vi.fn();
  render(
    <CalendarMonthGrid
      date={date}
      events={[
        meeting,
        { ...meeting, id: "two", title: "Review" },
        { ...meeting, id: "three", title: "Retro" },
      ]}
      maxVisibleEvents={1}
      onDayClick={onDayClick}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
    />,
  );
  expect(screen.getAllByRole("row")).toHaveLength(7);
  expect(screen.getAllByRole("gridcell")).toHaveLength(42);
  const cell = within(screen.getByRole("gridcell", { name: date }));
  await user.click(cell.getByRole("button", { name: /^Planning,/ }));
  expect(onEventClick).toHaveBeenCalledWith(meeting);
  await user.click(cell.getByRole("button", { name: `2 more events on ${date}` }));
  expect(onDayClick).toHaveBeenCalledWith(date);
  expect(cell.getByText("+2 more")).toBeTruthy();
  const empty = within(screen.getByRole("gridcell", { name: "2026-10-23" }));
  await user.click(empty.getByRole("button", { name: "Create event 2026-10-23" }));
  expect(onSlotClick).toHaveBeenCalledWith("2026-10-23T00:00");
  await user.click(empty.getByRole("button", { name: "Open day 2026-10-23" }));
  expect(onDayClick).toHaveBeenCalledWith("2026-10-23");
  expect(
    screen.getByRole("gridcell", { name: "2026-09-27" }).getAttribute("data-outside-month"),
  ).toBe("true");
});
test("empty day still offers slots and no events or now line", () => {
  render(<CalendarTimeGrid date={date} view="day" events={[]} />);
  expect(screen.getAllByRole("button", { name: /^Create event/ })).toHaveLength(48);
  expect(screen.queryByRole("img")).toBeNull();
});
