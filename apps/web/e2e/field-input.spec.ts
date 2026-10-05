import type { Locator } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
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
  const prefixSelect = prefix.locator(
    'xpath=ancestor::*[contains(@class,"record-prefix-select")][1]',
  );
  expect(await outerRightInset(prefixSelect, prefix.locator(".record-form-caret"))).toBeCloseTo(
    11,
    0,
  );
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
  expect(
    await outerRightInset(ownerTrigger, ownerTrigger.locator(".record-form-caret")),
  ).toBeCloseTo(9 + 32, 0);
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
  // Standard picklist: 1px CED0E1 edge, 6px upper/lower padding, 32px rows, F0F4FC selected fill.
  await expect(panel).toHaveCSS("border-top-width", "1px");
  await expect(panel).toHaveCSS("border-color", "rgb(206, 208, 225)");
  await expect(page.getByRole("listbox")).toHaveCSS("padding-top", "6px");
  await expect(page.getByRole("listbox")).toHaveCSS("padding-bottom", "6px");
  await expect(page.getByRole("option", { name: "-None-" })).toHaveCSS("height", "32px");
  await expect(page.getByRole("option", { name: "-None-" })).toHaveCSS(
    "background-color",
    "rgb(240, 244, 252)",
  );
  await expectType(
    page,
    page.getByRole("option", { name: "-None-" }),
    "--text-md",
    "--font-weight-semibold",
  );
  expect(await page.getByRole("dialog").getByRole("textbox").count()).toBe(0);
  expect((await panel.boundingBox())?.width).toBeCloseTo(
    (await standard.boundingBox())?.width ?? 0,
    0,
  );
  await page.keyboard.press("Escape");
  await expect(standard).toBeFocused();
  const country = demo.getByRole("button", { name: "Country empty", exact: true });
  await hydrate(country);
  await country.click();
  panel = page.locator(".record-choice-panel");
  // Country panel: 270px total height, 34px focused search and 32px pitch.
  await expect(panel).toHaveCSS("height", "270px");
  const search = page.getByRole("textbox", { name: "Search", exact: true });
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("height", "34px");
  await expect(search).toHaveCSS("border-color", "rgb(84, 100, 242)");
  const first = await page.getByRole("option", { name: "-None-" }).boundingBox();
  const second = await page.getByRole("option", { name: "Alpha" }).boundingBox();
  expect((second?.y ?? 0) - (first?.y ?? 0)).toBe(32);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR)
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/form-country-panel.png`,
    });
  await search.fill("ALP");
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.keyboard.press("Escape");
  const owner = demo.getByRole("button", { name: "ownerlookup filled", exact: true });
  await hydrate(owner);
  await owner.click();
  panel = page.locator(".record-choice-panel");
  // Owner dropdown: 179px panel with 1px CED0E1 border; selected name is heavier.
  await expect(panel).toHaveCSS("height", "179px");
  await expect(panel).toHaveCSS("border-color", "rgb(206, 208, 225)");
  await expect(page.getByRole("textbox", { name: "Search Users" })).toBeFocused();
  const selected = page.getByRole("option", { name: /Alex Example/ });
  await expect(selected).toHaveAttribute("aria-selected", "true");
  await expectType(
    page,
    selected.locator(".record-owner-name"),
    "--text-md",
    "--font-weight-semibold",
  );
  await expect(selected.locator("svg")).toHaveCount(2);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR)
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/form-owner-panel.png`,
    });
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
  await expectNoA11yViolations(page, {
    exclude: ["[data-part=empty]", "[data-part=empty-value]"],
  });
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
    await expectNoA11yViolations(page, {
      exclude: ["[data-part=empty]", "[data-part=empty-value]"],
    });
    await page.keyboard.press("Escape");
  }
});
