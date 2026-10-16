import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleRecordPath } from "./support/crm-paths";
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

async function open(page: Page, orgSlug: string, tab: string, id: string) {
  await page.goto(moduleRecordPath(orgSlug, tab, id));
  await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("Activities record details drop the copied rail and show the relation panel", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const person = await createRecord(page, org.slug, "Contacts", { Last_Name: "Sample" });
  const who = { module: "Contacts", id: person };
  const taskId = await createRecord(page, org.slug, "Tasks", {
    Subject: "Detail Task",
    Status: "Not Started",
    Priority: "High",
    Who_Id: who,
  });
  const callId = await createRecord(page, org.slug, "Calls", {
    Subject: "Detail Call",
    Call_Type: "Outbound",
    Call_Start_Time: "2030-01-01T10:00:00.000Z",
    Call_Duration: "00:05",
    Outgoing_Call_Status: "Scheduled",
    Who_Id: who,
  });
  const meetingId = await createRecord(page, org.slug, "Events", {
    Event_Title: "Detail Meeting",
    Start_DateTime: "2030-01-01T10:00:00.000Z",
    End_DateTime: "2030-01-01T11:00:00.000Z",
    Meeting_Venue__s: "In-office",
  });

  const cases = [
    { tab: "Tasks", id: taskId, title: "Detail Task" },
    { tab: "Calls", id: callId, title: "Sample" },
    { tab: "Meetings", id: meetingId, title: "Detail Meeting" },
  ];
  for (const item of cases) {
    await open(page, org.slug, item.tab, item.id);
    await expect(page.locator("[data-record-rail]")).toHaveCount(0);
    await expect(page.locator("[data-record-rail-control]")).toHaveCount(0);
    await expect(page.locator("[data-record-side-panel]")).toBeVisible();
    await expect(page.locator("[data-activity-relation-panel]")).toBeVisible();
    await expect(page.locator("[data-record-header] h1")).toContainText(item.title);
    const panel = await page.locator("[data-record-side-panel]").boundingBox();
    expect(panel?.width).toBe(300);
    const shot = process.env.PAPERCLIP_SCRATCH_DIR;
    if (shot) await page.screenshot({ path: `${shot}/local-${item.tab}.png` });
  }

  await open(page, org.slug, "Tasks", taskId);
  await expect(page.getByRole("button", { name: "Close Task" })).toBeVisible();
  await page.getByRole("button", { name: "More Options" }).click();
  await expect(page.getByRole("menuitem", { name: "Organize Task Details" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Run Macro" })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Mail Merge" })).toHaveCount(0);
});
