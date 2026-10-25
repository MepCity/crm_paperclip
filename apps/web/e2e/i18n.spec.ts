import { signIn, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test("saved Language switches shell EN/TR, survives reload and another session, and preserves a draft", async ({
  page,
  context,
  browser,
}) => {
  const user = await signUpNewUser(page);
  const org = await createOrganization(page);
  const draft = await context.newPage();
  await draft.goto(`/crm/${org.slug}/tab/Leads/create`);
  await draft
    .getByRole("textbox", { name: "Last Name", exact: true })
    .fill("Unsaved language draft");
  const settings = `/crm/${org.slug}/settings/personal-settings`;
  await page.goto(settings);
  await page.getByRole("button", { name: "Edit locale information" }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("tr");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("tab", { name: "Kişisel Ayarlar" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lokalizasyon Bilgisi" })).toBeVisible();
  await draft.bringToFront();
  await draft.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(draft.locator("html")).toHaveAttribute("lang", "tr");
  await expect(draft.getByRole("textbox", { name: "Last Name", exact: true })).toHaveValue(
    "Unsaved language draft",
  );
  await expect(draft.getByRole("button", { name: "Kaydet", exact: true })).toBeVisible();
  await expect(draft.getByRole("link", { name: "Müşteri Adayları", exact: true })).toBeVisible();
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await signIn(second, user, { next: settings });
    await expect(second.locator("html")).toHaveAttribute("lang", "tr");
  } finally {
    await other.close();
  }
  await page.bringToFront();
  await page.getByRole("button", { name: "Lokalizasyon bilgisini düzenle" }).click();
  await page.getByLabel("Dil", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Locale Information" })).toBeVisible();
  await draft.close();
});

test("a failed save retains the language and editable selection", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/personal-settings`);
  await page.route("**/api/personal-settings/language", (route) =>
    route.fulfill({ status: 500, json: { code: "SAVE_FAILED" } }),
  );
  await page.getByRole("button", { name: "Edit locale information" }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("tr");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("p[role='alert']")).toHaveText(
    "Language could not be saved. Please try again.",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByLabel("Language", { exact: true })).toHaveValue("tr");
  ignoreFailedResponses(pageErrors, [500]);
});
