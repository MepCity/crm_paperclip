import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("a new user creates an organization and returns to it from home", async ({ page }) => {
  await signUpNewUser(page);
  // A full load drops the submit button's temporary live announcement.
  // That node points at the previous screen for several seconds.
  await page.goto("/orgs/new");
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
  await expectNoA11yViolations(page);

  const organization = await createOrganization(page, "Çağrı Şirketi Örnek");
  expect(organization).toEqual({ name: "Çağrı Şirketi Örnek", slug: "cagri-sirketi-ornek" });
  await page.reload();
  await expect(page.getByRole("heading", { name: organization.name, exact: true })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto("/");
  await expect(page).toHaveURL(`/o/${organization.slug}`);
  await expect(page.getByRole("heading", { name: organization.name, exact: true })).toBeVisible();
});

test("a slug that is already in use is reported on the slug field", async ({ page, browser }) => {
  await signUpNewUser(page);
  const organization = await createOrganization(page, "Taken Name");

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  try {
    await signUpNewUser(other);
    await other.getByRole("textbox", { name: "Name" }).fill("Another Name");
    const slug = other.getByRole("textbox", { name: "Slug" });
    await expect(slug).toHaveValue("another-name");
    await slug.fill(organization.slug);
    await expect(slug).toHaveValue(organization.slug);
    await other.getByRole("button", { name: "Create organization" }).click();

    await expect(slug).toHaveAttribute("aria-invalid", "true");
    await expect(other.getByText("This slug is already in use.")).toBeVisible();
    await expect(other).toHaveURL("/orgs/new");
  } finally {
    await otherContext.close();
  }
});

test("a member of another organization sees the same not-found page", async ({ page, browser }) => {
  await signUpNewUser(page);
  const organization = await createOrganization(page);

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  try {
    await signUpNewUser(other);
    await other.goto(`/o/${organization.slug}`);
    await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
    await expect(other.getByText("The page you are looking for does not exist.")).toBeVisible();

    await other.goto("/o/missing-organization");
    await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
    await expect(other.getByText("The page you are looking for does not exist.")).toBeVisible();
  } finally {
    await otherContext.close();
  }
});

test("organization creation requires sign-in and returns there afterwards", async ({ page }) => {
  const user = await signUpNewUser(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/orgs/new");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Forgs%2Fnew$/);
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/orgs/new");
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
});

test("an unknown invitation token explains that the link is not valid", async ({ page }) => {
  await page.goto("/invite/gecersiz-token");
  await expect(page.getByRole("heading", { name: "Invitation" })).toBeVisible();
  await expect(page.getByText("This invitation link is not valid.")).toBeVisible();
  await expectNoA11yViolations(page);
});
