import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Tab, TabList, TabPanel, Tabs } from "./tabs";

function renderTabs(selectedKey?: string) {
  render(
    <Tabs selectedKey={selectedKey}>
      <TabList aria-label="Record">
        <Tab id="overview">Overview</Tab>
        <Tab id="details">Details</Tab>
        <Tab id="activity">Activity</Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="details">Details panel</TabPanel>
      <TabPanel id="activity">Activity panel</TabPanel>
    </Tabs>,
  );
}

afterEach(cleanup);

test("Tabs expose tablist, tab and tabpanel roles and follow the arrow keys", async () => {
  const user = userEvent.setup();
  renderTabs();

  expect(screen.getByRole("tablist", { name: "Record" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Overview", selected: true })).toBeTruthy();
  expect(screen.getByRole("tabpanel", { name: "Overview" }).textContent).toContain(
    "Overview panel",
  );
  expect(screen.queryByRole("tabpanel", { name: "Details" })).toBeNull();

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Overview" }));

  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Details", selected: true })).toBeTruthy();
  expect(screen.getByRole("tabpanel", { name: "Details" }).textContent).toContain("Details panel");
  expect(screen.queryByRole("tabpanel", { name: "Overview" })).toBeNull();
});

test("Tabs show the panel selected by the selectedKey prop", () => {
  renderTabs("details");

  expect(screen.getByRole("tab", { name: "Details", selected: true })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Overview", selected: false })).toBeTruthy();
  expect(screen.getByRole("tabpanel", { name: "Details" }).textContent).toContain("Details panel");
  expect(screen.queryByRole("tabpanel", { name: "Overview" })).toBeNull();
});
