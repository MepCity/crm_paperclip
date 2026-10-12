import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { AUTH_NAVIGATION_TIMEOUT_MS, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("organization creation passes accessibility right after redirect", async ({ page }) => {
  await signUpNewUser(page);
  const organization = await createOrganization(page, "Çağrı Şirketi Örnek");
  expect(organization).toEqual({ name: "Çağrı Şirketi Örnek", slug: "cagri-sirketi-ornek" });
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
});

/** Records every full document load of the organization form, the sign of a lost page state. */
function watchFormDocumentLoads(page: Page): string[] {
  const loads: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document" && new URL(request.url()).pathname === "/orgs/new")
      loads.push(request.url());
  });
  return loads;
}

test("the form helper fills the form it already sits on without loading it again", async ({
  page,
}) => {
  await signUpNewUser(page);
  const formLoads = watchFormDocumentLoads(page);

  const organization = await createOrganization(page);

  expect(formLoads).toEqual([]);
  await expect(page).toHaveURL(`/crm/${organization.slug}`);
});

test("the form helper opens the form when it starts from another page", async ({ page }) => {
  await signUpNewUser(page);
  const first = await createOrganization(page, "First Org");

  const formLoads = watchFormDocumentLoads(page);
  const second = await createOrganization(page, "Second Org");

  expect(second).toEqual({ name: "Second Org", slug: "second-org" });
  expect(formLoads).toHaveLength(1);
  await expect(page).toHaveURL(`/crm/${second.slug}`);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  expect(first.slug).toBe("first-org");
});

test("a new user creates an organization and returns to it from home", async ({ page }) => {
  await signUpNewUser(page);
  await expectNoA11yViolations(page);

  const organization = await createOrganization(page);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto("/");
  await expect(page).toHaveURL(`/crm/${organization.slug}`);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
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

test("a user without organization membership sees the same not-found page", async ({
  page,
  browser,
}) => {
  await signUpNewUser(page);
  const organization = await createOrganization(page);

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  try {
    await signUpNewUser(other);
    await other.goto(`/crm/${organization.slug}`);
    await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
    await expect(other.getByText("The page you are looking for does not exist.")).toBeVisible();

    await other.goto("/crm/missing-organization");
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
  await expect(page).toHaveURL("/orgs/new", { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Create an organization" })).toBeVisible();
});

test("an unknown invitation token explains that the link is not valid", async ({ page }) => {
  await page.goto("/invite/gecersiz-token");
  await expect(page.getByRole("heading", { name: "Invitation" })).toBeVisible();
  await expect(page.getByText("This invitation link is not valid.")).toBeVisible();
  await expectNoA11yViolations(page);
});
