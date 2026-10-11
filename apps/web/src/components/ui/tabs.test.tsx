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

test("Tabs arrow keys, Home and End focus laterModule tab without selecting it, while normal tabs still select", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="overview" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="overview">Overview</Tab>
        <Tab id="details" laterModule="M3">
          Details
        </Tab>
        <Tab id="activity">Activity</Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="details">Details panel</TabPanel>
      <TabPanel id="activity">Activity panel</TabPanel>
    </Tabs>,
  );

  const overviewTab = screen.getByRole("tab", { name: "Overview" });
  const detailsTab = screen.getByRole("tab", { name: "Details" });
  const activityTab = screen.getByRole("tab", { name: "Activity" });

  // 1. Initial focus on first tab
  await user.tab();
  expect(document.activeElement).toBe(overviewTab);
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");

  // 2. ArrowRight moves focus to laterModule tab without selecting it
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(detailsTab);
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Details" })).toBeNull();

  // 3. ArrowRight from laterModule tab moves focus to normal tab and selects it
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(activityTab);
  expect(activityTab.getAttribute("aria-selected")).toBe("true");
  expect(overviewTab.getAttribute("aria-selected")).toBe("false");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).toHaveBeenCalledWith("activity");
  expect(screen.getByRole("tabpanel", { name: "Activity" })).toBeTruthy();

  // 4. ArrowLeft from normal tab moves focus back to laterModule tab without selecting it
  selectionChange.mockClear();
  await user.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(detailsTab);
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(activityTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Activity" })).toBeTruthy();

  // 5. Home key moves focus to Overview and selects it
  await user.keyboard("{Home}");
  expect(document.activeElement).toBe(overviewTab);
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).toHaveBeenCalledWith("overview");
});

test("Tabs End and Home keys focus laterModule tabs at start/end without selecting them", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="middle" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="first" laterModule="M3">
          First (Later)
        </Tab>
        <Tab id="middle">Middle</Tab>
        <Tab id="last" laterModule="M4">
          Last (Later)
        </Tab>
      </TabList>
      <TabPanel id="first">First panel</TabPanel>
      <TabPanel id="middle">Middle panel</TabPanel>
      <TabPanel id="last">Last panel</TabPanel>
    </Tabs>,
  );

  const firstTab = screen.getByRole("tab", { name: "First (Later)" });
  const middleTab = screen.getByRole("tab", { name: "Middle" });
  const lastTab = screen.getByRole("tab", { name: "Last (Later)" });

  // Focus middle tab initially
  middleTab.focus();
  expect(document.activeElement).toBe(middleTab);
  expect(middleTab.getAttribute("aria-selected")).toBe("true");

  // End key focuses last tab (laterModule) without selecting it
  await user.keyboard("{End}");
  expect(document.activeElement).toBe(lastTab);
  expect(lastTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Last (Later)" })).toBeNull();

  // Repeated End key while already focused on laterModule tab does not select it
  await user.keyboard("{End}");
  expect(document.activeElement).toBe(lastTab);
  expect(lastTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Last (Later)" })).toBeNull();

  // Home key focuses first tab (laterModule) without selecting it
  await user.keyboard("{Home}");
  expect(document.activeElement).toBe(firstTab);
  expect(firstTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "First (Later)" })).toBeNull();

  // Repeated Home key while already focused on laterModule tab does not select it
  await user.keyboard("{Home}");
  expect(document.activeElement).toBe(firstTab);
  expect(firstTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "First (Later)" })).toBeNull();
});

test("Tabs arrow keys skip isDisabled tab and focus laterModule tab without selecting it", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="middle" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="middle">Middle</Tab>
        <Tab id="skip" isDisabled>
          Skip
        </Tab>
        <Tab id="last" laterModule="M4">
          Last (Later)
        </Tab>
      </TabList>
      <TabPanel id="middle">Middle panel</TabPanel>
      <TabPanel id="skip">Skip panel</TabPanel>
      <TabPanel id="last">Last panel</TabPanel>
    </Tabs>,
  );

  const middleTab = screen.getByRole("tab", { name: "Middle" });
  const lastTab = screen.getByRole("tab", { name: "Last (Later)" });

  middleTab.focus();
  expect(document.activeElement).toBe(middleTab);
  expect(middleTab.getAttribute("aria-selected")).toBe("true");

  // ArrowRight skips disabled tab and focuses Last (laterModule) without selecting it
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(lastTab);
  expect(lastTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Last (Later)" })).toBeNull();

  // End while already focused on Last (laterModule) does not select it
  await user.keyboard("{End}");
  expect(document.activeElement).toBe(lastTab);
  expect(lastTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).not.toHaveBeenCalled();

  // ArrowLeft from Last skips Skip (isDisabled) and selects Middle (normal tab)
  await user.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(middleTab);
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).toHaveBeenCalledWith("middle");
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
});

test("Tabs ArrowLeft skips isDisabled tab and focuses preceding laterModule tab without selecting it", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="middle" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="first" laterModule="M3">
          First (Later)
        </Tab>
        <Tab id="skip" isDisabled>
          Skip
        </Tab>
        <Tab id="middle">Middle</Tab>
      </TabList>
      <TabPanel id="first">First panel</TabPanel>
      <TabPanel id="skip">Skip panel</TabPanel>
      <TabPanel id="middle">Middle panel</TabPanel>
    </Tabs>,
  );

  const firstTab = screen.getByRole("tab", { name: "First (Later)" });
  const middleTab = screen.getByRole("tab", { name: "Middle" });

  middleTab.focus();
  expect(document.activeElement).toBe(middleTab);
  expect(middleTab.getAttribute("aria-selected")).toBe("true");

  // ArrowLeft skips Skip (isDisabled) and focuses First (laterModule) without selecting it
  await user.keyboard("{ArrowLeft}");
  expect(document.activeElement).toBe(firstTab);
  expect(firstTab.getAttribute("aria-selected")).toBe("false");
  expect(middleTab.getAttribute("aria-selected")).toBe("true");
  expect(selectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("tabpanel", { name: "Middle" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "First (Later)" })).toBeNull();

  // Home while already on First (laterModule) does not select it
  await user.keyboard("{Home}");
  expect(document.activeElement).toBe(firstTab);
  expect(firstTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).not.toHaveBeenCalled();
});

test("Tabs ArrowDown and ArrowUp do not move focus or change selection in horizontal tablist with laterModule tabs", async () => {
  const user = userEvent.setup();
  const selectionChange = vi.fn();
  render(
    <Tabs defaultSelectedKey="overview" onSelectionChange={selectionChange}>
      <TabList aria-label="Record">
        <Tab id="overview">Overview</Tab>
        <Tab id="details" laterModule="M3">
          Details
        </Tab>
        <Tab id="activity">Activity</Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="details">Details panel</TabPanel>
      <TabPanel id="activity">Activity panel</TabPanel>
    </Tabs>,
  );

  const overviewTab = screen.getByRole("tab", { name: "Overview" });
  const detailsTab = screen.getByRole("tab", { name: "Details" });

  await user.tab();
  expect(document.activeElement).toBe(overviewTab);
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");

  // ArrowDown does not move focus to laterModule tab and does not trigger selection
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(overviewTab);
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).not.toHaveBeenCalled();

  // ArrowUp does not move focus or trigger selection
  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(overviewTab);
  expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).not.toHaveBeenCalled();

  // Panel remains overview
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
  expect(screen.queryByRole("tabpanel", { name: "Details" })).toBeNull();

  // Moving focus to laterModule tab via ArrowRight
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(detailsTab);
  expect(detailsTab.getAttribute("aria-selected")).toBe("false");
  expect(selectionChange).not.toHaveBeenCalled();

  // From laterModule tab, ArrowDown and ArrowUp do not move focus or change selection
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(detailsTab);
  expect(selectionChange).not.toHaveBeenCalled();

  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(detailsTab);
  expect(selectionChange).not.toHaveBeenCalled();
});
