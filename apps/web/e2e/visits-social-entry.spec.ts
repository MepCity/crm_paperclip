import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Visits and Social entry controls stay local inside the shell", async ({
  page,
  pageErrors,
}, testInfo) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Visits", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/tab/Visits`);
  await expect(nav.getByRole("link", { name: "Visits", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "Visitor Tracking" })).toBeVisible();
  const writes: string[] = [];
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(`${request.method()} ${request.url()}`);
    requests.push(request.url());
  });
  await expect(page.getByRole("button", { name: "Slide 1", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Previous slide" }).click();
  await expect(page.getByRole("button", { name: "Slide 6", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(page.getByRole("heading", { name: "Generate More Qualified Leads" })).toBeVisible();
  const headings = new Set<string>();
  for (let i = 1; i <= 6; i++) {
    const dot = page.getByRole("button", { name: `Slide ${i}`, exact: true });
    await dot.click();
    await expect(dot).toHaveAttribute("aria-pressed", "true");
    headings.add(
      await page
        .getByRole("region", { name: "Visitor tracking features" })
        .getByRole("heading")
        .innerText(),
    );
  }
  expect(headings.size).toBe(6);
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Slide 1", exact: true }).click();
  await expectNoA11yViolations(page);
  for (const [module, label] of [
    ["Visits", "Get Started"],
    ["Social", "Let's Get Started"],
  ] as const) {
    if (module === "Social") await nav.getByRole("link", { name: module, exact: true }).click();
    await expect(nav.getByRole("link", { name: module, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    const setup = page.getByRole("button", { name: label, exact: true });
    await expect(setup).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${module.toLowerCase()}-entry.png`) });
    await expect(setup).toHaveAttribute("aria-disabled", "true");
    await setup.click({ force: true });
    await setup.focus();
    await setup.press("Enter");
    await setup.press("Space");
    await expect(page.getByText(/Integration not connected/)).toBeVisible();
    await expect(page).toHaveURL(`/crm/${slug}/tab/${module}`);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expectNoA11yViolations(page);
  }
  expect(writes).toEqual([]);
  await page.goto(`/crm/${slug}/tab/Visits`);
  await expect(page.getByRole("button", { name: "Slide 1", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto(`/crm/${slug}/tab/Social`);
  await expect(page.getByRole("heading", { name: /Engage customers/ })).toBeVisible();
  assertNoPageErrors(pageErrors);
});
