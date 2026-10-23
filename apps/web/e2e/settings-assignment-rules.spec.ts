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
