import { cleanup, screen, waitFor, within } from "@testing-library/react";
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

/** Opens a submenu from the keyboard. react-aria names the submenu after its trigger row,
 * which is how `list-page-size` names the page-size menu: the row's label plus its value. */
async function openSubmenu(user: UserEvent, rowName: string) {
  const item = screen.getByRole("menuitem", { name: rowName });
  item.focus();
  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(screen.getByRole("menu", { name: rowName })).toBeTruthy());
  return within(screen.getByRole("menu", { name: rowName }));
}

test("opens the View Settings menu with the keyboard and closes it with Escape", async () => {
  const user = userEvent.setup();
  setup();
  const menu = await openMenu(user);
  expect(menu).toBeTruthy();

  // Opening focuses the first row, so a highlighted row can be measured without a key press.
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Records Per Page 30" }),
  );
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "View Mode Wrap Text" }),
  );
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Records Per Page 30" }),
  );

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

test("names each parent row by its label and the value in effect", async () => {
  const user = userEvent.setup();
  setup({ perPage: 10, wrapText: true });
  await openMenu(user);
  expect(screen.getByRole("menuitem", { name: "Records Per Page 10" })).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "View Mode Wrap Text" })).toBeTruthy();
});

test("draws the capture's row content: leading glyph, label, value, submenu chevron", async () => {
  const user = userEvent.setup();
  setup();
  const menu = await openMenu(user);
  const rows = within(menu).getAllByRole("menuitem");
  expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
    "Records Per Page 30",
    "View Mode Wrap Text",
  ]);

  for (const row of rows) {
    // Two glyphs per row: the leading icon and the submenu chevron, both decorative.
    const icons = row.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    }
    // The value sits between the label and the chevron, pushed to the row's right edge.
    const value = row.lastElementChild?.previousElementSibling;
    expect(value?.className).toContain("ml-auto");
    // The value is heavier than the label: `typography.md` measures Table settings row
    // value at wght 640-660 and the row label at 420. `font-bold` is the 650 token; the
    // label keeps the menu item's own weight class.
    expect(value?.className).toContain("font-bold");
    const label = row.firstElementChild?.nextElementSibling;
    expect(label?.className ?? "").not.toMatch(/font-(bold|semibold|normal|medium)/);
  }
  expect(rows[0]?.lastElementChild?.previousElementSibling?.textContent).toBe("30");
  expect(rows[1]?.lastElementChild?.previousElementSibling?.textContent).toBe("Wrap Text");
  // The page-size row keeps the list glyph, the view-mode row the eye: the eye is a closed
  // outline, the list glyph is a set of horizontal rules.
  expect(rows[0]?.querySelector("path")?.getAttribute("d")).toContain("M9 6h12");
  expect(rows[1]?.querySelector("path")?.getAttribute("d")).toContain("12.5C5.5 8.75");
});

test("drops the View Mode value while Wrap Text is off", async () => {
  const user = userEvent.setup();
  setup({ wrapText: false });
  await openMenu(user);
  const row = screen.getByRole("menuitem", { name: "View Mode" });
  expect(row.textContent).toBe("View Mode");
  expect(screen.queryByRole("menuitem", { name: "View Mode Wrap Text" })).toBeNull();
});

test("the trigger draws the framed sliders glyph", async () => {
  setup();
  const trigger = screen.getByRole("button", { name: "View Settings" });
  const glyph = trigger.querySelector("svg");
  expect(glyph).toBeTruthy();
  // Framed: the sliders sit inside a rounded rectangle drawn by the glyph itself.
  expect(glyph?.querySelector("rect")).toBeTruthy();
});

test("offers six page sizes and marks the current one", async () => {
  const user = userEvent.setup();
  setup({ perPage: 30 });
  await openMenu(user);
  const submenu = await openSubmenu(user, "Records Per Page 30");

  const options = submenu.getAllByRole("menuitemradio");
  expect(options.map((option) => option.textContent?.trim())).toEqual([
    "10",
    "20",
    "30",
    "40",
    "50",
    "100",
  ]);
  const current = submenu.getByRole("menuitemradio", { name: "30" });
  expect(current.getAttribute("aria-checked")).toBe("true");
  for (const option of options) {
    if (option === current) continue;
    expect(option.getAttribute("aria-checked")).toBe("false");
  }
  expect(current.querySelector("svg")).toBeTruthy();
  expect(submenu.getByRole("menuitemradio", { name: "10" }).querySelector("svg")).toBeNull();
});

test("reports the selected page size and closes the menu", async () => {
  const user = userEvent.setup();
  const props = setup({ perPage: 30 });
  await openMenu(user);
  const submenu = await openSubmenu(user, "Records Per Page 30");

  await user.click(submenu.getByRole("menuitemradio", { name: "10" }));
  expect(props.onPerPageChange).toHaveBeenCalledWith(10);
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
});

test("marks the stored page size when the address has none", async () => {
  const user = userEvent.setup();
  setup({ perPage: 10 });
  await openMenu(user);
  const submenu = await openSubmenu(user, "Records Per Page 10");
  expect(submenu.getByRole("menuitemradio", { name: "10" }).getAttribute("aria-checked")).toBe(
    "true",
  );
});

test("Wrap Text is a checkbox item that reports both directions", async () => {
  const user = userEvent.setup();
  const props = setup({ wrapText: true });
  await openMenu(user);
  const viewMode = await openSubmenu(user, "View Mode Wrap Text");

  const item = viewMode.getByRole("menuitemcheckbox", { name: "Wrap Text" });
  expect(item.getAttribute("aria-checked")).toBe("true");
  await user.click(item);
  expect(props.onWrapTextChange).toHaveBeenCalledWith(false);

  cleanup();
  const next = setup({ wrapText: false });
  await openMenu(user);
  const off = await openSubmenu(user, "View Mode");
  const unchecked = off.getByRole("menuitemcheckbox", { name: "Wrap Text" });
  expect(unchecked.getAttribute("aria-checked")).toBe("false");
  await user.click(unchecked);
  expect(next.onWrapTextChange).toHaveBeenCalledWith(true);
});
