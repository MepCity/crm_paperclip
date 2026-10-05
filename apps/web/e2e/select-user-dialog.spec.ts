import { expect, test } from "@playwright/test";
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
  await expect(modal).toBeVisible();

  const modalBox = await modal.boundingBox();
  expect(modalBox).not.toBeNull();
  expect(Math.abs((modalBox?.x ?? 0) - 294)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.width ?? 0) - 882)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.height ?? 0) - 353)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.y ?? 0) - 0)).toBeLessThanOrEqual(1);
  await expect(modal).toHaveCSS("border-bottom-left-radius", "12px");
  await expect(modal).toHaveCSS("background-color", "rgb(255, 255, 255)");

  const title = dialog.getByRole("heading", { name: "Select User", exact: true });
  const titleBox = await title.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(Math.abs((titleBox?.y ?? 0) - 29)).toBeLessThanOrEqual(1);
  await expect(title).toHaveCSS("color", "rgb(32, 33, 35)");
  await expectType(page, title, "--text-2xl", "--font-weight-bold");

  const search = dialog.getByRole("textbox", { name: "Search Users" });
  await expect(search).toBeFocused();
  const searchBox = await search.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(Math.abs((searchBox?.x ?? 0) - 325)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.y ?? 0) - 64)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.width ?? 0) - 300)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.height ?? 0) - 34)).toBeLessThanOrEqual(1);
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("border-top-color", "rgb(84, 100, 242)");

  const summaryLabel = dialog.getByText("Selected User:", { exact: true });
  const summaryLabelBox = await summaryLabel.boundingBox();
  expect(summaryLabelBox).not.toBeNull();
  expect(Math.abs((summaryLabelBox?.x ?? 0) - 641)).toBeLessThanOrEqual(1);
  await expect(summaryLabel).toHaveCSS("color", "rgb(97, 110, 136)");
  await expectType(page, summaryLabel, "--text-md", "--font-weight-normal");

  const summaryAvatar = dialog.locator(".select-user-summary .user-avatar-placeholder").first();
  const summaryAvatarBox = await summaryAvatar.boundingBox();
  expect(summaryAvatarBox).not.toBeNull();
  expect(Math.abs((summaryAvatarBox?.x ?? 0) - 741)).toBeLessThanOrEqual(1);
  expect(Math.abs((summaryAvatarBox?.y ?? 0) - 64)).toBeLessThanOrEqual(1);
  expect(Math.abs((summaryAvatarBox?.width ?? 0) - 30)).toBeLessThanOrEqual(1);

  const tableFrame = dialog.locator(".select-user-table-frame");
  const tableBox = await tableFrame.boundingBox();
  expect(tableBox).not.toBeNull();
  expect(Math.abs((tableBox?.x ?? 0) - 325)).toBeLessThanOrEqual(1);
  expect(Math.abs((tableBox?.y ?? 0) - 119)).toBeLessThanOrEqual(1);
  expect(Math.abs((tableBox?.width ?? 0) - 820)).toBeLessThanOrEqual(1);
  expect(Math.abs((tableBox?.height ?? 0) - 151.5)).toBeLessThanOrEqual(1);
  await expect(tableFrame).toHaveCSS("border-top-color", "rgb(217, 224, 235)");

  const headerRole = dialog.getByRole("columnheader", { name: "Role" });
  await expectType(page, headerRole, "--text-md", "--font-weight-semibold");

  const radioVisual = dialog.locator(".select-user-td-radio .table-radio").first();
  const radioBox = await radioVisual.boundingBox();
  expect(radioBox).not.toBeNull();
  expect(Math.abs((radioBox?.x ?? 0) - 346)).toBeLessThanOrEqual(1);
  expect(Math.abs((radioBox?.width ?? 0) - 15)).toBeLessThanOrEqual(1);

  const rowAvatar = dialog.locator(".select-user-td-avatar .user-avatar-placeholder").first();
  const rowAvatarBox = await rowAvatar.boundingBox();
  expect(rowAvatarBox).not.toBeNull();
  expect(Math.abs((rowAvatarBox?.x ?? 0) - 391)).toBeLessThanOrEqual(1);

  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const cancelBox = await cancel.boundingBox();
  expect(cancelBox).not.toBeNull();
  expect(Math.abs((cancelBox?.x ?? 0) - 996.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((cancelBox?.width ?? 0) - 74.5)).toBeLessThanOrEqual(1);

  const done = dialog.getByRole("button", { name: "Done" });
  const doneBox = await done.boundingBox();
  expect(doneBox).not.toBeNull();
  expect(Math.abs((doneBox?.height ?? 0) - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.width ?? 0) - 63.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.x ?? 0) - 1081.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.y ?? 0) - 290.5)).toBeLessThanOrEqual(1);
  await expect(done).toBeDisabled();
  await expect(done).toHaveCSS("background-color", "rgb(173, 179, 238)");
});

test("Select User dialog stays centred at 1200px width", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 835 });
  const { modal } = await openThreeUserDialog(page);
  const modalBox = await modal.boundingBox();
  expect(modalBox).not.toBeNull();
  const centre = (modalBox?.x ?? 0) + (modalBox?.width ?? 0) / 2;
  expect(Math.abs(centre - 600)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.width ?? 0) - 882)).toBeLessThanOrEqual(1);
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
