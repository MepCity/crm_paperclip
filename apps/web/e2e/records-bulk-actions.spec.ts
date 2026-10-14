import type { Locator, Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const modules = [
  { name: "Contacts", singular: "Contact", field: "Phone", value: "555901234" },
  { name: "Accounts", singular: "Account", field: "Phone", value: "555901234" },
  { name: "Deals", singular: "Deal", field: "Stage", value: "Negotiation/Review" },
] as const;
type Module = (typeof modules)[number];

function item<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`Missing item ${index}`);
  return value;
}

async function showList(page: Page, module: Module) {
  const list = page.locator(".module-list-page");
  if (module.name === "Deals") {
    await list.getByRole("button", { name: "List presentation", exact: true }).click();
  }
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await expect(list.locator("tbody tr").nth(2)).toBeVisible();
  return list;
}

async function setup(page: Page, module: Module) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, module.name));
  return { org, list: await showList(page, module) };
}

async function trackedRows(list: Locator) {
  const hrefs = await Promise.all(
    [0, 1, 2].map((index) =>
      list.locator("tbody tr").nth(index).getByRole("link").first().getAttribute("href"),
    ),
  );
  return hrefs.map((href) => {
    expect(href).toBeTruthy();
    return list.locator("tbody tr").filter({ has: list.page().locator(`a[href="${href}"]`) });
  });
}

async function cell(list: Locator, row: Locator, label: string) {
  const labels = await list
    .locator('th[data-part="column"] [data-part="header-label"]')
    .allTextContents();
  const index = labels.indexOf(label);
  expect(index, `Column ${label} exists`).toBeGreaterThanOrEqual(0);
  return row.locator('td[data-part="column"]').nth(index).locator('[data-part="value"]');
}

async function selectPair(list: Locator, rows: Locator[]) {
  for (const row of rows.slice(0, 2)) await row.getByRole("checkbox").check({ force: true });
  await expect(list.locator("[data-selection-bar]")).toContainText("2 Records Selected.");
  await expect(item(rows, 2).getByRole("checkbox")).not.toBeChecked();
}

async function fillMassUpdate(
  page: Page,
  list: Locator,
  module: Module,
  value: string = module.value,
) {
  await list.getByRole("button", { name: "Mass Update", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Mass Update", exact: true });
  await dialog.getByRole("button", { name: "Field", exact: true }).click();
  await page.getByRole("option", { name: module.field, exact: true }).click();
  if (module.name === "Deals") {
    await dialog.getByRole("button", { name: module.field, exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  } else {
    await dialog.getByRole("textbox", { name: module.field, exact: true }).fill(value);
  }
  return dialog;
}

for (const module of modules) {
  test.describe(`${module.name} bulk actions`, () => {
    test("mass update persists for both selected records and leaves the unselected record unchanged", async ({
      page,
    }) => {
      const { list } = await setup(page, module);
      const rows = await trackedRows(list);
      const cells = await Promise.all(rows.map((row) => cell(list, row, module.field)));
      const before = await Promise.all(cells.map((value) => value.innerText()));
      const updatedValue =
        module.name === "Deals"
          ? item(
              ["Qualification", "Needs Analysis", "Value Proposition"].filter(
                (value) => !before.slice(0, 2).includes(value),
              ),
              0,
            )
          : module.value;
      for (const value of before.slice(0, 2)) expect(value).not.toBe(updatedValue);
      await selectPair(list, rows);
      const dialog = await fillMassUpdate(page, list, module, updatedValue);
      await dialog.getByRole("button", { name: "Update", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(list.locator("[data-selection-bar]")).toBeHidden();
      for (const value of cells.slice(0, 2)) await expect(value).toHaveText(updatedValue);
      await expect(item(cells, 2)).toHaveText(item(before, 2));
      await page.reload();
      await showList(page, module);
      for (const value of cells.slice(0, 2)) await expect(value).toHaveText(updatedValue);
      await expect(item(cells, 2)).toHaveText(item(before, 2));
    });

    test("change owner persists for both selected records", async ({ page, browser }) => {
      const { org, list } = await setup(page, module);
      // Add a real member through the existing invitation flow, without altering seeds.
      const email = `bulk-owner-${crypto.randomUUID()}@example.test`;
      const ownerName = "Bulk Action Member";
      await page.goto(`/crm/${org.slug}/settings/members`);
      await page.getByRole("button", { name: "Invite member", exact: true }).click();
      const invitation = page.getByRole("dialog", { name: "Invite member", exact: true });
      await invitation.getByRole("textbox", { name: "Email", exact: true }).fill(email);
      await invitation.getByRole("button", { name: "Create invitation", exact: true }).click();
      const inviteUrl = (await invitation.getByText(/\/invite\//).innerText()).trim();
      await invitation.getByRole("button", { name: "Close", exact: true }).click();
      const context = await browser.newContext({ baseURL: new URL(page.url()).origin });
      try {
        const member = await context.newPage();
        await signUpNewUser(member, { name: ownerName, email });
        await member.goto(inviteUrl);
        await member.getByRole("button", { name: `Join ${org.name}`, exact: true }).click();
        await expect(member).toHaveURL(`/crm/${org.slug}`);
      } finally {
        await context.close();
      }
      await page.goto(moduleListDefaultPath(org.slug, module.name));
      await showList(page, module);
      const rows = await trackedRows(list);
      const owners = await Promise.all(
        rows.map((row) => cell(list, row, `${module.singular} Owner`)),
      );
      const before = await Promise.all(owners.map((value) => value.innerText()));
      for (const value of before.slice(0, 2)) expect(value).not.toBe(ownerName);
      await selectPair(list, rows);
      await list.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Change Owner", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Change Owner", exact: true });
      await dialog.getByRole("button", { name: `${module.singular} Owner`, exact: true }).click();
      await page.getByRole("option", { name: ownerName }).click();
      await page.keyboard.press("Escape");
      await dialog.getByRole("button", { name: "Change Owner", exact: true }).click();
      await expect(dialog).toBeHidden();
      for (const value of owners.slice(0, 2)) await expect(value).toHaveText(ownerName);
      await page.reload();
      await showList(page, module);
      for (const value of owners.slice(0, 2)) await expect(value).toHaveText(ownerName);
      await expect(item(owners, 2)).toHaveText(item(before, 2));
    });

    test("cancel mass update preserves data and selection", async ({ page }) => {
      const { list } = await setup(page, module);
      const rows = await trackedRows(list);
      const cells = await Promise.all(rows.map((row) => cell(list, row, module.field)));
      const before = await Promise.all(cells.map((value) => value.innerText()));
      await selectPair(list, rows);
      const dialog = await fillMassUpdate(page, list, module);
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(list.locator("[data-selection-bar]")).toContainText("2 Records Selected.");
      for (const row of rows.slice(0, 2)) await expect(row.getByRole("checkbox")).toBeChecked();
      await expect(item(rows, 2).getByRole("checkbox")).not.toBeChecked();
      for (const [index, value] of cells.entries())
        await expect(value).toHaveText(item(before, index));
      await page.reload();
      await showList(page, module);
      for (const [index, value] of cells.entries())
        await expect(value).toHaveText(item(before, index));
    });

    test("confirmed bulk delete removes both records and reduces the count after reload", async ({
      page,
    }) => {
      const { list } = await setup(page, module);
      const rows = await trackedRows(list);
      const total = list.locator("[data-part=total-value]");
      await expect(total).toBeVisible();
      const before = Number(await total.innerText());
      expect(before).toBeGreaterThanOrEqual(3);
      await selectPair(list, rows);
      await list.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
      const dialog = page.getByRole("alertdialog", {
        name: `Delete ${module.name}`,
        exact: true,
      });
      await dialog.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(dialog).toBeHidden();
      for (const row of rows.slice(0, 2)) await expect(row).toHaveCount(0);
      await expect(item(rows, 2)).toBeVisible();
      await expect(total).toHaveText(String(before - 2));
      await page.reload();
      await showList(page, module);
      for (const row of rows.slice(0, 2)) await expect(row).toHaveCount(0);
      await expect(item(rows, 2)).toBeVisible();
      await expect(total).toHaveText(String(before - 2));
    });
  });
}
