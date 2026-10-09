import { expect, test } from "@playwright/test";
import {
  expectBaseline,
  expectCapTop,
  expectWithin1,
  textCapLeft,
  textCapTop,
} from "./support/geometry";
import { expectType } from "./support/typography";

const viewport = { width: 1470, height: 835 };
test.use({ viewport });

async function openThreeUserDialog(page: import("@playwright/test").Page) {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "select user dialog", exact: true });
  await demo.getByRole("button", { name: "Open (3 users, measure)" }).click();
  const modal = page.locator(".select-user-modal-panel");
  await expect(modal).toBeVisible();
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Select User" }) });
  return { demo, dialog, modal };
}

test("Select User dialog matches Visual layout at 1470px (three users)", async ({ page }) => {
  const { dialog, modal } = await openThreeUserDialog(page);

  const modalBox = await modal.boundingBox();
  expect(modalBox).not.toBeNull();
  expectWithin1(modalBox?.x ?? 0, 294);
  expectWithin1(modalBox?.width ?? 0, 882);
  expectWithin1(modalBox?.height ?? 0, 353);
  expectWithin1(modalBox?.y ?? 0, 0);
  await expect(modal).toHaveCSS("border-bottom-left-radius", "12px");
  await expect(modal).toHaveCSS("background-color", "rgb(255, 255, 255)");

  const title = dialog.getByRole("heading", { name: "Select User", exact: true });
  await expectCapTop(title, 29);
  await expect(title).toHaveCSS("color", "rgb(32, 33, 35)");
  await expectType(page, title, "--text-2xl", "--font-weight-bold");

  const search = dialog.getByRole("textbox", { name: "Search Users" });
  await expect(search).toBeFocused();
  const searchBox = await search.boundingBox();
  expect(searchBox).not.toBeNull();
  expectWithin1(searchBox?.x ?? 0, 325);
  expectWithin1(searchBox?.y ?? 0, 64);
  expectWithin1(searchBox?.width ?? 0, 300);
  expectWithin1(searchBox?.height ?? 0, 34);
  await expect(search).toHaveCSS("border-top-color", "rgb(84, 100, 242)");

  const summaryLabel = dialog.getByText("Selected User:", { exact: true });
  const summaryLabelBox = await summaryLabel.boundingBox();
  expect(summaryLabelBox).not.toBeNull();
  expectWithin1(summaryLabelBox?.x ?? 0, 641);
  await expect(summaryLabel).toHaveCSS("color", "rgb(97, 110, 136)");
  await expectType(page, summaryLabel, "--text-md", "--font-weight-normal");
  await expectBaseline(summaryLabel, 84);

  const summaryAvatar = dialog.locator(".select-user-summary .user-avatar-placeholder").first();
  const summaryAvatarBox = await summaryAvatar.boundingBox();
  expect(summaryAvatarBox).not.toBeNull();
  expectWithin1(summaryAvatarBox?.x ?? 0, 741);
  expectWithin1(summaryAvatarBox?.y ?? 0, 64);
  expectWithin1(summaryAvatarBox?.width ?? 0, 30);
  await expect(summaryAvatar).toHaveCSS("background-color", "rgb(219, 223, 232)");

  const summaryName = dialog.locator(".select-user-summary-name");
  expectWithin1(await textCapTop(summaryName), await textCapTop(summaryLabel));
  await expectBaseline(summaryName, 84);
  expectWithin1(await textCapLeft(summaryName), 782);
  await expect(summaryName).toHaveCSS("color", "rgb(32, 33, 35)");

  const tableFrame = dialog.locator(".select-user-table-frame");
  const tableBox = await tableFrame.boundingBox();
  expect(tableBox).not.toBeNull();
  expectWithin1(tableBox?.x ?? 0, 325);
  expectWithin1(tableBox?.y ?? 0, 119);
  expectWithin1(tableBox?.width ?? 0, 820);
  expectWithin1(tableBox?.height ?? 0, 151.5);
  await expect(tableFrame).toHaveCSS("border-top-color", "rgb(217, 224, 235)");
  await expect(tableFrame).toHaveCSS("border-top-left-radius", "8px");

  const headerBand = dialog.locator(".select-user-table thead tr");
  const headerBandBox = await headerBand.boundingBox();
  expect(headerBandBox).not.toBeNull();
  expectWithin1(headerBandBox?.y ?? 0, 120);
  expectWithin1(headerBandBox?.height ?? 0, 32);
  await expect(headerBand).toHaveCSS("border-bottom-width", "2px");
  await expect(headerBand).toHaveCSS("border-bottom-color", "rgb(217, 224, 235)");

  const headerRole = dialog.getByRole("columnheader", { name: "Role" });
  await expectType(page, headerRole, "--text-md", "--font-weight-semibold");

  const firstRow = dialog.locator(".select-user-table tbody tr").first();
  const firstRowBox = await firstRow.boundingBox();
  expect(firstRowBox).not.toBeNull();
  expectWithin1(firstRowBox?.height ?? 0, 38);

  const secondRow = dialog.locator(".select-user-table tbody tr").nth(1);
  await expect(secondRow).toHaveCSS("border-top-width", "1px");
  await expect(secondRow).toHaveCSS("border-top-color", "rgb(238, 241, 247)");

  const selectedRadio = dialog.locator(".select-user-td-radio .table-radio").first();
  const radioBox = await selectedRadio.boundingBox();
  expect(radioBox).not.toBeNull();
  expectWithin1(radioBox?.x ?? 0, 346);
  expectWithin1(radioBox?.y ?? 0, 167);
  expectWithin1(radioBox?.width ?? 0, 15);
  expectWithin1(radioBox?.height ?? 0, 15);
  await expect(selectedRadio).toHaveCSS("border-top-width", "4px");
  await expect(selectedRadio).toHaveCSS("border-top-color", "rgb(84, 100, 242)");

  const unselectedRadio = dialog.locator(".select-user-td-radio .table-radio").nth(1);
  await expect(unselectedRadio).toHaveCSS("border-top-width", "2px");
  await expect(unselectedRadio).toHaveCSS("border-top-color", "rgb(197, 196, 211)");

  const rowAvatar = dialog.locator(".select-user-td-avatar .user-avatar-placeholder").first();
  const rowAvatarBox = await rowAvatar.boundingBox();
  expect(rowAvatarBox).not.toBeNull();
  expectWithin1(rowAvatarBox?.x ?? 0, 391);
  expectWithin1(rowAvatarBox?.width ?? 0, 30);

  const nameCell = dialog.locator(".select-user-td-name").first();
  expectWithin1(await textCapLeft(nameCell), 432);
  const roleCell = dialog.locator(".select-user-td-role").first();
  expectWithin1(await textCapLeft(roleCell), 573.5);
  const emailCell = dialog.locator(".select-user-td-email").first();
  expectWithin1(await textCapLeft(emailCell), 738);
  const profileCell = dialog.locator(".select-user-td-profile").first();
  expectWithin1(await textCapLeft(profileCell), 991);
  await expect(nameCell).toHaveCSS("color", "rgb(49, 57, 73)");

  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const cancelBox = await cancel.boundingBox();
  expect(cancelBox).not.toBeNull();
  expectWithin1(cancelBox?.x ?? 0, 996.5);
  expectWithin1(cancelBox?.width ?? 0, 74.5);
  expectWithin1(cancelBox?.y ?? 0, 290.5);
  expectWithin1(Number.parseFloat(await cancel.evaluate((el) => getComputedStyle(el).height)), 32);
  await expect(cancel).toHaveCSS("border-top-color", "rgb(213, 216, 233)");
  await expect(cancel).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, cancel, "--text-md", "--font-weight-semibold");

  const done = dialog.getByRole("button", { name: "Done" });
  const doneBox = await done.boundingBox();
  expect(doneBox).not.toBeNull();
  expectWithin1(Number.parseFloat(await done.evaluate((el) => getComputedStyle(el).height)), 32);
  expectWithin1(doneBox?.width ?? 0, 63.5);
  expectWithin1(doneBox?.x ?? 0, 1081.5);
  expectWithin1(doneBox?.y ?? 0, 290.5);
  expectWithin1((doneBox?.x ?? 0) - ((cancelBox?.x ?? 0) + (cancelBox?.width ?? 0)), 10.5);
  await expect(done).toBeDisabled();
  await expect(done).toHaveCSS("background-color", "rgb(173, 179, 238)");
});

test("Select User dialog stays centred at 1200px width", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 835 });
  const { modal } = await openThreeUserDialog(page);
  const modalBox = await modal.boundingBox();
  expect(modalBox).not.toBeNull();
  const centre = (modalBox?.x ?? 0) + (modalBox?.width ?? 0) / 2;
  expectWithin1(centre, 600);
  expectWithin1(modalBox?.width ?? 0, 882);
});

test("Select User dialog shows five rows and keeps Done inside the shell", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "select user dialog", exact: true });
  await demo.getByRole("button", { name: "Open (5 users, owner u1)" }).click();
  const modal = page.locator(".select-user-modal-panel");
  await expect(modal).toBeVisible();
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Select User" }) });
  const lastRow = dialog.getByRole("radio", { name: "Evan Fox" });
  const frame = dialog.locator(".select-user-table-frame");
  const frameBox = await frame.boundingBox();
  const lastRowBox = await lastRow.boundingBox();
  const modalBox = await modal.boundingBox();
  const doneBox = await dialog.getByRole("button", { name: "Done" }).boundingBox();
  expect(frameBox && lastRowBox && modalBox && doneBox).toBeTruthy();
  expect((lastRowBox?.y ?? 0) + (lastRowBox?.height ?? 0)).toBeLessThanOrEqual(
    (frameBox?.y ?? 0) + (frameBox?.height ?? 0) + 1,
  );
  expect((doneBox?.y ?? 0) + (doneBox?.height ?? 0)).toBeLessThanOrEqual(
    (modalBox?.y ?? 0) + (modalBox?.height ?? 0) + 1,
  );
});

test("Select User dialog scrolls the table on a short viewport and keeps actions reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 400 });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "select user dialog", exact: true });
  await demo.getByRole("button", { name: "Open (5 users, owner u1)" }).click();
  const modal = page.locator(".select-user-modal-panel");
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Select User" }) });
  await expect(modal).toBeVisible();

  const wrapScroll = await dialog.locator(".select-user-table-wrap").evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(wrapScroll.scrollHeight).toBeGreaterThan(wrapScroll.clientHeight + 1);

  const modalBox = await modal.boundingBox();
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const done = dialog.getByRole("button", { name: "Done" });
  const cancelBox = await cancel.boundingBox();
  const doneBox = await done.boundingBox();
  expect(modalBox && cancelBox && doneBox).toBeTruthy();
  expect((cancelBox?.y ?? 0) + (cancelBox?.height ?? 0)).toBeLessThanOrEqual(
    (modalBox?.y ?? 0) + (modalBox?.height ?? 0) + 1,
  );
  expect((doneBox?.y ?? 0) + (doneBox?.height ?? 0)).toBeLessThanOrEqual(
    (modalBox?.y ?? 0) + (modalBox?.height ?? 0) + 1,
  );

  const lastRadio = dialog.getByRole("radio", { name: "Evan Fox" });
  await lastRadio.scrollIntoViewIfNeeded();
  await lastRadio.click({ force: true });
  await expect(done).toBeEnabled();
  await cancel.click();
  await expect(modal).toBeHidden();
});
