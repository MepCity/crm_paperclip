import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { ViewTypeSwitcher } from "./view-type-switcher";

afterEach(cleanup);

const TILES = [
  "List presentation",
  "Split presentation",
  "Grid presentation",
  "Chart presentation",
  "Connected presentation",
  "Cards presentation",
  "More presentations",
];

test("renders the six type tiles and the overflow control in the measured order", () => {
  render(<ViewTypeSwitcher />);
  for (const name of TILES) {
    expect(screen.getByRole("button", { name })).toBeTruthy();
  }
});

test("only the list tile is pressed; every other control is aria-disabled", () => {
  render(<ViewTypeSwitcher />);
  expect(
    screen.getByRole("button", { name: "List presentation" }).getAttribute("aria-pressed"),
  ).toBe("true");
  for (const name of TILES.filter((tile) => tile !== "List presentation")) {
    expect(screen.getByRole("button", { name }).getAttribute("aria-disabled")).toBe("true");
  }
});

test("activating an unimplemented tile changes nothing (Interim)", async () => {
  const user = userEvent.setup();
  render(<ViewTypeSwitcher />);
  await user.click(screen.getByRole("button", { name: "Grid presentation" }));
  expect(
    screen.getByRole("button", { name: "Grid presentation" }).getAttribute("aria-pressed"),
  ).toBe("false");
  expect(
    screen.getByRole("button", { name: "List presentation" }).getAttribute("aria-pressed"),
  ).toBe("true");
});
