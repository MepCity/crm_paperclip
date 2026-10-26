import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Home renders the observed empty canvas without development controls", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  await createOrganization(page);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expect(page.getByTestId("home-canvas")).toBeVisible();
  await expect(page.getByTestId("home-onboarding")).toHaveCount(0);
  assertNoPageErrors(pageErrors);
});
