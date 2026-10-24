import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Social connected fixture stays local", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(`${r.method()} ${r.url()}`);
  });
  await page.goto(`/crm/${slug}/tab/Social?fixture=populated`);
  await page.getByRole("tab", { name: "Monitor" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await page.getByLabel("Network", { exact: true }).selectOption("Network B");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Add column" }).click({ force: true });
  await page.goto(`/crm/${slug}/tab/Social?fixture=connected-empty`);
  await page.getByRole("tab", { name: "Monitor" }).click();
  await expect(page.getByText("No interactions found.")).toBeVisible();
  await page.goto(`/crm/${slug}/tab/Social?fixture=permission-denied`);
  await expect(page.getByText("You do not have permission to use the Social tab.")).toBeVisible();
  await page.goto(`/crm/${slug}/tab/Social`);
  await expect(page.getByRole("button", { name: "Let's Get Started" })).toBeVisible();
  expect(writes).toEqual([]);
  assertNoPageErrors(pageErrors);
});
