import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { LastUpdateLabel } from "./last-update-label";
import { RecordHeader, type RecordHeaderProps } from "./record-header";
import { RecordPageFrame } from "./record-page-frame";
import { RecordRailToggle } from "./record-rail-toggle";

const base: RecordHeaderProps = {
  title: "Example Record",
  subtitle: "Example Company",
  back: { label: "Back", href: "/dev/ui" },
  moreLabel: "More Options",
  previousLabel: "Previous Record",
  nextLabel: "Next Record",
};
afterEach(cleanup);

test("header names, absent menu and boundary arrows", () => {
  render(<RecordHeader {...base} menuGroups={[{ id: "empty", items: [] }]} />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Example Record - Example Company" }),
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/dev/ui");
  expect(screen.queryByRole("button", { name: "More Options" })).toBeNull();
  for (const name of ["Previous Record", "Next Record"])
    expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
});

test.each(["previous", "next", "both"])("navigation addresses for %s", (state) => {
  render(
    <RecordHeader
      {...base}
      previousHref={state !== "next" ? "/dev/ui?record=previous" : undefined}
      nextHref={state !== "previous" ? "/dev/ui?record=next" : undefined}
    />,
  );
  for (const [name, direction, enabled] of [
    ["Previous Record", "previous", state !== "next"],
    ["Next Record", "next", state !== "previous"],
  ] as const) {
    if (enabled)
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
        `/dev/ui?record=${direction}`,
      );
    else expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
  }
});

test("back callback and primary/secondary commands run independently", async () => {
  const user = userEvent.setup();
  const back = vi.fn();
  const primary = vi.fn();
  render(
    <RecordHeader
      {...base}
      subtitle={undefined}
      back={{ label: "Back", onPress: back }}
      commands={[
        { id: "primary", label: "Example action", variant: "primary", onPress: primary },
        { id: "edit", label: "Edit", href: "/dev/ui?edit=true" },
      ]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Example action" }));
  expect(back).toHaveBeenCalledOnce();
  expect(primary).toHaveBeenCalledOnce();
  expect(screen.getByRole("link", { name: "Edit" }).getAttribute("href")).toBe("/dev/ui?edit=true");
  expect(screen.getByRole("heading", { name: "Example Record" })).toBeTruthy();
});

test("grouped menu opens by keyboard, skips disabled entries, dispatches and restores focus", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(
    <RecordHeader
      {...base}
      menuGroups={[
        {
          id: "first",
          items: [
            { id: "one", label: "First action", onAction: action },
            { id: "disabled", label: "Disabled action", isDisabled: true, onAction: action },
          ],
        },
        { id: "empty", items: [] },
        { id: "second", items: [{ id: "two", label: "Second action", onAction: action }] },
      ]}
    />,
  );
  const trigger = screen.getByRole("button", { name: "More Options" });
  trigger.focus();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("menu", { name: "More Options" })).toBeTruthy();
  expect(screen.getAllByRole("separator")).toHaveLength(1);
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "First action" }));
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Second action" }));
  await user.keyboard("{Escape}");
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(screen.queryByRole("menu")).toBeNull();
  await user.keyboard("{Enter}{ArrowDown}{Enter}");
  expect(action).toHaveBeenCalledOnce();
});

function Frame({
  entries = true,
  railVisible = true,
  tabRowEnd,
}: {
  entries?: boolean;
  railVisible?: boolean;
  tabRowEnd?: import("react").ReactNode;
}) {
  const [selected, setSelected] = useState("one");
  const [tab, setTab] = useState("overview");
  const [rail, setRail] = useState(railVisible);
  return (
    <RecordPageFrame
      header={<RecordHeader {...base} />}
      relatedListLabel="Related List"
      relatedEntries={
        entries
          ? [
              { id: "one", label: "Section One", targetId: "target-one" },
              { id: "two", label: "Section Two", targetId: "target-two" },
            ]
          : []
      }
      selectedRelatedId={selected}
      onRelatedSelectionChange={setSelected}
      tabsLabel="Record views"
      selectedTabId={tab}
      onTabChange={setTab}
      relatedRailVisible={rail}
      railControl={<RecordRailToggle railVisible={rail} onRailVisibleChange={setRail} />}
      tabRowEnd={tabRowEnd}
      scrollTopLabel="Scroll To Top"
      tabs={[
        {
          id: "overview",
          label: "Overview",
          content: (
            <>
              <article id="target-one">First section</article>
              <article id="target-two">Second section</article>
            </>
          ),
        },
        { id: "timeline", label: "Timeline", content: "Alternate content" },
      ]}
    />
  );
}

test("rail selection, tab arrows and panel semantics", async () => {
  const user = userEvent.setup();
  render(<Frame />);
  const one = screen.getByRole("link", { name: "Section One" });
  const two = screen.getByRole("link", { name: "Section Two" });
  expect(one.getAttribute("aria-current")).toBe("page");
  await user.click(two);
  expect(two.getAttribute("aria-current")).toBe("page");
  expect(one.hasAttribute("aria-current")).toBe(false);
  expect(screen.getByRole("tablist", { name: "Record views" })).toBeTruthy();
  screen.getByRole("tab", { name: "Overview" }).focus();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Timeline", selected: true })).toBeTruthy();
  expect(screen.getByRole("tabpanel", { name: "Timeline" }).textContent).toBe("Alternate content");
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeTruthy();
});

test("rail toggle exposes aria-pressed and hides the related-list rail", async () => {
  const user = userEvent.setup();
  render(<Frame />);
  const toggle = screen.getByRole("button", { name: "Hide Related List" });
  expect(toggle.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("navigation", { name: "Related List" })).toBeTruthy();
  await user.click(toggle);
  expect(
    screen.getByRole("button", { name: "Show Related List" }).getAttribute("aria-pressed"),
  ).toBe("false");
  expect(screen.queryByRole("navigation", { name: "Related List" })).toBeNull();
});

test("empty rail has heading only; scroll control appears and returns to top", async () => {
  const user = userEvent.setup();
  const { container } = render(<Frame entries={false} />);
  expect(
    screen.getByRole("navigation", { name: "Related List" }).querySelectorAll("a"),
  ).toHaveLength(0);
  expect(screen.getByRole("heading", { name: "Related List" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Scroll To Top" })).toBeNull();
  const scroller = container.querySelector("[data-record-scroller]") as HTMLDivElement;
  scroller.scrollTo = vi.fn();
  scroller.scrollTop = 200;
  fireEvent.scroll(scroller);
  await user.click(screen.getByRole("button", { name: "Scroll To Top" }));
  expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 0 });
  expect(screen.queryByRole("button", { name: "Scroll To Top" })).toBeNull();
});

test("later-module header menu actions keep the menu open without dispatching", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(
    <RecordHeader
      {...base}
      menuGroups={[
        {
          id: "later",
          items: [{ id: "mail", label: "Send Mail", laterModule: "M11", onAction: action }],
        },
      ]}
    />,
  );
  await user.click(screen.getByRole("button", { name: "More Options" }));
  const item = screen.getByRole("menuitem", { name: "Send Mail" });
  expect(item.getAttribute("aria-disabled")).toBe("true");
  expect(item.getAttribute("data-later-module")).toBe("M11");
  await user.click(item);
  item.focus();
  await user.keyboard("{Enter} ");
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByRole("menu")).toBeTruthy();
  expect(item.hasAttribute("title")).toBe(false);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("later-module subtitle is a focusable inert link", async () => {
  const user = userEvent.setup();
  const location = window.location.href;
  render(<RecordHeader {...base} subtitleLaterModule="M4" />);
  const link = screen.getByRole("link", { name: "Example Company" });
  expect(link.getAttribute("data-later-module")).toBe("M4");
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.hasAttribute("href")).toBe(false);
  expect(link.hasAttribute("title")).toBe(false);
  await user.click(link);
  link.focus();
  await user.keyboard("{Enter} ");
  expect(document.activeElement).toBe(link);
  expect(window.location.href).toBe(location);
});

test("website subtitle renders shared link without opening new tab by default", () => {
  render(
    <RecordHeader {...base} subtitle="https://example.com" subtitleHref="https://example.com" />,
  );
  const link = screen.getByRole("link", { name: "https://example.com" });
  expect(link.getAttribute("href")).toBe("https://example.com");
  expect(link.hasAttribute("target")).toBe(false);
});

test("custom portrait icon renders in portrait container", () => {
  function CustomIcon(props: import("react").SVGProps<SVGSVGElement>) {
    return <svg data-testid="custom-portrait" {...props} />;
  }
  render(<RecordHeader {...base} portraitIcon={CustomIcon} />);
  expect(screen.getByTestId("custom-portrait")).toBeTruthy();
});

test("primary header command draws the filled command, secondary stays plain", () => {
  render(
    <RecordHeader
      {...base}
      commands={[
        { id: "send-email", label: "Send Email", variant: "primary", laterModule: "M10" },
        { id: "edit", label: "Edit", variant: "secondary", href: "/dev/ui?edit" },
      ]}
    />,
  );
  const send = screen.getByRole("button", { name: "Send Email" });
  const edit = screen.getByRole("link", { name: "Edit" });
  expect(send.className).toContain("bg-primary");
  expect(send.className).not.toContain("bg-surface");
  expect(edit.className).toContain("bg-surface");
  expect(edit.className).not.toContain("bg-primary");
});

test("the tab row keeps its right end empty until a module supplies one", () => {
  const { rerender } = render(<Frame />);
  const row = document.querySelector("[data-record-tab-row]");
  expect(row?.textContent).toContain("Overview");
  expect(row?.querySelector(".detail-last-update")).toBeNull();
  rerender(
    <Frame tabRowEnd={<LastUpdateLabel text="Last Update : 2 day(s) ago" inTabRow />} />,
  );
  const label = document.querySelector("[data-record-tab-row] .detail-last-update");
  expect(label?.textContent).toBe("Last Update : 2 day(s) ago");
  expect(label?.querySelector("svg")).toBeTruthy();
  // The panels keep the label out of the overview flow.
  expect(document.querySelector("[data-record-scroller] .detail-last-update")).toBeNull();
});

test("rail badges follow the record count; an empty card draws none", () => {
  render(
    <RecordPageFrame
      header={<RecordHeader {...base} />}
      relatedListLabel="Related List"
      relatedEntries={[
        { id: "notes", label: "Notes", targetId: "target-notes", countBadge: 2 },
        { id: "open", label: "Open Activities", targetId: "target-open", countBadge: undefined },
      ]}
      tabsLabel="Record views"
      selectedTabId="overview"
      onTabChange={() => {}}
      scrollTopLabel="Scroll To Top"
      tabs={[{ id: "overview", label: "Overview", content: <article id="target-notes" /> }]}
    />,
  );
  const rail = screen.getByRole("navigation", { name: "Related List" });
  expect(within(rail).getByText("2")).toBeTruthy();
  expect(within(rail).queryByText("1")).toBeNull();
  expect(rail.querySelectorAll("[class*='rounded-full']")).toHaveLength(1);
});
