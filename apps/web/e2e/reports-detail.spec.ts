import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

async function createRecord(
  page: Page,
  orgSlug: string,
  module: string,
  data: Record<string, unknown>,
): Promise<string> {
  const response = await page.request.post(`/crm/v2.2/${module}`, {
    headers: { "X-CRM-ORG": orgSlug, Origin: new URL(page.url()).origin },
    data: { data: [data] },
  });
  const body = await response.json();
  expect(response.status(), `${module} ${JSON.stringify(body)}`).toBeLessThan(300);
  return body.data[0].details.id as string;
}

/**
 * Mass-deletes all unlocked Events in an organization.
 * The fixture seed pre-populates 250 records where index 125 is locked.
 * Deleting the remaining 249 records leaves only index 125, which does not match
 * Lead meeting criteria, producing a verified 0-record empty state.
 */
async function deleteUnlockedEvents(page: Page, orgSlug: string): Promise<void> {
  const baseId = 130000000000000000n;
  const ids = Array.from({ length: 250 }, (_, i) => String(baseId + BigInt(i))).filter(
    (_, i) => i !== 125,
  );
  const response = await page.request.post("/crm/v2.2/Events/actions/mass_delete", {
    headers: { "X-CRM-ORG": orgSlug, Origin: new URL(page.url()).origin },
    data: { ids },
  });
  expect(response.status()).toBeLessThan(300);
}

test("Report detail: header, toolbar, empty and populated tables, back", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-2`);
  await expect(
    page
      .getByRole("region", { name: "Report detail" })
      .getByRole("heading", { name: "Message engagement summary" }),
  ).toBeVisible();
  for (const name of ["Edit", "Filter", "Filter By Date", "Clear", "Show Details"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveCount(9);
  await expect(table.getByRole("row").first()).toBeVisible();
  if (process.env.REPORT_SHOT_DIR)
    await page.screenshot({ path: `${process.env.REPORT_SHOT_DIR}/report-detail-empty.png` });
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-1`);
  await expect(table.getByRole("columnheader")).toHaveCount(9);
  await expect(table.getByRole("row").first()).toBeVisible();
  if (process.env.REPORT_SHOT_DIR)
    await page.screenshot({ path: `${process.env.REPORT_SHOT_DIR}/report-detail-populated.png` });
  await page.getByRole("button", { name: "Refresh report" }).click();
  await expect(table.getByRole("row").first()).toBeVisible();
  await page.getByRole("link", { name: "Back to Reports" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports`);
});

test("Report detail over a module with no records displays empty-result state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await deleteUnlockedEvents(page, org.slug);

  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-12`);
  await expect(
    page
      .getByRole("region", { name: "Report detail" })
      .getByRole("heading", { name: "Lead meeting summary" }),
  ).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveCount(5);
  await expect(table.getByRole("row")).toHaveCount(1);
  await expect(page.getByText("No Data Found")).toBeVisible();
});

test("Report detail over a module with seeded records displays formatted values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await createRecord(page, org.slug, "Events", {
    Event_Title: "Quarterly Strategy Review",
    Start_DateTime: "2030-06-15T09:00:00.000Z",
    End_DateTime: "2030-06-15T10:30:00.000Z",
    Meeting_Venue__s: "In-office",
    Venue: "Conference Room Alpha",
  });

  await createRecord(page, org.slug, "Campaigns", {
    Campaign_Name: "Synthetic Outreach Campaign",
    Num_sent: "2500",
    Expected_Response: "350",
    Budgeted_Cost: 12500,
    Actual_Cost: 9800,
  });

  // Verify meeting report formatted dates and text
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-8`);
  const meetingRow = page.getByRole("row").filter({ hasText: "Quarterly Strategy Review" });
  await expect(meetingRow).toBeVisible();
  await expect(meetingRow.getByRole("cell").nth(0)).toHaveText("Quarterly Strategy Review");
  await expect(meetingRow.getByRole("cell").nth(2)).toContainText("Jun 15, 2030");
  await expect(meetingRow.getByRole("cell").nth(2)).toContainText("12:00 PM");
  await expect(meetingRow.getByRole("cell").nth(3)).toContainText("Jun 15, 2030");
  await expect(meetingRow.getByRole("cell").nth(3)).toContainText("1:30 PM");
  await expect(meetingRow.getByRole("cell").nth(4)).toHaveText("Conference Room Alpha");

  // Verify outreach report formatted numbers
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-1`);
  const outreachRow = page.getByRole("row").filter({ hasText: "Synthetic Outreach Campaign" });
  await expect(outreachRow).toBeVisible();
  await expect(outreachRow.getByRole("cell").nth(0)).toHaveText("Synthetic Outreach Campaign");
  await expect(outreachRow.getByRole("cell").nth(1)).toHaveText("2,500");
  await expect(outreachRow.getByRole("cell").nth(2)).toHaveText("350");
  await expect(outreachRow.getByRole("cell").nth(3)).toHaveText("12,500");
  await expect(outreachRow.getByRole("cell").nth(4)).toHaveText("9,800");
});

test("Report detail respects tenant scope: records from another organization do not appear", async ({
  page,
}) => {
  // Note: No restricted-user fixture exists in e2e support (tested in unit tests via canReadRecord);
  // tenant isolation is verified here at the e2e boundary.
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org1 = await createOrganization(page);
  await createRecord(page, org1.slug, "Campaigns", {
    Campaign_Name: "Confidential Org1 Campaign",
    Num_sent: "500",
  });

  const org2 = await createOrganization(page);

  await page.goto(`/crm/${org2.slug}/tab/Reports/sample-report-1`);
  await expect(page.getByText("Confidential Org1 Campaign")).not.toBeVisible();

  await page.goto(`/crm/${org1.slug}/tab/Reports/sample-report-1`);
  await expect(page.getByText("Confidential Org1 Campaign")).toBeVisible();
});
