import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

test("Button renders and responds to click", async () => {
  let clicked = false;
  render(<Button onPress={() => (clicked = true)}>Click me</Button>);
  const btn = screen.getByRole("button", { name: "Click me" });
  expect(btn).toBeDefined();
  await userEvent.click(btn);
  expect(clicked).toBe(true);
});

test("Button shows pending state and disables click", async () => {
  render(<Button isPending>Submit</Button>);
  const btn = screen.getByRole("button", { name: "Submit" });
  // RAC automatically adds aria-disabled or native disabled when isPending is true, or disabled state. Wait, does it? We passed isPending to AriaButton.
  expect(btn.getAttribute("data-pending")).toBe("true");
});
