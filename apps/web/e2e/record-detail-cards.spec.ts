import { expect, type Page, test } from "@playwright/test";
import {
  expectWithin1,
  firstLineSolidCapTop,
  pageRasterInk,
  svgRasterInkBoxes,
  textSolidInkBand,
  textSolidInkLeft,
  textSolidInkRight,
  wrappedLineSolidCapTops,
} from "./support/geometry";
import { expectType } from "./support/typography";

/** research/specs/record-detail.md › Layout › Visual layout › Business card, Details card */

const CARD_WIDTH = 906;
const CARD_WIDTH_RAIL_HIDDEN = 1126;
const CARD_CORNER = 8;
const BUSINESS_LABEL_END = 173.5;
const BUSINESS_VALUE_START = 219;
const BUSINESS_LABEL_VALUE_GAP = 45.5;
const BUSINESS_ROW_PITCH = 44.5;
const BUSINESS_CARD_HEIGHT = 287;
const BUSINESS_FIRST_LABEL_TEXT_TOP = 46.5;
const DETAILS_LABEL_END_LEFT = 149;
const DETAILS_VALUE_START_LEFT = 185.5;
const DETAILS_LABEL_END_RIGHT = 582.5;
const DETAILS_VALUE_START_RIGHT = 618.5;
const DETAILS_LABEL_VALUE_GAP = 36.5;
const DETAILS_ROW_PITCH = 44;
const DETAILS_DIVIDER_TOP = 43.5;
const DETAILS_SECTION_TITLE_CAP_TOP = 66.5;
const DETAILS_FIRST_LABEL_TEXT_TOP = 117;
const DETAILS_AUDIT_LINE_PITCH = 18.5;
const DETAILS_MULTILINE_LINE_PITCH = 15.5;
const DETAILS_WRAPPED_LINK_LINE_PITCH = 19.5;
const DETAILS_TWO_LINE_ROW_PITCH = 60;
const DETAILS_PENCIL_INK_SIZE = 11.5;
const DETAILS_PENCIL_ABOVE_LABEL_CAP = 1.5;
const DETAILS_INTER_SECTION_LABEL_TO_TITLE = 70;
const DETAILS_ADDRESS_LABEL_END = 149;
const DETAILS_ADDRESS_VALUE_START = 185.5;
const DETAILS_DESCRIPTION_LABEL_END = 188;
const DETAILS_PENCIL_INK_LEFT_RAIL_HIDDEN = 1000.5;
/** Spec antialiased fringe: +1 px width / +0.5 px height vs solid (record-detail.md › Details field pencil). */
const DETAILS_PENCIL_AA_WIDTH_FRINGE = 1;
const DETAILS_PENCIL_AA_HEIGHT_FRINGE = 0.5;
const DETAILS_ADDRESS_TO_DESCRIPTION_TITLE = 71;
const CAP_HEIGHT = 10.5;
const LINE_HEIGHT = 18;

function labelCapTopFromBox(box: { y: number }) {
  return box.y + (LINE_HEIGHT - CAP_HEIGHT) / 2;
}

async function colorToken(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

test.describe("record detail cards visual layout", () => {
  test.use({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });

  test("raster helper measures page pixels including overflowing ink", async ({ page }) => {
    await page.setContent(`<style>body{margin:0;background:white;color:rgb(97,110,136)}
      svg{position:absolute;left:100px;top:100px;width:10px;height:10px;overflow:visible}
      #invisible{opacity:0;left:200px}</style>
      <svg id="visible" viewBox="0 0 10 10"><path fill="currentColor" d="M-1 -1H11V11H-1Z"/></svg>
      <svg id="invisible" viewBox="0 0 10 10"><path fill="currentColor" d="M0 0H10V10H0Z"/></svg>`);
    const visible = await pageRasterInk(page.locator("#visible"), true);
    expect(visible.scale).toBe(2);
    expect(visible.solid.box).toEqual({ left: 99, top: 99, width: 12, height: 12 });
    expect(visible.antialiased.box).toEqual(visible.solid.box);
    const hidden = await pageRasterInk(page.locator("#invisible"), true);
    expect(hidden.solid.box).toBeNull();
    expect(hidden.antialiased.box).toBeNull();
  });

  test("business and details cards match spec layout", async ({ page }, testInfo) => {
    await page.goto("/dev/ui");
    const heading = page.getByRole("heading", { name: "record detail cards", exact: true });
    await heading.scrollIntoViewIfNeeded();
    const demo = page.locator("[data-record-detail-demo]");
    await expect(demo).toBeVisible();

    const business = demo.locator(".detail-business-card");
    const details = demo.locator(".detail-details-card").first();

    const businessBox = await business.boundingBox();
    expect(businessBox).not.toBeNull();
    expect(Math.abs((businessBox?.width ?? 0) - CARD_WIDTH)).toBeLessThanOrEqual(1);
    expect(Math.abs((businessBox?.height ?? 0) - BUSINESS_CARD_HEIGHT)).toBeLessThanOrEqual(1);

    const cornerRadius = await business.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).borderRadius),
    );
    expect(Math.abs(cornerRadius - CARD_CORNER)).toBeLessThanOrEqual(1);

    const ownerLabel = business.getByText("Lead Owner", { exact: true });
    const ownerValue = business.getByText("Alex Morgan", { exact: true });
    const [labelBox, valueBox, cardBox] = await Promise.all([
      ownerLabel.boundingBox(),
      ownerValue.boundingBox(),
      business.boundingBox(),
    ]);
    expect(labelBox).not.toBeNull();
    expect(valueBox).not.toBeNull();
    expect(cardBox).not.toBeNull();

    const labelEnd = (labelBox?.x ?? 0) + (labelBox?.width ?? 0) - (cardBox?.x ?? 0);
    const valueStart = (valueBox?.x ?? 0) - (cardBox?.x ?? 0);
    expect(Math.abs(labelEnd - BUSINESS_LABEL_END)).toBeLessThanOrEqual(1);
    expect(Math.abs(valueStart - BUSINESS_VALUE_START)).toBeLessThanOrEqual(1);
    expect(Math.abs(valueStart - labelEnd - BUSINESS_LABEL_VALUE_GAP)).toBeLessThanOrEqual(1);

    const firstTextTop = labelCapTopFromBox({ y: labelBox?.y ?? 0 }) - (cardBox?.y ?? 0);
    expect(Math.abs(firstTextTop - BUSINESS_FIRST_LABEL_TEXT_TOP)).toBeLessThanOrEqual(1);

    const businessLabelNames = ["Lead Owner", "Email", "Phone", "Mobile", "Lead Status"];
    const businessLabelTops: number[] = [];
    for (const name of businessLabelNames) {
      const box = await business.getByText(name, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      businessLabelTops.push(labelCapTopFromBox({ y: box?.y ?? 0 }));
    }
    for (let i = 1; i < businessLabelTops.length; i += 1) {
      const prevTop = businessLabelTops[i - 1] ?? 0;
      const currTop = businessLabelTops[i] ?? 0;
      expect(Math.abs(currTop - prevTop - BUSINESS_ROW_PITCH)).toBeLessThanOrEqual(1);
    }

    await expect(ownerLabel).toHaveCSS("color", await colorToken(page, "--color-text-muted"));
    await expectType(page, ownerLabel, "--text-md", "--font-weight-normal");
    await expect(ownerValue).toHaveCSS("color", await colorToken(page, "--color-text"));

    const email = business.getByRole("link", { name: "lead001@example.org" });
    await expect(email).toHaveCSS("color", await colorToken(page, "--color-primary"));

    await expect(details).toHaveCSS("width", `${CARD_WIDTH}px`);
    const detailsBox = await details.boundingBox();
    expect(detailsBox).not.toBeNull();

    const divider = details.locator("[data-detail-divider]");
    const dividerBox = await divider.boundingBox();
    expect(dividerBox).not.toBeNull();
    expect(
      Math.abs((dividerBox?.y ?? 0) - (detailsBox?.y ?? 0) - DETAILS_DIVIDER_TOP),
    ).toBeLessThanOrEqual(1);
    expect(Math.abs((dividerBox?.x ?? 0) - (detailsBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((dividerBox?.width ?? 0) - CARD_WIDTH)).toBeLessThanOrEqual(1);
    await expect(divider).toHaveCSS(
      "background-color",
      await colorToken(page, "--color-detail-divider"),
    );

    const toggle = details.getByRole("button", { name: "Hide Details" });
    await expectType(page, toggle, "--text-lg", "--font-weight-bold");

    const columns = details.locator("[data-detail-columns]");
    const leftColumn = columns.locator('[data-detail-column="left"]');
    const leftTitle = leftColumn.getByText("Title", { exact: true });
    const leftTitleValue = leftColumn.getByText("Director", { exact: true });
    const [leftLabelBox, leftValueBox] = await Promise.all([
      leftTitle.boundingBox(),
      leftTitleValue.boundingBox(),
    ]);
    expect(leftLabelBox).not.toBeNull();
    expect(leftValueBox).not.toBeNull();
    const leftLabelEnd = (leftLabelBox?.x ?? 0) + (leftLabelBox?.width ?? 0) - (detailsBox?.x ?? 0);
    const leftValueStart = (leftValueBox?.x ?? 0) - (detailsBox?.x ?? 0);
    expect(Math.abs(leftLabelEnd - DETAILS_LABEL_END_LEFT)).toBeLessThanOrEqual(1);
    expect(Math.abs(leftValueStart - DETAILS_VALUE_START_LEFT)).toBeLessThanOrEqual(1);
    expect(Math.abs(leftValueStart - leftLabelEnd - DETAILS_LABEL_VALUE_GAP)).toBeLessThanOrEqual(
      1,
    );

    const firstDetailsTextTop = (await textSolidInkBand(leftTitle)).top - (detailsBox?.y ?? 0);
    expect(Math.abs(firstDetailsTextTop - DETAILS_FIRST_LABEL_TEXT_TOP)).toBeLessThanOrEqual(1);

    const leftLabelNames = ["Title", "Lead Source", "Modified By"];
    const leftLabelTops: number[] = [];
    for (const name of leftLabelNames) {
      const box = await leftColumn.getByText(name, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      leftLabelTops.push((await textSolidInkBand(leftColumn.getByText(name, { exact: true }))).top);
    }
    for (let i = 1; i < leftLabelTops.length; i += 1) {
      const prevTop = leftLabelTops[i - 1] ?? 0;
      const currTop = leftLabelTops[i] ?? 0;
      expect(Math.abs(currTop - prevTop - DETAILS_ROW_PITCH)).toBeLessThanOrEqual(1);
    }

    const longEmailRow = leftColumn.locator('[data-detail-field="Secondary_Email"]');
    const longEmailWrap = longEmailRow.locator(".detail-field-value-wrap");
    const longEmailLink = longEmailRow.locator(".detail-field-value-link");
    const [longEmailWrapBox, longEmailLinkBox, longEmailRowBox] = await Promise.all([
      longEmailWrap.boundingBox(),
      longEmailLink.boundingBox(),
      longEmailRow.boundingBox(),
    ]);
    expect(longEmailWrapBox).not.toBeNull();
    expect(longEmailLinkBox).not.toBeNull();
    expect(longEmailRowBox).not.toBeNull();
    expect((longEmailLinkBox?.x ?? 0) + (longEmailLinkBox?.width ?? 0)).toBeLessThanOrEqual(
      (longEmailWrapBox?.x ?? 0) + (longEmailWrapBox?.width ?? 0) + 0.5,
    );
    expect(longEmailRowBox?.height ?? 0).toBeGreaterThan(DETAILS_ROW_PITCH);

    const rightColumn = columns.locator('[data-detail-column="right"]');
    const rightCompany = rightColumn.getByText("Company", { exact: true });
    const rightCompanyValue = rightColumn.getByText("Example Corp", { exact: true });
    const [rightLabelBox, rightValueBox] = await Promise.all([
      rightCompany.boundingBox(),
      rightCompanyValue.boundingBox(),
    ]);
    const rightLabelEnd =
      (rightLabelBox?.x ?? 0) + (rightLabelBox?.width ?? 0) - (detailsBox?.x ?? 0);
    const rightValueStart = (rightValueBox?.x ?? 0) - (detailsBox?.x ?? 0);
    expect(Math.abs(rightLabelEnd - DETAILS_LABEL_END_RIGHT)).toBeLessThanOrEqual(1);
    expect(Math.abs(rightValueStart - DETAILS_VALUE_START_RIGHT)).toBeLessThanOrEqual(1);

    const sectionTitle = details.getByRole("heading", { name: "Lead Information" });
    await expect(sectionTitle).toHaveCSS("color", await colorToken(page, "--color-text-strong"));
    await expectType(page, sectionTitle, "--text-md", "--font-weight-bold");
    const sectionTitleInk = await textSolidInkBand(sectionTitle);
    const sectionTitleCapTop = sectionTitleInk.top - (detailsBox?.y ?? 0);
    expect(Math.abs(sectionTitleCapTop - DETAILS_SECTION_TITLE_CAP_TOP)).toBeLessThanOrEqual(1);

    const modifiedByRow = leftColumn.locator('[data-detail-field="Modified_By"]');
    const modifiedByName = modifiedByRow.getByText("Sam Rivera", { exact: true });
    const modifiedByTimestamp = modifiedByRow.locator(".detail-audit-timestamp");
    const modifiedNameCap = (await textSolidInkBand(modifiedByName)).top;
    const modifiedTimestampCap = (await textSolidInkBand(modifiedByTimestamp)).top;
    expect(
      Math.abs(modifiedTimestampCap - modifiedNameCap - DETAILS_AUDIT_LINE_PITCH),
    ).toBeLessThanOrEqual(1);
    await expect(modifiedByTimestamp).toHaveCSS("color", await colorToken(page, "--color-text"));

    const leadNameValue = rightColumn.getByText(
      "Northwind Trading Company International Division Regional Procurement Office West Coast",
      { exact: true },
    );
    const leadNameLineCaps = await wrappedLineSolidCapTops(leadNameValue);
    expect(leadNameLineCaps.length).toBeGreaterThanOrEqual(2);
    const leadNameLine2 = leadNameLineCaps?.[1];
    const leadNameLine1 = leadNameLineCaps?.[0];
    if (leadNameLine1 !== undefined && leadNameLine2 !== undefined) {
      expect(
        Math.abs(leadNameLine2 - leadNameLine1 - DETAILS_MULTILINE_LINE_PITCH),
      ).toBeLessThanOrEqual(1);
    }
    const companyLabel = rightColumn.getByText("Company", { exact: true });
    const leadNameLine1Cap = (await firstLineSolidCapTop(leadNameValue)) ?? 0;
    const companyLabelCap = (await textSolidInkBand(companyLabel)).top;
    expect(
      Math.abs(companyLabelCap - leadNameLine1Cap - DETAILS_TWO_LINE_ROW_PITCH),
    ).toBeLessThanOrEqual(1);

    const websiteRow = rightColumn.locator('[data-detail-field="Website"]');
    const websiteLink = websiteRow.locator(".detail-field-value-link");
    const websiteLineCaps = await wrappedLineSolidCapTops(websiteLink);
    expect(websiteLineCaps.length).toBeGreaterThanOrEqual(2);
    const websiteLine1 = websiteLineCaps?.[0];
    const websiteLine2 = websiteLineCaps?.[1];
    if (websiteLine1 !== undefined && websiteLine2 !== undefined) {
      expect(
        Math.abs(websiteLine2 - websiteLine1 - DETAILS_WRAPPED_LINK_LINE_PITCH),
      ).toBeLessThanOrEqual(1);
    }

    const ratingRow = rightColumn.locator('[data-detail-field="Rating"]');
    await ratingRow.hover();
    const pencil = ratingRow.getByRole("button", { name: "Edit Rating" });
    await pencil.hover();
    await expect(pencil).toHaveCSS("opacity", "1");
    await expect(pencil).toBeVisible();
    const ratingLabel = ratingRow.getByText("Rating", { exact: true });
    const pencilInk = await svgRasterInkBoxes(pencil);
    expect(pencilInk.solid).not.toBeNull();
    expect(pencilInk.antialiased).not.toBeNull();
    if (pencilInk.solid) {
      expectWithin1(pencilInk.solid.width, DETAILS_PENCIL_INK_SIZE);
      expectWithin1(pencilInk.solid.height, DETAILS_PENCIL_INK_SIZE);
    }
    if (pencilInk.solid && pencilInk.antialiased) {
      expectWithin1(pencilInk.antialiased.width, 12.5);
      expectWithin1(pencilInk.antialiased.height, 12);
      expect(pencilInk.antialiased.width).toBeGreaterThanOrEqual(pencilInk.solid.width);
      expect(pencilInk.antialiased.height).toBeGreaterThanOrEqual(pencilInk.solid.height);
      expectWithin1(
        pencilInk.antialiased.width - pencilInk.solid.width,
        DETAILS_PENCIL_AA_WIDTH_FRINGE,
      );
      expectWithin1(
        pencilInk.antialiased.height - pencilInk.solid.height,
        DETAILS_PENCIL_AA_HEIGHT_FRINGE,
      );
      expectWithin1(pencilInk.solid.left - pencilInk.antialiased.left, 0.5);
    }
    const ratingLabelCap = (await textSolidInkBand(ratingLabel)).top;
    expect(
      Math.abs(
        (pencilInk.antialiased?.top ?? 0) - (ratingLabelCap - DETAILS_PENCIL_ABOVE_LABEL_CAP),
      ),
    ).toBeLessThanOrEqual(1);
    await expect(pencil).toHaveCSS("color", await colorToken(page, "--color-text-muted"));

    const addressRow = details.locator('[data-detail-field="Address"]');
    const addressLabel = addressRow.getByText("Address", { exact: true });
    const addressValue = addressRow.locator(".detail-field-value");
    const addressLabelEnd = (await textSolidInkRight(addressLabel)) - (detailsBox?.x ?? 0);
    const addressValueStart = (await textSolidInkLeft(addressValue)) - (detailsBox?.x ?? 0);
    expectWithin1(addressLabelEnd, DETAILS_ADDRESS_LABEL_END);
    expectWithin1(addressValueStart, DETAILS_ADDRESS_VALUE_START);

    const descriptionRow = details.locator('[data-detail-field="Description"]');
    const descriptionLabel = descriptionRow.getByText("Description", { exact: true });
    const descriptionInk = await textSolidInkBand(descriptionLabel);
    const descriptionLabelEnd = descriptionInk.left + descriptionInk.width - (detailsBox?.x ?? 0);
    expectWithin1(descriptionInk.left - (detailsBox?.x ?? 0), 115.5);
    expectWithin1(descriptionInk.width, 72.5);
    expectWithin1(descriptionLabelEnd, DETAILS_DESCRIPTION_LABEL_END);

    const interSectionDemo = demo.locator("[data-detail-inter-section-demo]");
    const interSectionCard = interSectionDemo.locator(".detail-details-card");
    const twitterLabel = interSectionCard.getByText("Twitter", { exact: true });
    const addressHeading = interSectionCard.getByRole("heading", { name: "Address Information" });
    const twitterCap = (await textSolidInkBand(twitterLabel)).top;
    const addressTitleCap = (await textSolidInkBand(addressHeading)).top;
    expectWithin1(addressTitleCap - twitterCap, DETAILS_INTER_SECTION_LABEL_TO_TITLE);

    const interSectionCardBox = await interSectionCard.boundingBox();
    expect(interSectionCardBox).not.toBeNull();

    const addressValueInter = interSectionCard.locator(
      '[data-detail-field="Address"] .detail-field-value',
    );
    const addressLineCaps = await wrappedLineSolidCapTops(addressValueInter);
    const descriptionHeading = interSectionCard.getByRole("heading", {
      name: "Description Information",
    });
    await expect(descriptionHeading).toBeVisible();
    const descriptionTitleCap = (await textSolidInkBand(descriptionHeading)).top;
    const lastAddressLineCap =
      addressLineCaps?.[addressLineCaps.length - 1] ??
      (await firstLineSolidCapTop(addressValueInter)) ??
      (await textSolidInkBand(addressValueInter)).top;
    expectWithin1(descriptionTitleCap - lastAddressLineCap, DETAILS_ADDRESS_TO_DESCRIPTION_TITLE);

    const descriptionLabelInter = interSectionCard
      .locator('[data-detail-field="Description"]')
      .getByText("Description", { exact: true });
    const descriptionLabelCap = (await textSolidInkBand(descriptionLabelInter)).top;
    const cardBottom = (interSectionCardBox?.y ?? 0) + (interSectionCardBox?.height ?? 0);
    const lastRowBox = await descriptionLabelInter.locator("..").boundingBox();
    expect(lastRowBox).not.toBeNull();
    // View mode follows its own row height; the inline editor's bottom is not a target.
    expectWithin1(cardBottom, (lastRowBox?.y ?? 0) + (lastRowBox?.height ?? 0));
    expectWithin1(lastRowBox?.height ?? 0, DETAILS_ROW_PITCH);
    expect(descriptionLabelCap).toBeLessThan(cardBottom);
    expect(cardBottom - descriptionLabelCap).toBeGreaterThan(12);

    const railHiddenDemo = demo.locator("[data-detail-rail-hidden-demo]");
    const railHiddenCard = railHiddenDemo.locator(".detail-details-card");
    await expect(railHiddenCard).toHaveCSS("width", `${CARD_WIDTH_RAIL_HIDDEN}px`);
    const railHiddenBox = await railHiddenCard.boundingBox();
    expect(railHiddenBox).not.toBeNull();
    const railRatingRow = railHiddenCard.locator('[data-detail-field="Rating"]');
    await railRatingRow.hover();
    const railPencil = railRatingRow.getByRole("button", { name: "Edit Rating" });
    await railPencil.hover();
    await expect(railPencil).toHaveCSS("opacity", "1");
    const railPencilInk = await svgRasterInkBoxes(railPencil);
    expect(railPencilInk.solid).not.toBeNull();
    if (railPencilInk.antialiased && railHiddenBox) {
      expectWithin1(
        railPencilInk.antialiased.left - railHiddenBox.x,
        DETAILS_PENCIL_INK_LEFT_RAIL_HIDDEN,
      );
    }
    const railHiddenRatingWrap = railHiddenCard
      .locator('[data-detail-field="Rating"]')
      .locator(".detail-field-value-wrap");
    const railHiddenRatingWrapBox = await railHiddenRatingWrap.boundingBox();
    expect(railHiddenRatingWrapBox).not.toBeNull();
    if (railHiddenRatingWrapBox) {
      expect(Math.abs(railHiddenRatingWrapBox.width - 273)).toBeGreaterThan(1);
    }

    const longRow = rightColumn.locator('[data-detail-field="Website"]');
    const shortRow = leftColumn.locator('[data-detail-field="Title"]');
    const companyRow = rightColumn.locator('[data-detail-field="Company"]');
    const [longBox, shortBox, companyBox] = await Promise.all([
      longRow.boundingBox(),
      shortRow.boundingBox(),
      companyRow.boundingBox(),
    ]);
    expect(longBox).not.toBeNull();
    expect(shortBox).not.toBeNull();
    expect(companyBox).not.toBeNull();
    expect((longBox?.height ?? 0) > DETAILS_ROW_PITCH).toBeTruthy();
    expect(Math.abs((shortBox?.height ?? 0) - DETAILS_ROW_PITCH)).toBeLessThanOrEqual(1);
    expect(Math.abs((companyBox?.height ?? 0) - DETAILS_ROW_PITCH)).toBeLessThanOrEqual(1);

    const createdRow = rightColumn.locator('[data-detail-field="Created_By"]');
    const createdName = await textSolidInkBand(
      createdRow.getByText("Alex Morgan", { exact: true }),
    );
    const createdTimestamp = await textSolidInkBand(createdRow.locator(".detail-audit-timestamp"));
    expectWithin1(createdTimestamp.top - createdName.top, DETAILS_AUDIT_LINE_PITCH);
    await expect(createdRow.locator(".detail-audit-timestamp")).toHaveCSS(
      "color",
      await colorToken(page, "--color-text"),
    );
    const rows = [
      [
        "Details divider (DOM width / top)",
        "906 / 43.5",
        `${dividerBox?.width} / ${(dividerBox?.y ?? 0) - (detailsBox?.y ?? 0)}`,
      ],
      ["Lead Information solid cap top", "66.5", sectionTitleCapTop],
      ["First field label solid cap top", "117", firstDetailsTextTop],
      ["Modified By solid cap pitch", "18.5", modifiedTimestampCap - modifiedNameCap],
      ["Created By solid cap pitch", "18.5", createdTimestamp.top - createdName.top],
      ["Wrapped Lead Name solid cap pitch", "15.5", (leadNameLine2 ?? 0) - (leadNameLine1 ?? 0)],
      ["Wrapped Website solid cap pitch", "19.5", (websiteLine2 ?? 0) - (websiteLine1 ?? 0)],
      ["Two-line value to next label solid cap pitch", "60", companyLabelCap - leadNameLine1Cap],
      [
        "Address solid label end / value start",
        "148.5 / 186",
        `${addressLabelEnd} / ${addressValueStart}`,
      ],
      [
        "Description solid label start / end",
        "115.5 / 188",
        `${descriptionInk.left - (detailsBox?.x ?? 0)} / ${descriptionLabelEnd}`,
      ],
      [
        "Pencil solid width / height",
        "11.5 / 11.5",
        `${pencilInk.solid?.width} / ${pencilInk.solid?.height}`,
      ],
      [
        "Pencil total AA width / height",
        "12.5 / 12",
        `${pencilInk.antialiased?.width} / ${pencilInk.antialiased?.height}`,
      ],
      [
        "Pencil AA top relative to label cap",
        "-1.5",
        (pencilInk.antialiased?.top ?? 0) - ratingLabelCap,
      ],
      [
        "Rail-hidden pencil AA start (1126px card)",
        "1000.5",
        (railPencilInk.antialiased?.left ?? 0) - (railHiddenBox?.x ?? 0),
      ],
      ["Twitter to Address heading solid cap pitch", "70", addressTitleCap - twitterCap],
      [
        "Address last line to Description heading (synthetic one-line fixture)",
        "71 (local regression)",
        descriptionTitleCap - lastAddressLineCap,
      ],
      [
        "View-mode card bottom after final label cap",
        "not measured in reference",
        cardBottom - descriptionLabelCap,
      ],
    ];
    const report = `# Details card raster measurements\n\nViewport: 1470 × 835 CSS px; device scale: 2; card: 906 px (rail-hidden: 1126 px). All measured distances in CSS px. Solid = exact foreground RGB; total = every pixel differing from the flat white background. PNG bounds include the final pixel. DOM dimensions are explicitly marked. Tolerance: ±1 CSS px.\n\n| Spec row | Expected | Measured |\n| --- | --- | --- |\n${rows.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n\nOpen measurements: left/right view-mode wrapping container widths and Description view-mode value start/right edge remain not measured. The synthetic Address → Description transition and view-mode bottom are local regression evidence, not measurements of the inline editor capture.\n`;
    console.log(report);
    await testInfo.attach("measurement-report", {
      body: Buffer.from(report),
      contentType: "text/markdown",
    });
  });
});
