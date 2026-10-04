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
