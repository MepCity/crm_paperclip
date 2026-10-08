import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ViewSettingsMenu, type ViewSettingsMenuProps } from "./view-settings-menu";

afterEach(cleanup);

function setup(overrides: Partial<ViewSettingsMenuProps> = {}) {
  const props: ViewSettingsMenuProps = {
    perPage: 30,
    onPerPageChange: vi.fn(),
    wrapText: true,
    onWrapTextChange: vi.fn(),
    ...overrides,
  };
  render(<ViewSettingsMenu {...props} />);
  return props;
}

/** Opens the View Settings menu from the keyboard. Pointer presses on a portaled submenu
 * race the parent popover's outside-dismiss in jsdom, as in the other list chrome tests. */
async function openMenu(user: UserEvent) {
  const trigger = screen.getByRole("button", { name: "View Settings" });
  trigger.focus();
  await user.keyboard("{Enter}");
  return screen.getByRole("menu", { name: "View Settings" });
}

async function openSubmenu(user: UserEvent, name: string) {
  const item = screen.getByRole("menuitem", { name });
  item.focus();
  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(screen.getByRole("menu", { name })).toBeTruthy());
  return screen.getByRole("menu", { name });
}

test("opens the View Settings menu with the keyboard and closes it with Escape", async () => {
  const user = userEvent.setup();
  setup();
  const menu = await openMenu(user);
  expect(menu).toBeTruthy();

  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "View Mode" }));
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Records Per Page" }));

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu", { name: "View Settings" })).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "View Settings" })),
  );
});

test("does not draw the controls that belong to the customization module", async () => {
  const user = userEvent.setup();
  setup();
  await openMenu(user);
  expect(screen.queryByRole("menuitem", { name: "Manage Columns" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Reset Column Size" })).toBeNull();
});

test("offers six page sizes and marks the current one", async () => {
  const user = userEvent.setup();
  setup({ perPage: 30 });
  await openMenu(user);
  await openSubmenu(user, "Records Per Page");

  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((option) => option.textContent?.trim())).toEqual([
    "10",
    "20",
    "30",
    "40",
    "50",
    "100",
  ]);
  const current = screen.getByRole("menuitemradio", { name: "30" });
  expect(current.getAttribute("aria-checked")).toBe("true");
  for (const option of options) {
    if (option === current) continue;
    expect(option.getAttribute("aria-checked")).toBe("false");
  }
  expect(current.querySelector("svg")).toBeTruthy();
  expect(screen.getByRole("menuitemradio", { name: "10" }).querySelector("svg")).toBeNull();
});

test("reports the selected page size and closes the menu", async () => {
  const user = userEvent.setup();
  const props = setup({ perPage: 30 });
  await openMenu(user);
  await openSubmenu(user, "Records Per Page");

  await user.click(screen.getByRole("menuitemradio", { name: "10" }));
  expect(props.onPerPageChange).toHaveBeenCalledWith(10);
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
});

test("marks the stored page size when the address has none", async () => {
  const user = userEvent.setup();
  setup({ perPage: 10 });
  await openMenu(user);
  await openSubmenu(user, "Records Per Page");
  expect(screen.getByRole("menuitemradio", { name: "10" }).getAttribute("aria-checked")).toBe(
    "true",
  );
});

test("Wrap Text is a checkbox item that reports both directions", async () => {
  const user = userEvent.setup();
  const props = setup({ wrapText: true });
  await openMenu(user);
  await openSubmenu(user, "View Mode");

  const item = screen.getByRole("menuitemcheckbox", { name: "Wrap Text" });
  expect(item.getAttribute("aria-checked")).toBe("true");
  await user.click(item);
  expect(props.onWrapTextChange).toHaveBeenCalledWith(false);

  cleanup();
  const next = setup({ wrapText: false });
  await openMenu(user);
  await openSubmenu(user, "View Mode");
  const off = screen.getByRole("menuitemcheckbox", { name: "Wrap Text" });
  expect(off.getAttribute("aria-checked")).toBe("false");
  await user.click(off);
  expect(next.onWrapTextChange).toHaveBeenCalledWith(true);
});
