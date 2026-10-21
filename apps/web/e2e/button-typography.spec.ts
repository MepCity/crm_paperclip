import type { Locator } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

async function expectNoClippedLabel(button: Locator) {
  const overflow = await button.evaluate((element) => {
    const nodes = [element, ...element.querySelectorAll("span")];
    return nodes
      .filter((node) => node.clientWidth > 0 && Boolean(node.textContent?.trim()))
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

// record-detail.md > Existing-capture button measurements, at 1470 × 835.
test("record controls retain measured geometry and never cover the page footer", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signUpNewUser(page);
  const org = await createOrganization(page);
  for (const [module, id] of [
    ["Leads", "100000000000000000"],
    ["Contacts", "300000000000000000"],
    ["Accounts", "500000000000000000"],
    ["Deals", "700000000000000000"],
  ] as const) {
    await page.goto(moduleListDefaultPath(org.slug, module));
    await expect(page.locator("[data-record-board], table[aria-label='Records']")).toBeVisible();
    // List toolbar commands, including the create link.
    for (const button of await page
      .locator("[data-list-toolbar] button:visible, [data-list-toolbar] a:visible")
      .all()) {
      if (await button.evaluate((el) => el.classList.contains("whitespace-nowrap")))
        await expectNoClippedLabel(button);
    }
    await page.goto(moduleRecordPath(org.slug, module, id));
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    for (const button of await page.locator("[data-related-card] button").all()) {
      await expectNoClippedLabel(button);
    }
    const column = page.getByRole("button", { name: "Column View", exact: true }).first();
    if (await column.count()) {
      await expectType(page, column, "--text-sm", "--font-weight-normal");
      const box = await column.boundingBox();
      expect(Math.abs((box?.width ?? 0) - 117)).toBeLessThanOrEqual(1);
      expect(Math.abs((box?.height ?? 0) - 27)).toBeLessThanOrEqual(1);
      await expect(column).toHaveCSS("border-color", "rgb(197, 196, 211)");
      await expect(column).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(column).toHaveCSS("color", "rgb(49, 57, 73)");
    }
    const campaigns = page
      .locator("[data-related-card]")
      .getByRole("button", { name: "Add Campaigns", exact: true });
    if (await campaigns.count()) {
      await expectType(page, campaigns, "--text-sm", "--font-weight-semibold");
      const box = await campaigns.boundingBox();
      expect(Math.abs((box?.width ?? 0) - 122)).toBeLessThanOrEqual(1);
      expect(Math.abs((box?.height ?? 0) - 27)).toBeLessThanOrEqual(1);
      await expect(campaigns).toHaveCSS("background-color", "rgb(240, 241, 255)");
      await expect(campaigns).toHaveCSS("color", "rgb(84, 100, 242)");
    }
    const footer = page.locator("[data-record-footer]");
    await footer.scrollIntoViewIfNeeded();
    const standard = footer.getByRole("button", { name: "Standard View", exact: true });
    const custom = footer.getByRole("button", { name: "Create a custom record page", exact: true });
    for (const [button, width, height] of [
      [standard, 150, 34],
      [custom, 218, 32],
    ] as const) {
      await expectType(page, button, "--text-md", "--font-weight-normal");
      const box = await button.boundingBox();
      expect(Math.abs((box?.width ?? 0) - width)).toBeLessThanOrEqual(1);
      expect(Math.abs((box?.height ?? 0) - height)).toBeLessThanOrEqual(1);
      await expectNoClippedLabel(button);
    }
    await expect(standard).toHaveCSS("border-color", "rgb(197, 196, 211)");
    await expect(standard).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(custom).toHaveCSS("border-color", "rgb(213, 216, 233)");
    await expect(custom).toHaveCSS("color", "rgb(49, 57, 73)");
    await expect(custom).toHaveCSS(
      "background-image",
      /rgb\(255, 255, 255\).*rgb\(241, 240, 247\)/,
    );
    const standardBox = await standard.boundingBox();
    const customBox = await custom.boundingBox();
    expect(
      Math.abs((customBox?.x ?? 0) - (standardBox?.x ?? 0) - (standardBox?.width ?? 0) - 19.5),
    ).toBeLessThanOrEqual(1);
    const top = page.getByRole("button", { name: "Scroll To Top" });
    await expect(top).toBeVisible();
    const topBox = await top.boundingBox();
    const footerBox = await footer.boundingBox();
    expect(topBox?.width).toBe(37);
    expect(topBox?.height).toBe(37);
    expect((topBox?.y ?? 0) + (topBox?.height ?? 0)).toBeLessThanOrEqual((footerBox?.y ?? 0) - 16);
    const lastCard = page.locator("[data-related-cards-container] > [data-related-card]").last();
    const lastCardBox = await lastCard.boundingBox();
    expect(topBox?.y).toBeGreaterThanOrEqual((lastCardBox?.y ?? 0) + (lastCardBox?.height ?? 0));
    if (module === "Leads")
      await page.screenshot({ path: test.info().outputPath("record-buttons.png") });
    await page.goto(moduleCreatePath(org.slug, module));
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    for (const button of await page.locator("button:visible").all())
      await expectNoClippedLabel(button);
  }
});

test("remaining module lists, detail cards and forms have no clipped button labels", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await signUpNewUser(page);
  const org = await createOrganization(page);
  for (const module of ["Tasks", "Meetings", "Calls", "Campaigns", "Cases", "Solutions"] as const) {
    await page.goto(moduleListDefaultPath(org.slug, module));
    const table = page.getByRole("table", { name: "Records" });
    await expect(table).toBeVisible();
    for (const button of await page
      .locator("[data-list-toolbar] button:visible, [data-list-toolbar] a:visible")
      .all())
      await expectNoClippedLabel(button);
    await table
      .locator("tbody tr")
      .first()
      .getByRole("link")
      .filter({ hasText: /\S/ })
      .first()
      .click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    for (const button of await page
      .locator("[data-record-header] button, [data-related-card] button")
      .all())
      await expectNoClippedLabel(button);
    await page.goto(moduleCreatePath(org.slug, module));
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    for (const button of await page.locator("button:visible").all())
      await expectNoClippedLabel(button);
  }
});
