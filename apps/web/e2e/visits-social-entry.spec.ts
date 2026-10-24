import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test.use({ viewport: { width: 1470, height: 835 } });

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
  // Inventory V01–V08: Carousel controls and indicators (V02–V07)
  const previousSlide = page.getByRole("button", { name: "Previous slide" }); // V01
  const nextSlide = page.getByRole("button", { name: "Next slide" }); // V08
  await expect(previousSlide).toBeVisible();
  await expect(nextSlide).toBeVisible();

  // Initial state: V02 (Indicator 1) is pressed
  const dot1 = page.getByRole("button", { name: "Slide 1", exact: true }); // V02
  await expect(dot1).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Generate More Qualified Leads" })).toBeVisible();

  // V01: Previous slide wraps backwards from Slide 1 to Slide 6 (V07)
  await previousSlide.click();
  const dot6 = page.getByRole("button", { name: "Slide 6", exact: true }); // V07
  await expect(dot6).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Help Your Team Follow Up" })).toBeVisible();

  // V08: Next slide wraps forwards from Slide 6 to Slide 1 (V02)
  await nextSlide.click();
  await expect(dot1).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Generate More Qualified Leads" })).toBeVisible();

  // V08: Next slide moves forwards from Slide 1 to Slide 2 (V03)
  await nextSlide.click();
  const dot2 = page.getByRole("button", { name: "Slide 2", exact: true }); // V03
  await expect(dot2).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Understand Your Visitors" })).toBeVisible();

  // V01: Previous slide moves backwards from Slide 2 to Slide 1 (V02)
  await previousSlide.click();
  await expect(dot1).toHaveAttribute("aria-pressed", "true");

  // V02–V07: Direct indicator selection and slide text verification
  const expectedSlides = [
    { title: "Generate More Qualified Leads", text: "Discover interested visitors" },
    { title: "Understand Your Visitors", text: "Explore how visitors discover" },
    { title: "Start Meaningful Conversations", text: "Reach visitors while" },
    { title: "Recognize Returning Interest", text: "Keep website engagement" },
    { title: "Connect Visits and Conversations", text: "Bring visitor insights together" },
    { title: "Help Your Team Follow Up", text: "Use visitor interest to focus" },
  ];

  for (const [index, expected] of expectedSlides.entries()) {
    const slideNumber = index + 1;
    const dot = page.getByRole("button", { name: `Slide ${slideNumber}`, exact: true });
    await expect(dot).toBeVisible();
    await dot.click();
    await expect(dot).toHaveAttribute("aria-pressed", "true");
    const activeDots = page
      .getByRole("region", { name: "Visitor tracking features" })
      .locator('[aria-pressed="true"]');
    await expect(activeDots).toHaveCount(1);

    const slideContent = page.getByRole("region", { name: "Visitor tracking features" });
    await expect(slideContent.getByRole("heading", { name: expected.title })).toBeVisible();
    await expect(slideContent.getByText(expected.text, { exact: false })).toBeVisible();
  }
  const apiRequests = requests.filter((url) => !url.includes("_rsc"));
  expect(apiRequests).toEqual([]);
  await dot1.click();
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
    if (module === "Visits") {
      // V09: Accessible description explaining setup unavailability
      await expect(setup).toHaveAccessibleDescription(
        /Integration not connected\. Setup is not available in this build\./,
      );
    }
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
