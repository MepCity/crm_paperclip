import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectType, tokenValue } from "./support/typography";

// record-detail.md › Layout › Visual layout › Create/edit form; MEP-172 interim vertical measures
test.use({ viewport: { width: 1470, height: 835 } });

function px(value: string) {
  return Number.parseFloat(value);
}

async function length(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.width = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).width;
    probe.remove();
    return value;
  }, token);
}

async function color(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}

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
  const stripTitle = shell.locator("[data-record-form-title]");
  const portrait = shell.locator("[data-record-form-portrait]");
  const streetInput = demo.locator("#demo-street");
  const fieldGroup = shell.locator("[data-record-form-field-group]");
  const longLabel = demo.getByText("Very long synthetic field label for overflow", { exact: true });
  const longInput = demo.locator("#demo-long-label");
  const afterLongRow = demo
    .locator("#demo-after-long")
    .locator("xpath=ancestor::*[@data-record-form-row][1]");
  const mutedInk = await color(page, "--color-text-muted");
  const strongInk = await color(page, "--color-text-strong");
  const groupBorderInk = await color(page, "--color-form-field-group-border");
  const columnGap = px(await length(page, "--size-form-column-gap"));
  const cardInset = px(await length(page, "--size-form-card-inset"));
  const groupInputWidth = px(await length(page, "--size-form-input-group-width"));
  const groupPaddingEnd = px(await length(page, "--size-form-field-group-padding-end"));
  const groupBodyTop = px(await length(page, "--size-form-field-group-body-top"));
  const actionPaddingX = px(await length(page, "--size-form-action-padding-inline"));
  const stripPaddingEnd = px(await length(page, "--size-form-strip-padding-end"));
  const contentWidth =
    px(await length(page, "--size-form-label-column-left")) +
    px(await length(page, "--size-form-label-gap")) +
    px(await length(page, "--size-form-input-left-width")) +
    px(await length(page, "--size-form-label-column-right")) +
    px(await length(page, "--size-form-label-gap")) +
    px(await length(page, "--size-form-input-right-width"));
  const expectedCardWidth = contentWidth + 2 * cardInset;

  await expect(shell).toBeVisible();
  await boxHeight(strip, 57);
  await expect(strip).toHaveCSS("border-bottom-color", "rgb(237, 240, 244)");
  await expect(card).toHaveCSS("border-top-left-radius", "8px");
  await expect(card).toHaveCSS("border-top-right-radius", "8px");
  const cardBox = await card.boundingBox();
  const titleBox = await sectionTitle.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(Math.abs((titleBox?.x ?? 0) - ((cardBox?.x ?? 0) + cardInset))).toBeLessThanOrEqual(1);
  await boxWidth(card, expectedCardWidth);
  const stripTitleBox = await stripTitle.boundingBox();
  expect(stripTitleBox).not.toBeNull();
  expect(Math.abs((stripTitleBox?.x ?? 0) - (cardBox?.x ?? 0))).toBeLessThanOrEqual(1);
  const portraitBox = await portrait.boundingBox();
  expect(portraitBox).not.toBeNull();
  expect(Math.abs((portraitBox?.y ?? 0) - ((cardBox?.y ?? 0) + 63))).toBeLessThanOrEqual(1);
  const ownerBox = await leftInput.boundingBox();
  expect(ownerBox).not.toBeNull();
  expect(Math.abs((ownerBox?.y ?? 0) - ((cardBox?.y ?? 0) + 205))).toBeLessThanOrEqual(1);
  expect(Math.abs((ownerBox?.y ?? 0) - ((portraitBox?.y ?? 0) + 48 + 94))).toBeLessThanOrEqual(1);
  await boxWidth(leftInput, 320);
  await boxWidth(rightInput, 314.5);
  await boxHeight(leftInput, 34);
  const labelGap = await horizontalGap(leftLabel, leftInput);
  expect(labelGap).toBe(37);
  const inputColumnGap = await horizontalGap(leftInput, rightInput);
  expect(Math.abs(inputColumnGap - columnGap)).toBeLessThanOrEqual(1);
  const streetBox = await streetInput.boundingBox();
  expect(streetBox).not.toBeNull();
  expect(Math.abs((streetBox?.x ?? 0) - (ownerBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await expect(leftLabel).toHaveCSS("color", mutedInk);
  await expect(sectionTitle).toHaveCSS("color", strongInk);
  await expect(stripTitle).toHaveCSS("color", strongInk);
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
  await expect(cancel).toHaveCSS("padding-left", `${actionPaddingX}px`);
  await expect(cancel).toHaveCSS("padding-right", `${actionPaddingX}px`);
  const saveBox = await save.boundingBox();
  expect(saveBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(
    Math.abs(
      (cardBox?.x ?? 0) +
        expectedCardWidth -
        stripPaddingEnd -
        ((saveBox?.x ?? 0) + (saveBox?.width ?? 0)),
    ),
  ).toBeLessThanOrEqual(2);

  await expect(fieldGroup).toHaveCSS("border-color", groupBorderInk);
  const legend = fieldGroup.locator("legend");
  await expect(legend).toHaveCSS("color", mutedInk);
  await expectType(page, legend, "--text-md", "--font-weight-normal");
  await boxWidth(streetInput, groupInputWidth);
  const groupBox = await fieldGroup.boundingBox();
  expect(groupBox).not.toBeNull();
  expect(streetBox).not.toBeNull();
  expect(
    Math.abs(
      (groupBox?.x ?? 0) +
        (groupBox?.width ?? 0) -
        ((streetBox?.x ?? 0) + (streetBox?.width ?? 0)) -
        groupPaddingEnd,
    ),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs((streetBox?.y ?? 0) - ((groupBox?.y ?? 0) + groupBodyTop))).toBeLessThanOrEqual(
    1,
  );

  const longRowBox = await longInput
    .locator("xpath=ancestor::*[@data-record-form-row][1]")
    .boundingBox();
  const longInputBox = await longInput.boundingBox();
  const longLabelBox = await longLabel.boundingBox();
  const afterLongRowBox = await afterLongRow.boundingBox();
  expect(longRowBox).not.toBeNull();
  expect(longInputBox).not.toBeNull();
  expect(longLabelBox).not.toBeNull();
  expect(afterLongRowBox).not.toBeNull();
  expect(Math.abs((longInputBox?.y ?? 0) - (longRowBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      (afterLongRowBox?.y ?? 0) - ((longLabelBox?.y ?? 0) + (longLabelBox?.height ?? 0) + 20),
    ),
  ).toBeLessThanOrEqual(2);

  const scrollHost = demo.locator('[data-record-form-demo="scroll"]');
  const stripYBefore = (await strip.boundingBox())?.y ?? 0;
  await scrollHost.evaluate((node) => {
    node.scrollTop = 400;
  });
  const stripYAfter = (await strip.boundingBox())?.y ?? 0;
  expect(Math.abs(stripYAfter - stripYBefore)).toBeLessThanOrEqual(1);
});
