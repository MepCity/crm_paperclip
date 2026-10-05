import { expect, type Page, test } from "@playwright/test";

/** research/specs/record-detail.md › Layout › Visual layout › Business card, Details card */

async function length(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.width = `var(${name})`;
    document.body.append(probe);
    const pixels = Number.parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return pixels;
  }, token);
}

async function radius(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.borderRadius = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).borderRadius;
    probe.remove();
    return value;
  }, token);
}

async function tokenValue(
  page: Page,
  property: "font-size" | "font-weight" | "color",
  token: string,
) {
  return page.evaluate(
    ({ property, token }) => {
      const probe = document.createElement("span");
      probe.style.setProperty(property, `var(${token})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return value;
    },
    { property, token },
  );
}

test.describe("record detail cards visual layout", () => {
  test.use({ viewport: { width: 1470, height: 835 } });

  test("business and details cards match measured tokens", async ({ page }) => {
    await page.goto("/dev/ui");
    const heading = page.getByRole("heading", { name: "record detail cards", exact: true });
    await heading.scrollIntoViewIfNeeded();
    const demo = page.locator("[data-record-detail-demo]");
    await expect(demo).toBeVisible();

    const business = demo.locator(".detail-business-card");
    const details = demo.locator(".detail-details-card").first();

    const cardWidth = await length(page, "--size-detail-card-width");
    const padding = await length(page, "--size-detail-card-padding");
    const corner = await radius(page, "--radius-lg");

    await expect(business).toHaveCSS("width", `${cardWidth}px`);
    await expect(business).toHaveCSS("border-radius", corner);
    await expect(business).toHaveCSS("background-color", "rgb(255, 255, 255)");

    const businessBox = await business.boundingBox();
    const ownerLabel = business.getByText("Lead Owner", { exact: true });
    const ownerValue = business.getByText("Alex Morgan", { exact: true });
    const [labelBox, valueBox] = await Promise.all([
      ownerLabel.boundingBox(),
      ownerValue.boundingBox(),
    ]);
    expect(businessBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(valueBox).not.toBeNull();
    const labelEnd = (labelBox?.x ?? 0) + (labelBox?.width ?? 0);
    const valueStart = valueBox?.x ?? 0;
    const labelValueGap = await length(page, "--size-detail-business-label-value-gap");
    const labelColumn = await length(page, "--size-detail-business-label-width");
    expect(Math.abs(valueStart - labelEnd - labelValueGap)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(labelEnd - ((businessBox?.x ?? 0) + padding + labelColumn)),
    ).toBeLessThanOrEqual(2);

    await expect(ownerLabel).toHaveCSS("color", "rgb(97, 110, 136)");
    await expect(ownerLabel).toHaveCSS(
      "font-size",
      await tokenValue(page, "font-size", "--text-md"),
    );
    await expect(ownerLabel).toHaveCSS(
      "font-weight",
      await tokenValue(page, "font-weight", "--font-weight-normal"),
    );
    await expect(ownerValue).toHaveCSS("color", "rgb(49, 57, 73)");

    const email = business.getByRole("link", { name: "lead001@example.org" });
    await expect(email).toHaveCSS("color", await tokenValue(page, "color", "--color-primary"));

    await expect(details).toHaveCSS("width", `${cardWidth}px`);
    const divider = details.locator("[data-detail-divider]");
    await expect(divider).toHaveCSS("background-color", "rgb(214, 214, 227)");

    const columns = details.locator("[data-detail-columns]");
    const leftColumn = columns.locator('[data-detail-column="left"]');
    const leftTitle = leftColumn.getByText("Title", { exact: true });
    const leftTitleValue = leftColumn.getByText("Director", { exact: true });
    const [leftLabelBox, leftValueBox] = await Promise.all([
      leftTitle.boundingBox(),
      leftTitleValue.boundingBox(),
    ]);
    const detailsGap = await length(page, "--size-detail-details-label-value-gap");
    const leftLabelEnd = (leftLabelBox?.x ?? 0) + (leftLabelBox?.width ?? 0);
    expect(Math.abs((leftValueBox?.x ?? 0) - leftLabelEnd - detailsGap)).toBeLessThanOrEqual(1);

    const sectionTitle = details.getByRole("heading", { name: "Lead Information" });
    await expect(sectionTitle).toHaveCSS("color", "rgb(32, 33, 35)");
    await expect(sectionTitle).toHaveCSS(
      "font-weight",
      await tokenValue(page, "font-weight", "--font-weight-semibold"),
    );
  });
});
