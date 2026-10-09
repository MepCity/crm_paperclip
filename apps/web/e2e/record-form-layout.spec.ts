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

async function legendTextStartX(legend: Locator) {
  return legend.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getClientRects()[0];
    return rect?.left ?? node.getBoundingClientRect().left;
  });
}

async function legendTextEndX(legend: Locator) {
  return legend.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    const rect = rects[rects.length - 1];
    return (rect?.left ?? 0) + (rect?.width ?? 0);
  });
}

async function legendBaselineY(legend: Locator) {
  return legend.evaluate((node) => {
    const probe = document.createElement("span");
    probe.style.display = "inline-block";
    probe.style.width = "0";
    probe.style.height = "0";
    node.append(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    return baseline;
  });
}

async function verticalCenter(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return (box?.y ?? 0) + (box?.height ?? 0) / 2;
}

async function sectionContentBottom(section: Locator) {
  return section.evaluate((node) => {
    const children = Array.from(node.children).filter(
      (child) => !child.matches(".record-form-section__title"),
    );
    let bottom = node.getBoundingClientRect().top;
    for (const child of children) {
      bottom = Math.max(bottom, child.getBoundingClientRect().bottom);
    }
    return bottom;
  });
}

async function sectionContentTop(section: Locator) {
  return section.evaluate((node) => {
    const children = Array.from(node.children).filter(
      (child) => !child.matches(".record-form-section__title"),
    );
    if (children.length === 0) {
      return node.getBoundingClientRect().bottom;
    }
    return Math.min(...children.map((child) => child.getBoundingClientRect().top));
  });
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
  const saveAndNew = shell.getByRole("button", { name: "Save and New" });
  const save = shell.getByRole("button", { name: "Save", exact: true });
  const descriptionInput = demo.locator("#demo-description");
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
  expect(Math.abs(labelGap - 37)).toBeLessThanOrEqual(1);
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
  const fieldGroupRadiusPx = px(await length(page, "--radius-form-field-group"));
  const groupRadius = await fieldGroup.evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).borderTopLeftRadius),
  );
  expect(Math.abs(groupRadius - fieldGroupRadiusPx)).toBeLessThanOrEqual(0.5);
  // MEP-174 a: legend text inset and padding after text
  const legendBox = await legend.boundingBox();
  expect(legendBox).not.toBeNull();
  const textStartX = await legendTextStartX(legend);
  const textEndX = await legendTextEndX(legend);
  expect(Math.abs(textStartX - (groupBox?.x ?? 0) - 18.5)).toBeLessThanOrEqual(1);
  expect(
    Math.abs((legendBox?.x ?? 0) + (legendBox?.width ?? 0) - textEndX - 12.5),
  ).toBeLessThanOrEqual(1);
  // MEP-174 b: legend baseline below frame top
  const baselineY = await legendBaselineY(legend);
  expect(Math.abs(baselineY - ((groupBox?.y ?? 0) + 8))).toBeLessThanOrEqual(1);
  // MEP-174 d: frame width and insets
  expect(Math.abs((groupBox?.width ?? 0) - 529)).toBeLessThanOrEqual(0.5);
  expect(
    Math.abs(
      (groupBox?.x ?? 0) +
        (groupBox?.width ?? 0) -
        ((streetBox?.x ?? 0) + (streetBox?.width ?? 0)) -
        16,
    ),
  ).toBeLessThanOrEqual(1);
  expect(Math.abs((streetBox?.y ?? 0) - ((groupBox?.y ?? 0) + 31))).toBeLessThanOrEqual(1);

  // MEP-174 e, f: section title vertical rhythm
  const leadInfoTitle = shell.getByRole("heading", { name: "Lead Information" });
  const addressTitle = shell.getByRole("heading", { name: "Address Information" });
  const descriptionTitle = shell.getByRole("heading", { name: "Description Information" });
  const leadInfoSection = leadInfoTitle.locator("xpath=ancestor::*[@data-record-form-section][1]");
  const addressSection = addressTitle.locator("xpath=ancestor::*[@data-record-form-section][1]");
  const descriptionSection = descriptionTitle.locator(
    "xpath=ancestor::*[@data-record-form-section][1]",
  );
  const leadInfoBottom = await sectionContentBottom(leadInfoSection);
  const addressCenter = await verticalCenter(addressTitle);
  const addressContentTop = await sectionContentTop(addressSection);
  const addressGroupBottom = (groupBox?.y ?? 0) + (groupBox?.height ?? 0);
  const descriptionCenter = await verticalCenter(descriptionTitle);
  const descriptionContentTop = await sectionContentTop(descriptionSection);
  expect(Math.abs(addressCenter - leadInfoBottom - 61)).toBeLessThanOrEqual(1);
  expect(Math.abs(addressContentTop - addressCenter - 33)).toBeLessThanOrEqual(1);
  expect(Math.abs(descriptionCenter - addressGroupBottom - 78)).toBeLessThanOrEqual(1);
  expect(Math.abs(descriptionContentTop - descriptionCenter - 33)).toBeLessThanOrEqual(1);

  // MEP-174 g: action button gaps
  const actionGap = px(await length(page, "--size-form-action-gap"));
  expect(Math.abs((await horizontalGap(cancel, saveAndNew)) - actionGap)).toBeLessThanOrEqual(1);
  expect(Math.abs((await horizontalGap(saveAndNew, save)) - actionGap)).toBeLessThanOrEqual(1);

  // MEP-174 h: Description control geometry
  const descriptionBox = await descriptionInput.boundingBox();
  expect(descriptionBox).not.toBeNull();
  await boxWidth(descriptionInput, 639);
  await boxHeight(descriptionInput, 34);
  expect(Math.abs((descriptionBox?.x ?? 0) - (ownerBox?.x ?? 0))).toBeLessThanOrEqual(1);

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
