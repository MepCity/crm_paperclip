import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test.use({ viewport: { width: 1470, height: 835 } });

test("Visits enabled fixture: list to detail with unavailable controls and full inventory", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(`${r.method()} ${r.url()}`);
  });

  // 1. S3 Enabled-empty state: VD07 Send to Webmaster boundary
  await page.goto(`/crm/${slug}/tab/Visits?state=enabled-empty`);
  await expect(page.locator("section[data-integration-state='enabled-empty']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Visits", level: 2 })).toBeVisible();
  await expect(page.getByText("No visits yet.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);

  // VD07: Send to Webmaster setup/send boundary
  const sendToWebmaster = page.getByRole("button", { name: "Send to Webmaster" });
  await expect(sendToWebmaster).toBeVisible();
  await expect(sendToWebmaster).toHaveAttribute("aria-disabled", "true");
  await expect(sendToWebmaster).toHaveAccessibleDescription(
    /Sending is not available in this build\./,
  );
  await sendToWebmaster.click({ force: true });
  await sendToWebmaster.focus();
  await sendToWebmaster.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Controls also visible in enabled-empty
  await expect(page.getByLabel("Tracking account")).toBeVisible();
  await expect(page.getByLabel("View")).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage Columns" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  // 2. S3 Populated state: VD01, VD02, VD03, VD05
  await page.goto(`/crm/${slug}/tab/Visits?state=populated`);
  await expect(page.locator("section[data-integration-state='populated']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Visits", level: 2 })).toBeVisible();

  // VD03: Manage Columns preference boundary
  const manageColumns = page.getByRole("button", { name: "Manage Columns" });
  await expect(manageColumns).toBeVisible();
  await expect(manageColumns).toHaveAttribute("aria-disabled", "true");
  await expect(manageColumns).toHaveAccessibleDescription(
    /Column preferences are not available in this build\./,
  );
  await manageColumns.click({ force: true });
  await manageColumns.focus();
  await manageColumns.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // List columns headers check (8 documented columns)
  const expectedHeaders = [
    "IP Address",
    "VisitedBy",
    "Visited Page",
    "Time Spent (Minutes)",
    "Referrer",
    "User Agents",
    "Attended By",
    "Visited Page URL",
  ];
  for (const header of expectedHeaders) {
    await expect(page.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
  }

  // VD01: Tracking account selector
  const trackingAccountSelect = page.getByLabel("Tracking account");
  await expect(trackingAccountSelect).toBeVisible();
  await expect(trackingAccountSelect).toHaveValue("acct-alpha");

  // In Alpha Site Portal, "All Visits" view: 3 visit rows
  const table = page.getByRole("table");
  const rows = table.getByRole("row");
  // 1 header row + 3 data rows = 4 rows
  await expect(rows).toHaveCount(4);
  await expect(page.getByRole("link", { name: "192.0.2.1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "192.0.2.2", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "192.0.2.3", exact: true })).toBeVisible();

  // Switch to Beta Site Portal: filters to Beta visit
  await trackingAccountSelect.selectOption("acct-beta");
  await expect(rows).toHaveCount(2); // header + 1 row
  await expect(page.getByRole("link", { name: "192.0.2.4", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Sample Visitor 4" })).toBeVisible();

  // Switch back to Alpha Site Portal
  await trackingAccountSelect.selectOption("acct-alpha");
  await expect(rows).toHaveCount(4);

  // VD02: Six predefined views
  const viewSelect = page.getByLabel("View");
  await expect(viewSelect).toBeVisible();
  await expect(viewSelect).toHaveValue("all");

  // View: Today's Visits (2 visits: 192.0.2.1, 192.0.2.2)
  await viewSelect.selectOption("today");
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole("link", { name: "192.0.2.1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "192.0.2.2", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "192.0.2.3", exact: true })).toHaveCount(0);

  // View: Top Visits -> ranking unavailable status
  await viewSelect.selectOption("top");
  await expect(page.getByRole("status")).toHaveText("Ranking criteria not available");
  await expect(page.getByRole("table")).toHaveCount(0);

  // View: Today's Top Visits -> ranking unavailable status
  await viewSelect.selectOption("today-top");
  await expect(page.getByRole("status")).toHaveText("Ranking criteria not available");
  await expect(page.getByRole("table")).toHaveCount(0);

  // View: Visits by Leads (1 visit: 192.0.2.1)
  await viewSelect.selectOption("leads");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "192.0.2.1", exact: true })).toBeVisible();

  // View: Visits by Contacts (2 visits: 192.0.2.2, 192.0.2.3)
  await viewSelect.selectOption("contacts");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "192.0.2.2", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "192.0.2.3", exact: true })).toBeVisible();

  // Return to All Visits
  await viewSelect.selectOption("all");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);

  // VD05: Visit row -> detail navigation
  await page.getByRole("link", { name: "192.0.2.1", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/tab/Visits/visit-1`);

  // Detail screen checks
  await expect(page.locator("section[aria-label='Visit detail']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sample Visitor 1" })).toBeVisible();

  // Back to Visits link
  const backLink = page.getByRole("link", { name: "Back to Visits" });
  await expect(backLink).toBeVisible();
  await expect(backLink).toHaveAttribute(
    "href",
    `/crm/${encodeURIComponent(slug)}/tab/Visits?state=populated`,
  );

  // All 16 detail fields in <dl>
  const expectedFieldLabels = [
    "IP Address",
    "VisitedBy",
    "Visited Page",
    "Time Spent (Minutes)",
    "Referrer",
    "User Agents",
    "Attended By",
    "Visited Page URL",
    "Browser",
    "Operating System",
    "Portal Name",
    "Visitor Type",
    "Revenue",
    "Visited Time",
    "Search Keyword",
    "Search Engine",
  ];
  for (const label of expectedFieldLabels) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("192.0.2.1", { exact: true })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Sample Visitor 1" })).toBeVisible();
  await expect(page.getByText("Synthetic Agent 1.0", { exact: true })).toBeVisible();
  await expect(page.getByText("Alpha Site Portal", { exact: true })).toBeVisible();

  // Actions Performed table
  await expect(page.getByRole("heading", { name: "Actions Performed" })).toBeVisible();
  const actionHeaders = ["Action Type", "Actions", "Time Spent", "Action Performed Time"];
  for (const h of actionHeaders) {
    await expect(page.getByRole("columnheader", { name: h, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("cell", { name: "Accessed", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Opened landing page", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Navigation", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Viewed pricing", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Chat", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Started a chat", exact: true })).toBeVisible();

  // VD06: Note and attachment write boundaries
  const addNote = page.getByRole("button", { name: "Add Note" });
  await expect(addNote).toBeVisible();
  await expect(addNote).toHaveAttribute("aria-disabled", "true");
  await expect(addNote).toHaveAccessibleDescription(/Notes are not available in this build\./);
  await addNote.click({ force: true });
  await addNote.focus();
  await addNote.press("Enter");

  const attachFile = page.getByRole("button", { name: "Attach File" });
  await expect(attachFile).toBeVisible();
  await expect(attachFile).toHaveAttribute("aria-disabled", "true");
  await expect(attachFile).toHaveAccessibleDescription(
    /Attachments are not available in this build\./,
  );
  await attachFile.click({ force: true });
  await attachFile.focus();
  await attachFile.press("Enter");

  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Navigate back to populated list using the back link
  await backLink.click();
  await expect(page).toHaveURL(`/crm/${slug}/tab/Visits?state=populated`);
  await expect(page.getByRole("table")).toBeVisible();

  // Detail screen: Visit not found fallback
  await page.goto(`/crm/${slug}/tab/Visits/non-existent-visit`);
  await expect(page.locator("p[role='alert']")).toHaveText("Visit not found.");
  const missingBackLink = page.getByRole("link", { name: "Back to Visits" });
  await expect(missingBackLink).toBeVisible();
  await missingBackLink.click();
  await expect(page).toHaveURL(`/crm/${slug}/tab/Visits?state=populated`);

  // Assertions: zero non-GET requests and zero page errors
  expect(writes).toEqual([]);
  assertNoPageErrors(pageErrors);
});
