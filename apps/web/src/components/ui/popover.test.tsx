import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";
import { Popover, PopoverTrigger } from "./popover";

function renderPopover() {
  render(
    <>
      <PopoverTrigger>
        <Button>Filters</Button>
        <Popover title="Filters">
          <Button>Apply</Button>
        </Popover>
      </PopoverTrigger>
      <p>Outside the panel</p>
    </>,
  );
  return screen.getByRole("button", { name: "Filters" });
}

afterEach(cleanup);

test("Popover opens from its trigger and closes on Escape, returning focus", async () => {
  const user = userEvent.setup();
  const trigger = renderPopover();

  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("Popover closes on an outside click and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const trigger = renderPopover();

  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();

  await user.click(screen.getByText("Outside the panel"));
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
