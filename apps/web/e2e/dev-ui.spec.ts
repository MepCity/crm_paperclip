import { expect, test } from "@playwright/test";

test("dev ui gallery has no console errors and form demo works", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/dev/ui");
  await expect(page).toHaveTitle(/Component Gallery/);

  // Each demo is a labelled region so screens and tests can address it.
  const formRegion = page.getByRole("region", { name: "form" });
  await expect(formRegion).toBeVisible();

  const form = formRegion.getByRole("form", { name: "Demo sign-in form" });
  const emailInput = form.getByRole("textbox", { name: "Email" });
  await emailInput.fill("invalid-email");
  await form.getByRole("button", { name: "Sign In" }).click();

  const alert = form.getByRole("alert");
  await expect(alert).toHaveText(/Please check the form fields/);

  await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  const descId = await emailInput.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  await expect(page.locator(`id=${descId}`)).toHaveText("Invalid email address");

  // Keyboard-only: the menu opens with Enter and closes with Escape.
  const menuRegion = page.getByRole("region", { name: "menu" });
  const menuTrigger = menuRegion.getByRole("button", { name: "Options" });
  await menuTrigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();

  // An invalid Select trigger draws the same danger border as an invalid input.
  const invalidInput = page
    .getByRole("region", { name: "text field" })
    .getByRole("textbox", { name: "With Error" });
  await expect(invalidInput).toHaveAttribute("aria-invalid", "true");
  const invalidBorderColor = await invalidInput.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );

  const selectRegion = page.getByRole("region", { name: "select" });
  const invalidTrigger = selectRegion.getByRole("button", { name: /Invalid choice/ });
  await expect(invalidTrigger).toHaveAttribute("data-invalid", "true");
  const triggerBorderColor = await invalidTrigger.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );
  expect(triggerBorderColor).toBe(invalidBorderColor);
  await expect(selectRegion.getByRole("button", { name: /Select a fruit/ })).not.toHaveAttribute(
    "data-invalid",
  );

  expect(errors).toHaveLength(0);
});
