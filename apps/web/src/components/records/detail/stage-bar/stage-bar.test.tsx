import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { StageBar } from "./stage-bar";
import { demoLabels, demoStages } from "./stage-bar.demo";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(element: Element) {
        if (element instanceof HTMLElement && element.classList.contains("stage-bar-viewport")) {
          Object.defineProperty(element, "scrollWidth", { value: 900, configurable: true });
          Object.defineProperty(element, "clientWidth", { value: 240, configurable: true });
        }
      }
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup(current = "value-proposition") {
  const onSelectStage = vi.fn();
  render(
    <>
      <StageBar
        stages={demoStages}
        currentStageValue={current}
        startDate="01.01.2026"
        closingDate="15.06.2026"
        labels={demoLabels}
        onSelectStage={onSelectStage}
      />
      <p>Outside panel</p>
    </>,
  );
  return { onSelectStage, user: userEvent.setup() };
}

test("open stages follow metadata order and mark current, passed and future states", () => {
  setup("value-proposition");
  const openLabels = demoStages.filter((stage) => stage.kind === "open").map((s) => s.label);
  const steps = screen.getAllByRole("listitem");
  expect(steps.map((item) => item.textContent?.replace(/\s+/g, " ").trim())).toEqual(openLabels);
  expect(steps[0]?.getAttribute("data-state")).toBe("passed");
  expect(steps[1]?.getAttribute("data-state")).toBe("passed");
  expect(steps[2]?.getAttribute("data-state")).toBe("current");
  expect(steps[2]?.getAttribute("aria-current")).toBe("step");
  expect(steps[3]?.getAttribute("data-state")).toBe("future");
});

test("closed won marks every open step passed and highlights won terminal control", () => {
  setup("closed-won");
  for (const step of screen.getAllByRole("listitem")) {
    expect(step.getAttribute("data-state")).toBe("passed");
  }
  expect(screen.getByRole("button", { name: "Choose won stage" }).getAttribute("data-active")).toBe(
    "",
  );
});

test("clicking a non-current open step calls onSelectStage", async () => {
  const { onSelectStage, user } = setup("qualification");
  await user.click(screen.getByRole("button", { name: "Needs Analysis" }));
  expect(onSelectStage).toHaveBeenCalledExactlyOnceWith("needs-analysis");
});

test("won and lost menus list terminal stages and select by keyboard", async () => {
  const { onSelectStage, user } = setup();
  const wonTrigger = screen.getByRole("button", { name: "Choose won stage" });
  wonTrigger.focus();
  await user.keyboard("{Enter}");
  const wonDialog = screen.getByRole("dialog", { name: "Choose won stage" });
  expect(
    within(wonDialog)
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent),
  ).toEqual(["Closed Won"]);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(onSelectStage).toHaveBeenCalledExactlyOnceWith("closed-won");
  onSelectStage.mockClear();
  const lostTrigger = screen.getByRole("button", { name: "Choose lost stage" });
  await user.click(lostTrigger);
  const lostDialog = screen.getByRole("dialog", { name: "Choose lost stage" });
  expect(
    within(lostDialog)
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent),
  ).toEqual(["Closed Lost", "Closed Lost to Competition"]);
  await user.click(within(lostDialog).getByRole("menuitemradio", { name: "Closed Lost" }));
  expect(onSelectStage).toHaveBeenCalledExactlyOnceWith("closed-lost");
});

test("horizontal scroll buttons are present and start disabled at the left edge", () => {
  setup();
  const previous = screen.getByRole("button", { name: "Scroll previous stages" });
  const next = screen.getByRole("button", { name: "Scroll next stages" });
  expect(previous).toHaveProperty("disabled", true);
  expect(next).toHaveProperty("disabled", false);
});

test("current stage down chevron is decorative and not a separate button", () => {
  setup("qualification");
  const current = screen.getByRole("listitem", { current: "step" });
  expect(within(current).queryAllByRole("button")).toHaveLength(0);
});
