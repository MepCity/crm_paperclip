import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AnalyticsScreen } from "./analytics-screen";
import { DashboardCreate } from "./dashboard-create";
import { createFixtureAnalyticsPort, createFixtureDashboardCreationPort } from "./fixture-port";

afterEach(cleanup);

it("creates a private empty dashboard through the fixture port and displays the empty state", async () => {
  const user = userEvent.setup();
  const creationPort = createFixtureDashboardCreationPort();
  const save = vi.spyOn(creationPort, "createEmptyDashboard");
  render(
    <AnalyticsScreen
      orgSlug="demo"
      port={createFixtureAnalyticsPort()}
      creationPort={creationPort}
    />,
  );
  await screen.findByRole("region", { name: "LEADS THIS MONTH" });
  await user.click(screen.getByRole("button", { name: "Create Dashboard" }));
  const name = screen.getByRole("textbox", { name: "Dashboard name" });
  expect((name as HTMLInputElement).value).toBe("Untitled Dashboard");
  expect(screen.getByText("Only me")).toBeDefined();
  await user.clear(name);
  await user.type(name, "Team overview");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("heading", { name: "No Components Found" });
  expect(save).toHaveBeenCalledWith({
    name: "Team overview",
    description: "",
    access: "private",
    components: [],
  });
  expect(screen.getByRole("combobox", { name: "Overview selector" }).textContent).toBe(
    "Team overview",
  );
  await user.click(screen.getByRole("button", { name: "Add Component" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("heading", { name: "No Components Found" })).toBeDefined();
  expect(save).toHaveBeenCalledOnce();
});

it("opens quick chart, enables upstream fields after module selection, opens the criteria card and cancels both unsaved editors", async () => {
  const user = userEvent.setup();
  const cancel = vi.fn();
  const save = vi.fn();
  render(<DashboardCreate onCancel={cancel} onSave={save} />);
  await user.click(screen.getByRole("button", { name: "Favorite dashboard" }));
  await user.click(screen.getByRole("button", { name: "Edit dashboard access" }));
  expect(screen.getByText("Only me")).toBeDefined();
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Chart" }));
  await user.click(screen.getByRole("button", { name: "Quick chart" }));
  const chart = screen.getByRole("dialog", { name: "Add Chart" });
  expect(within(chart).getByText("Select a module to display a visual preview.")).toBeDefined();
  expect(
    (within(chart).getByRole("button", { name: "+ Criteria filter" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await user.click(within(chart).getByRole("button", { name: /Modules/ }));
  await user.click(screen.getByRole("option", { name: "Leads" }));
  expect(within(chart).getByRole("button", { name: /Measure/ }).textContent).toContain(
    "Count of Leads",
  );
  const measureRow = within(chart).getByRole("button", { name: /Measure/ }).parentElement
    ?.parentElement;
  const groupingRow = within(chart).getByRole("button", { name: /Grouping/ }).parentElement
    ?.parentElement;
  expect(measureRow?.querySelectorAll("span.rounded-full")).toHaveLength(2);
  expect(groupingRow?.querySelectorAll("span.rounded-full")).toHaveLength(1);
  for (const row of [measureRow, groupingRow]) {
    for (const ring of row?.querySelectorAll("span.rounded-full") ?? []) {
      expect(ring.childNodes.length).toBe(0);
      expect(ring.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  }
  expect(within(chart).getByRole("region", { name: "Chart preview" }).textContent).toContain(
    "Record count",
  );
  await user.click(within(chart).getByRole("button", { name: "+ Criteria filter" }));
  expect(within(chart).getByRole("region", { name: "Criteria filter" })).toBeDefined();
  expect(
    (within(chart).getByRole("textbox", { name: "Criterion value" }) as HTMLInputElement).disabled,
  ).toBe(true);
  await user.click(within(chart).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(cancel).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});

it("retains an unsaved dashboard when fixture saving fails and allows retry", async () => {
  const user = userEvent.setup();
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockResolvedValueOnce(undefined);
  render(<DashboardCreate onCancel={vi.fn()} onSave={save} />);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect((await screen.findByRole("alert")).textContent).toContain("could not be saved");
  expect((screen.getByRole("textbox", { name: "Dashboard name" }) as HTMLInputElement).value).toBe(
    "Untitled Dashboard",
  );
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(save).toHaveBeenCalledTimes(2);
});
