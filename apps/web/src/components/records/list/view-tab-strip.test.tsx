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
