import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("journeys: empty list → create dialog → canvas editor with states & transition → publish → active in list", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/journeys-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to Settings -> Process Management -> CommandCenter: Journey Builder
  await page.goto(`/crm/${org.slug}/settings/commandcenter/journey-builder`);
  await expect(page.getByTestId("journey-empty-state")).toBeVisible();

  // Screenshot 1: empty list
  await page.screenshot({ path: join(evidenceDir, "journeys-empty.png") });

  // 2. Open Create Journey dialog
  const createBtn = page.getByTestId("create-journey-button");
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  const createDialog = page.getByTestId("create-journey-dialog");
  await expect(createDialog).toBeVisible();

  // Screenshot 2: create dialog
  await page.screenshot({ path: join(evidenceDir, "journeys-create-dialog.png") });

  // Fill Name and Module
  await page.getByTestId("journey-name-input").fill("Inbound Lead Journey");
  await page.getByTestId("journey-module-select").selectOption("Leads");
  await page
    .getByTestId("journey-description-input")
    .fill("Automated qualification sequence for inbound leads.");

  // Click Next -> Navigates to canvas editor
  await page.getByTestId("journey-next-button").click();
  await expect(page.getByTestId("journey-editor-name")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("journey-editor-name")).toHaveText("Inbound Lead Journey");
  await expect(page.getByTestId("journey-status-badge")).toHaveText(/draft/i);

  // 3. Add second state and transition
  await page.getByTestId("add-state-button").click();
  await expect(page.getByText("State 2")).toBeVisible();

  await page.getByTestId("add-transition-button").click();

  // Select start state to view state property panel
  await page.getByTestId("journey-state-card-state_start").click();
  await expect(page.getByTestId("journey-property-panel")).toBeVisible();
  await expect(page.getByTestId("state-name-input")).toHaveValue("Start");

  // Screenshot 3: canvas editor with property panel
  await page.screenshot({ path: join(evidenceDir, "journeys-editor-property-panel.png") });

  // 4. Click Publish
  await page.getByTestId("journey-publish-button").click();
  await expect(page.getByTestId("journey-status-badge")).toHaveText(/active/i, { timeout: 10_000 });

  // 5. Return to list
  await page.getByTestId("journey-editor-back").click();
  await expect(page.getByText("Inbound Lead Journey")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Active")).toBeVisible();

  // Screenshot 4: list with active row
  await page.screenshot({ path: join(evidenceDir, "journeys-list-active.png") });
});
