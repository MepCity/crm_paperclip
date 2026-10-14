import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const SEEDED_ACCOUNT_ID = "500000000000000000";

type ParentModule = "Leads" | "Deals";

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

function createParent(page: Page, orgSlug: string, module: ParentModule, name: string) {
  return module === "Leads"
    ? createRecord(page, orgSlug, "Leads", { Company: `${name} Co`, Last_Name: name })
    : createRecord(page, orgSlug, "Deals", {
        Deal_Name: name,
        Account_Name: { id: SEEDED_ACCOUNT_ID },
        Stage: "Qualification",
        Closing_Date: "2030-01-01",
      });
}

function createTask(
  page: Page,
  orgSlug: string,
  module: ParentModule,
  parentId: string,
  subject: string,
  status: string,
) {
  const link = { module, id: parentId };
  return createRecord(page, orgSlug, "Tasks", {
    Subject: subject,
    Status: status,
    ...(module === "Leads" ? { Who_Id: link } : { What_Id: link }),
  });
}

async function openDetail(page: Page, orgSlug: string, module: ParentModule, id: string) {
  await page.goto(moduleRecordPath(orgSlug, module, id));
  await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

for (const module of ["Leads", "Deals"] as const) {
  test.describe(`${module} Open / Closed Activities cards`, () => {
    test("show linked open and completed Tasks with counts", async ({ page, pageErrors }) => {
      await signUpNewUser(page);
      const org = await createOrganization(page);
      const parentId = await createParent(page, org.slug, module, "Cards Parent");
      await createTask(page, org.slug, module, parentId, "Open Card Task", "Not Started");
      await createTask(page, org.slug, module, parentId, "Closed Card Task", "Completed");
      await openDetail(page, org.slug, module, parentId);

      const open = page.locator("#related-list-open-activities");
      const openTasks = open.getByRole("region", { name: "Open Tasks (1)" });
      await expect(openTasks).toBeVisible();
      await expect(openTasks.getByRole("link", { name: "Open Card Task" })).toBeVisible();
      await expect(open.getByText("Closed Card Task")).toHaveCount(0);

      const closed = page.locator("#related-list-closed-activities");
      const closedTasks = closed.getByRole("region", { name: "Closed Tasks (1)" });
      await expect(closedTasks).toBeVisible();
      await expect(closedTasks.getByRole("link", { name: "Closed Card Task" })).toBeVisible();
      await expect(closed.getByText("Open Card Task")).toHaveCount(0);
      ignoreFailedResponses(pageErrors, [400]);
    });

    test("show the empty state for a record without activities", async ({ page, pageErrors }) => {
      await signUpNewUser(page);
      const org = await createOrganization(page);
      const parentId = await createParent(page, org.slug, module, "Empty Parent");
      await openDetail(page, org.slug, module, parentId);

      const open = page.locator("#related-list-open-activities");
      const openTasks = open.getByRole("region", { name: "Open Tasks (0)" });
      await expect(openTasks).toBeVisible();
      await expect(openTasks.getByText("No records found")).toBeVisible();
      const closed = page.locator("#related-list-closed-activities");
      const closedTasks = closed.getByRole("region", { name: "Closed Tasks (0)" });
      await expect(closedTasks).toBeVisible();
      await expect(closedTasks.getByText("No records found")).toBeVisible();
      ignoreFailedResponses(pageErrors, [400]);
    });
  });
}
