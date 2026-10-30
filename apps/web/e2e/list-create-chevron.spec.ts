import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const modules = ["Accounts", "Leads", "Tasks", "Calls", "Solutions", "Cases"] as const;

test("the Create chevron opens on the first click, however soon after load", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  for (const module of modules) {
    for (const delay of [0, 150, 600]) {
      await page.goto(moduleListDefaultPath(org.slug, module));
      const list = page.locator(".module-list-page");
      const more = list.getByRole("button", { name: "More", exact: true });
      await more.waitFor();
      if (delay) await page.waitForTimeout(delay);
      await more.click();
      await expect(page.getByRole("menuitem", { name: `Import ${module}` })).toBeVisible({
        timeout: 3000,
      });
      await expect(more).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
  }
});

test("the Create chevron stays open while the list reloads behind it", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const more = list.getByRole("button", { name: "More", exact: true });
  await more.click();
  await expect(page.getByRole("menuitem", { name: "Import Accounts" })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByRole("menuitem", { name: "Import Accounts" })).toBeVisible();
});

test("one click on the chevron opens it even while another toolbar menu is open", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const more = list.getByRole("button", { name: "More", exact: true });
  for (const other of ["Actions", "View Settings", "Custom views"]) {
    await list.getByRole("button", { name: other, exact: true }).click();
    await expect(page.getByRole("menu").first()).toBeVisible();
    // A real pointer press: the other menu's overlay is in the way, so no actionability wait.
    const box = await more.boundingBox();
    if (!box) throw new Error("The chevron has no box.");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole("menuitem", { name: "Import Accounts" })).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
});
