import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { filterTimelineEvents, TimelineHistory } from "./timeline-history";
import type { TimelineEvent } from "./types";

afterEach(() => {
  cleanup();
});

const noteEvent = (id: string, at: string, extra: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id,
  at,
  kind: "note",
  moduleId: "notes",
  title: "Note added",
  actorName: "Ada",
  actorId: "u1",
  body: <p>body {id}</p>,
  ...extra,
});
const fieldEvent: TimelineEvent = {
  id: "f1",
  at: "2026-01-02T10:00:00Z",
  kind: "update",
  title: "Updated",
  actorName: "Bob",
};

describe("note timeline events", () => {
  it("interleaves note and field events chronologically", () => {
    render(
      <TimelineHistory
        heading="Timeline History"
        filterButtonLabel="History filter"
        events={[
          noteEvent("n1", "2026-01-02T09:00:00Z"),
          fieldEvent,
          noteEvent("n2", "2026-01-02T11:00:00Z"),
        ]}
        format={DEFAULT_FORMAT}
        modulesLabel="Modules"
        modulesAllLabel="All Modules"
        moduleOptions={[{ id: "notes", label: "Notes" }]}
        usersLabel="Users"
        usersAllLabel="All Users"
        userOptions={[]}
        timeLabel="Time"
        sourcesLabel="Sources"
        sourcesAllLabel="All Sources"
        sourceOptions={[]}
        applyLabel="Apply Filter"
        onApply={() => {}}
      />,
    );
    const rows = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(rows[0]).toContain("body n2");
    expect(rows[1]).toContain("Updated");
    expect(rows[2]).toContain("body n1");
    expect(screen.getAllByText("Add Note")).toHaveLength(2);
  });

  it("Modules filter keeps only note events", () => {
    const events = [noteEvent("n1", "2026-01-02T09:00:00Z"), fieldEvent];
    const out = filterTimelineEvents(events, {
      moduleIds: ["notes"],
      userId: null,
      time: "any",
      sourceIds: [],
    });
    expect(out.map((e) => e.id)).toEqual(["n1"]);
  });

  it("Show More toggles when the body overflows", () => {
    const proto = HTMLElement.prototype;
    const sh = Object.getOwnPropertyDescriptor(proto, "scrollHeight");
    Object.defineProperty(proto, "scrollHeight", { configurable: true, value: 200 });
    Object.defineProperty(proto, "clientHeight", { configurable: true, value: 50 });
    try {
      render(
        <TimelineHistory
          heading="h"
          filterButtonLabel="f"
          events={[noteEvent("n1", "2026-01-02T09:00:00Z")]}
          format={DEFAULT_FORMAT}
          modulesLabel="Modules"
          modulesAllLabel="All"
          moduleOptions={[]}
          usersLabel="Users"
          usersAllLabel="All"
          userOptions={[]}
          timeLabel="Time"
          sourcesLabel="S"
          sourcesAllLabel="All"
          sourceOptions={[]}
          applyLabel="Apply"
          onApply={() => {}}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Show More" }));
      expect(screen.getByRole("button", { name: "Show Less" })).toBeTruthy();
    } finally {
      if (sh) Object.defineProperty(proto, "scrollHeight", sh);
      else Reflect.deleteProperty(proto, "scrollHeight");
      Reflect.deleteProperty(proto, "clientHeight");
    }
  });

  it("renders all 250 note events in timeline history", () => {
    const events = Array.from({ length: 250 }, (_, i) =>
      noteEvent(`n${i + 1}`, new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(), {
        title: `Note ${i + 1}`,
      }),
    );
    render(
      <TimelineHistory
        heading="Timeline History"
        filterButtonLabel="History filter"
        events={events}
        format={DEFAULT_FORMAT}
        modulesLabel="Modules"
        modulesAllLabel="All Modules"
        moduleOptions={[{ id: "notes", label: "Notes" }]}
        usersLabel="Users"
        usersAllLabel="All Users"
        userOptions={[]}
        timeLabel="Time"
        sourcesLabel="Sources"
        sourcesAllLabel="All Sources"
        sourceOptions={[]}
        applyLabel="Apply Filter"
        onApply={() => {}}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(250);
  });
});
