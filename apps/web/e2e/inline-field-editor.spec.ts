import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath } from "./support/crm-paths";
import { svgRasterInkBoxes } from "./support/geometry";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

test.use({ deviceScaleFactor: 2 });

test("inline Rating geometry, persistence, validation and keyboard cancellation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
  await page.locator("table tbody tr").first().getByRole("link").first().click();
  const details = page.getByRole("region", { name: "Details card" });
  await expect(details).toBeVisible();
  const rating = details.locator('[data-detail-field="Rating"]');
  const pencil = rating.getByRole("button", { name: "Edit Rating", exact: true });
  await pencil.hover();
  await expect(pencil).toHaveCSS("opacity", "1");
  await expect(pencil).toHaveCSS("color", "rgb(97, 110, 136)");
  const pencilInk = await svgRasterInkBoxes(pencil);
  expect(pencilInk.solid).not.toBeNull();
  expect(Math.abs((pencilInk.solid?.width ?? 0) - 11.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((pencilInk.solid?.height ?? 0) - 11.5)).toBeLessThanOrEqual(1);
  await pencil.click();
  const choice = page.getByRole("button", { name: "Rating", exact: true });
  const panel = page.locator(".record-inline-choice-panel");
  await expect(panel).toBeVisible();
  const arrow = await choice.locator("svg").boundingBox();
  if (!arrow) throw new Error("Missing arrow geometry.");
  expect(arrow.width).toBe(8);
  expect(arrow.height).toBe(5);
  await expect(choice.locator("svg")).toHaveCSS("color", "rgb(131, 136, 146)");
  const control = await choice.boundingBox();
  const popup = await panel.boundingBox();
  const save = page.getByRole("button", { name: "Save", exact: true });
  const cancel = page.getByRole("button", { name: "Cancel", exact: true });
  const saveBox = await save.boundingBox();
  const cancelBox = await cancel.boundingBox();
  if (!control || !popup || !saveBox || !cancelBox) throw new Error("Missing editor geometry.");
  const near = (value: number, target: number) =>
    expect(Math.abs(value - target)).toBeLessThanOrEqual(1);
  near(control.width, 273);
  near(control.height, 34);
  near(popup.width, 273);
  near(popup.x, control.x);
  near(popup.y, control.y + 33);
  near(saveBox.width, 21);
  near(saveBox.height, 21);
  near(cancelBox.width, 21);
  near(cancelBox.height, 21);
  near(saveBox.x - control.x - control.width, 10);
  near(cancelBox.x - saveBox.x - saveBox.width, 6.5);
  near(saveBox.y + saveBox.height / 2, control.y + control.height / 2);
  const check = await save.locator("svg").boundingBox();
  if (!check) throw new Error("Missing save check.");
  near(check.width, 10);
  near(check.height, 7.5);
  await expect(save.locator("svg")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(save).toHaveCSS("background-color", "rgb(84, 100, 242)");
  await expect(cancel).toHaveCSS("border-top-color", "rgb(49, 57, 73)");
  await expect(choice).toHaveCSS("border-top-color", "rgb(84, 100, 242)");
  await expect(choice).toHaveCSS("border-radius", "4px");
  await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(panel).toHaveCSS("border-top-color", "rgb(206, 208, 225)");
  const options = page.getByRole("option");
  const count = await options.count();
  expect(count).toBe(6);
  near(popup.height, count * 32 + 14);
  for (const option of await options.all()) near((await option.boundingBox())?.height ?? 0, 32);
  const selected = panel.locator('[aria-selected="true"]');
  await expect(selected).toHaveCSS("background-color", "rgb(240, 244, 252)");
  await expectType(page, selected, "--text-md", "--font-weight-semibold");
  await expect(selected.locator(".record-inline-choice-check svg")).toBeVisible();
  // ADR 0003 §8: measured placeholder ink on white. Shared form validation
  // ink (#ff5d5a on white, ~3.04:1) retains the existing form scan exclusion.
  await expectNoA11yViolations(page, {
    exclude: [".detail-inline-control [data-part=empty-value]", ".record-form-validation-error"],
  });
  if (process.env.INLINE_EDITOR_ARTIFACT_DIR) {
    await mkdir(process.env.INLINE_EDITOR_ARTIFACT_DIR, { recursive: true });
    await page.screenshot({
      path: join(process.env.INLINE_EDITOR_ARTIFACT_DIR, "inline-rating.png"),
    });
    await writeFile(
      join(process.env.INLINE_EDITOR_ARTIFACT_DIR, "inline-measurements.json"),
      JSON.stringify(
        { control, popup, saveBox, cancelBox, optionCount: count, pencilInk },
        null,
        2,
      ),
    );
  }
  const target = page.getByRole("option", { name: "Active", exact: true });
  await target.click();
  const requestPromise = page.waitForRequest(
    (request) => request.method() === "PUT" && /\/Leads\//.test(request.url()),
  );
  await save.click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ data: [{ Rating: "Active" }] });
  await expect(rating.getByRole("button", { name: "Edit Rating value" })).toHaveText("Active");
  await page.reload();
  await expect(rating.getByRole("button", { name: "Edit Rating value" })).toHaveText("Active");
  const company = details.locator('[data-detail-field="Company"]');
  const original = await company.getByRole("button", { name: "Edit Company value" }).innerText();
  await company.getByRole("button", { name: "Edit Company", exact: true }).click();
  await page.getByRole("textbox", { name: "Company", exact: true }).fill("");
  await save.click();
  await expect(company).toContainText("Company cannot be empty.");
  await expect(page.getByRole("textbox", { name: "Company", exact: true })).toBeVisible();
  // ADR 0003 §8: measured placeholder ink on white. Shared form validation
  // ink (#ff5d5a on white, ~3.04:1) retains the existing form scan exclusion.
  await expectNoA11yViolations(page, {
    exclude: [".detail-inline-control [data-part=empty-value]", ".record-form-validation-error"],
  });
  await cancel.click();
  await expect(company.getByRole("button", { name: "Edit Company value" })).toHaveText(original);
  await rating.getByRole("button", { name: "Edit Rating", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(rating.getByRole("button", { name: "Edit Rating value" })).toHaveText("Active");
});
