import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("calendar shortcut opens native views, navigates dates and opens a meeting", async ({
  page,
}, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.getByRole("banner").getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/calendar`);
  await expect(page.getByRole("heading", { name: "Calendar", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "All Users", exact: true }).click();
  const date = await page.getByLabel("Calendar date", { exact: true }).inputValue();
  const nextWeek = new Date(Date.parse(`${date}T12:00:00Z`) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  await expect(page.getByRole("grid", { name: `day calendar ${date}` })).toBeVisible();
  const views = page.getByRole("group", { name: "Calendar view" });
  await views.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByRole("grid", { name: `week calendar ${date}` })).toBeVisible();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page.getByLabel("Calendar date", { exact: true })).toHaveValue(nextWeek);
  await page.getByRole("button", { name: "Previous week" }).click();
  await views.getByRole("button", { name: "Month", exact: true }).click();
  await expect(
    page.getByRole("grid", { name: `Month calendar ${date.slice(0, 7)}` }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("calendar-month.png") });
  await page
    .getByRole("grid")
    .getByRole("button", { name: `Open day ${date}`, exact: true })
    .click();
  await page
    .getByRole("grid")
    .getByRole("button", { name: /^Meeting \d+,/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/\\d+$`));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});
