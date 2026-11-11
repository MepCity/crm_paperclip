import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("cadences: C1 empty list → C1a/C1b filter menus → C2 create dialog → editor 3 steps → publish and status toggling", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/cadences-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to Settings -> Cadences
  await page.goto(`/crm/${org.slug}/settings/cadences`);
  await expect(page.getByTestId("cadence-empty-state")).toBeVisible();

  // Screenshot 1: C1 Empty state
  await page.screenshot({ path: join(evidenceDir, "cadences-c1-empty.png") });

  // Verify contextual help marker
  const helpMarker = page.getByTestId("cadence-help-marker");
  await expect(helpMarker).toBeVisible();
  await expect(helpMarker).toHaveAttribute("href", "https://help.crm.reference/cadences");

  // Screenshot 2: C1a All Modules filter menu open
  const moduleFilterBtn = page.getByTestId("module-filter-button");
  await expect(moduleFilterBtn).toBeVisible();
  await moduleFilterBtn.click();
  await expect(page.getByTestId("module-filter-menu")).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, "cadences-c1a-module-filter.png") });
  // Close menu
  await moduleFilterBtn.click();
  await expect(page.getByTestId("module-filter-menu")).toBeHidden();

  // Screenshot 3: C1b Status filter menu open
  const statusFilterBtn = page.getByTestId("status-filter-button");
  await expect(statusFilterBtn).toBeVisible();
  await statusFilterBtn.click();
  await expect(page.getByTestId("status-filter-menu")).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, "cadences-c1b-status-filter.png") });
  // Close menu
  await statusFilterBtn.click();
  await expect(page.getByTestId("status-filter-menu")).toBeHidden();

  // 2. Open C2 Create Cadence Dialog
  const createBtn = page.getByTestId("create-cadence-button");
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  const createDialog = page.getByTestId("create-cadence-dialog");
  await expect(createDialog).toBeVisible();

  // Next is disabled initially
  const nextBtn = page.getByTestId("cadence-next-button");
  await expect(nextBtn).toBeDisabled();

  // Audience select is disabled until module is chosen
  const audienceSelect = page.getByTestId("cadence-audience-select");
  await expect(audienceSelect).toBeDisabled();

  // Screenshot 4: C2 Create Dialog
  await page.screenshot({ path: join(evidenceDir, "cadences-c2-dialog.png") });

  // Fill Name
  const nameInput = page.getByTestId("cadence-name-input");
  await nameInput.fill("Inbound Lead Nurturing");
  await expect(nextBtn).toBeDisabled();

  // Select Module
  const moduleSelect = page.getByTestId("cadence-module-select");
  await moduleSelect.selectOption("Leads");

  // Now audience select is enabled and default is manual, enabling Next
  await expect(audienceSelect).toBeEnabled();
  await expect(nextBtn).toBeEnabled();

  // Fill Description
  const descInput = page.getByTestId("cadence-description-input");
  await descInput.fill("Standard sequence for inbound prospect outreach.");

  // Click Next -> Navigates to editor
  await nextBtn.click();
  await expect(page.getByTestId("cadence-editor-name")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("cadence-editor-name")).toHaveText("Inbound Lead Nurturing");
  await expect(page.getByTestId("cadence-status-badge")).toHaveText("Draft");

  // 3. Add Step 1 (Email)
  await page.getByTestId("add-email-step-button").click();
  await expect(page.getByTestId("cadence-step-modal")).toBeVisible();
  await page.getByTestId("step-email-name-input").fill("Welcome Introduction Email");
  await page.getByTestId("step-delay-amount-input").fill("1");
  await page.getByTestId("step-save-button").click();
  await expect(page.getByTestId("cadence-step-0")).toBeVisible();

  // 4. Add Step 2 (Task)
  await page.getByTestId("add-task-step-button").click();
  await expect(page.getByTestId("cadence-step-modal")).toBeVisible();
  await page.getByTestId("step-task-subject-input").fill("Review Prospect Activity");
  await page.getByTestId("step-delay-amount-input").fill("2");
  await page.getByTestId("step-save-button").click();
  await expect(page.getByTestId("cadence-step-1")).toBeVisible();

  // 5. Add Step 3 (Call)
  await page.getByTestId("add-call-step-button").click();
  await expect(page.getByTestId("cadence-step-modal")).toBeVisible();
  await page.getByTestId("step-call-subject-input").fill("Follow-up Discovery Call");
  await page.getByTestId("step-delay-amount-input").fill("3");
  await page.getByTestId("step-save-button").click();
  await expect(page.getByTestId("cadence-step-2")).toBeVisible();

  // 6. Toggle Exit Rules
  await page.getByTestId("exit-rule-reply-checkbox").check();
  await page.getByTestId("exit-rule-meeting-checkbox").check();

  // Screenshot 5: Editor with 3 steps and exit rules
  await page.screenshot({ path: join(evidenceDir, "cadences-editor-3steps.png") });

  // 7. Save Draft
  const saveDraftBtn = page.getByTestId("cadence-save-draft-button");
  await saveDraftBtn.click();
  await expect(page.getByText("Draft version saved successfully")).toBeVisible();

  // 8. Publish Cadence
  const publishBtn = page.getByTestId("cadence-publish-button");
  await publishBtn.click();
  await expect(page.getByTestId("cadence-status-badge")).toHaveText("Active");

  // 9. Deactivate and Activate Toggles
  const toggleStatusBtn = page.getByTestId("cadence-toggle-status-button");
  await expect(toggleStatusBtn).toBeVisible();
  await toggleStatusBtn.click();
  await expect(page.getByTestId("cadence-status-badge")).toHaveText("Inactive");

  await toggleStatusBtn.click();
  await expect(page.getByTestId("cadence-status-badge")).toHaveText("Active");

  // 10. Back to Cadences List Screen
  const backBtn = page.getByTestId("cadence-editor-back");
  await backBtn.click();
  await expect(page.getByText("Inbound Lead Nurturing")).toBeVisible();
  await expect(page.getByTestId("cadence-search-input")).toBeVisible();

  // 11. Navigate to Leads list and open first lead
  await page.goto(`/crm/${org.slug}/tab/Leads/list`);
  const recordTable = page.getByRole("table", { name: "Records" });
  await expect(recordTable).toBeVisible({ timeout: 15_000 });
  const firstLeadLink = recordTable.locator("tbody tr").first().locator("a").first();
  await firstLeadLink.click();

  // 12. Record detail More Options -> Enroll to Cadence
  const moreBtn = page.getByRole("button", { name: "More Options" });
  await expect(moreBtn).toBeVisible({ timeout: 10_000 });
  await moreBtn.click();
  const menu = page.getByRole("menu", { name: "More Options" });
  await expect(menu).toBeVisible();
  const enrollItem = menu.getByRole("menuitem", { name: "Enroll to Cadence" });
  await expect(enrollItem).toBeVisible();
  await enrollItem.click();

  // 13. Enroll dialog opens, shows active cadence, click Enroll
  const enrollDialog = page.getByRole("dialog", { name: "Enroll to Cadence" });
  await expect(enrollDialog).toBeVisible();
  const enrollBtn = enrollDialog.getByRole("button", { name: "Enroll" });
  await expect(enrollBtn).toBeEnabled();
  await enrollBtn.click();
  await expect(enrollDialog).toBeHidden();

  // 14. Verify Cadences related list on Lead detail
  const cadencesCard = page.locator('[data-related-card="cadences"]');
  await cadencesCard.scrollIntoViewIfNeeded();
  await expect(cadencesCard).toBeVisible();

  const cadencesTable = cadencesCard.getByTestId("cadences-related-table");
  await expect(cadencesTable).toBeVisible({ timeout: 10_000 });
  await expect(cadencesTable.getByText("Inbound Lead Nurturing")).toBeVisible();
  await expect(cadencesTable.getByText("Active")).toBeVisible();

  // Screenshot: Lead detail with Cadences card
  await page.screenshot({ path: join(evidenceDir, "cadences-lead-detail-card.png") });

  // Test Pause action in related list row
  const pauseBtn = cadencesTable.locator('[data-testid^="cadence-pause-"]');
  await expect(pauseBtn).toBeVisible();
  await pauseBtn.click();
  await expect(cadencesTable.getByText("Paused")).toBeVisible();

  // Test Resume action
  const resumeBtn = cadencesTable.locator('[data-testid^="cadence-resume-"]');
  await expect(resumeBtn).toBeVisible();
  await resumeBtn.click();
  await expect(cadencesTable.getByText("Active")).toBeVisible();

  // 15. Navigate to Cadences list screen and verify Number of Records column
  await page.goto(`/crm/${org.slug}/settings/cadences`);
  await expect(page.getByTestId("cadence-search-input")).toBeVisible();
  const cadenceRow = page.locator("tbody tr").first();
  await expect(cadenceRow).toBeVisible();
  await expect(cadenceRow.getByText("Inbound Lead Nurturing")).toBeVisible();
  // Verify Number of Records is 1
  await expect(cadenceRow.locator("td").nth(3)).toHaveText("1");

  // Screenshot: C1 with row
  await page.screenshot({ path: join(evidenceDir, "cadences-c1-with-row.png") });

  // 16. Navigate to Cadence editor and click Reports
  await cadenceRow.click();
  await expect(page.getByTestId("cadence-editor-name")).toBeVisible({ timeout: 15_000 });
  const reportsBtn = page.getByTestId("cadence-reports-button");
  await expect(reportsBtn).toBeVisible();
  await reportsBtn.click();

  // 17. Verify Cadence Report Screen
  await expect(page.getByTestId("report-cadence-title")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("report-cadence-title")).toContainText("Inbound Lead Nurturing");
  await expect(page.getByTestId("kpi-enrolled")).toHaveText("1");
  await expect(page.getByTestId("kpi-active")).toHaveText("1");

  // Test Date range filter button
  await expect(page.getByTestId("report-range-7d")).toBeVisible();
  const range30Btn = page.getByTestId("report-range-30d");
  await expect(range30Btn).toBeVisible();
  await range30Btn.click();
  await expect(page.getByTestId("kpi-enrolled")).toHaveText("1");

  // Screenshot: Cadence Report Page
  await page.screenshot({ path: join(evidenceDir, "cadences-report-page.png") });
});
