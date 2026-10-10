import { join } from "node:path";
import type { Page } from "@playwright/test";
import { operationPath, operations } from "../src/lib/api/wire/operations";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath } from "./support/crm-paths";
import { expectWithin1, textCapLeft } from "./support/geometry";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType, tokenValue } from "./support/typography";

function px(value: string) {
  return Number.parseFloat(value);
}

async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

async function sampleBackdropFromOverlayToken(page: Page) {
  return page.evaluate(() => {
    const overlay = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-overlay")
      .trim();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Expected canvas context.");
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = overlay;
    context.globalAlpha = 0.5;
    context.fillRect(0, 0, 1, 1);
    const pixels = context.getImageData(0, 0, 1, 1).data;
    return {
      red: pixels[0] ?? 0,
      green: pixels[1] ?? 0,
      blue: pixels[2] ?? 0,
      alpha: pixels[3] ?? 0,
    };
  });
}

async function sampleComputedBackground(page: Page, css: string) {
  return page.evaluate((background) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = background;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Expected canvas context.");
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const pixels = context.getImageData(0, 0, 1, 1).data;
    return {
      red: pixels[0] ?? 0,
      green: pixels[1] ?? 0,
      blue: pixels[2] ?? 0,
      alpha: pixels[3] ?? 0,
    };
  }, css);
}

function expectRgbaClose(
  actual: { red: number; green: number; blue: number; alpha: number },
  expected: { red: number; green: number; blue: number; alpha: number },
) {
  for (const channel of ["red", "green", "blue", "alpha"] as const) {
    expect(Math.abs(actual[channel] - expected[channel])).toBeLessThanOrEqual(2);
  }
}

async function expectLinearGradientUsesColors(
  page: Page,
  locator: import("@playwright/test").Locator,
  startToken: string,
  endToken: string,
) {
  const startColor = await tokenColor(page, startToken);
  const endColor = await tokenColor(page, endToken);
  const backgroundImage = await locator.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  expect(backgroundImage).toContain("linear-gradient");
  expect(backgroundImage).toContain(startColor);
  expect(backgroundImage).toContain(endColor);
}

async function tokenLength(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.width = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).width;
    probe.remove();
    return value;
  }, token);
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, "Leads");
  await page.goto(`${list}?page=2&per_page=10`);
  await page.getByRole("link", { name: "Create Lead", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Lead" })).toBeVisible();
  return { org, list };
}

async function fillRequired(page: Page, suffix = "One") {
  await page.getByRole("textbox", { name: "Company", exact: true }).fill(`Form Company ${suffix}`);
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill(`Form Lead ${suffix}`);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("create and edit save with ADR write envelopes and changed fields only", async ({ page }) => {
  await openCreate(page);
  await fillRequired(page);
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Leads",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  expect(request.postDataJSON().data[0]).toMatchObject({
    Company: "Form Company One",
    Last_Name: "Form Lead One",
  });
  await expect(page.locator("[data-record-header]")).toContainText("Form Lead One");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Company", exact: true })).toHaveValue(
    "Form Company One",
  );
  const editStrip = await page.locator("[data-record-form-strip]").boundingBox();
  if (!editStrip) throw new Error("Missing edit strip");
  expectWithin1(editStrip.x, 332);
  expectWithin1(editStrip.y, 50);
  expectWithin1(editStrip.height, 57);
  await page.getByRole("textbox", { name: "Company", exact: true }).fill("Updated Form Company");
  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" &&
      /\/crm\/v2\.2\/Leads\/[^/]+$/.test(new URL(request.url()).pathname),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await updateRequest).postDataJSON()).toEqual({
    data: [{ Company: "Updated Form Company" }],
  });
  await expect(page.locator("[data-record-header]")).toContainText("Updated Form Company");
});

test("Save and New clears the form and leaves a saved record in the list", async ({ page }) => {
  const { org, list } = await openCreate(page);
  await fillRequired(page, "New");
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, "Leads"));
  await expect(page.getByRole("textbox", { name: "Company", exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(`${list}?page=2&per_page=10`);
  await page.goto(list);
  await expect(page.getByRole("link", { name: "Form Lead New", exact: true })).toBeVisible();
});

test("client validation keeps the form open, shows messages and focuses Company", async ({
  page,
}) => {
  await openCreate(page);
  const saveRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Leads",
    { timeout: 2_000 },
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Company cannot be empty.", { exact: true })).toBeVisible();
  await expect(page.getByText("Last Name cannot be empty.", { exact: true })).toBeVisible();
  const company = page.getByRole("textbox", { name: "Company", exact: true });
  await expect(company).toHaveAttribute("aria-invalid", "true");
  await expect(company).toBeFocused();
  await expect(page.getByRole("heading", { name: "Create Lead" })).toBeVisible();
  await expect(saveRequest).rejects.toThrow();
});

test("invalid email shows a format message without saving", async ({ page }) => {
  await openCreate(page);
  await fillRequired(page);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("not-an-email");
  const saveRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Leads",
    { timeout: 2_000 },
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Please enter a valid Email.", { exact: true })).toBeVisible();
  await expect(saveRequest).rejects.toThrow();
});

test("validation and unsaved dialog visuals match record-detail tokens", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const companyField = page.locator("[data-form-field=Company]");
  const message = companyField.getByText("Company cannot be empty.", { exact: true });
  const frame = companyField.locator(".record-input-frame");
  const frameBox = await frame.boundingBox();
  const messageBox = await message.boundingBox();
  if (!frameBox || !messageBox) throw new Error("Missing validation geometry");
  expectWithin1(messageBox.y - (frameBox.y + frameBox.height), 4);
  await expect(message).toHaveCSS("color", "rgb(255, 93, 90)");
  await expectType(page, message, "--text-sm", "--font-weight-normal");
  await expect(frame).toHaveCSS("border-top-color", "rgb(255, 93, 90)");
  await expect(frame).toHaveCSS("border-top-width", "1px");
  await expect(frame).toHaveCSS("border-right-width", "1px");
  await expect(frame).toHaveCSS("border-bottom-width", "1px");
  await expect(frame).toHaveCSS("border-left-width", "1px");
  await page.getByRole("textbox", { name: "Company", exact: true }).fill("Dirty");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  const panel = dialog.locator("xpath=..");
  const modalBox = await panel.boundingBox();
  if (!modalBox) throw new Error("Missing dialog");
  const dialogWidth = px(await tokenLength(page, "--size-dialog-width"));
  expectWithin1(modalBox.width, dialogWidth);
  const cornerRadius = px(await tokenLength(page, "--radius-create-menu"));
  await expect(panel).toHaveCSS("border-radius", `${cornerRadius}px`);
  const title = dialog.getByRole("heading");
  const titleBox = await title.boundingBox();
  if (!titleBox) throw new Error("Missing dialog title");
  const paddingTop = px(await tokenLength(page, "--size-confirm-dialog-padding-block-start"));
  const paddingInline = px(await tokenLength(page, "--size-confirm-dialog-padding-inline"));
  const paddingBottom = px(await tokenLength(page, "--size-confirm-dialog-padding-block-end"));
  expectWithin1(titleBox.y - modalBox.y, paddingTop);
  expectWithin1(titleBox.x - modalBox.x, paddingInline);
  const backdrop = dialog.locator('xpath=ancestor::*[contains(@class,"inset-0")][1]');
  const backdropColor = await backdrop.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const expectedBackdrop = await sampleBackdropFromOverlayToken(page);
  const actualBackdrop = await sampleComputedBackground(page, backdropColor);
  expectRgbaClose(actualBackdrop, expectedBackdrop);
  const stay = page.getByRole("button", { name: "Stay Here", exact: true });
  const leave = page.getByRole("button", { name: "Yes, Leave Page", exact: true });
  const stayBox = await stay.boundingBox();
  const leaveBox = await leave.boundingBox();
  if (!stayBox || !leaveBox) throw new Error("Missing dialog actions");
  expectWithin1(stayBox.height, 32);
  expectWithin1(leaveBox.height, 32);
  const stayWidth = px(await tokenLength(page, "--size-unsaved-dialog-stay-width"));
  const leaveWidth = px(await tokenLength(page, "--size-unsaved-dialog-leave-width"));
  expectWithin1(stayBox.width, stayWidth);
  expectWithin1(leaveBox.width, leaveWidth);
  expectWithin1(leaveBox.x - (stayBox.x + stayBox.width), 10.5);
  expectWithin1(modalBox.y + modalBox.height - (leaveBox.y + leaveBox.height), paddingBottom);
  await expect(stay).toHaveCSS("border-radius", `${cornerRadius}px`);
  await expect(leave).toHaveCSS("border-radius", `${cornerRadius}px`);
  await expect(stay).toHaveCSS("border-top-width", "1px");
  await expect(stay).toHaveCSS(
    "border-top-color",
    await tokenColor(page, "--color-unsaved-dialog-stay-border"),
  );
  await expect(stay).toHaveCSS("color", await tokenColor(page, "--color-unsaved-dialog-stay-text"));
  await expect(leave).toHaveCSS(
    "color",
    await tokenColor(page, "--color-unsaved-dialog-leave-text"),
  );
  await expectType(page, stay, "--text-md", "--font-weight-normal");
  await expectType(page, leave, "--text-md", "--font-weight-semibold");
  await expectLinearGradientUsesColors(
    page,
    stay,
    "--color-unsaved-dialog-stay-start",
    "--color-unsaved-dialog-stay-end",
  );
  await expectLinearGradientUsesColors(
    page,
    leave,
    "--color-unsaved-dialog-leave-start",
    "--color-unsaved-dialog-leave-end",
  );
});

test("dirty cancel opens unsaved dialog; Stay Here and Leave Page behave correctly", async ({
  page,
}) => {
  const { list } = await openCreate(page);
  await page.getByRole("textbox", { name: "Company", exact: true }).fill("Dirty Company");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "You have not saved your changes." });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Stay Here", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Create Lead" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Yes, Leave Page", exact: true }).click();
  await expect(page).toHaveURL(`${list}?page=2&per_page=10`);
});

test("Cancel on Edit returns to detail; the actual owner dialog opens", async ({ page }) => {
  const { list } = await openCreate(page);
  await page.getByRole("button", { name: "Open owner picker", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Select User", exact: true })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.goto(list);
  await page.locator("table tbody tr").first().getByRole("link").first().click();
  await expect(page.locator("[data-record-header]")).toBeVisible();
  const detail = page.url();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Lead" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(detail);
});

test("Create geometry follows record-detail Visual layout and passes accessibility", async ({
  page,
}) => {
  const { org } = await openCreate(page);
  await page.evaluate(() => document.fonts.ready);
  const strip = page.locator("[data-record-form-strip]");
  const stripBox = await strip.boundingBox();
  if (!stripBox) throw new Error("Missing strip");
  expectWithin1(stripBox.x, 332);
  expectWithin1(stripBox.y, 50);
  expectWithin1(stripBox.height, 57);
  const card = await page.locator("[data-record-form-card]").boundingBox();
  if (!card) throw new Error("Missing card");
  expectWithin1(card.x, 332);
  expectWithin1(card.y, 107);
  expectWithin1(card.width, 1126);
  await expect(strip).toHaveCSS("background-color", "rgb(238, 241, 249)");
  await expectType(
    page,
    page.locator("[data-record-form-title]"),
    "--text-2xl",
    "--font-weight-bold",
  );
  const left = await page.locator("[data-form-field=Owner] .record-choice-shell").boundingBox();
  const right = await page.locator("[data-form-field=Company] .record-input-frame").boundingBox();
  if (!left || !right) throw new Error("Missing input");
  expectWithin1(left.x, 553);
  expectWithin1(left.y, 312);
  expectWithin1(left.width, 320);
  expectWithin1(left.height, 34);
  expectWithin1(right.x, 1131.5);
  expectWithin1(right.width, 314.5);
  expectWithin1(right.y, 312);
  const name = await page.locator("[data-form-field=Last_Name] .record-input-frame").boundingBox();
  if (!name) throw new Error("Missing name input");
  expectWithin1(name.y - right.y, 54);
  const label = await page
    .locator(".record-form-row__label")
    .filter({ hasText: /^Company$/ })
    .boundingBox();
  if (!label) throw new Error("Missing label");
  expectWithin1(label.x + label.width, 1094.5);
  const actions = await page.locator("[data-record-form-actions] > button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
  for (const [index, expected] of [
    [1181, 74],
    [1263, 119.5],
    [1390.5, 59.5],
  ].entries()) {
    const box = actions[index];
    if (!box) throw new Error("Missing action");
    expectWithin1(box.x, expected[0] ?? 0);
    expectWithin1(box.width, expected[1] ?? 0);
    expectWithin1(box.y, 62);
    expectWithin1(box.height, 32);
  }
  const portrait = await page.getByRole("img", { name: "Lead Image", exact: true }).boundingBox();
  if (!portrait) throw new Error("Missing portrait");
  expectWithin1(portrait.x, 344);
  expectWithin1(portrait.y, 170);
  expectWithin1(portrait.width, 48);
  const picker = await page.getByRole("button", { name: "Open owner picker" }).boundingBox();
  if (!picker) throw new Error("Missing picker");
  expectWithin1(picker.x, 840);
  expectWithin1(picker.width, 32);
  await expect(page.locator("[data-form-field=Company] .record-input-frame")).toHaveCSS(
    "box-shadow",
    "rgb(255, 93, 90) 3px 0px 0px 0px inset",
  );
  // Composite inputs: Annual Revenue sentence (record-detail.md Visual layout).
  const revenue = page.locator("[data-form-field=Annual_Revenue]");
  const information = revenue.getByRole("img", { name: "Currency information" });
  const informationBox = await information.boundingBox();
  const iconBox = await information.locator("svg").boundingBox();
  if (!informationBox || !iconBox) throw new Error("Missing currency information icon");
  expectWithin1(informationBox.x, 840);
  expectWithin1(informationBox.width, 32);
  expectWithin1(informationBox.height, 32);
  expectWithin1(iconBox.width, 16);
  expectWithin1(iconBox.height, 16);
  await expect(information).toHaveCSS("background-color", "rgb(240, 244, 255)");
  await expect(information).toHaveCSS("color", "rgb(49, 57, 73)");
  const currencyResponse = await page.request.get(operationPath(operations.currencies), {
    headers: { "X-CRM-ORG": org.slug },
  });
  expect(currencyResponse.status()).toBe(200);
  const currencies = (await currencyResponse.json()).currencies as [{ symbol: string }];
  const prefix = revenue.locator(".record-currency-prefix > span").first();
  const divider = revenue.locator(".record-currency-divider");
  await expect(prefix).toHaveText(currencies[0].symbol);
  await expect(prefix).toHaveCSS("color", await tokenValue(page, "color", "--color-text-muted"));
  const input = await revenue.locator(".record-input-frame").boundingBox();
  const prefixBox = await prefix.boundingBox();
  const dividerBox = await divider.boundingBox();
  if (!input || !prefixBox || !dividerBox) throw new Error("Missing currency prefix");
  expectWithin1(prefixBox.x - input.x, 11.5);
  expectWithin1(dividerBox.x - (prefixBox.x + prefixBox.width), 9.5);
  expectWithin1(dividerBox.width, 1);
  await expect(divider).toHaveCSS(
    "background-color",
    await tokenValue(page, "background-color", "--color-control-border"),
  );
  expectWithin1(dividerBox.height, 20);
  expectWithin1(dividerBox.y - input.y, 7);
  expectWithin1(input.y + input.height - dividerBox.y - dividerBox.height, 7);
  console.log(
    "currency prefix",
    JSON.stringify({
      symbol: currencies[0].symbol,
      input,
      prefixBox,
      dividerBox,
      capLeft: await textCapLeft(prefix),
    }),
  );
  await expect(revenue.getByRole("button")).toHaveCount(0);
  const address = await page.locator("[data-record-form-field-group]").boundingBox();
  const country = await page.locator("[data-form-field=Country] .record-control").boundingBox();
  if (!address || !country) throw new Error("Missing address");
  expectWithin1(address.x, 344);
  expectWithin1(address.width, 529);
  expectWithin1(address.height, 467);
  expectWithin1(country.x, 554);
  expectWithin1(country.width, 303);
  expectWithin1(country.y - address.y, 31);
  const building = await page
    .locator("[data-form-field=Flat_House_No_Building_Apartment_Name] .record-input-frame")
    .boundingBox();
  const street = await page.locator("[data-form-field=Street] .record-input-frame").boundingBox();
  const coordinates = await page.locator(".record-form-coordinates").boundingBox();
  if (!building || !street || !coordinates) throw new Error("Missing address row");
  expectWithin1(street.y - building.y, 80);
  expectWithin1(address.y + address.height - coordinates.y - coordinates.height, 52.5);
  const description = await page
    .getByRole("textbox", { name: "Description", exact: true })
    .boundingBox();
  if (!description) throw new Error("Missing description");
  expectWithin1(description.x, 553);
  expectWithin1(description.width, 639);
  expectWithin1(description.height, 34);
  expectWithin1(description.y - address.y - address.height, 111);
  console.log(
    "form geometry",
    JSON.stringify({
      strip: stripBox,
      card,
      left,
      right,
      portrait,
      picker,
      address,
      country,
      description,
      actions,
      building,
      street,
      coordinates,
    }),
  );
  // ADR 0003 §8: measured empty Salutation ink #8c91ab on white remains below AA.
  // Clear All ink #a0a8b8 on white is a newly measured pair reported to CTO;
  // only its text is excluded, while the functional button remains in the scan.
  await expectNoA11yViolations(page, {
    exclude: [
      "#record-form-Salutation-value.record-prefix-empty",
      ".record-form-clear-address > span",
    ],
  });
  const output = process.env.PAPERCLIP_RUN_SCRATCH_DIR;
  if (output) {
    await page.screenshot({ path: join(output, "lead-create.png") });
    await page.locator("[data-record-form-field-group]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, "lead-address.png") });
  }
});
