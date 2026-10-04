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
  const rowPitch = await length(page, "--size-list-row-pitch");
  const leadingPair = await length(page, "--size-list-leading-pair-width");
  const badgeWidth = await length(page, "--size-list-badge-width");
  const columnWidth = await length(page, "--size-list-column-width");
  const cellInset = await length(page, "--size-list-cell-inset");
  const settingsWidth = await length(page, "--size-list-settings-width");
  const footerHeight = await length(page, "--size-list-footer-height");
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
  const disabled = await color(page, "--color-text-disabled");

  const card = populated.locator("[data-part=card]");
  // Records table: white, 6 px corners, 1 px panel outline.
  await expect(card).toHaveCSS("background-color", surface);
  await expect(card).toHaveCSS("border-top-color", panel);
  await expect(card).toHaveCSS("border-top-width", "1px");
  await expect(card).toHaveCSS("border-top-left-radius", radius);

  const header = populated.locator("[data-part=header]");
  // Table header and rows: header is 37 px including the 2 px bottom border.
  expectPx(await boxHeight(header), headerHeight);
  const headerCell = populated.locator("[data-part=header] [data-part=column]").first();
  await expect(headerCell).toHaveCSS("border-bottom-width", headerBorder);
  await expect(headerCell).toHaveCSS("border-bottom-color", panel);
  await expect(headerCell).toHaveCSS("border-left-color", panel);
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS("font-size", textSm);
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS(
    "font-weight",
    weightMedium,
  );
  await expect(headerCell.locator("[data-part=header-label]")).toHaveCSS("color", strong);

  const rows = populated.locator("[data-part=row]");
  const firstBox = await rows.nth(0).boundingBox();
  const secondBox = await rows.nth(1).boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  // Table header and rows: rows repeat every 55 px (54 px plus a 1 px separator).
  expectPx((secondBox?.y ?? 0) - (firstBox?.y ?? 0), rowPitch);
  const bodyCell = populated.locator("[data-part=row] [data-part=column]").first();
  await expect(bodyCell).toHaveCSS("border-bottom-color", separator);
  await expect(bodyCell).toHaveCSS("border-left-width", "0px");

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
  expectPx(
    await boxWidth(populated.locator("[data-part=header] [data-part=settings]")),
    settingsWidth,
  );

  // Table footer: 31 px between two 1 px panel lines. Text is the 13 px role.
  const footer = populated.locator("[data-part=footer]");
  expectPx(await contentHeight(footer), footerHeight);
  await expect(footer).toHaveCSS("border-top-color", panel);
  await expect(footer).toHaveCSS("border-bottom-color", panel);
  await expect(footer).toHaveCSS("font-size", text13);
  await expect(footer.locator("[data-part=total-value]")).toHaveCSS("font-weight", weightSemibold);
  await expect(footer.locator("[data-part=range-to-word]")).toHaveCSS("font-weight", weightNormal);
  await expect(footer.locator("[data-part=range-end]").first()).toHaveCSS(
    "font-weight",
    weightSemibold,
  );
  await expect(populated.getByText("Previous")).toHaveCSS("color", disabled);
  await expect(populated.getByText("Next")).toHaveCSS("color", disabled);

  // Empty view: header and footer stay, no checkbox, one centered message.
  const empty = page.getByRole("region", { name: "Empty records" });
  await expect(empty.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(empty.locator("[data-part=footer]")).toBeVisible();
  await expect(empty.getByText("No records found.")).toBeVisible();
  await expect(empty.getByRole("checkbox")).toHaveCount(0);
  await expect(empty.locator("[data-part=badge]")).toHaveCount(0);
  expectPx(await sumWidth(empty.locator("[data-part=header] [data-part=leading]")), leadingPair);

  // Wrapped text grows the row past one pitch.
  const wrapped = page.getByRole("region", { name: "Wrapped records" });
  const wrappedHeight = await boxHeight(wrapped.locator("[data-part=row]"));
  expect(wrappedHeight).toBeGreaterThan(Number.parseFloat(rowPitch) + 1);

  // A later page enables both directions in the body colour.
  const later = page.getByRole("region", { name: "Later page" });
  await expect(later.getByRole("link", { name: "Previous" })).toHaveCSS("color", text);
  await expect(later.getByRole("link", { name: "Next" })).toHaveCSS("color", text);
});

function expectPx(actual: number, expected: string) {
  expect(Math.abs(actual - Number.parseFloat(expected))).toBeLessThanOrEqual(1);
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
