import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Home renders the observed empty canvas without development controls", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  await createOrganization(page);
  await expect(page.getByTestId("home-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play intro video" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip", exact: true })).toHaveCount(0);
  assertNoPageErrors(pageErrors);
});
