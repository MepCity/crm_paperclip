import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Workflow Rules list, detail navigation, and return link", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings`);

  // Settings sidebar navigation (S9)
  const nav = page.getByRole("navigation", { name: "Settings navigation" });
  await nav.getByRole("link", { name: "Workflow Rules" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(nav.getByRole("link", { name: "Workflow Rules" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // WL1: Heading and columns
  await expect(page.getByRole("heading", { name: "Workflow Rules" })).toBeVisible();
  const table = page.getByRole("table", { name: "Workflow rules table" });
  await expect(table).toBeVisible();

  for (const name of ["Name", "Module", "Trigger", "Status"]) {
    await expect(table.getByRole("columnheader", { name })).toBeVisible();
  }

  // WL2, WL3, WL4, WL5: Populated rows
  const ruleLink = table.getByRole("link", {
    name: "High Value Lead Follow-up",
  });
  await expect(ruleLink).toBeVisible();
  await expect(table.getByRole("cell", { name: "Leads" })).toBeVisible();
  await expect(table.getByText("On record creation")).toBeVisible();
  await expect(table.getByText("Enabled").first()).toBeVisible();

  // WL6: Module filter
  const filter = page.getByRole("combobox", {
    name: "Filter workflow rules by module",
  });
  await expect(filter).toBeVisible();
  await filter.selectOption("Deals");
  await expect(table.getByRole("link", { name: "Large Deal Approval Routing" })).toBeVisible();
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toHaveCount(0);

  // Switch filter back to all
  await filter.selectOption("all");
  await expect(table.getByRole("link", { name: "High Value Lead Follow-up" })).toBeVisible();

  // Navigate to Detail (WL2 -> WD1)
  await table.getByRole("link", { name: "High Value Lead Follow-up" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/crm/${org.slug}/settings/workflow-rules/wf-rule-lead-welcome$`),
  );

  // WD1: Heading, module, status, description, back link
  await expect(page.getByRole("heading", { name: "High Value Lead Follow-up" })).toBeVisible();
  await expect(page.getByText("Module: Leads")).toBeVisible();
  await expect(page.getByText("Enabled").first()).toBeVisible();

  // WD2: Trigger
  await expect(page.getByRole("heading", { name: "Trigger" })).toBeVisible();
  await expect(page.getByText("On record creation")).toBeVisible();

  // WD3, WD4, WD5: Condition branches, immediate and scheduled actions
  await expect(page.getByRole("heading", { name: "Condition Branches" })).toBeVisible();
  await expect(page.getByText("Branch 1")).toBeVisible();
  await expect(page.getByText('Lead_Source equals "Web Download"')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Immediate Actions" })).toBeVisible();
  await expect(page.getByText("template:lead_welcome_pack")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scheduled Actions" })).toBeVisible();
  await expect(page.getByText("task:introductory_call")).toBeVisible();

  // WD1: Return link back to list
  const backLink = page.getByRole("link", { name: "Back to Workflow Rules" });
  await expect(backLink).toBeVisible();
  await backLink.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(table).toBeVisible();

  assertNoPageErrors(pageErrors);
});
