import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { TimelineSurface } from "./timeline-surface";
import type { TimelineSubtab } from "./types";

afterEach(cleanup);

const sampleSubtabs: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
  { id: "interactions", label: "Interactions" },
  { id: "upcoming", label: "Upcoming & Overdue" },
];

test("renders a region named Timeline containing a tablist named Timeline sections", () => {
  render(
    <TimelineSurface subtabs={sampleSubtabs} activeSubtabId="history">
      <div>Content</div>
    </TimelineSurface>,
  );

  const region = screen.getByRole("region", { name: "Timeline" });
  expect(region).toBeTruthy();
  const tablist = within(region).getByRole("tablist", { name: "Timeline sections" });
  expect(tablist).toBeTruthy();
});

test("renders one tab per subtab entry with accessible selection state and tabIndex", () => {
  render(
    <TimelineSurface subtabs={sampleSubtabs} activeSubtabId="history">
      <div>Content</div>
    </TimelineSurface>,
  );

  const tabs = screen.getAllByRole("tab");
  expect(tabs).toHaveLength(3);

  const historyTab = screen.getByRole("tab", { name: "History" });
  const interactionsTab = screen.getByRole("tab", { name: "Interactions" });
  const upcomingTab = screen.getByRole("tab", { name: "Upcoming & Overdue" });

  expect(historyTab.getAttribute("aria-selected")).toBe("true");
  expect(historyTab.tabIndex).toBe(0);
  expect(historyTab.getAttribute("data-active")).toBe("true");

  expect(interactionsTab.getAttribute("aria-selected")).toBe("false");
  expect(interactionsTab.tabIndex).toBe(-1);
  expect(interactionsTab.getAttribute("data-active")).toBe("false");

  expect(upcomingTab.getAttribute("aria-selected")).toBe("false");
  expect(upcomingTab.tabIndex).toBe(-1);
  expect(upcomingTab.getAttribute("data-active")).toBe("false");
});

test("clicking a tab calls onSubtabChange once with that tab's id", async () => {
  const user = userEvent.setup();
  const onSubtabChange = vi.fn();

  render(
    <TimelineSurface
      subtabs={sampleSubtabs}
      activeSubtabId="history"
      onSubtabChange={onSubtabChange}
    >
      <div>Content</div>
    </TimelineSurface>,
  );

  await user.click(screen.getByRole("tab", { name: "Interactions" }));

  expect(onSubtabChange).toHaveBeenCalledTimes(1);
  expect(onSubtabChange).toHaveBeenCalledWith("interactions");
});

test("clicking a tab without onSubtabChange does not throw", async () => {
  const user = userEvent.setup();

  render(
    <TimelineSurface subtabs={sampleSubtabs} activeSubtabId="history">
      <div>Content</div>
    </TimelineSurface>,
  );

  await expect(
    user.click(screen.getByRole("tab", { name: "Interactions" })),
  ).resolves.not.toThrow();
});

test("renders children inside the tabpanel", () => {
  render(
    <TimelineSurface subtabs={sampleSubtabs} activeSubtabId="history">
      <div data-testid="timeline-children">Panel body content</div>
    </TimelineSurface>,
  );

  const panel = screen.getByRole("tabpanel");
  expect(panel).toBeTruthy();
  expect(within(panel).getByTestId("timeline-children")).toBeTruthy();
  expect(panel.textContent).toContain("Panel body content");
});
