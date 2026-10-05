import type { Locator } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { expect, test } from "./support/test";

/**
 * The control's React fiber exists only after hydration, and it is already in view.
 * Focusing an off-screen field scrolls the page; if that scroll arrives after the menu
 * opens, the menu closes and a saved lookup snaps back to its label.
 */
async function whenHydrated(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  await expect
    .poll(
      async () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactFiber$")),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  await locator.scrollIntoViewIfNeeded();
}

// The gallery renders every primitive in every state, so one scan covers the new ones too.
test("dev ui gallery is accessible with the data entry primitives", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/dev/ui");

  for (const name of [
    "text area",
    "number field",
    "checkbox",
    "switch",
    "radio group",
    "date picker",
    "combo box",
  ]) {
    await expect(page.getByRole("region", { name })).toBeVisible();
  }

  await whenHydrated(page.getByRole("region", { name: "combo box" }).getByRole("combobox").first());
  // Empty-list copy is the measured #8B9AB9 on white (2.83:1). The value stays.
  await expectNoA11yViolations(page, { exclude: ["[data-part=empty]"] });
});

test("number field steps and submits from the keyboard", async ({ page }) => {
  await page.goto("/dev/ui");

  const region = page.getByRole("region", { name: "number field" });
  const field = region.getByRole("textbox", { name: "Filled" });
  await expect(field).toHaveValue("1,234.5");

  await whenHydrated(field);
  await field.focus();
  await page.keyboard.press("ArrowUp");
  await expect(field).toHaveValue("1,235");

  // The German field shows the same number the way that locale writes it.
  const german = region.getByRole("textbox", { name: "German locale" });
  await german.scrollIntoViewIfNeeded();
  await german.focus();
  await german.fill("1234,5");
  await page.keyboard.press("Tab");
  await expect(german).toHaveValue("1.234,5");
});

test("radio group and checkbox move with the keyboard", async ({ page }) => {
  await page.goto("/dev/ui");

  const radios = page.getByRole("region", { name: "radio group" });
  const hot = radios.getByRole("radio", { name: "Hot" }).first();
  await whenHydrated(hot);
  await hot.focus();
  await page.keyboard.press("ArrowDown");
  await expect(radios.getByRole("radio", { name: "Warm" }).first()).toBeChecked();

  const boxes = page.getByRole("region", { name: "checkbox" });
  const empty = boxes.getByRole("checkbox", { name: "Empty" });
  await empty.scrollIntoViewIfNeeded();
  await empty.focus();
  await page.keyboard.press("Space");
  await expect(empty).toBeChecked();
});

test("date picker opens its calendar from the keyboard", async ({ page }) => {
  await page.goto("/dev/ui");

  const region = page.getByRole("region", { name: "date picker" });
  const trigger = region.getByRole("button", { name: /Calendar/ }).first();
  await whenHydrated(trigger);
  await trigger.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("grid")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("grid")).toBeHidden();

  // The typed field is the other half of the picker.
  const month = region.getByRole("spinbutton").first();
  await month.scrollIntoViewIfNeeded();
  await month.focus();
  await page.keyboard.type("03102026");
  await expect(region.getByRole("group", { name: "Empty" })).toContainText("3/10/2026");
});

test("combo box filters, searches and selects from the keyboard", async ({ page }) => {
  await page.goto("/dev/ui");

  const region = page.getByRole("region", { name: "combo box" });

  const staticList = region.getByRole("combobox", { name: "Empty" });
  await whenHydrated(staticList);
  await staticList.click();
  await staticList.pressSequentially("cont");
  await expect(staticList).toHaveValue("cont");
  await expect(page.getByRole("option", { name: "Contoso Ltd" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(staticList).toHaveValue("Contoso Ltd");

  // The lookup field debounces the typing and then shows what the loader returned.
  const lookup = region.getByRole("combobox", { name: "Lookup", exact: true });
  await whenHydrated(lookup);
  await lookup.click();
  await lookup.pressSequentially("fab");
  await expect(lookup).toHaveValue("fab");
  await expect(page.getByRole("option", { name: "Fabrikam Inc" })).toBeVisible();

  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await lookup.pressSequentially("zzz");
  await expect(lookup).toHaveValue("zzz");
  await expect(page.getByRole("status")).toHaveText("No results");
});

test("saved lookup restores its label after an unfinished search", async ({ page }) => {
  await page.goto("/dev/ui");
  const region = page.getByRole("region", { name: "combo box" });
  const lookup = region.getByRole("combobox", { name: "Saved lookup" });
  const submitted = () =>
    region.locator('input[type="hidden"][name="demo-combo-saved-lookup"]').inputValue();

  await expect(lookup).toHaveValue("Fabrikam Inc");
  expect(await submitted()).toBe("account-3");
  await whenHydrated(lookup);
  await lookup.focus();
  await page.keyboard.press("Tab");
  await expect(lookup).toHaveValue("Fabrikam Inc");

  await lookup.scrollIntoViewIfNeeded();
  await lookup.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await lookup.pressSequentially("cont");
  await expect(lookup).toHaveValue("cont");
  await expect(page.getByRole("option", { name: "Contoso Ltd" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(lookup).toHaveValue("Fabrikam Inc");
  expect(await submitted()).toBe("account-3");

  await lookup.scrollIntoViewIfNeeded();
  await lookup.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await lookup.pressSequentially("cont");
  await expect(lookup).toHaveValue("cont");
  await expect(page.getByRole("option", { name: "Contoso Ltd" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(lookup).toHaveValue("Contoso Ltd");
  expect(await submitted()).toBe("account-2");

  await lookup.scrollIntoViewIfNeeded();
  await lookup.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Tab");
  await expect(lookup).toHaveValue("");
  expect(await submitted()).toBe("");
});
