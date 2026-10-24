import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Workflow Rules list WL1–WL11 and detail WD1–WD6 read-only inventory", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(
    page,
    `Synthetic Populated Workflow ${crypto.randomUUID().slice(0, 8)}`,
  );

  // Monitor all requests after setup to ensure zero non-GET requests occur
  const nonGetRequests: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET") {
      nonGetRequests.push(`${req.method()} ${req.url()}`);
    }
  });

  await page.goto(`/crm/${org.slug}/settings`);

  // Settings sidebar navigation (S9)
  const nav = page.getByRole("navigation", { name: "Settings navigation" });
  const workflowNavLink = nav.getByRole("link", { name: "Workflow Rules" });
  await expect(workflowNavLink).toBeVisible();
  await workflowNavLink.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(workflowNavLink).toHaveAttribute("aria-current", "page");

  // --- WL1: Heading and columns in exact order ---
  await expect(page.getByRole("heading", { name: "Workflow Rules", level: 2 })).toBeVisible();
  const table = page.getByRole("table", { name: "Workflow rules table" });
  await expect(table).toBeVisible();

  const columnHeaders = table.getByRole("columnheader");
  await expect(columnHeaders).toHaveCount(4);
  const headerTexts = await columnHeaders.allTextContents();
  expect(headerTexts.map((t) => t.trim())).toEqual(["Name", "Module", "Trigger", "Status"]);

  // WL11: No user-controlled sorting or invented total count
  for (const header of await columnHeaders.all()) {
    await expect(header).not.toHaveAttribute("aria-sort");
    await expect(header.getByRole("button")).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "Next page" })).toHaveCount(0);

  // --- WL2, WL3, WL4, WL5: Populated rows with details and static status ---
  const expectedRules = [
    {
      name: "High Value Lead Follow-up",
      id: "wf-rule-lead-welcome",
      module: "Leads",
      trigger: "On record creation",
      status: "Enabled",
    },
    {
      name: "Large Deal Approval Routing",
      id: "wf-rule-deal-discount",
      module: "Deals",
      trigger: "When fields change: Stage, Amount",
      status: "Enabled",
    },
    {
      name: "Annual Contract Renewal Notice",
      id: "wf-rule-contact-renewal",
      module: "Contacts",
      trigger: "Date field: Contract_End_Date (UTC)",
      status: "Disabled",
    },
    {
      name: "Enterprise Account Data Sync",
      id: "wf-rule-account-sync",
      module: "Accounts",
      trigger: "On record edit",
      status: "Enabled",
    },
  ];

  // WL2: detail links with one row per returned rule
  const rows = table.getByRole("row");
  // 1 header row + 4 data rows
  await expect(rows).toHaveCount(5);

  for (const item of expectedRules) {
    const link = table.getByRole("link", { name: item.name });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      `/crm/${org.slug}/settings/workflow-rules/${item.id}`,
    );

    // WL3: Module label
    await expect(table.getByRole("cell", { name: item.module, exact: true })).toBeVisible();

    // WL4: Trigger summary
    await expect(table.getByText(item.trigger)).toBeVisible();

    // WL5: Static status text
    await expect(table.getByText(item.status).first()).toBeVisible();
  }

  // WL5 / RC6: No switches, no checkbox selection
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(table.getByRole("checkbox")).toHaveCount(0);

  // RC1–RC5: No write controls in workflow rules region
  const workflowRegion = page.getByRole("region", { name: "Workflow Rules" });
  await expect(workflowRegion.getByRole("button", { name: /create|new rule/i })).toHaveCount(0);
  await expect(workflowRegion.getByRole("button", { name: /edit/i })).toHaveCount(0);
  await expect(workflowRegion.getByRole("button", { name: /delete/i })).toHaveCount(0);
  await expect(workflowRegion.getByRole("button", { name: /clone/i })).toHaveCount(0);
  await expect(workflowRegion.getByRole("button", { name: /reorder|drag/i })).toHaveCount(0);

  await expectNoA11yViolations(page, { include: ['section[aria-label="Workflow Rules"]'] });

  // --- WL6: Module filter ---
  const moduleFilter = page.getByRole("combobox", {
    name: "Filter workflow rules by module",
  });
  await expect(moduleFilter).toBeVisible();

  // Filter: Leads
  await moduleFilter.selectOption("Leads");
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Large Deal Approval Routing" })).toHaveCount(0);
  await expect(table.getByRole("link", { name: "Annual Contract Renewal Notice" })).toHaveCount(0);
  await expect(table.getByRole("link", { name: "Enterprise Account Data Sync" })).toHaveCount(0);

  // Filter: Deals
  await moduleFilter.selectOption("Deals");
  await expect(table.getByRole("link", { name: "Large Deal Approval Routing" })).toBeVisible();
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toHaveCount(0);

  // Filter: Contacts
  await moduleFilter.selectOption("Contacts");
  await expect(table.getByRole("link", { name: "Annual Contract Renewal Notice" })).toBeVisible();
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toHaveCount(0);

  // Filter: Accounts
  await moduleFilter.selectOption("Accounts");
  await expect(table.getByRole("link", { name: "Enterprise Account Data Sync" })).toBeVisible();
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toHaveCount(0);

  // Filter: All modules resets table
  await moduleFilter.selectOption("all");
  for (const item of expectedRules) {
    await expect(table.getByRole("link", { name: item.name })).toBeVisible();
  }

  // --- WD1–WD5: Detail Screen 1 (Leads rule: populated immediate and scheduled actions) ---
  await table.getByRole("link", { name: "High Value Lead Follow-up" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules/wf-rule-lead-welcome`);

  // WD1: Heading, module, status, description, return link
  await expect(
    page.getByRole("heading", { name: "High Value Lead Follow-up", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Module: Leads")).toBeVisible();
  await expect(page.getByText("Enabled").first()).toBeVisible();
  await expect(
    page.getByText(
      "Triggers notification and scheduled task for newly created leads with high expected value.",
    ),
  ).toBeVisible();

  // WD2: Trigger
  await expect(page.getByRole("heading", { name: "Trigger", level: 2 })).toBeVisible();
  await expect(page.getByText("On record creation")).toBeVisible();

  // WD3: Condition Branches
  await expect(page.getByRole("heading", { name: "Condition Branches", level: 2 })).toBeVisible();
  await expect(page.getByText("Branch 1")).toBeVisible();
  await expect(page.getByText('Lead_Source equals "Web Download"')).toBeVisible();

  // WD4: Immediate Actions
  await expect(page.getByRole("heading", { name: "Immediate Actions", level: 3 })).toBeVisible();
  await expect(page.getByText("Email Notification")).toBeVisible();
  await expect(page.getByText("template:lead_welcome_pack")).toBeVisible();

  // WD5: Scheduled Actions
  await expect(page.getByRole("heading", { name: "Scheduled Actions", level: 3 })).toBeVisible();
  await expect(page.getByText("1 day after event")).toBeVisible();
  await expect(page.getByText("Task / Activity")).toBeVisible();
  await expect(page.getByText("task:introductory_call")).toBeVisible();

  await expectNoA11yViolations(page, {
    include: ['section[aria-label="Workflow Rule Details"]'],
  });

  // RC1–RC6 on detail: no write affordances
  const detailRegion = page.getByRole("region", { name: "Workflow Rule Details" });
  await expect(detailRegion.getByRole("button", { name: /create|new rule/i })).toHaveCount(0);
  await expect(detailRegion.getByRole("button", { name: /edit/i })).toHaveCount(0);
  await expect(detailRegion.getByRole("button", { name: /delete/i })).toHaveCount(0);
  await expect(detailRegion.getByRole("button", { name: /clone/i })).toHaveCount(0);
  await expect(detailRegion.getByRole("switch")).toHaveCount(0);

  // Return to list via safe back link
  const backToList = page.getByRole("link", { name: "Back to Workflow Rules" });
  await expect(backToList).toBeVisible();
  await backToList.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(table).toBeVisible();

  // --- WD1–WD5: Detail Screen 2 (Deals rule: empty scheduled actions, multi-condition, webhook/field update) ---
  await table.getByRole("link", { name: "Large Deal Approval Routing" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules/wf-rule-deal-discount`);

  await expect(
    page.getByRole("heading", { name: "Large Deal Approval Routing", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Module: Deals")).toBeVisible();
  await expect(page.getByText("When fields change: Stage, Amount")).toBeVisible();
  await expect(page.getByText('(Stage equals "Negotiation" AND Amount > 100000)')).toBeVisible();
  await expect(page.getByText("Field Update", { exact: true })).toBeVisible();
  await expect(page.getByText("field_update:flag_executive_review")).toBeVisible();
  await expect(page.getByText("Webhook", { exact: true })).toBeVisible();
  await expect(page.getByText("webhook:notify_deal_desk")).toBeVisible();

  // WD5: Empty scheduled actions section
  await expect(page.getByText("No scheduled actions configured.")).toBeVisible();

  await page.getByRole("link", { name: "Back to Workflow Rules" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);

  // --- WD1–WD5: Detail Screen 3 (Contacts rule: disabled status, date trigger, all records, empty immediate actions) ---
  await table.getByRole("link", { name: "Annual Contract Renewal Notice" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules/wf-rule-contact-renewal`);

  await expect(
    page.getByRole("heading", { name: "Annual Contract Renewal Notice", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Module: Contacts")).toBeVisible();
  await expect(page.getByText("Disabled").first()).toBeVisible();
  await expect(page.getByText("Date field: Contract_End_Date (UTC)")).toBeVisible();
  await expect(page.getByText("All records")).toBeVisible();

  // WD4: Empty immediate actions section
  await expect(page.getByText("No immediate actions configured.")).toBeVisible();

  // WD5: Scheduled timing with field-relative offset
  await expect(page.getByText("30 days before Contract_End_Date (UTC)")).toBeVisible();
  await expect(page.getByText("template:contract_renewal_notice")).toBeVisible();

  await page.getByRole("link", { name: "Back to Workflow Rules" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);

  // --- WD6: Not Found state and safe back-navigation ---
  await page.goto(`/crm/${org.slug}/settings/workflow-rules/non-existent-rule-id`);
  const notFoundAlert = page
    .getByRole("region", { name: "Workflow Rule Details" })
    .getByRole("alert");
  await expect(notFoundAlert).toBeVisible();
  await expect(notFoundAlert.getByText("Workflow rule not found.")).toBeVisible();
  await expect(
    notFoundAlert.getByText("The requested workflow rule does not exist or may have been removed."),
  ).toBeVisible();

  const backFromNotFound = page.getByRole("link", { name: "Back to Workflow Rules" });
  await expect(backFromNotFound).toBeVisible();
  await backFromNotFound.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(table).toBeVisible();

  // Zero non-GET requests throughout the run
  expect(nonGetRequests).toEqual([]);

  // Clean page errors
  assertNoPageErrors(pageErrors);
});

test("ordinary organizations show no workflow rules or foreign detail", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(page.getByText("No workflow rules have been configured yet.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.goto(`/crm/${org.slug}/settings/workflow-rules/wf-rule-lead-welcome`);
  await expect(page.getByText("Workflow rule not found.")).toBeVisible();
  assertNoPageErrors(pageErrors);
});
