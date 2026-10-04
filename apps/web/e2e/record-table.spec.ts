import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Expected values are the list spec's Visual layout tokens, read from the cascade
 * so a later type-token change is picked up here instead of a fixed px or weight.
 * `research/specs/list-views.md` → Layout → Visual layout.
 */

test("record table matches the measured list layout", async ({ page }) => {
  await page.goto("/dev/ui");
  const populated = page.getByRole("region", { name: "Populated records" });
  await expect(populated).toBeVisible();

  const headerHeight = await length(page, "--size-list-header-height");
  const headerBorder = await length(page, "--size-list-header-border");
  const headerRule = await length(page, "--size-list-header-rule");
  const headerRuleOffset = await length(page, "--size-list-header-rule-offset");
  const rowPitch = await length(page, "--size-list-row-pitch");
  const rowPad = await length(page, "--size-list-row-pad");
  const lineHeight = await length(page, "--size-list-line-height");
  const leadingPair = await length(page, "--size-list-leading-pair-width");
  const badgeWidth = await length(page, "--size-list-badge-width");
  const columnWidth = await length(page, "--size-list-column-width");
  const cellInset = await length(page, "--size-list-cell-inset");
  const checkboxInset = await length(page, "--size-list-checkbox-inset");
  const checkboxOffset = await length(page, "--size-list-checkbox-offset");
  const settingsWidth = await length(page, "--size-list-settings-width");
  const emptyOffset = await length(page, "--size-list-empty-offset");
  const footerHeight = await length(page, "--size-list-footer-height");
  const footerGapBefore = await length(page, "--size-list-footer-gap-before");
  const footerGapAfter = await length(page, "--size-list-footer-gap-after");
  const footerEnd = await length(page, "--size-list-footer-end");
  const listInset = await length(page, "--size-list-inset");
  const chevronWidth = await length(page, "--size-list-chevron-width");
  const chevronHeight = await length(page, "--size-list-chevron-height");
  const radius = await length(page, "--radius-md");
  const textSm = await fontSize(page, "--text-sm");
  const text13 = await fontSize(page, "--text-13");
  const weightMedium = await fontWeight(page, "--font-weight-medium");
  const weightNormal = await fontWeight(page, "--font-weight-normal");
  const weightSemibold = await fontWeight(page, "--font-weight-semibold");
  const surface = await color(page, "--color-surface");
  const panel = await color(page, "--color-panel-border");
  const separator = await color(page, "--color-row-separator");
  const text = await color(page, "--color-text");
  const strong = await color(page, "--color-text-strong");
  const muted = await color(page, "--color-text-muted");
  const disabled = await color(page, "--color-text-disabled");
  const emptyInk = await color(page, "--color-text-empty");

  const card = populated.locator("[data-part=card]");
  // Records table: white, 6 px corners, 1 px panel outline.
  await expect(card).toHaveCSS("background-color", surface);
  await expect(card).toHaveCSS("border-top-color", panel);
  await expect(card).toHaveCSS("border-top-width", "1px");
  await expect(card).toHaveCSS("border-top-left-radius", radius);

  const table = populated.locator("table");
  await expect(table).toHaveCSS("border-collapse", "separate");
  const headerCell = populated.locator("[data-part=header] [data-part=column]").first();
  // Table header and rows: the header cell box is 37 px, with the 2 px rule inside it.
  expectPx(await boxHeight(headerCell), headerHeight);
  await expect(headerCell).toHaveCSS("border-bottom-width", headerBorder);
  await expect(headerCell).toHaveCSS("border-bottom-color", panel);
  await expect(headerCell).toHaveCSS("border-left-width", "0px");
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS("font-size", textSm);
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS(
    "font-weight",
    weightMedium,
  );
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS("color", strong);

  const divider = headerCell.locator("[data-part=divider]");
  const headerBox = await headerCell.boundingBox();
  const dividerBox = await divider.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(dividerBox).not.toBeNull();
  expectPx(dividerBox?.height ?? 0, headerRule);
  expectPx((dividerBox?.y ?? 0) - (headerBox?.y ?? 0), headerRuleOffset);
  expectPx(
    (headerBox?.x ?? 0) +
      (headerBox?.width ?? 0) -
      ((dividerBox?.x ?? 0) + (dividerBox?.width ?? 0)),
    "0",
  );
  const headerColumns = populated.locator("[data-part=header] [data-part=column]");
  await expect(headerColumns.locator("[data-part=divider]")).toHaveCount(
    await headerColumns.count(),
  );

  const rows = populated.locator("[data-part=row]");
  const bodyCell = rows.nth(0).locator("[data-part=column]").first();
  const secondCell = rows.nth(1).locator("[data-part=column]").first();
  const firstBox = await bodyCell.boundingBox();
  const secondBox = await secondCell.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  // Table header and rows: single-line cells repeat every 37 px.
  expectPx((secondBox?.y ?? 0) - (firstBox?.y ?? 0), rowPitch);
  const headerCellBox = await headerCell.boundingBox();
  expect(headerCellBox).not.toBeNull();
  expectPx((firstBox?.y ?? 0) - (headerCellBox?.y ?? 0), headerHeight);
  await expect(bodyCell).toHaveCSS("border-bottom-color", separator);
  await expect(bodyCell).toHaveCSS("border-left-width", "0px");
  const separatorWidth = await bodyCell.evaluate(
    (element) => getComputedStyle(element).borderBottomWidth,
  );

  const wrappedRow = rows.nth(2);
  const wrappedCell = wrappedRow.locator("[data-part=column]").first();
  const twoLine = px(rowPad) * 2 + px(lineHeight) * 2 + px(separatorWidth);
  expectPx(await boxHeight(wrappedCell), String(twoLine));
  const wrappedName = wrappedRow
    .getByRole("cell", { name: "Lead 003" })
    .locator("[data-part=value]");
  const wrappedCompany = wrappedRow
    .getByRole("cell", { name: "Wrapped Example Trading Partners" })
    .locator("[data-part=value]");
  const nameBox = await wrappedName.boundingBox();
  const companyBox = await wrappedCompany.boundingBox();
  expect(Math.abs((nameBox?.y ?? 0) - (companyBox?.y ?? 0))).toBeLessThanOrEqual(1);

  const checkbox = rows.nth(0).locator("[data-part=checkbox]");
  const checkboxBox = await checkbox.boundingBox();
  const pairRight = await rows
    .nth(0)
    .locator("[data-part=leading]")
    .evaluateAll((elements) =>
      Math.max(...elements.map((element) => element.getBoundingClientRect().right)),
    );
  expectPx(pairRight - ((checkboxBox?.x ?? 0) + (checkboxBox?.width ?? 0)), checkboxInset);
  expectPx((checkboxBox?.y ?? 0) - (firstBox?.y ?? 0), checkboxOffset);

  // Text roles: ordinary cells are body text, and links use that colour too.
  const company = populated.getByRole("cell", { name: "Example Co" }).first();
  const companyValue = company.locator("[data-part=value]");
  await expect(companyValue).toHaveCSS("font-size", textSm);
  await expect(companyValue).toHaveCSS("font-weight", weightNormal);
  await expect(companyValue).toHaveCSS("color", text);
  const nameLink = populated.getByRole("link", { name: "Lead 001" });
  await expect(nameLink).toHaveCSS("color", text);
  await expect(populated.getByRole("link", { name: "lead001@example.org" })).toHaveCSS(
    "color",
    text,
  );

  // Data and trailing column widths, and the 12 px text inset.
  expectPx(await boxWidth(headerCell), columnWidth);
  expectPx(await inset(headerCell, headerCell.locator("[data-part=header-label]")), cellInset);
  expectPx(await inset(company, companyValue), cellInset);
  expectPx(
    await sumWidth(populated.locator("[data-part=header] [data-part=leading]")),
    leadingPair,
  );
  expectPx(await boxWidth(populated.locator("[data-part=header] [data-part=badge]")), badgeWidth);
  const settings = populated.locator("[data-part=settings]");
  expectPx(await boxWidth(settings), settingsWidth);
  expectPx(await boxHeight(settings), headerHeight);
  const settingsBox = await settings.boundingBox();
  expect(settingsBox).not.toBeNull();
  expect(Math.abs((settingsBox?.y ?? 0) - (headerCellBox?.y ?? 0))).toBeLessThanOrEqual(0.5);
  expect(
    Math.abs(
      (settingsBox?.y ?? 0) +
        (settingsBox?.height ?? 0) -
        ((headerCellBox?.y ?? 0) + (headerCellBox?.height ?? 0)),
    ),
  ).toBeLessThanOrEqual(0.5);
  await expect(populated.locator("[data-part=row] [data-part=settings]")).toHaveCount(0);
  await expect(settings).toHaveText("");

  // Table footer: previous, range, next. The names are accessible, not visible.
  const footer = populated.locator("[data-part=footer]");
  expectPx(await contentHeight(footer), footerHeight);
  await expect(footer).toHaveCSS("border-top-color", panel);
  await expect(footer).toHaveCSS("border-bottom-color", panel);
  await expect(footer).toHaveCSS("font-size", text13);
  await expect(footer.locator("[data-part=total-value]")).toHaveCSS("font-weight", weightSemibold);
  await expect(footer.locator("[data-part=range-to-word]")).toHaveCSS("font-weight", weightNormal);
  await expect(footer.locator("[data-part=range-to-word]")).toHaveCSS("color", muted);
  await expect(footer.locator("[data-part=range-end]").first()).toHaveCSS(
    "font-weight",
    weightSemibold,
  );
  await expect(footer.locator("[data-part=range-end]").first()).toHaveCSS("color", text);
  const footerBox = await footer.boundingBox();
  const cardEdges = await innerEdges(card);
  const previous = footer.locator("[data-part=previous]");
  const range = footer.locator("[data-part=range]");
  const next = footer.locator("[data-part=next]");
  const previousBox = await previous.boundingBox();
  const rangeBox = await range.boundingBox();
  const nextBox = await next.boundingBox();
  expect(footerBox && previousBox && rangeBox && nextBox).toBeTruthy();
  expect((previousBox?.x ?? 0) < (rangeBox?.x ?? 0)).toBe(true);
  expect((rangeBox?.x ?? 0) < (nextBox?.x ?? 0)).toBe(true);
  expectPx(
    (rangeBox?.x ?? 0) - ((previousBox?.x ?? 0) + (previousBox?.width ?? 0)),
    footerGapBefore,
  );
  expectPx((nextBox?.x ?? 0) - ((rangeBox?.x ?? 0) + (rangeBox?.width ?? 0)), footerGapAfter);
  expectPx(cardEdges.right - ((nextBox?.x ?? 0) + (nextBox?.width ?? 0)), footerEnd);
  expect((footerBox?.x ?? 0) + (footerBox?.width ?? 0)).toBeLessThanOrEqual(cardEdges.right + 0.5);
  const totalLabel = footer.locator("[data-part=total-label]");
  const totalBox = await totalLabel.boundingBox();
  expectPx((totalBox?.x ?? 0) - cardEdges.left, listInset);
  await expect(previous).toHaveCSS("color", disabled);
  await expect(next).toHaveCSS("color", disabled);
  await expect(footer).not.toContainText("Previous");
  await expect(footer).not.toContainText("Next");
  expectPx(await boxWidth(previous.locator("[data-part=chevron]")), chevronWidth);
  expectPx(await boxHeight(previous.locator("[data-part=chevron]")), chevronHeight);

  // Empty view: header and footer stay, no checkbox, one message in the first band.
  const empty = page.getByRole("region", { name: "Empty records" });
  await expect(empty.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(empty.locator("[data-part=footer]")).toBeVisible();
  const emptyMessage = empty.getByText("No records found.");
  await expect(emptyMessage).toBeVisible();
  await expect(empty.getByRole("checkbox")).toHaveCount(0);
  await expect(empty.locator("[data-part=badge]")).toHaveCount(0);
  expectPx(await sumWidth(empty.locator("[data-part=header] [data-part=leading]")), leadingPair);
  const emptyBand = empty.locator("[data-part=empty]");
  expect(await emptyBand.evaluate((element) => element.closest("table"))).toBeNull();
  await expect(empty.locator("[data-part=header] [data-part=column]")).toHaveCount(7);
  const emptyCard = empty.locator("[data-part=card]");
  const emptyCardBox = await emptyCard.boundingBox();
  const emptyTableBox = await empty.locator("table").boundingBox();
  expect(emptyCardBox).not.toBeNull();
  expect(emptyTableBox).not.toBeNull();
  expect(emptyTableBox?.width ?? 0).toBeGreaterThan(emptyCardBox?.width ?? 0);
  expectPx(await contentHeight(emptyBand), String(px(emptyOffset) + px(lineHeight) + px(rowPad)));
  await expect(emptyBand).toHaveCSS("border-bottom-width", "1px");
  await expect(emptyBand).toHaveCSS("border-bottom-color", separator);
  await expect(emptyBand).toHaveCSS("color", emptyInk);
  const emptyBandBox = await emptyBand.boundingBox();
  const emptyTextTop = await emptyBand.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().y;
  });
  expectPx(emptyTextTop - (emptyBandBox?.y ?? 0), emptyOffset);
  const messageCenter = await textCenter(emptyMessage);
  const cardCenter = (emptyCardBox?.x ?? 0) + (emptyCardBox?.width ?? 0) / 2;
  expect(Math.abs(messageCenter - cardCenter)).toBeLessThanOrEqual(1);
  await empty.locator("section").evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  expect(Math.abs((await textCenter(emptyMessage)) - cardCenter)).toBeLessThanOrEqual(1);
  await expect(empty.locator("[data-part=range]")).toHaveCount(0);
  await expect(empty.locator("[data-part=previous]")).toHaveCount(0);
  await expect(empty.locator("[data-part=next]")).toHaveCount(0);

  // Wrapped text grows the row past one pitch.
  const wrapped = page.getByRole("region", { name: "Wrapped records" });
  const wrappedHeight = await boxHeight(wrapped.locator("[data-part=row]"));
  expect(wrappedHeight).toBeGreaterThan(px(rowPitch) + 1);

  // A later page enables both directions in the body colour.
  const later = page.getByRole("region", { name: "Later page" });
  const laterNext = later.getByRole("link", { name: "Next" });
  await expect(later.getByRole("link", { name: "Previous" })).toHaveCSS("color", text);
  await expect(laterNext).toHaveCSS("color", text);
  const laterCardBox = await later.locator("[data-part=card]").boundingBox();
  const laterNextBox = await laterNext.boundingBox();
  expect(laterCardBox).not.toBeNull();
  expect(laterNextBox).not.toBeNull();
  expect((laterNextBox?.x ?? 0) >= (laterCardBox?.x ?? 0) - 0.5).toBe(true);
  expect(
    (laterNextBox?.x ?? 0) + (laterNextBox?.width ?? 0) <=
      (laterCardBox?.x ?? 0) + (laterCardBox?.width ?? 0) + 0.5,
  ).toBe(true);
});

function expectPx(actual: number, expected: string) {
  expect(Math.abs(actual - Number.parseFloat(expected))).toBeLessThanOrEqual(1);
}

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

async function fontSize(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.fontSize = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontSize;
    probe.remove();
    return value;
  }, token);
}

async function fontWeight(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.fontWeight = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontWeight;
    probe.remove();
    return value;
  }, token);
}

async function color(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

async function boxHeight(locator: Locator) {
  return locator.evaluate((element) => element.getBoundingClientRect().height);
}

async function boxWidth(locator: Locator) {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

async function sumWidth(locator: Locator) {
  return locator.evaluateAll((elements) =>
    elements.reduce((sum, element) => sum + element.getBoundingClientRect().width, 0),
  );
}

async function innerEdges(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left + Number.parseFloat(style.borderLeftWidth),
      right: rect.right - Number.parseFloat(style.borderRightWidth),
    };
  });
}

async function textCenter(locator: Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return rect.x + rect.width / 2;
  });
}

async function contentHeight(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return (
      element.getBoundingClientRect().height -
      Number.parseFloat(style.borderTopWidth) -
      Number.parseFloat(style.borderBottomWidth)
    );
  });
}

async function inset(cell: Locator, text: Locator) {
  const [cellBox, textBox] = await Promise.all([cell.boundingBox(), text.boundingBox()]);
  return (textBox?.x ?? 0) - (cellBox?.x ?? 0);
}
