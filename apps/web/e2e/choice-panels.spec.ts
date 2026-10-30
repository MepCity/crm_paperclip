import { appendFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

// record-detail.md: Owner 299.5 / search 30 / row 41;
// Country search 303 / search 34 / row 32. Activity mapping is provisional.
function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}

async function checkPanel(page: Page, panel: Locator, owner: boolean, searchable: boolean) {
  await expect(panel).toBeVisible();
  const rect = await panel.boundingBox();
  if (!rect) throw new Error("Missing panel bounds");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
  const trigger = page.locator('.record-choice-trigger[aria-expanded="true"]');
  const triggerWidth = (await trigger.boundingBox())?.width ?? 0;
  if (owner) near(rect.width, Math.max(triggerWidth, 299.5));
  else if (searchable) near(rect.width, Math.max(triggerWidth, 303));
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
    appendFileSync(
      `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/panel-measurements.jsonl`,
      `${JSON.stringify({ viewport: viewport.width, trigger: await trigger.getAttribute("aria-labelledby"), triggerWidth, panelWidth: rect.width, owner, searchable, searchHeight: searchable ? (await panel.getByRole("textbox").boundingBox())?.height : null, rowHeight: (await panel.getByRole("option").first().boundingBox())?.height })}\n`,
    );
  }
  if (searchable) {
    const input = panel.getByRole("textbox");
    near((await input.boundingBox())?.height ?? 0, owner ? 30 : 34);
    near((await input.boundingBox())?.width ?? 0, rect.width - 24);
    if (owner) await expect(input).toHaveAttribute("placeholder", "Search Users");
  }
  const rows = panel.getByRole("option");
  expect(await rows.count()).toBeGreaterThan(0);
  near((await rows.first().boundingBox())?.height ?? 0, owner ? 41 : 32);
  const clipped = await panel
    .locator(".record-choice-text, .record-owner-name, .record-owner-email")
    .evaluateAll((nodes) => nodes.some((node) => node.scrollWidth > node.clientWidth + 1));
  expect(clipped).toBe(false);
  if (owner) {
    await expect(panel.locator(".record-owner-avatar").first()).toBeVisible();
    await expect(panel.locator(".record-owner-name").first()).toBeVisible();
    await expect(panel.locator(".record-owner-email").first()).toBeVisible();
    await expect(panel.locator('[aria-selected="true"] .record-choice-check')).toHaveCount(1);
    near((await panel.locator(".record-owner-avatar").first().boundingBox())?.width ?? 0, 30);
    await expectType(
      page,
      panel.locator(".record-owner-name").first(),
      "--text-md",
      "--font-weight-semibold",
    );
  }
}

test("Leads form and list filter choice panels keep their measured geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page, { email: `p${crypto.randomUUID().slice(0, 8)}@example.test` });
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, "Leads");
  await page.goto(list);
  await page.getByRole("link", { name: "Create Lead", exact: true }).click();
  for (const field of ["Owner", "Country", "Salutation"]) {
    const trigger =
      field === "Salutation"
        ? page.locator(".record-prefix-select .record-choice-trigger").first()
        : page.locator(`[data-form-field="${field}"] .record-choice-trigger`);
    await trigger.click();
    await checkPanel(
      page,
      page.locator(".record-choice-panel"),
      field === "Owner",
      field !== "Salutation",
    );
    await page.keyboard.press("Escape");
  }
  await page.goto(list);
  const filter = page.getByRole("region", { name: "Filter Leads by" });
  const company = filter.getByRole("checkbox", { name: "Company", exact: true });
  await company.scrollIntoViewIfNeeded();
  await expect(company).toBeEnabled();
  await company.focus();
  await page.keyboard.press("Space");
  await filter.getByRole("button", { name: /Company operator$/ }).click();
  const operators = page.locator(".filter-operator-popover");
  near((await operators.boundingBox())?.width ?? 0, 146);
  near((await operators.getByRole("option").first().boundingBox())?.height ?? 0, 27);
  await expect(operators.getByRole("option", { name: "is", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
});

for (const width of [1470, 900]) {
  test(`Task narrow owner and module panels remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 835 });
    await signUpNewUser(page, { email: `p${crypto.randomUUID().slice(0, 8)}@example.test` });
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
    await page.getByRole("link", { name: "Create Task", exact: true }).click();
    await page.locator('[data-form-field="Owner"] .record-choice-trigger').click();
    await checkPanel(page, page.locator(".record-owner-panel"), true, true);
    if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
      await page.screenshot({
        path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/task-owner-${width}.png`,
      });
    }
    await page.keyboard.press("Escape");
    for (const label of ["Contact Name module", "Related To module"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const panel = page.locator(".record-choice-panel");
      await checkPanel(page, panel, false, label === "Related To module");
      await expect(
        panel.getByRole("option", {
          name: label === "Contact Name module" ? "Contact" : "Account",
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });

  test(`Meeting owner panel retains two-line rows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 835 });
    await signUpNewUser(page, { email: `p${crypto.randomUUID().slice(0, 8)}@example.test` });
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Meetings"));
    await page.getByRole("button", { name: "Create Meeting", exact: true }).click();
    await page.locator('[data-form-field="Owner"] .record-choice-trigger').click();
    await checkPanel(page, page.locator(".record-owner-panel"), true, true);
    if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
      await page.screenshot({
        path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/meeting-owner-${width}.png`,
      });
    }
  });
}
