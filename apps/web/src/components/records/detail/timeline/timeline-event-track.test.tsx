import { type FormatOptions, formatDate, formatTime } from "@crm/core/format";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { TimelineEventTrack } from "./timeline-event-track";
import type { TimelineEvent } from "./types";

afterEach(cleanup);

const UTC_FORMAT: FormatOptions = { locale: "en-US", timeZone: "UTC" };

const middayEvents: readonly TimelineEvent[] = [
  {
    id: "oct4-midday",
    at: "2026-10-04T12:00:00.000Z",
    kind: "task",
    title: "Oct 4 Midday Event",
    actorName: "Alice",
  },
  {
    id: "oct4-afternoon",
    at: "2026-10-04T15:00:00.000Z",
    kind: "image_upload",
    title: "Oct 4 Afternoon Event",
    actorName: "Bob",
  },
  {
    id: "oct5-midday",
    at: "2026-10-05T12:00:00.000Z",
    kind: "email",
    title: "Oct 5 Midday Event",
    actorName: "Charlie",
  },
  {
    id: "oct3-midday",
    at: "2026-10-03T11:00:00.000Z",
    kind: "unknown",
    title: "Oct 3 Midday Event",
    actorName: "Diana",
  },
  {
    id: "oct3-afternoon",
    at: "2026-10-03T14:00:00.000Z",
    kind: "task",
    title: "Oct 3 Afternoon Event",
    actorName: "Edward",
  },
];

test("renders nothing when events array is empty", () => {
  const { container } = render(<TimelineEventTrack events={[]} format={UTC_FORMAT} />);
  expect(container.firstChild).toBeNull();
  expect(document.querySelector("[data-timeline-event-track]")).toBeNull();
});

test("groups events per day, newest day first, and newest event first inside each day", () => {
  render(<TimelineEventTrack events={middayEvents} format={UTC_FORMAT} />);

  const sections = document.querySelectorAll(".timeline-event-day");
  expect(sections).toHaveLength(3);

  const dayBadges = [...document.querySelectorAll(".timeline-event-date-badge")].map(
    (el) => el.textContent,
  );
  expect(dayBadges).toEqual([
    formatDate("2026-10-05T12:00:00.000Z", UTC_FORMAT),
    formatDate("2026-10-04T12:00:00.000Z", UTC_FORMAT),
    formatDate("2026-10-03T11:00:00.000Z", UTC_FORMAT),
  ]);

  const titles = [...document.querySelectorAll(".timeline-event-title")].map(
    (el) => el.textContent,
  );
  expect(titles).toEqual([
    "Oct 5 Midday Event",
    "Oct 4 Afternoon Event",
    "Oct 4 Midday Event",
    "Oct 3 Afternoon Event",
    "Oct 3 Midday Event",
  ]);
});

test("renders time with dateTime, title, and byline with actor name and formatted date", () => {
  const singleEvent: TimelineEvent = {
    id: "single-test-event",
    at: "2026-10-04T12:30:00.000Z",
    kind: "task",
    title: "Contract review call",
    actorName: "Sarah Connor",
  };

  render(<TimelineEventTrack events={[singleEvent]} format={UTC_FORMAT} />);

  const timeElement = screen.getByText(formatTime(singleEvent.at, UTC_FORMAT));
  expect(timeElement.tagName.toLowerCase()).toBe("time");
  expect(timeElement.getAttribute("dateTime")).toBe(singleEvent.at);

  const titleElement = screen.getByText("Contract review call");
  expect(titleElement).toBeTruthy();
  expect(titleElement.classList.contains("timeline-event-title")).toBe(true);

  const expectedByline = `by Sarah Connor ${formatDate(singleEvent.at, UTC_FORMAT)}`;
  const bylineElement = screen.getByText(expectedByline);
  expect(bylineElement).toBeTruthy();
  expect(bylineElement.classList.contains("timeline-event-byline")).toBe(true);
});

test("kind image_upload renders pencil icon, and any other kind renders generic icon", () => {
  const events: readonly TimelineEvent[] = [
    {
      id: "pencil-event",
      at: "2026-10-04T14:00:00.000Z",
      kind: "image_upload",
      title: "Profile photo uploaded",
      actorName: "John",
    },
    {
      id: "generic-event",
      at: "2026-10-04T12:00:00.000Z",
      kind: "task",
      title: "Task completed",
      actorName: "John",
    },
  ];

  render(<TimelineEventTrack events={events} format={UTC_FORMAT} />);

  const rows = document.querySelectorAll(".timeline-event-row");
  expect(rows).toHaveLength(2);

  const pencilRow = within(rows[0] as HTMLElement);
  expect(pencilRow.getByText("Profile photo uploaded")).toBeTruthy();
  expect((rows[0] as HTMLElement).querySelector('[data-kind-icon="pencil"]')).toBeTruthy();
  expect((rows[0] as HTMLElement).querySelector('[data-kind-icon="generic"]')).toBeNull();

  const genericRow = within(rows[1] as HTMLElement);
  expect(genericRow.getByText("Task completed")).toBeTruthy();
  expect((rows[1] as HTMLElement).querySelector('[data-kind-icon="generic"]')).toBeTruthy();
  expect((rows[1] as HTMLElement).querySelector('[data-kind-icon="pencil"]')).toBeNull();
});
