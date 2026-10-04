import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";
import { Tooltip, TooltipTrigger } from "./tooltip";

afterEach(cleanup);

test("Tooltip appears on focus and closes with Escape", async () => {
  const user = userEvent.setup();
  render(
    <TooltipTrigger>
      <Button>Owner</Button>
      <Tooltip>The owner of this record</Tooltip>
    </TooltipTrigger>,
  );

  expect(screen.queryByRole("tooltip")).toBeNull();

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Owner" }));
  expect(screen.getByRole("tooltip").textContent).toBe("The owner of this record");

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).toBeNull();
});
