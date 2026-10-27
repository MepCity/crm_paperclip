import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Home renders onboarding without development controls", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  await createOrganization(page);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expect(page.getByTestId("home-canvas")).toBeVisible();
  await expect(page.getByTestId("home-onboarding")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set up your CRM" })).toBeVisible();
  assertNoPageErrors(pageErrors);
});
