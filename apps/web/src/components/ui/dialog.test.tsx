import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";
import { Dialog, DialogTrigger } from "./dialog";

function renderDialog() {
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <Dialog title="Test Dialog">
        <p>Dialog content</p>
        <Button>Inside</Button>
      </Dialog>
    </DialogTrigger>,
  );
  return screen.getByRole("button", { name: "Open" });
}

afterEach(cleanup);

test("Dialog opens and keeps focus inside while open", async () => {
  const user = userEvent.setup();
  renderDialog();

  await user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = screen.getByRole("dialog", { name: "Test Dialog" });
  expect(dialog.contains(document.activeElement)).toBe(true);

  await user.tab();
  await user.tab();
  expect(dialog.contains(document.activeElement)).toBe(true);
});

test("Dialog closes on Escape and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const trigger = renderDialog();

  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Test Dialog" })).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
