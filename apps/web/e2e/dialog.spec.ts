import { expectNoA11yViolations } from "./support/a11y";
import { expect, test } from "./support/test";

test("Dialog keeps focus and closes on Escape after its content is replaced", async ({ page }) => {
  await page.goto("/dev/ui");
  const region = page.getByRole("region", { name: "dialog", exact: true });
  const trigger = region.getByRole("button", { name: "Replace content" });

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Replaced dialog" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Replace the content" }).click();
  await expect(dialog.getByText("The first step was replaced from inside.")).toBeVisible();

  // The button that was clicked is gone with the first step. Focus has to stay inside
  // the dialog, or Escape would no longer reach it and the dialog could not close.
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute("role")))
    .toBe("dialog");
  await expectNoA11yViolations(page);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.textContent?.trim()))
    .toBe("Replace content");
});
