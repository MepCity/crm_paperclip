import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "react-aria-components";
import { afterEach, expect, test, vi } from "vitest";
import { Menu, MenuButton, MenuItem, MenuTrigger, Submenu, SubmenuTrigger } from "./menu";

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

test("MenuTrigger with laterModule button does not open on ArrowDown or ArrowUp", async () => {
  const user = userEvent.setup();
  render(
    <MenuTrigger>
      <MenuButton laterModule="M4">Options</MenuButton>
      <Menu>
        <MenuItem id="one">One</MenuItem>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  trigger.focus();
  expect(document.activeElement).toBe(trigger);

  await user.keyboard("{ArrowDown}");
  expect(screen.queryByRole("menu")).toBeNull();

  await user.keyboard("{ArrowUp}");
  expect(screen.queryByRole("menu")).toBeNull();

  await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
  expect(screen.queryByRole("menu")).toBeNull();

  await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("MenuItem with laterModule does not block arrow keys for navigating between menu rows", async () => {
  const user = userEvent.setup();
  const chosen: string[] = [];
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu onAction={(key) => chosen.push(String(key))}>
        <MenuItem id="edit">Edit</MenuItem>
        <MenuItem id="later" laterModule="M3">
          Later Item
        </MenuItem>
        <MenuItem id="delete">Delete</MenuItem>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  // Navigate to first item
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Edit" }));

  // Navigate to laterModule item
  await user.keyboard("{ArrowDown}");
  const laterItem = screen.getByRole("menuitem", { name: "Later Item" });
  expect(document.activeElement).toBe(laterItem);
  expect(screen.getByRole("menu")).toBeTruthy();

  // Enter on laterModule item does not trigger action and keeps menu open
  await user.keyboard("{Enter}");
  expect(chosen).toEqual([]);
  expect(screen.getByRole("menu")).toBeTruthy();

  // ArrowDown past laterModule item navigates to Delete
  await user.keyboard("{ArrowDown}");
  const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
  expect(document.activeElement).toBe(deleteItem);

  // ArrowUp navigates back to laterModule item
  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(laterItem);
  expect(screen.getByRole("menu")).toBeTruthy();
});

test("SubmenuTrigger with laterModule MenuItem does not open on ArrowRight, ArrowLeft, hover, click, Enter or Space", async () => {
  const user = userEvent.setup();
  const subAction = vi.fn();
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu>
        <MenuItem id="first">First</MenuItem>
        <SubmenuTrigger>
          <MenuItem id="later-sub" laterModule="M3">
            Later Submenu
          </MenuItem>
          <Submenu ariaLabel="Later Submenu">
            <MenuItem id="child" onAction={subAction}>
              Child
            </MenuItem>
          </Submenu>
        </SubmenuTrigger>
        <MenuItem id="last">Last</MenuItem>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  const firstItem = screen.getByRole("menuitem", { name: "First" });
  const laterSubItem = screen.getByRole("menuitem", { name: "Later Submenu" });
  const lastItem = screen.getByRole("menuitem", { name: "Last" });

  // 1. ArrowDown navigates to laterSubItem
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(firstItem);

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(laterSubItem);

  // 2. ArrowRight (LTR) does not open submenu
  await user.keyboard("{ArrowRight}");
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(document.activeElement).toBe(laterSubItem);

  // 3. ArrowLeft does not open submenu
  await user.keyboard("{ArrowLeft}");
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(document.activeElement).toBe(laterSubItem);

  // 4. Click does not open submenu
  await user.click(laterSubItem);
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(screen.getByRole("menu")).toBeTruthy();

  // 5. Enter & Space do not open submenu
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(screen.getByRole("menu")).toBeTruthy();

  await user.keyboard(" ");
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(screen.getByRole("menu")).toBeTruthy();

  // 6. Hover appearance is retained, but submenu does not open after delay
  await user.hover(laterSubItem);
  expect(
    laterSubItem.hasAttribute("data-hovered") ||
      laterSubItem.classList.contains("data-hovered:bg-surface-hover") ||
      laterSubItem.getAttribute("data-hovered") === "true",
  ).toBe(true);

  // Wait past default submenu open delay (200ms)
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(screen.queryByRole("menu", { name: "Later Submenu" })).toBeNull();
  expect(screen.getByRole("menu")).toBeTruthy();

  // 7. ArrowDown and ArrowUp continue to navigate between parent menu rows
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(lastItem);

  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(laterSubItem);

  expect(subAction).not.toHaveBeenCalled();
});

test("SubmenuTrigger with normal MenuItem opens on hover and ArrowRight", async () => {
  const user = userEvent.setup();
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu>
        <MenuItem id="first">First</MenuItem>
        <SubmenuTrigger>
          <MenuItem id="normal-sub">Normal Submenu</MenuItem>
          <Submenu ariaLabel="Normal Submenu">
            <MenuItem id="child">Child</MenuItem>
          </Submenu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  const normalSubItem = screen.getByRole("menuitem", { name: "Normal Submenu" });
  await user.hover(normalSubItem);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(screen.getByRole("menu", { name: "Normal Submenu" })).toBeTruthy();
});

test("MenuItem with laterModule inside an open submenu allows ArrowLeft to return to parent menu", async () => {
  const user = userEvent.setup();
  const laterAction = vi.fn();
  const normalAction = vi.fn();
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu>
        <SubmenuTrigger>
          <MenuItem id="parent-sub">Nested Submenu</MenuItem>
          <Submenu ariaLabel="Nested Submenu">
            <MenuItem id="later-child" laterModule="M3" onAction={laterAction}>
              Later Child
            </MenuItem>
            <MenuItem id="normal-child" onAction={normalAction}>
              Normal Child
            </MenuItem>
          </Submenu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  const parentSub = screen.getByRole("menuitem", { name: "Nested Submenu" });
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(parentSub);

  // Open the submenu via ArrowRight
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("menu", { name: "Nested Submenu" })).toBeTruthy();

  const laterChild = screen.getByRole("menuitem", { name: "Later Child" });
  expect(document.activeElement).toBe(laterChild);

  // Vertical arrows navigate between child rows
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Normal Child" }));

  await user.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(laterChild);

  // Click / Enter on laterChild do not trigger action and keep submenu open
  await user.click(laterChild);
  expect(laterAction).not.toHaveBeenCalled();
  expect(screen.getByRole("menu", { name: "Nested Submenu" })).toBeTruthy();

  await user.keyboard("{Enter}");
  expect(laterAction).not.toHaveBeenCalled();
  expect(screen.getByRole("menu", { name: "Nested Submenu" })).toBeTruthy();

  // ArrowLeft on laterChild closes submenu and returns focus to parentSub trigger
  await user.keyboard("{ArrowLeft}");
  expect(screen.queryByRole("menu", { name: "Nested Submenu" })).toBeNull();
  expect(document.activeElement).toBe(parentSub);
  expect(parentSub.getAttribute("aria-expanded")).toBe("false");
});

test("Normal submenu opens via ArrowRight even when cursor is hovered on sibling laterModule submenu item", async () => {
  const user = userEvent.setup();
  render(
    <MenuTrigger>
      <MenuButton>Options</MenuButton>
      <Menu>
        <SubmenuTrigger>
          <MenuItem id="later-sub" laterModule="M3">
            Later Submenu
          </MenuItem>
          <Submenu ariaLabel="Later Submenu">
            <MenuItem id="later-child">Later Child</MenuItem>
          </Submenu>
        </SubmenuTrigger>
        <SubmenuTrigger>
          <MenuItem id="normal-sub">Normal Submenu</MenuItem>
          <Submenu ariaLabel="Normal Submenu">
            <MenuItem id="normal-child">Normal Child</MenuItem>
          </Submenu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);
  expect(screen.getByRole("menu")).toBeTruthy();

  const laterSubItem = screen.getByRole("menuitem", { name: "Later Submenu" });
  const normalSubItem = screen.getByRole("menuitem", { name: "Normal Submenu" });

  // Hover over laterSubItem so it gets data-hovered
  await user.hover(laterSubItem);
  expect(
    laterSubItem.hasAttribute("data-hovered") ||
      laterSubItem.getAttribute("data-hovered") === "true",
  ).toBe(true);

  // Focus moves to normalSubItem while laterSubItem remains hovered
  normalSubItem.focus();
  expect(document.activeElement).toBe(normalSubItem);
  expect(
    laterSubItem.hasAttribute("data-hovered") ||
      laterSubItem.getAttribute("data-hovered") === "true",
  ).toBe(true);

  // Press ArrowRight on normalSubItem - normal submenu MUST open
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("menu", { name: "Normal Submenu" })).toBeTruthy();
  expect(normalSubItem.getAttribute("aria-expanded")).toBe("true");
});

test("In RTL menu, laterModule submenu trigger does not open on ArrowLeft, but normal submenu opens", async () => {
  const user = userEvent.setup();
  render(
    <I18nProvider locale="ar-AE">
      <MenuTrigger>
        <MenuButton>Options</MenuButton>
        <Menu>
          <SubmenuTrigger>
            <MenuItem id="later-sub-rtl" laterModule="M3">
              Later Submenu RTL
            </MenuItem>
            <Submenu ariaLabel="Later Submenu RTL">
              <MenuItem id="later-child-rtl">Later Child</MenuItem>
            </Submenu>
          </SubmenuTrigger>
          <SubmenuTrigger>
            <MenuItem id="normal-sub-rtl">Normal Submenu RTL</MenuItem>
            <Submenu ariaLabel="Normal Submenu RTL">
              <MenuItem id="normal-child-rtl">Normal Child</MenuItem>
            </Submenu>
          </SubmenuTrigger>
        </Menu>
      </MenuTrigger>
    </I18nProvider>,
  );

  const trigger = screen.getByRole("button", { name: "Options" });
  await user.click(trigger);

  const laterSubItem = screen.getByRole("menuitem", { name: "Later Submenu RTL" });
  const normalSubItem = screen.getByRole("menuitem", { name: "Normal Submenu RTL" });

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(laterSubItem);

  // In RTL, ArrowLeft would open normal submenu, but laterSubItem must NOT open
  await user.keyboard("{ArrowLeft}");
  expect(screen.queryByRole("menu", { name: "Later Submenu RTL" })).toBeNull();

  // Navigate to normalSubItem
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(normalSubItem);

  // In RTL, ArrowLeft opens normalSubItem
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("menu", { name: "Normal Submenu RTL" })).toBeTruthy();
});
