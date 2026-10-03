import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

test("Button renders every variant as a labelled button", () => {
  render(
    <>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </>,
  );

  for (const name of ["Primary", "Secondary", "Ghost", "Danger"]) {
    expect(screen.getByRole("button", { name })).toBeTruthy();
  }
});

test("Button activates with the mouse and with Enter and Space", async () => {
  const user = userEvent.setup();
  let presses = 0;
  render(
    <>
      <Button onPress={() => presses++}>Mouse</Button>
      <Button onPress={() => presses++}>Keys</Button>
    </>,
  );

  await user.click(screen.getByRole("button", { name: "Mouse" }));
  screen.getByRole("button", { name: "Keys" }).focus();
  await user.keyboard("{Enter}");
  await user.keyboard(" ");

  expect(presses).toBe(3);
});

test("Button in the disabled state ignores presses", async () => {
  const user = userEvent.setup();
  let presses = 0;
  render(
    <Button isDisabled onPress={() => presses++}>
      Disabled
    </Button>,
  );

  const button = screen.getByRole("button", { name: "Disabled" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("data-disabled")).toBe("true");

  await user.click(button);
  expect(presses).toBe(0);
});

test("Button in the pending state ignores presses and announces pending", async () => {
  const user = userEvent.setup();
  let presses = 0;
  render(
    <Button isPending onPress={() => presses++}>
      Saving
    </Button>,
  );

  const button = screen.getByRole("button", { name: "Saving" });
  expect(button.getAttribute("data-pending")).toBe("true");
  expect(button.getAttribute("aria-disabled")).toBe("true");

  await user.click(button);
  expect(presses).toBe(0);
});
