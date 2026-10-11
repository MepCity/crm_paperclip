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

test("Measured menu displays a header and communicates single selection", async () => {
  const user = userEvent.setup();
  render(
    <MenuTrigger>
      <MenuButton>Organizations</MenuButton>
      <Menu
        appearance="measured"
        aria-label="Organizations"
        header={<p>Example identity</p>}
        selectionMode="single"
        selectedKeys={["current"]}
      >
        <MenuItem appearance="measured" id="current">
          Current organization
        </MenuItem>
        <MenuItem appearance="measured" id="other">
          Other organization
        </MenuItem>
      </Menu>
    </MenuTrigger>,
  );
  await user.click(screen.getByRole("button", { name: "Organizations" }));
  expect(screen.getByText("Example identity")).toBeTruthy();
  expect(
    screen
      .getByRole("menuitemradio", { name: "Current organization" })
      .getAttribute("aria-checked"),
  ).toBe("true");
  expect(
    screen.getByRole("menuitemradio", { name: "Other organization" }).getAttribute("aria-checked"),
  ).toBe("false");
});

test("MenuItem with laterModule renders active appearance, retains focus, stays open on click, and ignores actions", async () => {
  const user = userEvent.setup();
  const chosen: string[] = [];
  render(
    <div>
      <div data-testid="outside">Outside</div>
      <MenuTrigger>
        <MenuButton>Options</MenuButton>
        <Menu onAction={(key) => chosen.push(String(key))}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="later" laterModule="M3">
            Later Action
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </div>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  const laterItem = screen.getByRole("menuitem", { name: "Later Action" });
  expect(laterItem.getAttribute("aria-disabled")).toBe("true");
  expect(laterItem.getAttribute("data-later-module")).toBe("M3");
  expect(laterItem.hasAttribute("title")).toBe(false);
  expect(laterItem.hasAttribute("data-disabled")).toBe(false);
  expect(laterItem.classList.contains("opacity-50")).toBe(false);
  expect(laterItem.classList.contains("cursor-not-allowed")).toBe(false);

  // Mouse click keeps menu open and does not call onAction
  await user.click(laterItem);
  expect(chosen).toEqual([]);
  expect(screen.getByRole("menu")).toBeTruthy();

  // Keyboard focus can reach the item, Enter & Space do not close or trigger onAction
  laterItem.focus();
  expect(document.activeElement).toBe(laterItem);
  await user.keyboard("{Enter}");
  expect(chosen).toEqual([]);
  expect(screen.getByRole("menu")).toBeTruthy();

  await user.keyboard(" ");
  expect(chosen).toEqual([]);
  expect(screen.getByRole("menu")).toBeTruthy();

  // Escape closes menu
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();

  // Outside click closes menu
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();
  await user.click(screen.getByTestId("outside"));
  expect(screen.queryByRole("menu")).toBeNull();
});
