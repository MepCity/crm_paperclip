import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { ListToolbar, type ListToolbarProps } from "./list-toolbar";
import { ViewTabStrip } from "./view-tab-strip";

const base: ListToolbarProps = {
  filterOpen: false,
  onFilterChange: () => {},
  onRefresh: () => {},
  fields: [],
  sort: null,
  onSortApply: () => {},
  create: { label: "Create Lead" },
};
afterEach(cleanup);

test("Filter toggles via props and reports aria-pressed, refresh delegates", async () => {
  const user = userEvent.setup();
  const refresh = vi.fn();
  const changed = vi.fn();
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <ListToolbar
        {...base}
        filterOpen={open}
        onFilterChange={(next) => {
          changed(next);
          setOpen(next);
        }}
        onRefresh={refresh}
      />
    );
  }
  render(<Example />);
  const filter = screen.getByRole("button", { name: "Filter" });
  expect(filter.getAttribute("aria-pressed")).toBe("false");
  await user.click(filter);
  expect(filter.getAttribute("aria-pressed")).toBe("true");
  await user.click(filter);
  expect(changed.mock.calls).toEqual([[true], [false]]);
  await user.click(screen.getByRole("button", { name: "Refresh Custom View" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "List presentation" }).getAttribute("aria-pressed"),
  ).toBe("true");
});

test("No items omits More and Actions; the selected view has no extra controls", () => {
  render(
    <>
      <ViewTabStrip viewName="All Leads" />
      <ListToolbar {...base} />
    </>,
  );
  expect(screen.getByText("All Leads")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Actions" })).toBeNull();
  expect(screen.queryByRole("tab")).toBeNull();
});

test("Actions opens, invokes the enabled menu item and closes with the keyboard", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(
    <ListToolbar
      {...base}
      actions={[
        { id: "disabled", label: "Unavailable", isDisabled: true, onAction: vi.fn() },
        { id: "example", label: "Example action", onAction: action },
      ]}
    />,
  );
  const trigger = screen.getByRole("button", { name: "Actions" });
  trigger.focus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menuitem", { name: "Unavailable" }).getAttribute("aria-disabled")).toBe(
    "true",
  );
  await user.keyboard("{Enter}");
  expect(action).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menu")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("every toolbar icon svg has fill='none' and a stroke", () => {
  const { container } = render(<ListToolbar {...base} />);
  const svgs = container.querySelectorAll("svg");
  expect(svgs.length).toBeGreaterThanOrEqual(9);
  for (const svg of svgs) {
    expect(svg.getAttribute("fill")).toBe("none");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
  }
});

test("refresh button is not drawn without onRefresh", () => {
  render(<ListToolbar {...base} onRefresh={undefined} />);
  expect(screen.queryByRole("button", { name: "Refresh Custom View" })).toBeNull();
});

test("Actions menu honours actionsMenuWidth and draws a separator before flagged items", async () => {
  const user = userEvent.setup();
  render(
    <ListToolbar
      {...base}
      actionsMenuWidth={143}
      actions={[
        { id: "a", label: "First", onAction: vi.fn() },
        { id: "b", label: "Print View", separatorBefore: true, onAction: vi.fn() },
      ]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Actions" }));
  expect((screen.getByRole("menu").closest("[style*=width]") as HTMLElement).style.width).toBe(
    "143px",
  );
  expect(screen.getByRole("menuitem", { name: "First" }).className).not.toContain("border-t");
  expect(screen.getByRole("menuitem", { name: "Print View" }).className).toContain("border-t");
});
