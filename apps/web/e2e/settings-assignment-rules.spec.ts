import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Assignment Rules opens from settings with the introductory state", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings`);
  const nav = page.getByRole("navigation", { name: "Settings navigation" });
  await nav.getByRole("link", { name: "Assignment Rules" }).click();
  await expect(nav.getByRole("link", { name: "Assignment Rules" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "Assignment Rules" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Rules", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("assignment-introduction")).toBeVisible();
  for (const name of ["Thresholds", "Assistant"]) {
    const tab = page.getByRole("tab", { name });
    await tab.focus();
    await expect(tab).toBeFocused();
    await tab.press("Enter");
  }
  await expect(page.getByRole("button", { name: "Assignment Rules help" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Contextual help" })).toBeVisible();
  const create = page.getByRole("button", { name: "Create Assignment Rule" });
  await expect(create).toHaveAttribute("aria-disabled", "true");
  await create.click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/assignment-rules$`));
  assertNoPageErrors(pageErrors);
});

test("populated synthetic Assignment rules list and open read-only detail", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page, "Synthetic Populated Org");
  await page.goto(`/crm/${org.slug}/settings/assignment-rules`);
  await expect(page.getByTestId("assignment-introduction")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create Assignment Rule" })).toHaveCount(0);
  await page.getByLabel("Module").selectOption("Deals");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.getByTestId("assignment-no-matches")).toBeVisible();
  await expect(page.getByTestId("assignment-introduction")).toHaveCount(0);
  await page.getByLabel("Module").selectOption("");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.getByRole("link", { name: "Synthetic regional routing" })).toBeVisible();
  await page.getByRole("link", { name: "Synthetic regional routing" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic regional routing" })).toBeVisible();
  await expect(page.getByTestId("assignment-detail-fallback")).toContainText("synthetic-group-a");
  await expect(
    page.getByRole("region", { name: "Assignment Rule" }).getByRole("button"),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Back to Assignment Rules" }).click();
  await page.goto(`/crm/${org.slug}/settings/assignment-rules/missing-rule`);
  await expect(page.getByTestId("assignment-detail-not_found")).toBeVisible();
  assertNoPageErrors(pageErrors);
});
