import { expect, type Page, test } from "@playwright/test";
import { expectType } from "./support/typography";

/** research/specs/record-detail.md › Layout › Visual layout › Business card, Details card */

const CARD_WIDTH = 906;
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
const DETAILS_TWO_LINE_ROW_PITCH = 60;
const DETAILS_PENCIL_SIZE = 11.5;
const CAP_HEIGHT = 10.5;
const LINE_HEIGHT = 18;

function labelTextTop(labelBox: { y: number }) {
  return labelBox.y + (LINE_HEIGHT - CAP_HEIGHT) / 2;
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
  test.use({ viewport: { width: 1470, height: 835 } });

  test("business and details cards match spec layout", async ({ page }) => {
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

    const firstTextTop = labelTextTop({ y: labelBox?.y ?? 0 }) - (cardBox?.y ?? 0);
    expect(Math.abs(firstTextTop - BUSINESS_FIRST_LABEL_TEXT_TOP)).toBeLessThanOrEqual(1);

    const businessLabelNames = ["Lead Owner", "Email", "Phone", "Mobile", "Lead Status"];
    const businessLabelTops: number[] = [];
    for (const name of businessLabelNames) {
      const box = await business.getByText(name, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      businessLabelTops.push(box?.y ?? 0);
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

    const firstDetailsTextTop = labelTextTop({ y: leftLabelBox?.y ?? 0 }) - (detailsBox?.y ?? 0);
    expect(Math.abs(firstDetailsTextTop - DETAILS_FIRST_LABEL_TEXT_TOP)).toBeLessThanOrEqual(1);

    const leftLabelNames = ["Title", "Lead Source", "Modified By"];
    const leftLabelTops: number[] = [];
    for (const name of leftLabelNames) {
      const box = await leftColumn.getByText(name, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      leftLabelTops.push(box?.y ?? 0);
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
    const sectionTitleBox = await sectionTitle.boundingBox();
    expect(sectionTitleBox).not.toBeNull();
    const sectionTitleCapTop = labelTextTop({ y: sectionTitleBox?.y ?? 0 }) - (detailsBox?.y ?? 0);
    expect(Math.abs(sectionTitleCapTop - DETAILS_SECTION_TITLE_CAP_TOP)).toBeLessThanOrEqual(1);

    const modifiedByRow = leftColumn.locator('[data-detail-field="Modified_By"]');
    const modifiedByName = modifiedByRow.getByText("Sam Rivera", { exact: true });
    const modifiedByTimestamp = modifiedByRow.locator(".detail-audit-timestamp");
    const [modifiedNameBox, modifiedTimestampBox] = await Promise.all([
      modifiedByName.boundingBox(),
      modifiedByTimestamp.boundingBox(),
    ]);
    expect(modifiedNameBox).not.toBeNull();
    expect(modifiedTimestampBox).not.toBeNull();
    const modifiedNameCap = labelTextTop({ y: modifiedNameBox?.y ?? 0 });
    const modifiedTimestampCap = labelTextTop({ y: modifiedTimestampBox?.y ?? 0 });
    expect(
      Math.abs(modifiedTimestampCap - modifiedNameCap - DETAILS_AUDIT_LINE_PITCH),
    ).toBeLessThanOrEqual(1);
    await expect(modifiedByTimestamp).toHaveCSS("color", await colorToken(page, "--color-text"));

    const leadNameValue = rightColumn.getByText(
      "Northwind Trading Company International Division Regional Procurement Office West Coast",
      {
        exact: true,
      },
    );
    const leadNameLines = await leadNameValue.evaluate((node) => {
      const range = document.createRange();
      const text = node.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE) {
        return null;
      }
      const content = text.textContent ?? "";
      const words = content.split(" ");
      const firstLine = words.slice(0, 4).join(" ");
      const secondLineStart = firstLine.length + 1;
      range.setStart(text, 0);
      range.setEnd(text, firstLine.length);
      const line1Top = range.getBoundingClientRect().top;
      range.setStart(text, secondLineStart);
      range.setEnd(text, content.length);
      const line2Top = range.getBoundingClientRect().top;
      return { line1Top, line2Top };
    });
    expect(leadNameLines).not.toBeNull();
    if (leadNameLines) {
      expect(
        Math.abs(leadNameLines.line2Top - leadNameLines.line1Top - DETAILS_MULTILINE_LINE_PITCH),
      ).toBeLessThanOrEqual(1);
    }
    const leadNameRow = rightColumn.locator('[data-detail-field="Lead_Name"]');
    const companyLabel = rightColumn.getByText("Company", { exact: true });
    const [leadNameValueBox, companyLabelBox] = await Promise.all([
      leadNameRow.locator(".detail-field-value").boundingBox(),
      companyLabel.boundingBox(),
    ]);
    expect(leadNameValueBox).not.toBeNull();
    expect(companyLabelBox).not.toBeNull();
    const leadNameLine1Cap = labelTextTop({ y: leadNameValueBox?.y ?? 0 });
    const companyLabelTop = labelTextTop({ y: companyLabelBox?.y ?? 0 });
    expect(
      Math.abs(companyLabelTop - leadNameLine1Cap - DETAILS_TWO_LINE_ROW_PITCH),
    ).toBeLessThanOrEqual(1);

    const ratingRow = rightColumn.locator('[data-detail-field="Rating"]');
    await ratingRow.hover();
    const pencil = ratingRow.getByRole("button", { name: "Edit Rating" });
    await expect(pencil).toBeVisible();
    const ratingLabel = ratingRow.getByText("Rating", { exact: true });
    const [pencilBox, ratingLabelBox] = await Promise.all([
      pencil.boundingBox(),
      ratingLabel.boundingBox(),
    ]);
    expect(pencilBox).not.toBeNull();
    expect(ratingLabelBox).not.toBeNull();
    expect(Math.abs((pencilBox?.width ?? 0) - DETAILS_PENCIL_SIZE)).toBeLessThanOrEqual(1);
    expect(Math.abs((pencilBox?.height ?? 0) - DETAILS_PENCIL_SIZE)).toBeLessThanOrEqual(1);
    const ratingLabelCap = labelTextTop({ y: ratingLabelBox?.y ?? 0 });
    expect(Math.abs((pencilBox?.y ?? 0) - (ratingLabelCap - 1.5))).toBeLessThanOrEqual(1);
    await expect(pencil).toHaveCSS("color", await colorToken(page, "--color-text-muted"));

    const addressSection = details.locator(".detail-details-sections > div").nth(1);
    const descriptionRow = addressSection.locator(".detail-details-row-description");
    await expect(descriptionRow).toHaveCount(1);

    const longRow = rightColumn.locator('[data-detail-field="Description"]');
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
  });
});
