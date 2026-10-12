import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const CONTACTS = "Contacts";
const LEADS = "Leads";

async function createRecord(
  page: Page,
  module: string,
  orgSlug: string,
  fields: Record<string, string>,
): Promise<string> {
  const response = await page.request.post(`/crm/v2.2/${module}`, {
    headers: { "X-CRM-ORG": orgSlug, Origin: new URL(page.url()).origin },
    data: { data: [fields] },
  });
  expect(
    response.ok(),
    `create failed with ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
  const body = (await response.json()) as { data: { details: { id: string } }[] };
  return body.data[0]?.details.id ?? "";
}

async function recordStatus(page: Page, module: string, orgSlug: string, id: string) {
  const response = await page.request.get(`/crm/v2.2/${module}/${id}`, {
    headers: { "X-CRM-ORG": orgSlug },
  });
  return response.status();
}

async function openDedupPanel(page: Page, module: string) {
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: `Deduplicate ${module}` }).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: "Select Field" })).toBeVisible();
  return panel;
}

async function toggleField(panel: ReturnType<Page["getByRole"]>, name: string) {
  const box = panel.getByRole("checkbox", { name, exact: true });
  if (await box.isChecked()) await box.uncheck({ force: true });
  else await box.check({ force: true });
}

async function runCleanup(page: Page, module: string) {
  const panel = page.getByRole("dialog");
  await panel.getByRole("button", { name: "Find And Merge Duplicates" }).click();
  const confirm = page.getByRole("dialog", { name: `Deduplicate ${module}` });
  await expect(confirm.getByText(/You are about to run the de-duplication check/)).toBeVisible();
  await expect(confirm.getByRole("link", { name: "Learn More" })).toBeVisible();
  await confirm.getByRole("button", { name: "Yes, proceed" }).click();
  const notice = page.getByRole("dialog", { name: "Deduplication started" });
  await expect(notice.getByText(/Deduplication will take few minutes/)).toBeVisible();
  await notice.getByRole("button", { name: "OK" }).click();
}

test.describe("Module-wide deduplication", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Contacts: merges identical records and resolves the conflicting group", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const twinA = await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Dana",
      Last_Name: "AutoMerge",
      Email: "auto-merge@example.test",
    });
    const twinB = await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Dana",
      Last_Name: "AutoMerge",
    });
    const pairA = await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Cira",
      Last_Name: "ConflictCase",
      Phone: "555-0101",
    });
    const pairB = await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Cira",
      Last_Name: "ConflictCase",
      Phone: "555-0102",
    });

    await page.goto(moduleListDefaultPath(org.slug, CONTACTS));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    const panel = await openDedupPanel(page, CONTACTS);
    await expect(
      panel.getByText("Select the fields you want to identify duplicate Contacts with."),
    ).toBeVisible();
    await expect(panel.getByText("Maximum of 3 fields can be selected.")).toBeVisible();
    // Email is the interim default set; the cleanup runs on the family name instead.
    await toggleField(panel, "Email");
    await toggleField(panel, "Last Name");
    await runCleanup(page, CONTACTS);

    const popup = page.getByRole("dialog", { name: "Deduplicate Contacts" });
    await expect(popup.getByText("1 duplicate group merged and 1 record removed.")).toBeVisible();
    await expect(popup.getByText("A Few duplicate Contacts with conflicts found.")).toBeVisible();
    await expect(popup.getByRole("link", { name: "Do it later" })).toBeVisible();
    await popup.getByRole("button", { name: "Resolve Now" }).click();

    await expect(page).toHaveURL(new RegExp(`/tab/${CONTACTS}/deduplicate\\?fields=Last_Name`));
    const groups = page.getByRole("table", { name: "Duplicate groups with conflicts" });
    await expect(groups.getByRole("columnheader", { name: "Last Name" })).toBeVisible();
    await expect(groups.getByRole("columnheader", { name: "Duplicates" })).toBeVisible();
    await expect(groups.getByText("ConflictCase")).toBeVisible();
    await expect(groups.getByText("2", { exact: true })).toBeVisible();

    await groups.getByRole("button", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: "Merge Records" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Show Conflicts Only" })).toBeVisible();
    await page.getByRole("button", { name: "Merge", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Merge", exact: true }).click();

    // The last conflict group is resolved, so the module list takes over again.
    await expect(page).toHaveURL(new RegExp(`/tab/${CONTACTS}/list`), { timeout: 15_000 });
    const twins = await Promise.all(
      [twinA, twinB].map((id) => recordStatus(page, CONTACTS, org.slug, id)),
    );
    const conflicts = await Promise.all(
      [pairA, pairB].map((id) => recordStatus(page, CONTACTS, org.slug, id)),
    );
    expect(twins.filter((status) => status === 200)).toHaveLength(1);
    expect(conflicts.filter((status) => status === 200)).toHaveLength(1);
  });

  test("Contacts: Do it later closes the notice and keeps the list", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Cira",
      Last_Name: "DeferCase",
      Phone: "555-0201",
    });
    await createRecord(page, CONTACTS, org.slug, {
      First_Name: "Cira",
      Last_Name: "DeferCase",
      Phone: "555-0202",
    });
    await page.goto(moduleListDefaultPath(org.slug, CONTACTS));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    const panel = await openDedupPanel(page, CONTACTS);
    await toggleField(panel, "Email");
    await toggleField(panel, "Last Name");
    await runCleanup(page, CONTACTS);

    const popup = page.getByRole("dialog", { name: "Deduplicate Contacts" });
    await popup.getByRole("link", { name: "Do it later" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  });

  test("Leads: merges identical records on the match field", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const lead = {
      First_Name: "Ada",
      Last_Name: "Lovelace",
      Company: "Analytical Engine",
      Email: "lead-merge@example.test",
      Phone: "444-0001",
    };
    const first = await createRecord(page, LEADS, org.slug, lead);
    const second = await createRecord(page, LEADS, org.slug, lead);

    await page.goto(moduleListDefaultPath(org.slug, LEADS));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    const panel = await openDedupPanel(page, LEADS);
    const rows = panel.locator("[data-dedup-field-dialog] ul li label");
    await expect(rows.nth(0)).toHaveText("Email");
    await expect(rows.nth(1)).toHaveText("Company");
    await expect(rows.nth(2)).toHaveText("Phone");
    await expect(rows.nth(3)).toHaveText("Mobile");
    await expect(panel.getByRole("checkbox", { name: "Email", exact: true })).toBeChecked();
    await runCleanup(page, LEADS);

    await expect(page.getByRole("alert")).toContainText(
      "1 duplicate group merged and 1 record removed.",
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const statuses = await Promise.all(
      [first, second].map((id) => recordStatus(page, LEADS, org.slug, id)),
    );
    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
  });

  test("Leads: the field panel refuses a fourth field", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    const panel = await openDedupPanel(page, LEADS);
    await toggleField(panel, "Company");
    await toggleField(panel, "Phone");
    const mobile = panel.getByRole("checkbox", { name: "Mobile", exact: true });
    await expect(mobile).toBeDisabled();
    await mobile.click({ force: true });
    await expect(mobile).not.toBeChecked();
    await expect(panel.getByRole("checkbox", { name: "Email", exact: true })).toBeChecked();
    await panel.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
