import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecordPageFrame, type RecordPageFrameProps } from "./record-page-frame";

afterEach(cleanup);

const entries = [
  { id: "summary", label: "Summary", targetId: "summary-section" },
  { id: "history", label: "History", targetId: "history-section", tabId: "history", countBadge: 2 },
];

function setup(extra: Partial<RecordPageFrameProps> = {}) {
  const onTabChange = vi.fn();
  const onRelatedSelectionChange = vi.fn();
  function Harness() {
    const [tab, setTab] = useState("overview");
    return (
      <RecordPageFrame
        header={<h1>Sample record</h1>}
        relatedListLabel="Related lists"
        relatedEntries={entries}
        tabsLabel="Record sections"
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: <section id="summary-section">Summary content</section>,
          },
          {
            id: "history",
            label: "History",
            content: <section id="history-section">History content</section>,
          },
        ]}
        selectedTabId={tab}
        onTabChange={(id) => {
          onTabChange(id);
          setTab(id);
        }}
        onRelatedSelectionChange={onRelatedSelectionChange}
        scrollTopLabel="Back to top"
        {...extra}
      />
    );
  }
  const result = render(<Harness />);
  const scroller = result.container.querySelector<HTMLElement>("[data-record-scroller]");
  if (!scroller) throw new Error("Record scroller missing");
  return { ...result, scroller, user: userEvent.setup(), onTabChange, onRelatedSelectionChange };
}

test("composes the header, named rail, selected panel and optional slots", () => {
  setup({
    railControl: <button type="button">Toggle rail</button>,
    tabRowEnd: <span>Tab actions</span>,
    relatedRailHeaderAction: <button type="button">Manage lists</button>,
    relatedRailFooter: <span>Rail footer</span>,
    sidePanel: <aside aria-label="Record context">Context content</aside>,
  });
  expect(screen.getByRole("heading", { level: 1, name: "Sample record" })).toBeTruthy();
  const rail = screen.getByRole("navigation", { name: "Related lists" });
  expect(within(rail).getByRole("button", { name: "Manage lists" })).toBeTruthy();
  expect(within(rail).getByText("Rail footer")).toBeTruthy();
  expect(within(rail).getByText("2")).toBeTruthy();
  expect(screen.getByRole("tablist", { name: "Record sections" })).toBeTruthy();
  expect(
    within(screen.getByRole("tabpanel", { name: "Overview" })).getByText("Summary content"),
  ).toBeTruthy();
  expect(screen.queryByText("History content")).toBeNull();
  expect(screen.getByRole("button", { name: "Toggle rail" })).toBeTruthy();
  expect(screen.getByText("Tab actions")).toBeTruthy();
  expect(screen.getByRole("complementary", { name: "Record context" })).toBeTruthy();
});

test("hiding the related rail preserves the header and content", () => {
  setup({ relatedRailVisible: false });
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
});

test("rail selection switches tabs before selecting the newly mounted target", async () => {
  const { user, onTabChange, onRelatedSelectionChange } = setup();
  await user.click(screen.getByRole("link", { name: "History" }));
  expect(onTabChange).toHaveBeenCalledExactlyOnceWith("history");
  expect(onRelatedSelectionChange).toHaveBeenCalledExactlyOnceWith("history");
  expect(screen.getByRole("tab", { name: "History" }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("link", { name: "History" }).getAttribute("aria-current")).toBe("page");
  expect(
    within(screen.getByRole("tabpanel", { name: "History" })).getByText("History content"),
  ).toBeTruthy();
  expect(screen.queryByText("Summary content")).toBeNull();
});

test("keyboard users can enter the rail and activate a link with Enter", async () => {
  const { user, onRelatedSelectionChange } = setup();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("link", { name: "Summary" }));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("link", { name: "History" }));
  await user.keyboard("{Enter}");
  expect(onRelatedSelectionChange).toHaveBeenCalledWith("history");
  expect(screen.getByRole("tabpanel", { name: "History" })).toBeTruthy();
});

test("arrow keys switch the controlled tabs, focus and visible panel", async () => {
  const { user, onTabChange } = setup({ relatedRailVisible: false });
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Overview" }));
  await user.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "History" }));
  expect(screen.getByRole("tabpanel", { name: "History" })).toBeTruthy();
  expect(onTabChange).toHaveBeenLastCalledWith("history");
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Overview" }));
});

test("same-tab rail selection scrolls to its target without changing tabs", async () => {
  const { user, scroller, onTabChange, onRelatedSelectionChange } = setup();
  Object.defineProperty(screen.getByText("Summary content"), "offsetTop", { value: 180 });
  await user.click(screen.getByRole("link", { name: "Summary" }));
  expect(scroller.scrollTop).toBe(180);
  expect(onTabChange).not.toHaveBeenCalled();
  expect(onRelatedSelectionChange).toHaveBeenCalledExactlyOnceWith("summary");
});

test("missing targets and unknown tab ids do not select a rail item", async () => {
  const { user, onTabChange, onRelatedSelectionChange } = setup({
    relatedEntries: [
      ...entries,
      { id: "missing", label: "Missing target", targetId: "absent" },
      { id: "unknown", label: "Unknown tab", targetId: "absent", tabId: "unknown" },
    ],
  });
  await user.click(screen.getByRole("link", { name: "Missing target" }));
  await user.click(screen.getByRole("link", { name: "Unknown tab" }));
  expect(onTabChange).not.toHaveBeenCalled();
  expect(onRelatedSelectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Summary" }).getAttribute("aria-current")).toBe("page");
});

test("controlled selection remains with the parent while rail clicks report changes", async () => {
  const { user, onRelatedSelectionChange } = setup({ selectedRelatedId: "summary" });
  await user.click(screen.getByRole("link", { name: "History" }));
  expect(onRelatedSelectionChange).toHaveBeenCalledWith("history");
  expect(screen.getByRole("link", { name: "Summary" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "History" }).hasAttribute("aria-current")).toBe(false);
});

test("rail actions appear only for the selected entry and invoke their callback", async () => {
  const onAction = vi.fn();
  const { user } = setup({
    relatedEntries: entries.map((entry) => ({
      ...entry,
      railAction: { id: "add", label: `Add ${entry.label}`, onAction },
    })),
  });
  expect(screen.queryByRole("button", { name: "Add History" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Add Summary" }));
  expect(onAction).toHaveBeenCalledOnce();
  await user.click(screen.getByRole("link", { name: "History" }));
  expect(screen.queryByRole("button", { name: "Add Summary" })).toBeNull();
  expect(screen.getByRole("button", { name: "Add History" })).toBeTruthy();
});

test("scroll-to-top resets the scroller and related selection", async () => {
  const { user, scroller, onRelatedSelectionChange } = setup();
  expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
  scroller.scrollTop = 200;
  fireEvent.scroll(scroller);
  const scrollTo = vi.fn();
  Object.defineProperty(scroller, "scrollTo", { value: scrollTo });
  await user.click(screen.getByRole("button", { name: "Back to top" }));
  expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
  expect(onRelatedSelectionChange).toHaveBeenLastCalledWith("summary");
  expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
});
