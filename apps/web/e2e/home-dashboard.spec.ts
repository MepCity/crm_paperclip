import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test.use({ viewport: { width: 1470, height: 900 } });

test("Home personal page preview (HD01/HD06/HD16): selector, cards, empty state, no writes", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const nonGet: string[] = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(r.method())) nonGet.push(`${r.method()} ${r.url()}`);
  });

  await expect(page.getByTestId("home-onboarding")).toBeVisible();
  await page.getByRole("combobox", { name: "Home page" }).selectOption("preview");
  await expect(page.getByRole("region", { name: "Open Tasks" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pipeline Deals by Stage" })).toBeVisible();
  await expect(page.getByTestId("deals-total")).toHaveText("Total deals: 9");
  await expect(page.getByText("Send revised proposal")).toBeVisible();
  await page.getByRole("combobox", { name: "Home page" }).selectOption("onboarding");
  await expect(page.getByTestId("home-onboarding")).toBeVisible();

  await page.goto(`/crm/${org.slug}?state=preview-empty`);
  await expect(page.getByText(/local preview convention/)).toHaveCount(2);
  expect(nonGet).toEqual([]);
  assertNoPageErrors(pageErrors);
});
