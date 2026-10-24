import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test.use({ viewport: { width: 1470, height: 900 } });

test("Home onboarding body (H01-H09): visibility, selection switching, and inert controls", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await expect(page).toHaveURL(`/crm/${org.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: "Home", exact: true })).toBeVisible();

  // 1. H01–H09 are visible (using roles/labels, not CSS classes)
  const h01 = page.getByRole("button", { name: "Play intro video", exact: true });
  const h02 = page.getByRole("button", { name: "Book Now", exact: true });
  const h03 = page.getByRole("button", { name: "Invite your team", exact: true });
  const h04 = page.getByRole("button", {
    name: "Configure your deals pipeline",
    exact: true,
  });
  const h05 = page.getByRole("button", {
    name: "Connect to your email account",
    exact: true,
  });
  const h06 = page.getByRole("button", {
    name: "Migrate your existing data",
    exact: true,
  });
  const h07 = page.getByRole("button", { name: "Integration", exact: true });
  const h08 = page.getByRole("link", { name: "Invite users", exact: true });
  const h09 = page.getByRole("button", { name: "Skip", exact: true });

  await expect(h01).toBeVisible();
  await expect(h02).toBeVisible();
  await expect(h03).toBeVisible();
  await expect(h04).toBeVisible();
  await expect(h05).toBeVisible();
  await expect(h06).toBeVisible();
  await expect(h07).toBeVisible();
  await expect(h08).toBeVisible();
  await expect(h09).toBeVisible();

  // 2. H03 is selected by default; clicking H04–H07 switches the selected choice and the detail panel (H08 area) follows
  await expect(h03).toHaveAttribute("aria-pressed", "true");
  await expect(h04).toHaveAttribute("aria-pressed", "false");
  await expect(h05).toHaveAttribute("aria-pressed", "false");
  await expect(h06).toHaveAttribute("aria-pressed", "false");
  await expect(h07).toHaveAttribute("aria-pressed", "false");

  // Initial H08 area (H03 detail)
  await expect(
    page.getByRole("heading", { level: 3, name: "Invite your team", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Stay connected and collaborate with your team members to share sales updates from one platform.",
      { exact: true },
    ),
  ).toBeVisible();
  // 3. H08 "Invite users" points to settings members (assert href, do not need to complete the flow)
  await expect(h08).toHaveAttribute("href", `/crm/${org.slug}/settings/members`);

  // Switch to H04
  await h04.click();
  await expect(h04).toHaveAttribute("aria-pressed", "true");
  await expect(h03).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Configure your deals pipeline",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Set up the stages your deals move through so progress is easy to follow.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Configure pipeline", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Invite users", exact: true })).toHaveCount(0);

  // Switch to H05
  await h05.click();
  await expect(h05).toHaveAttribute("aria-pressed", "true");
  await expect(h04).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Connect to your email account",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Bring your email conversations next to your records in one place.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect email", exact: true })).toBeVisible();

  // Switch to H06
  await h06.click();
  await expect(h06).toHaveAttribute("aria-pressed", "true");
  await expect(h05).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Migrate your existing data",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Bring your existing records into the CRM so you can start working right away.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Start migration", exact: true })).toBeVisible();

  // Switch to H07
  await h07.click();
  await expect(h07).toHaveAttribute("aria-pressed", "true");
  await expect(h06).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", { level: 3, name: "Integration", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Connect the tools you already use to make your CRM smarter and more interactive.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Browse integrations", exact: true }),
  ).toBeVisible();

  // Switch back to H03
  await h03.click();
  await expect(h03).toHaveAttribute("aria-pressed", "true");
  await expect(h07).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("heading", { level: 3, name: "Invite your team", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Invite users", exact: true })).toBeVisible();

  // 3. H01, H02, H09 are inert — no navigation away and no non-GET request while clicking them
  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      nonGetRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  const expectedUrl = page.url();

  await h01.click();
  expect(page.url()).toBe(expectedUrl);

  await h02.click();
  expect(page.url()).toBe(expectedUrl);

  await h09.click();
  expect(page.url()).toBe(expectedUrl);

  expect(nonGetRequests).toEqual([]);

  // 4. assertNoPageErrors / pageErrors fixture
  assertNoPageErrors(pageErrors);
});
