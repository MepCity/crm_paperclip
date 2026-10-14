import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test("search groups Leads and Contacts, opens a detail and remembers the record", async ({
  page,
}, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  // Create synthetic records through our own application only.
  for (const [module, lastName] of [
    ["Leads", "Lead"],
    ["Contacts", "Contact"],
  ]) {
    const response = await page.request.post(`/crm/v2.2/${module}`, {
      headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
      data: {
        data: [
          {
            First_Name: "Global",
            Last_Name: lastName,
            ...(module === "Leads" ? { Company: "Search Example" } : {}),
          },
        ],
      },
    });
    expect(response.ok()).toBeTruthy();
  }
  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Global");
  await expect(dialog.getByRole("region", { name: "Leads" })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Contacts" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("global-search-results.png") });
  await dialog.getByRole("link", { name: "Global Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Contacts\/[^/]+$/);
  await expect(page.locator("[data-record-header]")).toContainText("Global Contact");
  await page.getByRole("button", { name: "Search records" }).click();
  await expect(dialog.getByRole("region", { name: "Search History" })).toContainText(
    "Global Contact",
  );
  await page.screenshot({ path: testInfo.outputPath("global-search-history.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Search records" })).toBeFocused();
});

test("Enter and advanced search preserve query and selected module in the route", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  // The advanced page belongs to a separate issue; inspect the destination URL here.
  await page.getByRole("button", { name: "Search records" }).click();
  await page.getByRole("button", { name: "Search module" }).click();
  await page
    .getByRole("dialog", { name: "Search Modules" })
    .getByRole("button", { name: "Contacts" })
    .click();
  await page.getByRole("textbox", { name: "Search records" }).fill("#Global");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/crm/${org.slug}/search?q=%23Global&module=Contacts`);
  await page.goto(`/crm/${org.slug}`);
  await page.getByRole("button", { name: "Search records" }).click();
  await page.getByRole("textbox", { name: "Search records" }).fill("Global");
  await page.getByRole("link", { name: "View advanced search" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/search?q=Global`);
  ignoreFailedResponses(pageErrors, [404]);
});

test("search finds a Task by subject and opens the Tasks record detail", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const response = await page.request.post("/crm/v2.2/Tasks", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: { data: [{ Subject: "Zephyrquartz follow-up" }] },
  });
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Zephyrquartz");
  await expect(dialog.getByRole("region", { name: "Tasks" })).toBeVisible();
  await dialog.getByRole("link", { name: "Zephyrquartz follow-up", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Tasks\/[^/]+$/);
  await expect(page.locator("[data-record-header]")).toContainText("Zephyrquartz follow-up");
});

test("search finds a Meeting by title and opens the Meetings record detail", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  // Meetings use the Events API endpoint; Event_Title is the searchable title field.
  const response = await page.request.post("/crm/v2.2/Events", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: {
      data: [
        {
          Event_Title: "Zephrysearch Meeting",
          Start_DateTime: "2026-06-01T10:00:00.000Z",
          End_DateTime: "2026-06-01T11:00:00.000Z",
          All_day: false,
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Zephrysearch");
  await expect(dialog.getByRole("region", { name: "Meetings" })).toBeVisible();
  // Detail screen for Meetings is still being built (MEP-507): assert URL only.
  await dialog.getByRole("link", { name: "Zephrysearch Meeting", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Meetings\/[^/]+$/);
});

test("search finds a Call by subject and opens the Calls record detail", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const response = await page.request.post("/crm/v2.2/Calls", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: { data: [{ Subject: "Zephrysearch Call" }] },
  });
  expect(response.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Zephrysearch");
  await expect(dialog.getByRole("region", { name: "Calls" })).toBeVisible();
  // Detail screen for Calls is still being built (MEP-508): assert URL only.
  await dialog.getByRole("link", { name: "Zephrysearch Call", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Calls\/[^/]+$/);
});
