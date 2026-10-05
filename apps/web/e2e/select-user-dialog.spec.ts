import { expect, test } from "@playwright/test";
import { expectType } from "./support/typography";

const viewport = { width: 1470, height: 835 };
test.use({ viewport });

test("Select User dialog matches the scoped Visual layout measurements", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "select user dialog", exact: true });
  await demo.getByRole("button", { name: "Open (owner u1)" }).click();

  const dialog = page.getByRole("dialog", { name: "Select User" });
  await expect(dialog).toBeVisible();
  const modal = page.locator(".select-user-modal");
  await expect(modal).toBeVisible();

  // record-detail.md › Select User dialog › Backdrop and modal
  const modalBox = await modal.boundingBox();
  expect(modalBox).not.toBeNull();
  expect(Math.abs((modalBox?.x ?? 0) - 294)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.width ?? 0) - 882)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.height ?? 0) - 353)).toBeLessThanOrEqual(1);
  expect(Math.abs((modalBox?.y ?? 0) - 0)).toBeLessThanOrEqual(1);
  await expect(modal).toHaveCSS("border-bottom-left-radius", "12px");
  await expect(modal).toHaveCSS("border-bottom-right-radius", "12px");
  await expect(modal).toHaveCSS("background-color", "rgb(255, 255, 255)");

  const search = dialog.getByRole("textbox", { name: "Search Users" });
  const searchBox = await search.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(Math.abs((searchBox?.x ?? 0) - 325)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.y ?? 0) - 64)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.width ?? 0) - 300)).toBeLessThanOrEqual(1);
  expect(Math.abs((searchBox?.height ?? 0) - 34)).toBeLessThanOrEqual(1);
  await search.focus();
  await expect(search).toHaveCSS("border-top-color", "rgb(84, 100, 242)");

  const tableWrap = dialog.locator(".select-user-table-wrap");
  const tableBox = await tableWrap.boundingBox();
  expect(tableBox).not.toBeNull();
  expect(Math.abs((tableBox?.x ?? 0) - 325)).toBeLessThanOrEqual(1);
  expect(Math.abs((tableBox?.y ?? 0) - 119)).toBeLessThanOrEqual(1);
  expect(Math.abs((tableBox?.width ?? 0) - 820)).toBeLessThanOrEqual(1);

  const done = dialog.getByRole("button", { name: "Done" });
  const doneBox = await done.boundingBox();
  expect(doneBox).not.toBeNull();
  expect(Math.abs((doneBox?.height ?? 0) - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.width ?? 0) - 63.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.x ?? 0) - 1081.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((doneBox?.y ?? 0) - 290.5)).toBeLessThanOrEqual(1);
  await expect(done).toBeDisabled();
  await expect(done).toHaveCSS("background-color", "rgb(173, 179, 238)");

  const title = dialog.getByRole("heading", { name: "Select User", exact: true });
  await expectType(page, title, "--text-2xl", "--font-weight-bold");

  const headerRole = dialog.getByRole("columnheader", { name: "Role" });
  await expectType(page, headerRole, "--text-md", "--font-weight-semibold");

  const summaryLabel = dialog.getByText("Selected User", { exact: true });
  await expectType(page, summaryLabel, "--text-md", "--font-weight-normal");

  const footerCancel = dialog.getByRole("button", { name: "Cancel" });
  await expectType(page, footerCancel, "--text-md", "--font-weight-semibold");
});
