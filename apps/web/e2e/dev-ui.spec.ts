import { test, expect } from "@playwright/test";

test("dev ui gallery has no console errors and form demo works", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/dev/ui");
  await expect(page).toHaveTitle(/Component Gallery/);
  
  // Wait a bit to ensure hydration finishes
  await page.waitForTimeout(500);

  expect(errors).toHaveLength(0);

  // Form demo test
  const emailInput = page.getByRole("textbox", { name: "Email" });
  await emailInput.fill("invalid-email");
  const submitBtn = page.getByRole("button", { name: "Sign In" });
  await submitBtn.click();

  // Next.js server actions in playwright might require waiting
  const formArea = page.locator('section').filter({ hasText: 'form' });
  const form = formArea.locator('form');
  const alert = form.getByRole("alert");
  await expect(alert).toHaveText(/Please check the form fields/);

  // Aria-describedby should be set
  await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  const descId = await emailInput.getAttribute("aria-describedby");
  expect(descId).toBeTruthy();
  const errorMsg = page.locator(`id=${descId}`);
  await expect(errorMsg).toHaveText("Invalid email address");
});
