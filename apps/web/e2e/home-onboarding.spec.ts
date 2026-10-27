import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Home renders onboarding without development controls", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  await createOrganization(page);
  await expect(page.getByTestId("home-canvas")).toBeVisible();
  await expect(page.getByTestId("home-onboarding")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play intro video" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
  await expect(page.getByTestId("home-preview")).toHaveCount(0);
  assertNoPageErrors(pageErrors);
});
