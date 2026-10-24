import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Home onboarding body inventory H controls, headings, safe links and GET-only load", async ({
  page,
}) => {
  const credentials = await signUpNewUser(page, { name: "Ada Lovelace" });
  const { slug } = await createOrganization(page);

  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET")
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const homeNavLink = nav.getByRole("link", { name: "Home", exact: true });

  // Navigate to Home tab via main navigation
  await homeNavLink.click();
  await expect(page).toHaveURL(`/crm/${slug}`);
  await expect(homeNavLink).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);

  // App shell page title
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();

  // Root onboarding container
  const onboarding = page.getByTestId("home-onboarding");
  await expect(onboarding).toBeVisible();

  // Headings & intro greeting
  await expect(
    page.getByRole("heading", { name: new RegExp(`Hello\\s+${credentials.name}`) }),
  ).toBeVisible();
  await expect(
    page.getByText("We're happy to bring you aboard the world's favorite CRM!"),
  ).toBeVisible();
  await expect(page.getByText("Let's get started!")).toBeVisible();
  await expect(page.getByText("Watch a one-minute video")).toBeVisible();
  await expect(page.getByText("View the key features we offer")).toBeVisible();

  // H01 — Intro region: video play (onboardingVideo; playback untested, inert button)
  const introVideoContainer = onboarding.getByTestId("home-intro-video");
  await expect(introVideoContainer).toBeVisible();
  const playVideoBtn = introVideoContainer.getByRole("button", {
    name: "Play intro video",
    exact: true,
  });
  await expect(playVideoBtn).toBeVisible();
  await playVideoBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // H02 — Below intro: Book Now (webinarOption; inert button)
  const bookNowBtn = onboarding.getByRole("button", { name: "Book Now", exact: true });
  await expect(bookNowBtn).toBeVisible();
  await bookNowBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // H09 — Body upper right: Skip (skipOption; inert button)
  const skipBtn = onboarding.getByRole("button", { name: "Skip", exact: true });
  await expect(skipBtn).toBeVisible();
  await skipBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // Setup panel heading and subtitle
  await expect(
    onboarding.getByRole("heading", { name: "Set up your CRM", exact: true }),
  ).toBeVisible();
  await expect(onboarding.getByText("Make your CRM smarter and more interactive.")).toBeVisible();

  // H03 — Setup first choice: Invite your team (teamInviteOption; initially highlighted)
  const inviteTeamOption = onboarding.getByRole("button", {
    name: "Invite your team",
    exact: true,
  });
  await expect(inviteTeamOption).toBeVisible();
  await expect(inviteTeamOption).toHaveAttribute("aria-pressed", "true");

  // H04 — Setup second choice: Configure your deals pipeline (dealsOption; not selected)
  const dealsOption = onboarding.getByRole("button", {
    name: "Configure your deals pipeline",
    exact: true,
  });
  await expect(dealsOption).toBeVisible();
  await expect(dealsOption).toHaveAttribute("aria-pressed", "false");

  // H05 — Setup third choice: Connect to your email account (mailBoxOption; not selected)
  const mailOption = onboarding.getByRole("button", {
    name: "Connect to your email account",
    exact: true,
  });
  await expect(mailOption).toBeVisible();
  await expect(mailOption).toHaveAttribute("aria-pressed", "false");

  // H06 — Setup fourth choice: Migrate your existing data (migrateDataOption; not selected)
  const migrateOption = onboarding.getByRole("button", {
    name: "Migrate your existing data",
    exact: true,
  });
  await expect(migrateOption).toBeVisible();
  await expect(migrateOption).toHaveAttribute("aria-pressed", "false");

  // H07 — Setup fifth choice: Integration (appsAndExtensionOption; not selected)
  const integrationOption = onboarding.getByRole("button", {
    name: "Integration",
    exact: true,
  });
  await expect(integrationOption).toBeVisible();
  await expect(integrationOption).toHaveAttribute("aria-pressed", "false");

  // H08 — Setup detail: Invite users (teamInviteOptionButton; links to settings/members)
  await expect(
    onboarding.getByRole("heading", { name: "Invite your team", level: 3, exact: true }),
  ).toBeVisible();
  await expect(
    onboarding.getByText(
      "Stay connected and collaborate with your team members to share sales updates from one platform.",
      { exact: true },
    ),
  ).toBeVisible();
  const inviteUsersLink = onboarding.getByRole("link", { name: "Invite users", exact: true });
  await expect(inviteUsersLink).toBeVisible();
  await expect(inviteUsersLink).toHaveAttribute("href", `/crm/${slug}/settings/members`);

  // Safe navigation to members settings and back to Home
  await inviteUsersLink.click();
  await expect(page).toHaveURL(`/crm/${slug}/settings/members`);
  await homeNavLink.click();
  await expect(page).toHaveURL(`/crm/${slug}`);
  await expect(onboarding).toBeVisible();

  // Select H04 and verify its detail panel + inert action button
  await dealsOption.click();
  await expect(dealsOption).toHaveAttribute("aria-pressed", "true");
  await expect(inviteTeamOption).toHaveAttribute("aria-pressed", "false");
  await expect(
    onboarding.getByRole("heading", {
      name: "Configure your deals pipeline",
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    onboarding.getByText(
      "Set up the stages your deals move through so progress is easy to follow.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  const configurePipelineBtn = onboarding.getByRole("button", {
    name: "Configure pipeline",
    exact: true,
  });
  await expect(configurePipelineBtn).toBeVisible();
  await configurePipelineBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // Select H05 and verify its detail panel + inert action button
  await mailOption.click();
  await expect(mailOption).toHaveAttribute("aria-pressed", "true");
  await expect(
    onboarding.getByRole("heading", {
      name: "Connect to your email account",
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    onboarding.getByText("Bring your email conversations next to your records in one place.", {
      exact: true,
    }),
  ).toBeVisible();
  const connectEmailBtn = onboarding.getByRole("button", {
    name: "Connect email",
    exact: true,
  });
  await expect(connectEmailBtn).toBeVisible();
  await connectEmailBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // Select H06 and verify its detail panel + inert action button
  await migrateOption.click();
  await expect(migrateOption).toHaveAttribute("aria-pressed", "true");
  await expect(
    onboarding.getByRole("heading", {
      name: "Migrate your existing data",
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    onboarding.getByText(
      "Bring your existing records into the CRM so you can start working right away.",
      { exact: true },
    ),
  ).toBeVisible();
  const startMigrationBtn = onboarding.getByRole("button", {
    name: "Start migration",
    exact: true,
  });
  await expect(startMigrationBtn).toBeVisible();
  await startMigrationBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // Select H07 and verify its detail panel + inert action button
  await integrationOption.click();
  await expect(integrationOption).toHaveAttribute("aria-pressed", "true");
  await expect(
    onboarding.getByRole("heading", { name: "Integration", level: 3, exact: true }),
  ).toBeVisible();
  await expect(
    onboarding.getByText(
      "Connect the tools you already use to make your CRM smarter and more interactive.",
      { exact: true },
    ),
  ).toBeVisible();
  const browseIntegrationsBtn = onboarding.getByRole("button", {
    name: "Browse integrations",
    exact: true,
  });
  await expect(browseIntegrationsBtn).toBeVisible();
  await browseIntegrationsBtn.click();
  await expect(page).toHaveURL(`/crm/${slug}`);

  // Return to H03 selection and confirm Invite users link returns
  await inviteTeamOption.click();
  await expect(inviteTeamOption).toHaveAttribute("aria-pressed", "true");
  await expect(onboarding.getByRole("link", { name: "Invite users", exact: true })).toBeVisible();

  // Reload page to ensure clean state and assert no non-GET requests occurred on Home
  await page.reload();
  await expect(onboarding).toBeVisible();
  expect(writes).toEqual([]);
});
