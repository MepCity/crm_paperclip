import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import {
  LIVE_MODULE_KEYS,
  laterModuleProps,
  resolveLaterModule,
  useLaterModule,
} from "./later-module";

afterEach(cleanup);

test("resolveLaterModule returns undefined for active modules and key for later modules", () => {
  expect(LIVE_MODULE_KEYS).toEqual(["M2", "M3"]);
  expect(resolveLaterModule("M2")).toBeUndefined();
  expect(resolveLaterModule("M3")).toBeUndefined();
  expect(resolveLaterModule(undefined)).toBeUndefined();
  expect(resolveLaterModule(null)).toBeUndefined();
  expect(resolveLaterModule("")).toBeUndefined();
  expect(resolveLaterModule("M4")).toBe("M4");
  expect(resolveLaterModule("M5")).toBe("M5");
  expect(resolveLaterModule("P2")).toBe("P2");
  expect(resolveLaterModule("P3")).toBe("P3");
});

test("laterModuleProps returns aria-disabled and data-later-module when key provided", () => {
  expect(laterModuleProps()).toEqual({});
  expect(laterModuleProps("M3")).toEqual({
    "aria-disabled": "true",
    "data-later-module": "M3",
    title: undefined,
  });
});

test("useLaterModule blocks events and retains keyboard focus", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  function TestControl({ laterModule }: { laterModule?: "M3" }) {
    const ref = useLaterModule(laterModule);
    return (
      <button type="button" ref={ref} onClick={onClick}>
        Control
      </button>
    );
  }

  render(<TestControl laterModule="M3" />);
  const button = screen.getByRole("button", { name: "Control" });

  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();

  button.focus();
  expect(document.activeElement).toBe(button);

  await user.keyboard("{Enter}");
  expect(onClick).not.toHaveBeenCalled();

  await user.keyboard(" ");
  expect(onClick).not.toHaveBeenCalled();

  await user.keyboard("{ArrowDown}");
  expect(onClick).not.toHaveBeenCalled();

  await user.keyboard("{ArrowUp}");
  expect(onClick).not.toHaveBeenCalled();
});

test("useLaterModule allows arrow keys on non-button elements while blocking Enter and Space", async () => {
  const user = userEvent.setup();
  const onKeyDown = vi.fn();

  function TestRow({ laterModule }: { laterModule?: "M3" }) {
    const ref = useLaterModule<HTMLDivElement>(laterModule);
    return (
      <div tabIndex={0} role="menuitem" ref={ref} onKeyDown={onKeyDown}>
        Row
      </div>
    );
  }

  render(<TestRow laterModule="M3" />);
  const row = screen.getByRole("menuitem", { name: "Row" });
  row.focus();
  expect(document.activeElement).toBe(row);

  await user.keyboard("{ArrowDown}");
  expect(onKeyDown).toHaveBeenCalledTimes(1);

  await user.keyboard("{ArrowUp}");
  expect(onKeyDown).toHaveBeenCalledTimes(2);

  await user.keyboard("{Enter}");
  // Enter is blocked so onKeyDown on element is not triggered
  expect(onKeyDown).toHaveBeenCalledTimes(2);

  await user.keyboard(" ");
  // Space is blocked so onKeyDown on element is not triggered
  expect(onKeyDown).toHaveBeenCalledTimes(2);
});
