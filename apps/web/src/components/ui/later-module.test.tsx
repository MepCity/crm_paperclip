import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { laterModuleProps, useLaterModule } from "./later-module";

afterEach(cleanup);

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
});
