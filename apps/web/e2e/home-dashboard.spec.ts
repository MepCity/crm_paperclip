import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Home renders the observed empty canvas without development controls", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  for (const query of ["", "?state=preview", "?state=preview-empty"]) {
    await page.goto(`/crm/${org.slug}${query}`);
    await expect(page.getByTestId("home-canvas")).toBeVisible();
    await expect(page.getByTestId("home-preview")).toHaveCount(0);
    await expect(page.getByText(/local preview convention/)).toHaveCount(0);
  }
  assertNoPageErrors(pageErrors);
});
