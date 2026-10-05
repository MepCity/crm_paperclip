import { expect, type Locator, test } from "@playwright/test";
import { expectType, tokenValue } from "./support/typography";

// record-detail.md › Layout › Visual layout › Create/edit form
test.use({ viewport: { width: 1470, height: 835 } });

async function boxHeight(target: Locator, height: number) {
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs((bounds?.height ?? 0) - height)).toBeLessThanOrEqual(1);
}

async function boxWidth(target: Locator, width: number) {
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs((bounds?.width ?? 0) - width)).toBeLessThanOrEqual(1);
}

async function horizontalGap(left: Locator, right: Locator) {
  const a = await left.boundingBox();
  const b = await right.boundingBox();
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  return (b?.x ?? 0) - ((a?.x ?? 0) + (a?.width ?? 0));
}

test("create lead form layout matches measured geometry", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "record form layout", exact: true });
  const shell = demo.locator("[data-record-form-shell]");
  const strip = shell.locator("[data-record-form-strip]");
  const card = shell.locator("[data-record-form-card]");
  const sectionTitle = shell
    .locator("[data-record-form-section-title]")
    .filter({ hasText: "Lead Information" });
  const leftInput = demo.locator("#demo-owner");
  const leftLabel = demo.getByText("Lead Owner", { exact: true });
  const rightInput = demo.locator("#demo-company");
  const rows = shell.locator('[data-record-form-row-column="left"]');
  const cancel = shell.getByRole("button", { name: "Cancel" });
  const save = shell.getByRole("button", { name: "Save", exact: true });

  await expect(shell).toBeVisible();
  await boxHeight(strip, 57);
  await expect(strip).toHaveCSS("border-bottom-color", "rgb(237, 240, 244)");
  await expect(card).toHaveCSS("border-top-left-radius", "8px");
  await expect(card).toHaveCSS("border-top-right-radius", "8px");
  const cardBox = await card.boundingBox();
  const titleBox = await sectionTitle.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(Math.abs((titleBox?.x ?? 0) - ((cardBox?.x ?? 0) + 12))).toBeLessThanOrEqual(1);
  await boxWidth(leftInput, 320);
  await boxWidth(rightInput, 314.5);
  await boxHeight(leftInput, 34);
  const labelGap = await horizontalGap(leftLabel, leftInput);
  expect(labelGap).toBe(37);
  const firstRow = rows.first();
  const secondRow = rows.nth(1);
  const firstBox = await firstRow.boundingBox();
  const secondBox = await secondRow.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  const rowPitch = (secondBox?.y ?? 0) - (firstBox?.y ?? 0);
  expect(Math.abs(rowPitch - 54)).toBeLessThanOrEqual(1);
  await expectType(page, leftLabel, "--text-md", "--font-weight-normal");
  await expectType(page, sectionTitle, "--text-md", "--font-weight-bold");
  await expectType(
    page,
    shell.locator("[data-record-form-title]"),
    "--text-2xl",
    "--font-weight-bold",
  );
  await boxHeight(cancel, 32);
  await boxHeight(save, 32);
  await expect(cancel).toHaveCSS("font-size", await tokenValue(page, "font-size", "--text-md"));
  await expect(cancel).toHaveCSS(
    "font-weight",
    await tokenValue(page, "font-weight", "--font-weight-semibold"),
  );

  const scrollHost = demo.locator('[data-record-form-demo="scroll"]');
  const stripYBefore = (await strip.boundingBox())?.y ?? 0;
  await scrollHost.evaluate((node) => {
    node.scrollTop = 400;
  });
  const stripYAfter = (await strip.boundingBox())?.y ?? 0;
  expect(Math.abs(stripYAfter - stripYBefore)).toBeLessThanOrEqual(1);
});
