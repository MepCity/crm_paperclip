import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

/**
 * MEP-518 behaviour: when a parent record (Lead) is deleted, every activity
 * (Task / Event / Call) whose Who_Id or What_Id points at that parent is also
 * deleted by the record service.  This spec verifies that cascade through the
 * UI: after the lead is removed the linked task no longer appears in the Tasks
 * list and its detail URL returns a not-found page.
 */
test("deleting a lead removes its linked task from the Tasks list and makes the task detail not found", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // ── 1. Create a lead via API ──────────────────────────────────────────────
  const leadSubject = `Cascade Lead ${crypto.randomUUID().slice(0, 8)}`;
  const leadResponse = await page.request.post("/crm/v2.2/Leads", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: {
      data: [{ First_Name: "Cascade", Last_Name: leadSubject, Company: "Cascade Co" }],
    },
  });
  expect(
    leadResponse.ok(),
    `Lead create: ${leadResponse.status()} ${await leadResponse.text()}`,
  ).toBe(true);
  const leadBody = await leadResponse.json();
  const leadId: string = String(leadBody.data?.[0]?.details?.id ?? "");
  expect(leadId, "Expected lead id in response").toBeTruthy();

  // ── 2. Create a task linked to that lead (Who_Id = lead) via API ──────────
  const taskSubject = `Cascade Task ${crypto.randomUUID().slice(0, 8)}`;
  const taskResponse = await page.request.post("/crm/v2.2/Tasks", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: {
      data: [
        {
          Subject: taskSubject,
          Who_Id: { module: "Leads", id: leadId },
        },
      ],
    },
  });
  expect(
    taskResponse.ok(),
    `Task create: ${taskResponse.status()} ${await taskResponse.text()}`,
  ).toBe(true);
  const taskBody = await taskResponse.json();
  const taskId: string = String(taskBody.data?.[0]?.details?.id ?? "");
  expect(taskId, "Expected task id in response").toBeTruthy();

  // ── 3. Verify the task appears in the Tasks list ──────────────────────────
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: taskSubject, exact: true })).toBeVisible();

  // ── 4. Delete the lead from its detail page (More Options → Delete) ───────
  await page.goto(moduleRecordPath(org.slug, LEADS_MODULE, leadId));
  await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

  const header = page.locator("[data-record-header]");
  const more = header.getByRole("button", { name: "More Options" });
  await more.click();
  const menu = page.getByRole("menu", { name: "More Options" });
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeVisible();

  const deleteDone = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes(`/crm/v2.2/Leads/${leadId}`) &&
      response.ok(),
  );
  await menu.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Delete Lead" })).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await deleteDone;

  // After deletion the app returns to the Leads list.
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

  // ── 5. Task no longer appears in the Tasks list ───────────────────────────
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: taskSubject, exact: true })).toHaveCount(0);

  // ── 6. Task detail URL returns a not-found page ───────────────────────────
  await page.goto(moduleRecordPath(org.slug, "Tasks", taskId));
  await expect(page.getByText(/could not be found/i)).toBeVisible();

  ignoreFailedResponses(pageErrors, [404]);
});
