import { expect, test } from "@playwright/test";
import { expectType } from "./support/typography";

// typography.md → List and detail text roles → Create form field label.
test("shared input labels use the adopted regular body role in every demo state", async ({
  page,
}) => {
  await page.goto("/dev/ui");
  const common = ["Empty", "Filled", "With description", "With error", "Disabled", "Required"];
  const demos = [
    [
      "text field",
      [
        "Default Text Field",
        "With Description",
        "With Error",
        "Email address",
        "Secret",
        "Disabled",
      ],
    ],
    ["text area", common],
    ["number field", [...common, "Two decimal places", "German locale"]],
    ["select", ["Select a fruit", "Disabled choice", "Invalid choice"]],
    [
      "combo box",
      [...common.filter((label) => label !== "With description"), "Lookup", "Saved lookup"],
    ],
    ["date picker", [...common, "Limited to 2026"]],
    ["radio group", [...common, "Horizontal"]],
  ] as const;
  for (const [demo, labels] of demos) {
    const region = page.getByRole("region", { name: demo, exact: true });
    for (const label of labels) {
      const target = region.getByText(label, { exact: true });
      await expect(target).toBeVisible();
      await expectType(page, target, "--text-md", "--font-weight-normal");
    }
  }
});

test("list primary links share the adopted primary button typography", async ({ page }) => {
  await page.goto("/dev/ui");
  const region = page.getByRole("region", { name: "split button", exact: true });
  await expectType(page, region.getByRole("link"), "--text-md", "--font-weight-semibold");
});

// typography.md → List and detail text roles → Sort popover and list menus.
test("list sort popover and menus use measured dialog and menu text roles", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "list chrome" });
  const chrome = demo.locator('[data-list-demo="with-menus"]');
  const sortDemo = demo.locator('[data-list-demo="sort"]');
  await sortDemo.getByRole("button", { name: "Sort", exact: true }).click();
  const popover = page.locator(".record-sort-popover");
  await expect(popover).toBeVisible();
  await expectType(
    page,
    popover.getByText("Sort By", { exact: true }),
    "--text-md",
    "--font-weight-normal",
  );
  await expectType(
    page,
    popover.getByRole("button", { name: /Sort By/ }),
    "--text-sm",
    "--font-weight-normal",
  );
  await expectType(
    page,
    popover.getByRole("button", { name: /Order/ }),
    "--text-sm",
    "--font-weight-normal",
  );
  await popover.getByRole("button", { name: /Order/ }).click();
  await expectType(
    page,
    page.getByRole("option", { name: "Ascending", exact: true }),
    "--text-sm",
    "--font-weight-normal",
  );
  await page.keyboard.press("Escape");
  await expectType(
    page,
    popover.getByRole("button", { name: "Cancel" }),
    "--text-sm",
    "--font-weight-semibold",
  );
  await expectType(
    page,
    popover.getByRole("button", { name: "Apply", exact: true }),
    "--text-sm",
    "--font-weight-semibold",
  );
  await page.keyboard.press("Escape");
  const more = chrome.getByRole("button", { name: "More", exact: true });
  await more.focus();
  await page.keyboard.press("ArrowDown");
  const menuItem = page.getByRole("menuitem", { name: "Example action", exact: true });
  await expect(menuItem).toBeVisible();
  await expectType(page, menuItem, "--text-md", "--font-weight-normal");
  await page.keyboard.press("Escape");
});
