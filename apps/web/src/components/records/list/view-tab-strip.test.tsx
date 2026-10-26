import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ViewTabStrip } from "./view-tab-strip";

afterEach(cleanup);

test("selects service views and keeps later customization items inert", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <ViewTabStrip
      viewName="All Contacts"
      views={[
        { id: "all", name: "All Contacts" },
        { id: "mine", name: "My Contacts" },
      ]}
      onViewChange={change}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Custom views" }));
  const later = screen.getByRole("menuitem", { name: "New Custom View" });
  expect(later.getAttribute("data-later-module")).toBe("M11");
  fireEvent.click(later);
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByRole("menu", { name: "Custom views" })).toBeTruthy();
  await user.click(screen.getByRole("menuitem", { name: "My Contacts" }));
  expect(change).toHaveBeenCalledWith("mine");
});

test("preserves the original strip when a module has no view inventory", () => {
  render(<ViewTabStrip viewName="All Leads" />);
  expect(screen.queryByRole("button", { name: "Custom views" })).toBeNull();
});

test("renders multiple pinned tabs and allows switching between them", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  render(
    <ViewTabStrip
      viewName="All Accounts"
      pinnedViews={["All Accounts", "All Locked Accounts"]}
      views={[
        { id: "all", name: "All Accounts" },
        { id: "locked", name: "All Locked Accounts" },
        { id: "mine", name: "My Accounts" },
      ]}
      onViewChange={change}
    />,
  );
  expect(screen.getByText("All Accounts").hasAttribute("data-view-pill")).toBe(true);
  const lockedBtn = screen.getByRole("button", { name: "All Locked Accounts" });
  expect(lockedBtn).toBeTruthy();
  await user.click(lockedBtn);
  expect(change).toHaveBeenCalledWith("locked");
});

test("searchable draws the search box only when enabled and filters case-insensitively", async () => {
  const user = userEvent.setup();
  const views = [
    { id: "a", name: "Open Tasks" },
    { id: "b", name: "Overdue Tasks" },
  ];
  const { unmount } = render(<ViewTabStrip viewName="Open Tasks" views={views} />);
  await user.click(screen.getByRole("button", { name: "Custom views" }));
  expect(screen.queryByRole("textbox", { name: "Search views" })).toBeNull();
  unmount();
  cleanup();
  render(<ViewTabStrip viewName="Open Tasks" views={views} searchable />);
  await user.click(screen.getByRole("button", { name: "Custom views" }));
  const box = screen.getByRole("textbox", { name: "Search views" });
  await user.type(box, "OVER");
  expect(screen.queryByRole("menuitem", { name: "Open Tasks" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Overdue Tasks" })).toBeTruthy();
  await user.clear(box);
  expect(screen.getAllByRole("menuitem", { name: /Tasks$/ })).toHaveLength(2);
});

test("calls onNewView when New Custom View is clicked and handler is provided", async () => {
  const user = userEvent.setup();
  const onNewView = vi.fn();
  render(
    <ViewTabStrip
      viewName="All Contacts"
      views={[{ id: "all", name: "All Contacts" }]}
      onNewView={onNewView}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Custom views" }));
  const newItem = screen.getByRole("menuitem", { name: "New Custom View" });
  expect(newItem.getAttribute("data-later-module")).toBeNull();
  await user.click(newItem);
  expect(onNewView).toHaveBeenCalledTimes(1);
});

test("renders Edit Current View and calls onEditView with active view id", async () => {
  const user = userEvent.setup();
  const onEditView = vi.fn();
  render(
    <ViewTabStrip
      viewName="My Contacts"
      views={[
        { id: "all", name: "All Contacts" },
        { id: "mine", name: "My Contacts" },
      ]}
      onEditView={onEditView}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Custom views" }));
  const editItem = screen.getByRole("menuitem", { name: "Edit Current View" });
  await user.click(editItem);
  expect(onEditView).toHaveBeenCalledWith("mine");
});
