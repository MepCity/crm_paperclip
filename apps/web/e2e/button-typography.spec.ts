import type { Locator } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

async function expectNoClippedLabel(button: Locator) {
  const overflow = await button.evaluate((element) => {
    const nodes = [element, ...element.querySelectorAll("span")];
    return nodes
      .filter((node) => node.clientWidth > 0)
      .map((node) => ({
        text: node.textContent,
        width: node.clientWidth,
        content: node.scrollWidth,
      }));
  });
  for (const node of overflow)
    expect(node.content, node.text ?? "label").toBeLessThanOrEqual(node.width);
}

test.use({ viewport: { width: 1470, height: 835 } });

test("default command buttons use the standard command text role", async ({ page }) => {
  await page.goto("/dev/ui");
  // typography.md > List and detail text roles: Command & buttons use --text-md,
  // and the adopted Semibold role is --font-weight-semibold.
  for (const name of ["Primary", "Secondary", "Ghost", "Danger"]) {
    const button = page.getByRole("button", { name, exact: true }).first();
    await expectType(page, button, "--text-md", "--font-weight-semibold");
    await expectNoClippedLabel(button);
  }
});

test("Attach matches the measured related-card action", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  await page.goto(moduleRecordPath(org.slug, "Leads", "100000000000000000"));
  const attach = page
    .locator("#related-list-attachments")
    .getByRole("button", { name: "Attach", exact: true });
  await attach.scrollIntoViewIfNeeded();
  // typography.md > Related-list card action maps cap/x 9.5/7 to --text-sm.
  await expectType(page, attach, "--text-sm", "--font-weight-semibold");
  // record-detail.md > Related-list card > Card shell: x1359.5–1438, y193–220.
  const box = await attach.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs((box?.width ?? 0) - 78.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((box?.height ?? 0) - 27)).toBeLessThanOrEqual(1);
  await expect(attach).toHaveCSS("border-width", "1px");
  await expect(attach).toHaveCSS("border-color", "rgb(84, 100, 242)");
  await expect(attach).toHaveCSS("background-color", "rgb(240, 241, 255)");
  await expect(attach).toHaveCSS("color", "rgb(84, 100, 242)");
  await expectNoClippedLabel(attach);
});
