import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import {
  ActivityCategoriesCardBody,
  type ParentActivityCategory,
  type ParentActivityRow,
} from "./activity-categories-card-body";

afterEach(cleanup);

const task: ParentActivityRow = {
  id: "task-1",
  subject: "Prepare sample proposal",
  href: "/crm/demo/Tasks/task-1",
  dateText: "15.10.2026",
  ownerName: "Alex Example",
  details: [
    { label: "Status", value: "In Progress" },
    { label: "Priority", value: "High" },
  ],
};

const meeting: ParentActivityRow = {
  id: "meeting-1",
  subject: "Sample planning meeting",
  href: "/crm/demo/Meetings/meeting-1",
  dateText: "16.10.2026 10:00 AM - 11:00 AM",
  ownerName: "Taylor Example",
  details: [],
};

const call: ParentActivityRow = {
  id: "call-1",
  subject: "Sample follow-up call",
  href: "/crm/demo/Calls/call-1",
  dateText: null,
  ownerName: null,
  details: [],
};

// Deliberately unordered, with counts independent of the number of displayed rows.
const categories: readonly ParentActivityCategory[] = [
  { kind: "call", count: 5, rows: [call] },
  { kind: "task", count: 3, rows: [task] },
  { kind: "meeting", count: 2, rows: [meeting] },
];

describe("ActivityCategoriesCardBody", () => {
  it.each(["open", "closed"] as const)(
    "renders ordered named regions, static headings and supplied badges for %s activities",
    (variant) => {
      render(<ActivityCategoriesCardBody variant={variant} categories={categories} />);
      const prefix = variant === "open" ? "Open" : "Closed";
      const regions = screen.getAllByRole("region");
      expect(regions.map((region) => region.getAttribute("aria-label"))).toEqual([
        `${prefix} Tasks (3)`,
        `${prefix} Meetings (2)`,
        `${prefix} Calls (5)`,
      ]);
      for (const [index, region] of regions.entries()) {
        const label = ["Tasks", "Meetings", "Calls"][index];
        const count = [3, 2, 5][index];
        const heading = within(region).getByRole("heading", {
          name: `${prefix} ${label} (${count})`,
        });
        expect(within(heading).getByText(String(count))).toBeTruthy();
        expect(heading.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
      }
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("columnheader")).toBeNull();
      expect(screen.queryByRole("checkbox")).toBeNull();
    },
  );

  it("renders every kind together and preserves subject link destinations", () => {
    render(<ActivityCategoriesCardBody variant="open" categories={categories} />);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      task.href,
      meeting.href,
      call.href,
    ]);
    for (const row of [task, meeting, call]) {
      expect(screen.getByRole("link", { name: row.subject })).toBeTruthy();
    }
    expect(screen.getByText(meeting.dateText ?? "")).toBeTruthy();
  });

  it("keeps the open task subject, date, owner, Status and Priority in display order", () => {
    render(<ActivityCategoriesCardBody variant="open" categories={categories} />);
    const row = screen.getByRole("link", { name: task.subject }).closest("li");
    expect(row?.textContent).toBe(
      `${task.subject}${task.dateText}${task.ownerName}Status: In ProgressPriority: High`,
    );
    expect(row?.querySelectorAll("dt").length).toBe(2);
    expect(row?.querySelectorAll("dd").length).toBe(2);
    expect(row?.querySelectorAll("button").length).toBe(0);
  });

  it("renders Closed Time after the supplied date and owner without formatting dates", () => {
    const closedTask = {
      ...task,
      details: [{ label: "Closed Time", value: "14.10.2026 09:30 AM" }],
    };
    render(
      <ActivityCategoriesCardBody
        variant="closed"
        categories={[{ kind: "task", count: 1, rows: [closedTask] }]}
      />,
    );
    expect(screen.getByRole("link", { name: task.subject }).closest("li")?.textContent).toBe(
      `${task.subject}${task.dateText}${task.ownerName}Closed Time: 14.10.2026 09:30 AM`,
    );
  });

  it.each(["open", "closed"] as const)(
    "shows the captured empty text for supplied and omitted %s categories",
    (variant) => {
      render(
        <ActivityCategoriesCardBody
          variant={variant}
          categories={[{ kind: "task", count: 0, rows: [] }]}
        />,
      );
      expect(screen.getAllByText("No records found")).toHaveLength(3);
      for (const region of screen.getAllByRole("region")) {
        expect(region.getAttribute("aria-label")).toMatch(/\(0\)$/);
        expect(within(region).getByText("No records found")).toBeTruthy();
      }
    },
  );

  it("omits absent optional row fields and details without placeholders", () => {
    render(<ActivityCategoriesCardBody variant="open" categories={categories} />);
    const row = screen.getByRole("link", { name: call.subject }).closest("li");
    expect(row?.textContent).toBe(call.subject);
    expect(row?.querySelector("dl")).toBeNull();
    expect(row?.querySelector("svg")).toBeNull();
  });

  it("shows the contact an activity is with, after its owner", () => {
    const withContact = { ...call, dateText: "04.11.2026 02:00 PM", contactName: "Jane Example" };
    render(
      <ActivityCategoriesCardBody
        variant="open"
        categories={[{ kind: "call", count: 1, rows: [withContact] }]}
      />,
    );
    const row = screen.getByRole("link", { name: call.subject }).closest("li");
    expect(row?.textContent).toBe(`${call.subject}04.11.2026 02:00 PMJane Example`);
  });
});
