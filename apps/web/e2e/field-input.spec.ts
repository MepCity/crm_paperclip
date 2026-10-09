import type { Locator } from "@playwright/test";
import { DEV_UI_A11Y_EXCLUDE, expectNoA11yViolations } from "./support/a11y";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

async function hydrate(target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      target.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactFiber$")),
      ),
    )
    .toBe(true);
}

async function valueStartAfterOuterLeft(frame: Locator, control: Locator) {
  return control.evaluate(
    (element, frameElement) => {
      const frameStyle = getComputedStyle(frameElement);
      const controlStyle = getComputedStyle(element);
      return (
        Number.parseFloat(frameStyle.borderLeftWidth) + Number.parseFloat(controlStyle.paddingLeft)
      );
    },
    await frame.elementHandle(),
  );
}

async function outerLeftInset(frame: Locator, inner: Locator) {
  const frameBox = await frame.boundingBox();
  const innerBox = await inner.boundingBox();
  return (innerBox?.x ?? 0) - (frameBox?.x ?? 0);
}

async function outerRightInset(frame: Locator, inner: Locator) {
  const frameBox = await frame.boundingBox();
  const innerBox = await inner.boundingBox();
  return (
    (frameBox?.x ?? 0) + (frameBox?.width ?? 0) - ((innerBox?.x ?? 0) + (innerBox?.width ?? 0))
  );
}

async function horizontalGap(left: Locator, right: Locator) {
  const leftBox = await left.boundingBox();
  const rightBox = await right.boundingBox();
  return (rightBox?.x ?? 0) - ((leftBox?.x ?? 0) + (leftBox?.width ?? 0));
}

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Expected a rendered measurement target");
  return box;
}

function expectPixels(actual: number, target: number) {
  expect(Math.abs(actual - target)).toBeLessThanOrEqual(1);
}

function expectFocusGlow(shadow: string) {
  expect(shadow).toContain("6px");
  expect(shadow).toMatch(/84,\s*100,\s*255/);
}

test("form input geometry and composite inks match the measured form rows", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "field input" });
  const input = demo.getByRole("textbox", { name: "text empty", exact: true });
  await hydrate(input);
  const frame = input.locator("xpath=ancestor::*[contains(@class,'record-input-frame')][1]");
  // record-detail.md → Lead Information rows: 34 high, 1px C5C4D3 edge, 5px corners.
  await expect(frame).toHaveCSS("height", "34px");
  await expect(frame).toHaveCSS("border-top-width", "1px");
  await expect(frame).toHaveCSS("border-color", "rgb(197, 196, 211)");
  await expect(frame).toHaveCSS("border-radius", "5px");
  expect(await valueStartAfterOuterLeft(frame, input)).toBeCloseTo(13, 0);
  await expect(input).toHaveCSS("color", "rgb(49, 57, 73)");
  await expect(demo.getByText("text empty", { exact: true })).toHaveCSS(
    "color",
    "rgb(97, 110, 136)",
  );
  await expectType(page, input, "--text-md", "--font-weight-normal");
  await expectType(
    page,
    demo.getByText("text empty", { exact: true }),
    "--text-md",
    "--font-weight-normal",
  );
  const picklist = demo.getByRole("button", { name: "picklist empty", exact: true });
  await hydrate(picklist);
  expect(await valueStartAfterOuterLeft(picklist, picklist)).toBeCloseTo(13, 0);
  const caret = picklist.locator(".record-form-caret");
  await expect(caret).toHaveCSS("width", "8px");
  await expect(caret).toHaveCSS("height", "5px");
  await expect(caret).toHaveCSS("color", "rgb(131, 136, 146)");
  expect(await outerRightInset(picklist, caret)).toBeCloseTo(12, 0);
  await picklist.click();
  await expect(caret).toHaveAttribute("data-open", "");
  await page.keyboard.press("Escape");
  // Lead Information rows: 3px FF5D5A required bar; 5464F2 focus border.
  const required = demo.getByRole("textbox", { name: "text required", exact: true }).locator("..");
  await expect(required).toHaveCSS("box-shadow", "rgb(255, 93, 90) 3px 0px 0px 0px inset");
  await input.focus();
  await expect(frame).toHaveCSS("border-color", "rgb(84, 100, 242)");
  const requiredInput = demo.getByRole("textbox", { name: "text required", exact: true });
  expectFocusGlow(await frame.evaluate((element) => getComputedStyle(element).boxShadow));
  await requiredInput.focus();
  const requiredShadow = await required.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(requiredShadow).toContain("rgb(255, 93, 90) 3px 0px 0px 0px inset");
  expectFocusGlow(requiredShadow);
  for (const type of ["email", "phone", "website", "integer", "double", "currency"]) {
    await expect(
      demo.getByRole("textbox", { name: `${type} empty`, exact: true }).locator(".."),
    ).toHaveCSS("height", "34px");
  }
  const currencyFrame = demo
    .getByRole("textbox", { name: "currency empty", exact: true })
    .locator("xpath=ancestor::*[contains(@class,'record-input-frame')][1]");
  const currencyPrefix = currencyFrame.locator(".record-currency-prefix > span").first();
  await expect(currencyPrefix).toHaveCSS("color", "rgb(97, 110, 136)");
  expect(
    await valueStartAfterOuterLeft(currencyFrame, currencyFrame.locator(".record-currency-prefix")),
  ).toBeCloseTo(12, 0);
  const currencyDivider = currencyFrame.locator(".record-currency-divider");
  const currencyBox = await bounds(currencyFrame);
  const currencyDividerBox = await bounds(currencyDivider);
  const currencyPrefixBox = await bounds(currencyPrefix);
  const currencyDividerTop = currencyDividerBox.y - currencyBox.y;
  const currencyDividerGap = currencyDividerBox.x - (currencyPrefixBox.x + currencyPrefixBox.width);
  expectPixels(currencyDividerBox.width, 1);
  expectPixels(currencyDividerBox.height, 20);
  expectPixels(currencyDividerTop, 7);
  expectPixels(currencyDividerGap, 9.5);
  await expect(currencyDivider).toHaveCSS("background-color", "rgb(197, 196, 211)");
  const currencyEnd = currencyFrame.locator(".record-input-end");
  await expect(currencyEnd).toHaveCSS("width", "32px");
  await expect(currencyEnd).toHaveCSS("background-color", "rgb(240, 244, 255)");
  await expect(currencyEnd.locator("svg")).toHaveCSS("width", "16px");
  await expect(currencyEnd.locator("svg")).toHaveCSS("color", "rgb(49, 57, 73)");
  // Composite inputs: only the empty Salutation prefix uses 8C91AB.
  const prefix = demo.getByRole("button", { name: "Salutation" });
  await prefix.scrollIntoViewIfNeeded();
  const salutationFrame = prefix.locator(
    "xpath=ancestor::*[contains(@class,'record-input-frame')][1]",
  );
  const emptyValue = prefix.locator("[data-part=empty-value]");
  expect(await valueStartAfterOuterLeft(salutationFrame, prefix)).toBeCloseTo(13, 0);
  await expect(emptyValue).toHaveCSS("color", "rgb(140, 145, 171)");
  const salutationDivider = salutationFrame.locator(".record-prefix-divider");
  const salutationOuter = salutationFrame;
  expect(await outerLeftInset(salutationOuter, salutationDivider)).toBeCloseTo(94, 0);
  const salutationBox = await bounds(salutationFrame);
  const prefixBox = await bounds(prefix);
  const emptyBox = await bounds(emptyValue);
  const prefixCaretBox = await bounds(prefix.locator(".record-form-caret"));
  const prefixDividerBox = await bounds(salutationDivider);
  const prefixTop = prefixBox.y - salutationBox.y;
  const emptyCenter = emptyBox.y + emptyBox.height / 2 - salutationBox.y;
  const caretCenter = prefixCaretBox.y + prefixCaretBox.height / 2 - salutationBox.y;
  const prefixCaretGap = prefixDividerBox.x - (prefixCaretBox.x + prefixCaretBox.width);
  expectPixels(prefixBox.height, 32);
  expectPixels(prefixTop, 1);
  expectPixels(emptyCenter, salutationBox.height / 2);
  expectPixels(caretCenter, salutationBox.height / 2);
  expectPixels(prefixCaretGap, 11);
  await prefix.click();
  const salutationPanel = page.locator(".record-choice-panel").last();
  expect((await salutationPanel.boundingBox())?.width).toBeCloseTo(110, 0);
  expect((await prefix.boundingBox())?.width).toBeLessThan(110);
  await page.keyboard.press("Escape");
  const ownerTrigger = demo.getByRole("button", { name: "ownerlookup filled", exact: true });
  await hydrate(ownerTrigger);
  const ownerFrame = ownerTrigger.locator(
    "xpath=ancestor::*[contains(@class,'record-choice-shell')][1]",
  );
  const ownerEnd = ownerFrame.locator(".record-input-end");
  await expect(ownerEnd).toHaveCSS("width", "32px");
  await expect(ownerEnd).toHaveCSS("background-color", "rgb(240, 244, 255)");
  expect(await outerRightInset(ownerFrame, ownerEnd)).toBeCloseTo(1, 0);
  const ownerEndBox = await bounds(ownerEnd);
  const ownerCaretBox = await bounds(ownerTrigger.locator(".record-form-caret"));
  const ownerCaretGap = ownerEndBox.x - (ownerCaretBox.x + ownerCaretBox.width);
  expectPixels(ownerCaretGap, 9);
  const ownerIcon = ownerEnd.locator("svg");
  const ownerIconBox = await bounds(ownerIcon);
  expectPixels(ownerIconBox.width, 16);
  expectPixels(ownerIconBox.height, 16);
  await expect(ownerIcon).toHaveCSS("color", "rgb(49, 57, 73)");
  const disabledOwner = demo
    .getByRole("button", { name: "ownerlookup disabled", exact: true })
    .locator("xpath=ancestor::*[contains(@class,'record-choice-shell')][1]");
  const disabledText = demo
    .getByRole("textbox", { name: "text disabled", exact: true })
    .locator("xpath=ancestor::*[contains(@class,'record-input-frame')][1]");
  for (const property of ["opacity", "background-color"]) {
    await expect(disabledOwner).toHaveCSS(
      property,
      await disabledText.evaluate(
        (element, name) => getComputedStyle(element).getPropertyValue(name),
        property,
      ),
    );
  }
  await expect(disabledOwner).toHaveCSS("opacity", "0.5");
  await expect(disabledOwner.locator(".record-input-end")).toHaveCSS("opacity", "1");
  const textFrame = demo
    .getByRole("textbox", { name: "text empty", exact: true })
    .locator("xpath=ancestor::*[contains(@class,'record-input-frame')][1]");
  expect((await ownerFrame.boundingBox())?.width).toBeCloseTo(
    (await textFrame.boundingBox())?.width ?? 0,
    0,
  );
  // Form surface and Lead Image: 48px disk, B4B4B4 ring, B2B2B2 silhouette.
  const profile = demo.getByRole("img", { name: "profileimage empty" });
  await expect(profile).toHaveCSS("width", "48px");
  await expect(profile).toHaveCSS("height", "48px");
  await expect(profile).toHaveCSS("border-top-width", "1px");
  await expect(profile).toHaveCSS("border-color", "rgb(180, 180, 180)");
  await expect(profile.locator("svg")).toHaveCSS("color", "rgb(178, 178, 178)");
  const profileBox = await bounds(profile);
  const headBox = await bounds(profile.locator("circle"));
  const bodyBox = await bounds(profile.locator("path"));
  const headTop = headBox.y - profileBox.y;
  expectPixels(headTop, 15);
  expectPixels(headBox.width, 16);
  expect(bodyBox.y - profileBox.y).toBeLessThanOrEqual(32);
  // The neck fills the space between the head and shoulders.
  const bodyWidths = await profile.locator("path").evaluate((element) => {
    const path = element as SVGGeometryElement;
    return [30, 33, 36].map((y) => {
      let halfWidth = 0;
      for (let x = 24; x <= 48; x += 0.05) {
        if (path.isPointInFill(new DOMPoint(x, y))) halfWidth = x - 24;
      }
      return halfWidth * 2;
    });
  });
  for (const [index, width] of [8.5, 24, 31.5].entries()) {
    expectPixels(bodyWidths[index] ?? Number.NaN, width);
  }
  const measurements = {
    salutationTriggerHeight: prefixBox.height,
    salutationTriggerTop: prefixTop,
    salutationTextCenter: emptyCenter,
    salutationCaretCenter: caretCenter,
    salutationCaretDividerGap: prefixCaretGap,
    ownerCaretEndGap: ownerCaretGap,
    ownerIconWidth: ownerIconBox.width,
    ownerIconHeight: ownerIconBox.height,
    currencyDividerTop,
    currencyDividerGap,
    currencyDividerWidth: currencyDividerBox.width,
    currencyDividerHeight: currencyDividerBox.height,
    portraitHeadTop: headTop,
    portraitHeadWidth: headBox.width,
    portraitBodyTop: bodyBox.y - profileBox.y,
    portraitBodyWidths: bodyWidths,
  };
  await test.info().attach("round-two-measurements", {
    body: JSON.stringify(measurements, null, 2),
    contentType: "application/json",
  });
  console.log("ROUND_TWO_MEASUREMENTS", JSON.stringify(measurements));
  await expect(demo.getByRole("textbox", { name: "textarea empty" })).toHaveCSS("resize", "both");
  await expect(demo.getByRole("textbox", { name: "Latitude" })).toHaveAttribute(
    "placeholder",
    "Latitude",
  );
  await demo.getByRole("button", { name: "Clear All" }).click();
  await expect(demo.getByRole("textbox", { name: "Latitude" })).toHaveValue("");
  await expect(demo.getByRole("textbox", { name: "Longitude" })).toHaveValue("");
  await input.scrollIntoViewIfNeeded();
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR)
    await page.screenshot({ path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/form-inputs.png` });
});

test("standard, searchable and owner panel geometry matches the dropdown table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "field input" });
  const standard = demo.getByRole("button", { name: "picklist empty", exact: true });
  await hydrate(standard);
  await standard.click();
  let panel = page.locator(".record-choice-panel");
  // a: Panel corners have a 5 px radius.
  await expect(panel).toHaveCSS("border-radius", "5px");
  const selectedNone = page.getByRole("option", { name: "-None-" });
  const unselected = page.getByRole("option", { name: "Alpha" });
  const check = selectedNone.locator(".record-choice-check");
  // b: Standard picklist selected check at 15 px from panel outer left, ink #313949.
  expectPixels(await outerLeftInset(panel, check), 15);
  await expect(check).toHaveCSS("width", "11.5px");
  await expect(check).toHaveCSS("height", "8.5px");
  await expect(check).toHaveCSS("color", "rgb(49, 57, 73)");
  // c: Option text starts 32.5 px after the panel outer left edge.
  const selectedText = selectedNone.locator(".min-w-0").first();
  const unselectedText = unselected.locator(".min-w-0").first();
  expectPixels(await outerLeftInset(panel, selectedText), 32.5);
  expectPixels(await outerLeftInset(panel, unselectedText), 32.5);
  // d: Inset selected fill on standard picklist only.
  const fillColor = await selectedNone.evaluate(
    (element) => getComputedStyle(element, "::before").backgroundColor,
  );
  expect(fillColor).toBe("rgb(240, 244, 252)");
  const panelBox = await bounds(panel);
  const fillBox = await selectedNone.evaluate((element) => {
    const before = getComputedStyle(element, "::before");
    const row = element.getBoundingClientRect();
    const left = Number.parseFloat(before.left) + row.left;
    const width = Number.parseFloat(before.width);
    const height = Number.parseFloat(before.height);
    const top = row.top + (row.height - height) / 2;
    return { x: left, y: top, width, height };
  });
  expectPixels(fillBox.x - panelBox.x, 7);
  expectPixels(panelBox.x + panelBox.width - (fillBox.x + fillBox.width), 7);
  expectPixels(fillBox.height, 32);
  await expect(selectedNone).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expectType(page, selectedNone, "--text-md", "--font-weight-semibold");
  expect(await page.getByRole("dialog").getByRole("textbox").count()).toBe(0);
  await page.keyboard.press("Escape");
  const country = demo.getByRole("button", { name: "Country empty", exact: true });
  await hydrate(country);
  await country.click();
  panel = page.locator(".record-choice-panel");
  await expect(panel).toHaveCSS("border-radius", "5px");
  const search = page.getByRole("textbox", { name: "Search", exact: true });
  // e: Search input inset 11 px from panel sides, 12 px from panel top.
  expectPixels(await outerLeftInset(panel, search), 11);
  expectPixels(await outerRightInset(panel, search), 11);
  const panelTop = (await bounds(panel)).y;
  const searchTop = (await bounds(search)).y;
  expectPixels(searchTop - panelTop, 12);
  // f: Country search height 34 px.
  await expect(search).toHaveCSS("height", "34px");
  const searchIcon = panel.locator(".record-panel-search-icon");
  // g: Magnifier 13.5 × 13.5 px, #313949, 11.5 px after search outer left.
  await expect(searchIcon).toHaveCSS("width", "13.5px");
  await expect(searchIcon).toHaveCSS("height", "13.5px");
  await expect(searchIcon).toHaveCSS("color", "rgb(49, 57, 73)");
  expectPixels(await outerLeftInset(search, searchIcon), 11.5);
  // h: No placeholder on country search.
  await expect(search).toHaveAttribute("placeholder", "");
  // k: Focused panel search uses the focus glow token.
  expectFocusGlow(await search.evaluate((element) => getComputedStyle(element).boxShadow));
  const countrySelected = page.getByRole("option", { name: "-None-" });
  expectPixels(await outerLeftInset(panel, countrySelected.locator(".record-choice-check")), 15);
  expectPixels(await outerLeftInset(panel, countrySelected.locator(".min-w-0").first()), 32.5);
  await expect(countrySelected).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  // i: First row starts 7.5 px below search bottom; 32 px pitch.
  const searchBottom = (await bounds(search)).y + (await bounds(search)).height;
  const firstRowTop = (await bounds(countrySelected)).y;
  expectPixels(firstRowTop - searchBottom, 7.5);
  const second = await page.getByRole("option", { name: "Alpha" }).boundingBox();
  const first = await countrySelected.boundingBox();
  expect((second?.y ?? 0) - (first?.y ?? 0)).toBe(32);
  await search.fill("ALP");
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.keyboard.press("Escape");
  const owner = demo.getByRole("button", { name: "ownerlookup filled", exact: true });
  await hydrate(owner);
  await owner.click();
  panel = page.locator(".record-choice-panel");
  const ownerSearch = page.getByRole("textbox", { name: "Search Users" });
  // f: Owner search height 30 px.
  await expect(ownerSearch).toHaveCSS("height", "30px");
  // h: Search Users placeholder on owner panel.
  await expect(ownerSearch).toHaveAttribute("placeholder", "Search Users");
  const selected = page.getByRole("option", { name: /Alex Example/ });
  await expect(selected).toHaveAttribute("aria-selected", "true");
  await expectType(
    page,
    selected.locator(".record-owner-name"),
    "--text-md",
    "--font-weight-semibold",
  );
  await expect(selected).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expectPixels(await outerLeftInset(panel, selected.locator(".record-choice-check")), 16);
  const avatar = selected.locator(".record-owner-avatar");
  expectPixels(await outerLeftInset(panel, avatar), 32);
  await expect(avatar).toHaveCSS("width", "30px");
  await expect(avatar).toHaveCSS("height", "30px");
  const tokenAvatarColor = await page.evaluate(() => {
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    probe.style.setProperty("background-color", "var(--color-avatar)");
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect(avatar).toHaveCSS("background-color", tokenAvatarColor);
  expectPixels(await horizontalGap(avatar, selected.locator(".record-owner-name")), 11);
  await expect(selected.locator(".record-owner-email")).toHaveCSS("color", "rgb(97, 110, 136)");
  const avatars = panel.locator(".record-owner-avatar");
  const firstAvatar = await bounds(avatars.first());
  const secondAvatar = await bounds(avatars.nth(1));
  // j: 41 px avatar pitch; last avatar 13 px above panel bottom.
  expectPixels(secondAvatar.y - firstAvatar.y, 41);
  const lastAvatar = await bounds(avatars.last());
  const ownerPanelBox = await bounds(panel);
  expectPixels(ownerPanelBox.y + ownerPanelBox.height - (lastAvatar.y + lastAvatar.height), 13);
  await page.keyboard.press("Escape");
});

test("form demo meets the accessibility baseline", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "field input" });
  await hydrate(demo.getByRole("textbox", { name: "text empty", exact: true }));
  await expect(demo.getByRole("button", { name: "Salutation" })).toBeVisible();
  await expect(demo.locator("[data-part=empty-value]")).toHaveCount(1);
  // The pre-existing list empty-state ink is outside this issue's scope.
  // Empty selection text keeps the measured #8C91AB on white (3.11:1): ADR 0003 §8.
  await expectNoA11yViolations(page, { exclude: [...DEV_UI_A11Y_EXCLUDE] });
});

test("open form panels meet the accessibility baseline", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "field input" });
  for (const name of ["picklist empty", "Country empty", "ownerlookup filled"]) {
    const trigger = demo.getByRole("button", { name, exact: true });
    await hydrate(trigger);
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Empty selection text keeps the measured #8C91AB on white (3.11:1): ADR 0003 §8.
    await expectNoA11yViolations(page, { exclude: [...DEV_UI_A11Y_EXCLUDE] });
    await page.keyboard.press("Escape");
  }
});
