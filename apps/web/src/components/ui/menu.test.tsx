import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Menu, MenuButton, MenuItem, MenuTrigger } from "./menu";

function renderMenu(onAction?: (key: string) => void, withDisabled = false) {
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu onAction={(key) => onAction?.(String(key))}>
        <MenuItem id="edit">Edit</MenuItem>
        {withDisabled && (
          <MenuItem id="unavailable" isDisabled>
            Unavailable
          </MenuItem>
        )}
        <MenuItem id="delete">Delete</MenuItem>
      </Menu>
    </MenuTrigger>,
  );
  return screen.getByRole("button", { name: "Options" });
}

afterEach(cleanup);

test("Menu moves focus with the arrow keys", async () => {
  const user = userEvent.setup();
  renderMenu();

  await user.click(screen.getByRole("button", { name: "Options" }));
  expect(screen.getByRole("menu")).toBeTruthy();

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Edit" }));

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));
});

test("Menu marks the focused item as visibly focused", async () => {
  const user = userEvent.setup();
  renderMenu();

  await user.click(screen.getByRole("button", { name: "Options" }));
  await user.keyboard("{ArrowDown}");

  const item = screen.getByRole("menuitem", { name: "Edit" });
  const visiblyFocused =
    item.hasAttribute("data-focus-visible") || item.hasAttribute("data-focused");
  expect(visiblyFocused).toBe(true);
});

test("Menu selects the focused item with Enter and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const chosen: string[] = [];
  const trigger = renderMenu((key) => chosen.push(key));

  await user.click(trigger);
  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");

  expect(chosen).toEqual(["edit"]);
  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("Menu skips disabled items and closes on Escape", async () => {
  const user = userEvent.setup();
  const trigger = renderMenu(undefined, true);

  await user.click(trigger);
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Edit" }));

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" }));

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
