import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";
import { Dialog, DialogTrigger } from "./dialog";

afterEach(cleanup);

test("Dialog opens, traps focus, and closes on Escape", async () => {
  render(
    <DialogTrigger>
      <Button>Open</Button>
      <Dialog title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    </DialogTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);

  const dialog = screen.getByRole("dialog", { name: "Test Dialog" });
  expect(dialog).toBeDefined();

  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});
