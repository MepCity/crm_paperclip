import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const origin = (page: Page) => new URL(page.url()).origin;

async function createRecord(
  page: Page,
  module: string,
  orgSlug: string,
  fields: Record<string, string>,
): Promise<string> {
  const response = await page.request.post(`/crm/v2.2/${module}`, {
    headers: { "X-CRM-ORG": orgSlug, Origin: origin(page) },
    data: { data: [fields] },
  });
  expect(response.ok(), `create failed: ${await response.text()}`).toBeTruthy();
  const body = (await response.json()) as { data: { details: { id: string } }[] };
  return body.data[0]?.details.id ?? "";
}

async function openImport(page: Page, orgSlug: string, module: string) {
  await page.goto(moduleListDefaultPath(orgSlug, module));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: `Import ${module}` }).click();
  await expect(page).toHaveURL(new RegExp(`/tab/${module}/import`));
}

async function uploadCsv(page: Page, body: string) {
  await page.getByTestId("csv-input").setInputFiles({
    name: "import.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(body),
  });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("How should records be handled?")).toBeVisible();
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^﻿/, "")
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));
}

test.describe("CSV import and export", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Leads: import with a skipped row, history, undo", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openImport(page, org.slug, "Leads");
    await uploadCsv(
      page,
      "Last Name,Email\nImportOne,one@example.test\nImportTwo,two@example.test\n,three@example.test\n",
    );
    await page.getByRole("radio", { name: /Add as new/ }).check({ force: true });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByText(/Import completed/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("count-added")).toHaveText("2");
    await expect(page.getByTestId("count-skipped")).toHaveText("1");
    await page.getByRole("button", { name: "Done" }).click();

    await expect(page).toHaveURL(/\/tab\/Leads\/list/);
    await expect(page.getByText("ImportOne")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("ImportTwo")).toBeVisible();

    await page.goto(`/crm/${org.slug}/settings/import-history`);
    const row = page.getByRole("row", { name: /import\.csv/ });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Undo Import" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Undo Import", exact: true })
      .click();
    await expect(page.getByRole("row", { name: /import\.csv/ }).getByText("Undone")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("ImportOne")).toHaveCount(0);
  });

  test("Contacts: Update mode matches by Email", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const id = await createRecord(page, "Contacts", org.slug, {
      Last_Name: "BeforeUpdate",
      Email: "match@example.test",
    });
    await openImport(page, org.slug, "Contacts");
    await uploadCsv(page, "Last Name,Email\nAfterUpdate,match@example.test\n");
    await page.getByRole("radio", { name: /Update existing/ }).check({ force: true });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText(/Import completed/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("count-updated")).toHaveText("1");

    const response = await page.request.get(`/crm/v2.2/Contacts/${id}`, {
      headers: { "X-CRM-ORG": org.slug },
    });
    const body = (await response.json()) as { data: { Last_Name: string }[] };
    expect(body.data[0]?.Last_Name).toBe("AfterUpdate");
  });

  test("Leads: export a view with chosen fields and export selected records", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    for (const name of ["ExportA", "ExportB", "ExportC"]) {
      await createRecord(page, "Leads", org.slug, { Last_Name: name });
    }
    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export Leads" }).click();
    const dialog = page.getByRole("dialog", { name: "Export Leads" });
    await dialog.getByRole("radio", { name: "Choose fields" }).check({ force: true });
    await dialog.getByRole("checkbox", { name: "Last Name", exact: true }).check({ force: true });
    await dialog.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByText("Export completed")).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download" }).click(),
    ]);
    const path = await download.path();
    const { readFile } = await import("node:fs/promises");
    const rows = parseCsv(await readFile(path, "utf8"));
    expect(rows[0]).toEqual(["Last Name"]);
    expect(rows).toHaveLength(4);

    const checks = page.getByRole("checkbox", { name: /Select row/ });
    await checks.nth(0).check({ force: true });
    await checks.nth(1).check({ force: true });
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export Selected Records" }).click();
    const selected = page.getByRole("dialog", { name: "Export Leads" });
    await expect(selected.getByText("Selected records (2)")).toBeVisible();
    await selected.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByText("2 records exported").first()).toBeVisible({ timeout: 15_000 });
  });
});
