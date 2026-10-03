import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Menu, MenuButton, MenuItem, MenuTrigger } from "./menu";

afterEach(cleanup);

test("Menu keyboard navigation", async () => {
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu>
        <MenuItem id="1">One</MenuItem>
        <MenuItem id="2">Two</MenuItem>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await userEvent.click(trigger);

  const menu = screen.getByRole("menu");
  expect(menu).toBeDefined();

  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  const item2 = screen.getByRole("menuitem", { name: "Two" });
  expect(document.activeElement).toBe(item2);

  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
});
