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
  await page.getByRole("button", { name: "More", exact: true }).click();
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

  test("Leads: import with a failed row, history, undo", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openImport(page, org.slug, "Leads");
    await uploadCsv(
      page,
      "Last Name,Company,Email\nImportOne,Acme,one@example.test\nImportTwo,Acme,two@example.test\n,Acme,three@example.test\n",
    );
    await page.getByRole("radio", { name: /Add as new/ }).check({ force: true });
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(page.getByText(/Import completed/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("count-added")).toHaveText("2");
    await expect(page.getByTestId("count-skipped")).toHaveText("0");
    await expect(page.getByTestId("count-failed")).toHaveText("1");
    await page.getByRole("button", { name: "Done" }).click();

    await expect(page).toHaveURL(/\/tab\/Leads\/list/);
    await expect(page.getByRole("link", { name: "ImportOne" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "ImportTwo" })).toBeVisible();

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
    await expect(page.getByRole("link", { name: "ImportOne" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ImportTwo" })).toHaveCount(0);
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
      await createRecord(page, "Leads", org.slug, { Last_Name: name, Company: "Acme" });
    }
    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export Leads" }).click();
    const dialog = page.getByRole("dialog", { name: "Export Leads" });
    await dialog.getByRole("radio", { name: "Choose fields" }).check({ force: true });
    await dialog.getByRole("checkbox", { name: "Company", exact: true }).check({ force: true });
    await dialog.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByText("Export completed")).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download" }).click(),
    ]);
    const path = await download.path();
    const { readFile } = await import("node:fs/promises");
    const rows = parseCsv(await readFile(path, "utf8"));
    expect(rows[0]).toEqual(["Record Id", "Company"]);
    expect(rows.filter((row) => row[1] === "Acme")).toHaveLength(3);

    const checks = page.getByRole("checkbox", { name: /^Select (?!all)/ });
    await checks.nth(0).check({ force: true });
    await checks.nth(1).check({ force: true });
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export Selected Records" }).click();
    const selected = page.getByRole("dialog", { name: "Export Leads" });
    await expect(selected.getByText("Selected records (2)")).toBeVisible();
    await selected.getByRole("button", { name: "Export", exact: true }).click();
    const notification = page
      .getByRole("alertdialog", { name: "Export completed" })
      .filter({ hasText: /2 records exported/ });
    await expect(notification).toBeVisible({ timeout: 15_000 });
    const [selectedDownload] = await Promise.all([
      page.waitForEvent("download"),
      notification.getByRole("button", { name: "Download", exact: true }).click(),
    ]);
    const selectedRows = parseCsv(await readFile(await selectedDownload.path(), "utf8"));
    expect(selectedRows).toHaveLength(3);
    expect(new Set(selectedRows.slice(1).map((row) => row[0])).size).toBe(2);
    await notification.getByRole("link", { name: "View export history" }).click();
    await expect(page).toHaveURL(/\/settings\/export-history/);
    await expect(page.getByRole("row", { name: /Selected records/ })).toBeVisible();
  });
});

for (const { label, csv } of [
  { module: "Tasks", label: "Tasks", csv: "Subject\nCSV Task\n" },
  {
    module: "Events",
    label: "Meetings",
    csv: "Event_Title,Start_DateTime,End_DateTime,Meeting_Venue__s\nCSV Meeting,2026-11-01T09:00:00Z,2026-11-01T10:00:00Z,Client location\n",
  },
  {
    module: "Calls",
    label: "Calls",
    csv: "Subject,Call_Type,Call_Start_Time,Call_Duration\nCSV Call,Outbound,2026-11-01T09:00:00Z,01:00\n",
  },
]) {
  test(`${label}: import related records, export view and selection, and show histories`, async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const accountId = await createRecord(page, "Accounts", org.slug, {
      Account_Name: "CSV Parent",
    });
    const contactId = await createRecord(page, "Contacts", org.slug, { Last_Name: "CSV Contact" });
    await page.goto(moduleListDefaultPath(org.slug, label));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: `Import ${label}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tab/${label}/import`));
    const [header = "", values = ""] = csv.trim().split("\n");
    await uploadCsv(
      page,
      `${header},What_Id,$se_module,Who_Id\n${values},${accountId},Accounts,${contactId}\n`,
    );
    await page.getByRole("radio", { name: /Add as new/ }).check({ force: true });
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.getByRole("tab", { name: `Mapped (${header.split(",").length + 3})` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByTestId("count-added")).toHaveText("1", { timeout: 15_000 });
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const title = values.split(",")[0] ?? "";
    const row = page
      .getByRole("row")
      .filter({ has: page.getByRole("link", { name: title, exact: true }) });
    await expect(row).toBeVisible();
    await expect(row).toContainText("CSV Parent");
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: `Export ${label}`, exact: true }).click();
    await page
      .getByRole("dialog", { name: `Export ${label}` })
      .getByRole("button", { name: "Export", exact: true })
      .click();
    await expect(page.getByRole("alertdialog", { name: "Export completed" })).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("alertdialog", { name: "Export completed" })
      .getByRole("button", { name: "Close" })
      .click();
    await row.getByRole("checkbox").check({ force: true });
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export Selected Records", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Export ${label}` });
    await expect(dialog.getByText("Selected records (1)")).toBeVisible();
    await dialog.getByRole("button", { name: "Export", exact: true }).click();
    const notification = page
      .getByRole("alertdialog", { name: "Export completed" })
      .filter({ hasText: /1 records exported/ });
    await expect(notification).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      notification.getByRole("button", { name: "Download", exact: true }).click(),
    ]);
    const { readFile } = await import("node:fs/promises");
    const rows = parseCsv(await readFile(await download.path(), "utf8"));
    expect(rows).toHaveLength(2);
    expect(rows[1]).toContain(title);
    expect(rows[1]?.[rows[0]?.indexOf("Related To Id") ?? -1]).toBe(accountId);
    expect(rows[1]?.[rows[0]?.indexOf("Contact Name Id") ?? -1]).toBe(contactId);
    await page.goto(`/crm/${org.slug}/settings/import-history`);
    await expect(
      page
        .getByRole("row", { name: /import\.csv/ })
        .getByRole("cell", { name: label, exact: true }),
    ).toBeVisible();
    await page.goto(`/crm/${org.slug}/settings/export-history`);
    await expect(page.getByRole("cell", { name: label, exact: true })).toHaveCount(2);
  });
}
