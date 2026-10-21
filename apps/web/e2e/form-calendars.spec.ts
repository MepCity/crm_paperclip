import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// Exercise every current form: modules without editable dates must stay free of calendar triggers.
const forms = [
  { module: "Leads", title: "Lead", dates: [] },
  { module: "Contacts", title: "Contact", dates: ["Date of Birth"] },
  { module: "Accounts", title: "Account", dates: [] },
  { module: "Deals", title: "Deal", dates: ["Closing Date"] },
  { module: "Tasks", title: "Task", dates: ["Due Date"] },
  { module: "Calls", title: "Call", dates: ["Call Start Time date"] },
  { module: "Campaigns", title: "Campaign", dates: ["Start Date", "End Date"] },
  { module: "Cases", title: "Case", dates: [] },
  { module: "Solutions", title: "Solution", dates: [] },
  { module: "Meetings", title: "Meeting", dates: ["From date", "To date"] },
];

test.use({ viewport: { width: 1470, height: 835 } });

for (const form of forms) {
  test(`${form.module}: form calendars select dates and retain editable text`, async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    if (form.module === "Meetings") {
      await page.goto(moduleListDefaultPath(org.slug, form.module));
      await page.getByRole("button", { name: "Create Meeting", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Meeting Information" })).toBeVisible();
    } else {
      await page.goto(moduleCreatePath(org.slug, form.module));
      await expect(
        page.getByRole("heading", { name: `Create ${form.title}`, exact: true }),
      ).toBeVisible();
    }
    await expect(page.locator('input[aria-haspopup="dialog"]')).toHaveCount(form.dates.length);
    for (const label of form.dates) {
      const input = page.getByRole("textbox", { name: label, exact: true });
      const timeInput = label.endsWith(" date")
        ? page.getByRole("textbox", { name: label.replace(/ date$/, " time"), exact: true })
        : null;
      const time = timeInput ? await timeInput.inputValue() : null;
      await input.fill("10.11.2026");
      await input.click();
      const calendar = page.getByRole("dialog", { name: `${label} calendar`, exact: true });
      await expect(calendar).toBeVisible();
      const inputBox = await input.boundingBox();
      const panelBox = await calendar.locator("..").boundingBox();
      expect(inputBox).not.toBeNull();
      expect(panelBox).not.toBeNull();
      expect(panelBox?.width ?? 0).toBeGreaterThanOrEqual(inputBox?.width ?? 0);
      await calendar.getByRole("button", { name: /November 15, 2026/ }).click();
      await expect(input).toHaveValue("15.11.2026");
      await expect(calendar).toBeHidden();
      if (timeInput) await expect(timeInput).toHaveValue(time ?? "");
      await input.click();
      await input.press("Escape");
      await expect(calendar).toBeHidden();
      await input.fill("31.02.2026");
      await expect(input).toHaveValue("31.02.2026");
      await input.fill("12.0");
      await expect(input).toHaveValue("12.0");
    }
    if (form.module === "Calls") {
      await expect(page.getByRole("textbox", { name: "Subject", exact: true })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Subject", exact: true })).toHaveCount(0);
    }
    if (form.module === "Meetings") {
      await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
      await page.getByRole("checkbox", { name: "All day" }).check();
      const from = page.getByRole("textbox", { name: "From date", exact: true });
      await from.fill("10.11.2026");
      await from.click();
      await page
        .getByRole("dialog", { name: "From date calendar" })
        .getByRole("button", { name: /November 15, 2026/ })
        .click();
      await expect(from).toHaveValue("15.11.2026");
      await expect(page.getByRole("textbox", { name: "From time", exact: true })).toHaveCount(0);
    }
  });
}
