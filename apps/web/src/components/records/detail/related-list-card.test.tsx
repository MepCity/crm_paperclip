import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { RelatedListDefinition } from "@/modules/types";
import { render } from "@/test/render";
import { RelatedListCard } from "./related-list-card";

afterEach(cleanup);

const base: RelatedListDefinition = {
  id: "contacts",
  title: "Contacts",
  moduleKey: "M2",
  order: 1,
  targetId: "contacts-target",
  emptyStateText: "No records found",
};

it("renders the title as a labelled section heading with the empty state", () => {
  render(<RelatedListCard definition={base} />);
  const section = screen.getByRole("region", { name: "Contacts" });
  expect(section.id).toBe("contacts-target");
  expect(within(section).getByRole("heading", { name: "Contacts" })).toBeTruthy();
  expect(screen.getByText("No records found")).toBeTruthy();
});

it("shows the loading text instead of the empty state", () => {
  render(<RelatedListCard definition={{ ...base, loadingText: "Loading..." }} />);
  expect(screen.getByText("Loading...")).toBeTruthy();
  expect(screen.queryByText("No records found")).toBeNull();
});

it("renders preview rows with record links", () => {
  render(
    <RelatedListCard
      definition={{
        ...base,
        tableColumns: [
          { id: "name", label: "Name", cellKind: "recordLink" },
          { id: "city", label: "City" },
        ],
        tablePreviewRows: [
          { id: "r1", cells: { name: "Alpha", city: "Paris" }, recordLink: { href: "/c/1" } },
          { id: "r2", cells: { name: "Beta", city: "Rome" }, recordLink: { href: "/c/2" } },
        ],
      }}
    />,
  );
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "City" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Alpha" }).getAttribute("href")).toBe("/c/1");
  expect(screen.getByRole("link", { name: "Beta" }).getAttribute("href")).toBe("/c/2");
  expect(screen.getByText("Paris")).toBeTruthy();
  expect(screen.queryByText("No records found")).toBeNull();
});

it("shows only the column headers and empty text for an empty table", () => {
  render(
    <RelatedListCard
      definition={{ ...base, showEmptyTable: true, tableColumns: [{ id: "name", label: "Name" }] }}
    />,
  );
  expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
  expect(screen.getByText("No records found")).toBeTruthy();
});

it("runs control actions by role and name", () => {
  const onAdd = vi.fn();
  const onExpand = vi.fn();
  render(
    <RelatedListCard
      definition={{
        ...base,
        upperControls: [
          { id: "add", label: "Add Contact", type: "button", moduleKey: "M2", onAction: onAdd },
          {
            id: "expand",
            label: "Expand",
            type: "icon-button",
            moduleKey: "M2",
            onAction: onExpand,
          },
        ],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add Contact" }));
  fireEvent.click(screen.getByRole("button", { name: "Expand" }));
  expect(onAdd).toHaveBeenCalledTimes(1);
  expect(onExpand).toHaveBeenCalledTimes(1);
});

it.each(["Cases"] as const)("keeps unsupported %s activity Add New controls inactive", (module) => {
  render(
    <RelatedListCard
      definition={{
        ...base,
        id: "open-activities",
        title: "Open Activities",
        moduleKey: "M5",
        upperControls: [{ id: "add-new", label: "Add New", type: "split-button", moduleKey: "M5" }],
      }}
      context={{
        orgSlug: "example",
        module,
        record: { id: "parent-1", fields: {} },
        recordPath: () => "/parent",
      }}
    />,
  );
  const card = screen.getByRole("region", { name: "Open Activities" });
  for (const label of ["Add New", "More"]) {
    const control = within(card).getByRole("button", { name: label });
    expect(control.getAttribute("data-later-module")).toBe("M5");
    expect(control.getAttribute("aria-disabled")).toBe("true");
  }
});

it("lists activity columns with their counts and empty texts", () => {
  render(
    <RelatedListCard
      definition={{
        ...base,
        activityColumns: [
          { id: "tasks", title: "Open Tasks", count: 3, emptyText: "No tasks" },
          { id: "calls", title: "Calls", count: 0, emptyText: "No calls" },
        ],
      }}
    />,
  );
  expect(screen.getByText("Open Tasks")).toBeTruthy();
  expect(screen.getByText("3")).toBeTruthy();
  expect(screen.getByText("No tasks")).toBeTruthy();
  expect(screen.getByText("No calls")).toBeTruthy();
});

it("switches subtabs", () => {
  render(
    <RelatedListCard
      definition={{
        ...base,
        subtabs: [
          { id: "a", label: "First" },
          { id: "b", label: "Second" },
        ],
      }}
    />,
  );
  const first = screen.getByRole("tab", { name: "First" });
  const second = screen.getByRole("tab", { name: "Second" });
  expect(first.getAttribute("aria-selected")).toBe("true");
  fireEvent.click(second);
  expect(second.getAttribute("aria-selected")).toBe("true");
  expect(first.getAttribute("aria-selected")).toBe("false");
});

it("uses a custom body when renderBody returns content", () => {
  render(<RelatedListCard definition={{ ...base, renderBody: () => <p>Custom body</p> }} />);
  expect(screen.getByText("Custom body")).toBeTruthy();
  expect(screen.queryByText("No records found")).toBeNull();
});
