import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
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

test("Tab with laterModule renders active appearance, retains focus, and ignores clicks, Enter and Space without changing selection", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="overview" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="overview">Overview</Tab>
        <Tab id="details" laterModule="M3">
          Details
        </Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="details">Details panel</TabPanel>
    </Tabs>,
  );

  const overviewTab = screen.getByRole("tab", { name: "Overview" });
  const detailsTab = screen.getByRole("tab", { name: "Details" });

  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(detailsTab.getAttribute("aria-disabled")).toBe("true");
  expect(detailsTab.getAttribute("data-later-module")).toBe("M3");
  expect(detailsTab.hasAttribute("title")).toBe(false);
  expect(detailsTab.hasAttribute("data-disabled")).toBe(false);
  expect(detailsTab.classList.contains("opacity-50")).toBe(false);
  expect(detailsTab.classList.contains("cursor-not-allowed")).toBe(false);

  // 1. Mouse click on laterModule tab does not change selection
  await user.click(detailsTab);
  expect(selectionChange).not.toHaveBeenCalled();
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Details" })).toBeNull();

  // 2. Focus and keyboard (Enter, Space) do not change selection
  detailsTab.focus();
  expect(document.activeElement).toBe(detailsTab);

  await user.keyboard("{Enter}");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");

  await user.keyboard(" ");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
});
