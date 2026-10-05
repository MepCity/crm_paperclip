import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { RecordHeader, type RecordHeaderProps } from "./record-header";
import { RecordPageFrame } from "./record-page-frame";

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

function Frame({ entries = true }: { entries?: boolean }) {
  const [selected, setSelected] = useState("one");
  const [tab, setTab] = useState("overview");
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
