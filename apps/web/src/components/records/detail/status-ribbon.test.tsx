import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { StatusRibbon } from "./status-ribbon";
import { demoGroups, demoLabels, demoStages } from "./status-ribbon.demo";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const onSelect = vi.fn();
  render(
    <>
      <StatusRibbon
        stages={demoStages}
        value="stage-4"
        terminalGroups={demoGroups}
        labels={demoLabels}
        onSelect={onSelect}
      />
      <p>Outside panel</p>
    </>,
  );
  return { onSelect, user: userEvent.setup() };
}

test("stages retain metadata order, exclude None, and mark only current stage", () => {
  setup();
  const stages = screen.getAllByRole("listitem");
  expect(stages.map((item) => item.textContent)).toEqual(
    demoStages.slice(1).map((stage) => stage.label),
  );
  expect(stages.filter((item) => item.hasAttribute("aria-current"))).toHaveLength(1);
  expect(stages[4]?.getAttribute("aria-current")).toBe("step");
  expect(stages[3]?.querySelector(".status-stage-thumb")).toBeTruthy();
  expect(stages[7]?.querySelector(".status-stage-thumb")).toBeTruthy();
});

test("stage menu opens by keyboard, checks current value and selects null", async () => {
  const { onSelect, user } = setup();
  const trigger = screen.getByRole("button", { name: "Choose stage" });
  trigger.focus();
  await user.keyboard("{Enter}");
  const search = screen.getByRole("textbox", { name: "Search stages" });
  expect(document.activeElement).toBe(search);
  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((item) => item.textContent)).toEqual(demoStages.map((stage) => stage.label));
  expect(
    screen.getByRole("menuitemradio", { name: "Lost Lead" }).getAttribute("aria-checked"),
  ).toBe("true");
  expect(
    screen.getByRole("menuitemradio", { name: "Lost Lead" }).querySelector("svg"),
  ).toBeTruthy();
  await user.keyboard("{ArrowDown}{Home}");
  expect(document.activeElement).toBe(screen.getByRole("menuitemradio", { name: "-None-" }));
  expect(onSelect).not.toHaveBeenCalled();
  await user.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("search filters by case-insensitive substring, supports empty state and stored payload", async () => {
  const { onSelect, user } = setup();
  await user.click(screen.getByRole("button", { name: "Choose stage" }));
  const search = screen.getByRole("textbox", { name: "Search stages" });
  await user.type(search, "qU");
  await user.paste("aLi");
  expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual([
    "Pre-Qualified",
    "Not Qualified",
  ]);
  await user.clear(search);
  await user.paste("unmatched");
  expect(
    screen.queryAllByRole("menuitemradio").filter((option) => option.hasAttribute("data-key")),
  ).toHaveLength(0);
  expect(screen.getByText("No matching stages")).toBeTruthy();
  await user.clear(search);
  await user.paste("Contact in");
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitemradio", { name: "Contact in Future" }),
  );
  await user.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("stage-1");
});

test("terminal menu focuses search, skips group headers during navigation and closes on select", async () => {
  const { onSelect, user } = setup();
  const trigger = screen.getByRole("button", { name: "Choose terminal stage" });
  trigger.focus();
  await user.keyboard(" ");
  const dialog = screen.getByRole("dialog", { name: "Choose terminal stage" });
  expect(document.activeElement).toBe(within(dialog).getByRole("textbox"));
  await within(dialog).findAllByRole("menuitemradio");
  expect(
    within(dialog)
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent),
  ).toEqual(["Junk Lead", "Not Qualified"]);
  expect(within(dialog).getByText("Junk").getAttribute("role")).not.toBe("menuitemradio");
  await user.keyboard("{ArrowDown}{Home}{ArrowDown}{Enter}");
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("stage-7");
  expect(screen.queryByRole("dialog")).toBeNull();
});

for (const name of ["Choose stage", "Choose terminal stage"]) {
  test(`${name} closes on Escape and outside click without selecting`, async () => {
    const { onSelect, user } = setup();
    const trigger = screen.getByRole("button", { name });
    await user.click(trigger);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox")));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("role")).toBe("menuitemradio");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(trigger);
    await user.click(screen.getByText("Outside panel"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
}

test("terminal search preserves only matching groups", async () => {
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Choose terminal stage" }));
  await user.paste("junk");
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(1);
  expect(screen.queryByRole("group", { name: "Not Qualified" })).toBeNull();
});

test("mouse selection delivers current or changed stored values once", async () => {
  const { onSelect, user } = setup();
  const trigger = screen.getByRole("button", { name: "Choose stage" });
  await user.click(trigger);
  await user.click(screen.getByRole("menuitemradio", { name: "Lost Lead" }));
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("stage-4");
  expect(screen.queryByRole("dialog")).toBeNull();
  onSelect.mockClear();
  await user.click(trigger);
  await user.click(screen.getByRole("menuitemradio", { name: /^Contacted$/ }));
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("stage-2");
});
