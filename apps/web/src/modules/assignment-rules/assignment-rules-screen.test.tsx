import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { SettingsNavigation } from "@/components/shell/settings-navigation";
import { render } from "@/test/render";
import { AssignmentRulesScreen } from "./assignment-rules-screen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/crm/synthetic/settings/assignment-rules",
}));
afterEach(cleanup);

it("shows A0, A1–A6 and selected S12; deferred controls remain focusable and inert", async () => {
  const user = userEvent.setup();
  render(
    <>
      <SettingsNavigation orgSlug="synthetic" />
      <AssignmentRulesScreen result={{ ok: true, value: { items: [], nextCursor: null } }} />
    </>,
  );
  const nav = screen.getByRole("navigation", { name: "Settings navigation" });
  expect(within(nav).getByText("Automation")).toBeTruthy();
  const selected = within(nav).getByRole("link", { name: "Assignment Rules" });
  expect(selected.getAttribute("aria-current")).toBe("page");
  expect(selected.getAttribute("href")).toBe("/crm/synthetic/settings/assignment-rules");
  expect(screen.getByRole("tab", { name: "Rules" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByTestId("assignment-introduction").textContent).toContain(
    "automatically assign records",
  );
  for (const control of [
    screen.getByRole("tab", { name: "Thresholds" }),
    screen.getByRole("tab", { name: "Assistant" }),
    screen.getByRole("button", { name: "Assignment Rules help" }),
    screen.getByRole("button", { name: "Contextual help" }),
  ]) {
    control.focus();
    expect(document.activeElement).toBe(control);
    await user.click(control);
    await user.keyboard("{Enter} ");
    expect(screen.getByRole("tab", { name: "Rules" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("assignment-introduction")).toBeTruthy();
  }
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("grid")).toBeNull();
});

it.each(["forbidden", "unavailable"] as const)(
  "does not present %s as an empty snapshot",
  (code) => {
    render(<AssignmentRulesScreen result={{ ok: false, error: { code } }} />);
    expect(screen.getByRole("alert").textContent).toContain("could not be loaded");
    expect(screen.queryByTestId("assignment-introduction")).toBeNull();
  },
);

it("offers a read-only retry link on unavailable but not on forbidden", () => {
  const { unmount } = render(
    <AssignmentRulesScreen result={{ ok: false, error: { code: "unavailable" } }} orgSlug="o" />,
  );
  expect(screen.getByRole("link", { name: "Try again" }).getAttribute("href")).toBe(
    "/crm/o/settings/assignment-rules",
  );
  unmount();
  render(<AssignmentRulesScreen result={{ ok: false, error: { code: "forbidden" } }} />);
  expect(screen.queryByRole("link", { name: "Try again" })).toBeNull();
});

it("opens the unsaved assignment entry and cancels without a write", async () => {
  const user = userEvent.setup();
  render(<AssignmentRulesScreen result={{ ok: true, value: { items: [], nextCursor: null } }} />);
  await user.click(screen.getByRole("button", { name: "Create Assignment Rule" }));
  expect(screen.getByRole("dialog", { name: "Create Assignment Rule" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Next" })).toHaveProperty("disabled", true);
  for (const control of [
    screen.getByRole("combobox", { name: "Module" }),
    screen.getByRole("textbox", { name: "Rule Name" }),
  ]) {
    expect(control).toHaveProperty("required", true);
    expect(control.classList.contains("border-l-danger")).toBe(true);
  }
  await user.type(screen.getByRole("textbox", { name: "Rule Name" }), "Routing draft");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
