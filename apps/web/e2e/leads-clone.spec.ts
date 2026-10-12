import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath, moduleRecordClonePath } from "./support/crm-paths";
import { expectWithin1 } from "./support/geometry";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

function leadRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const leadsIndex = parts.indexOf("Leads");
  const id = leadsIndex >= 0 ? parts[leadsIndex + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected a lead record id in ${pathname}`);
  }
  return id;
}

async function createLead(page: Page, company: string, lastName: string) {
  await page.getByRole("link", { name: "Create Lead", exact: true }).click();
  await page.getByRole("textbox", { name: "Company", exact: true }).fill(company);
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill(lastName);
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Leads",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
  await expect(page.locator("[data-record-header]")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("clone from detail saves a new record and preserves the source", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, LEADS_MODULE);
  await page.goto(list);
  await createLead(page, "Clone Source Co", "Clone Source Lead");
  const sourceUrl = page.url();
  const sourceId = leadRecordIdFromPath(new URL(sourceUrl).pathname);
  await page.getByRole("button", { name: "More Options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clone", exact: true }).click();
  await expect(page).toHaveURL(moduleRecordClonePath(org.slug, LEADS_MODULE, sourceId));
  await expect(page.getByRole("heading", { name: "Clone Lead" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Company", exact: true })).toHaveValue(
    "Clone Source Co",
  );
  await expect(page.getByRole("textbox", { name: "Last Name", exact: true })).toHaveValue(
    "Clone Source Lead",
  );
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Clone Saved Lead");
  let createPostCount = 0;
  const isLeadCreatePost = (url: string, method: string) =>
    method === "POST" && new URL(url).pathname === "/crm/v2.2/Leads";
  page.on("request", (request) => {
    if (isLeadCreatePost(request.url(), request.method())) createPostCount += 1;
  });
  const createRequest = page.waitForRequest((request) =>
    isLeadCreatePost(request.url(), request.method()),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  await expect(page.locator("[data-record-header]")).toBeVisible();
  expect(createPostCount).toBe(1);
  expect(request.postDataJSON().data[0]).toMatchObject({
    Company: "Clone Source Co",
    Last_Name: "Clone Saved Lead",
  });
  await expect(page.locator("[data-record-header]")).toContainText("Clone Saved Lead");
  const newId = leadRecordIdFromPath(new URL(page.url()).pathname);
  expect(newId).not.toBe(sourceId);
  await page.goto(sourceUrl);
  await expect(page.locator("[data-record-header]")).toContainText("Clone Source Lead");
});

test("clone cancel without edits returns to source; dirty cancel confirms", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
  await createLead(page, "Cancel Co", "Cancel Lead");
  const sourceUrl = page.url();
  await page.getByRole("button", { name: "More Options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clone", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(sourceUrl);
  await page.getByRole("button", { name: "More Options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clone", exact: true }).click();
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Dirty Lead");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("alertdialog", { name: "You have not saved your changes." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Yes, Leave Page", exact: true }).click();
  await expect(page).toHaveURL(sourceUrl);
});

test("clone geometry matches create lead layout", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
  await createLead(page, "Geom Co", "Geom Lead");
  const sourceId = leadRecordIdFromPath(new URL(page.url()).pathname);
  await page.goto(moduleRecordClonePath(org.slug, LEADS_MODULE, sourceId));
  await expect(page.getByRole("heading", { name: "Clone Lead" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const strip = page.locator("[data-record-form-strip]");
  const stripBox = await strip.boundingBox();
  if (!stripBox) throw new Error("Missing strip");
  expectWithin1(stripBox.x, 332);
  expectWithin1(stripBox.y, 50);
  expectWithin1(stripBox.height, 57);
  await expectType(
    page,
    page.locator("[data-record-form-title]"),
    "--text-2xl",
    "--font-weight-bold",
  );
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
  await expectNoA11yViolations(page, {
    exclude: [
      "#record-form-Salutation-value.record-prefix-empty",
      ".record-form-clear-address > span",
    ],
  });
  const output = process.env.PAPERCLIP_RUN_SCRATCH_DIR;
  if (output) {
    await page.screenshot({ path: join(output, "lead-clone.png") });
  }
});
