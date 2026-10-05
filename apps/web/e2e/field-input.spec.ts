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

test("form input geometry and composite inks match the measured form rows", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "field input" });
  const input = demo.getByRole("textbox", { name: "text empty", exact: true });
  await hydrate(input);
  const frame = input.locator("..");
  // record-detail.md → Lead Information rows: 34 high, 1px C5C4D3 edge, 5px corners.
  await expect(frame).toHaveCSS("height", "34px");
  await expect(frame).toHaveCSS("border-top-width", "1px");
  await expect(frame).toHaveCSS("border-color", "rgb(197, 196, 211)");
  await expect(frame).toHaveCSS("border-radius", "5px");
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
  // Composite inputs: only the empty Salutation prefix uses 8C91AB.
  const prefix = demo.getByRole("button", { name: "Salutation" });
  await prefix.scrollIntoViewIfNeeded();
  await expect(prefix.locator("[data-part=empty-value]")).toHaveCSS("color", "rgb(140, 145, 171)");
  // Form surface and Lead Image: 48px disk, B2B2B2 original placeholder ink.
  const profile = demo.getByRole("img", { name: "profileimage empty" });
  await expect(profile).toHaveCSS("width", "48px");
  await expect(profile).toHaveCSS("height", "48px");
  await expect(profile).toHaveCSS("color", "rgb(178, 178, 178)");
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
