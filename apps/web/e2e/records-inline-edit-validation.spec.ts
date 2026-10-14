import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

/**
 * Inline-edit validation tests for required text fields across Accounts
 * and Deals detail screens.  Contacts is omitted: its detail screen shows
 * "Contact Name" as a read-only composite, so Last Name has no inline editor.
 *
 * Acceptance criteria (from MEP-551):
 *  1. Clearing a required field and saving shows the validation message,
 *     keeps the editor open, and does not persist a bad value.
 *  2. Cancel (button) and Escape restore the original value without saving.
 *  3. After a page reload the stored value is unchanged.
 *
 * Only real, current behaviour is pinned here.  If a case is broken in
 * production it must NOT be included (no skip/fixme).
 */

// ---------------------------------------------------------------------------
// Fixture IDs that match packages/core/src/records/fixture/*/seed.ts
// ---------------------------------------------------------------------------
const ACCOUNT_RECORD_ID = "500000000000000000"; // Account_Name: "Account 001"
const DEAL_RECORD_ID = "700000000000000000"; // Deal_Name: "Deal 001"

// ---------------------------------------------------------------------------
// Navigation helpers (mirror the pattern used in *-detail.spec.ts files)
// ---------------------------------------------------------------------------

async function openDetail(
  page: import("@playwright/test").Page,
  orgSlug: string,
  module: string,
  recordId: string,
) {
  const listUrl = moduleListDefaultPath(orgSlug, module);
  await page.goto(listUrl);
  // Wait for the list to confirm the org + module are ready before navigating
  // to the detail page (avoids 404-race on fresh org sessions).
  await expect(page.locator("table[aria-label='Records'], [data-record-board]")).toBeVisible({
    timeout: 15_000,
  });
  await page.goto(moduleRecordPath(orgSlug, module, recordId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

// ---------------------------------------------------------------------------
// Shared helper: open an inline text editor, clear the field, save, and
// verify the validation error message is shown with the editor still open.
// ---------------------------------------------------------------------------

async function verifyClearAndSaveShowsError(
  page: import("@playwright/test").Page,
  fieldApiName: string,
  fieldLabel: string,
  { editButtonLabel, valueButtonLabel }: { editButtonLabel: string; valueButtonLabel: string },
) {
  const row = page.locator(`[data-detail-field="${fieldApiName}"]`);
  await row.hover();
  await row.getByRole("button", { name: editButtonLabel, exact: true }).click();
  const input = row.getByRole("textbox", { name: fieldLabel });
  await input.fill("");
  await row.getByRole("button", { name: "Save", exact: true }).click();
  // 1a. Validation message is visible inside the row.
  await expect(row).toContainText(`${fieldLabel} cannot be empty.`);
  // 1b. Editor (the textbox) is still open — the save was rejected.
  await expect(input).toBeVisible();
  // 1c. Value button is gone — we are still in edit mode.
  await expect(row.getByRole("button", { name: valueButtonLabel })).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Accounts · Account Name
// ---------------------------------------------------------------------------

test.describe("Inline-edit validation – Accounts Account Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("clearing Account Name and saving shows validation error with editor still open", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Accounts", ACCOUNT_RECORD_ID);

    await verifyClearAndSaveShowsError(page, "Account_Name", "Account Name", {
      editButtonLabel: "Edit Account Name",
      valueButtonLabel: "Edit Account Name value",
    });

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Cancel button on Account Name editor restores the original value", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Accounts", ACCOUNT_RECORD_ID);

    const row = page.locator('[data-detail-field="Account_Name"]');
    const original = await row.getByRole("button", { name: "Edit Account Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Account Name", exact: true }).click();
    await row.getByRole("textbox", { name: "Account Name" }).fill("");
    await row.getByRole("button", { name: "Cancel", exact: true }).click();

    await expect(row.getByRole("button", { name: "Edit Account Name value" })).toHaveText(original);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Escape key on Account Name editor restores the original value", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Accounts", ACCOUNT_RECORD_ID);

    const row = page.locator('[data-detail-field="Account_Name"]');
    const original = await row.getByRole("button", { name: "Edit Account Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Account Name", exact: true }).click();
    const input = row.getByRole("textbox", { name: "Account Name" });
    await input.fill("temporary value");
    await page.keyboard.press("Escape");

    await expect(row.getByRole("button", { name: "Edit Account Name value" })).toHaveText(original);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("stored Account Name is unchanged after page reload when edit was cancelled", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Accounts", ACCOUNT_RECORD_ID);

    const row = page.locator('[data-detail-field="Account_Name"]');
    const original = await row.getByRole("button", { name: "Edit Account Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Account Name", exact: true }).click();
    await row.getByRole("textbox", { name: "Account Name" }).fill("");
    await row.getByRole("button", { name: "Cancel", exact: true }).click();

    await page.reload();
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    const reloaded = page.locator('[data-detail-field="Account_Name"]');
    await expect(reloaded.getByRole("button", { name: "Edit Account Name value" })).toHaveText(
      original,
    );

    ignoreFailedResponses(pageErrors, [400]);
  });
});

// ---------------------------------------------------------------------------
// Deals · Deal Name
// ---------------------------------------------------------------------------

test.describe("Inline-edit validation – Deals Deal Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("clearing Deal Name and saving shows validation error with editor still open", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Deals", DEAL_RECORD_ID);

    await verifyClearAndSaveShowsError(page, "Deal_Name", "Deal Name", {
      editButtonLabel: "Edit Deal Name",
      valueButtonLabel: "Edit Deal Name value",
    });

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Cancel button on Deal Name editor restores the original value", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Deals", DEAL_RECORD_ID);

    const row = page.locator('[data-detail-field="Deal_Name"]');
    const original = await row.getByRole("button", { name: "Edit Deal Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Deal Name", exact: true }).click();
    await row.getByRole("textbox", { name: "Deal Name" }).fill("");
    await row.getByRole("button", { name: "Cancel", exact: true }).click();

    await expect(row.getByRole("button", { name: "Edit Deal Name value" })).toHaveText(original);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Escape key on Deal Name editor restores the original value", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Deals", DEAL_RECORD_ID);

    const row = page.locator('[data-detail-field="Deal_Name"]');
    const original = await row.getByRole("button", { name: "Edit Deal Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Deal Name", exact: true }).click();
    const input = row.getByRole("textbox", { name: "Deal Name" });
    await input.fill("temporary value");
    await page.keyboard.press("Escape");

    await expect(row.getByRole("button", { name: "Edit Deal Name value" })).toHaveText(original);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("stored Deal Name is unchanged after page reload when edit was cancelled", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDetail(page, org.slug, "Deals", DEAL_RECORD_ID);

    const row = page.locator('[data-detail-field="Deal_Name"]');
    const original = await row.getByRole("button", { name: "Edit Deal Name value" }).innerText();

    await row.hover();
    await row.getByRole("button", { name: "Edit Deal Name", exact: true }).click();
    await row.getByRole("textbox", { name: "Deal Name" }).fill("");
    await row.getByRole("button", { name: "Cancel", exact: true }).click();

    await page.reload();
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    const reloaded = page.locator('[data-detail-field="Deal_Name"]');
    await expect(reloaded.getByRole("button", { name: "Edit Deal Name value" })).toHaveText(
      original,
    );

    ignoreFailedResponses(pageErrors, [400]);
  });
});
