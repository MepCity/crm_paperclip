import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("convert a lead from its record detail and see the conversion on the timeline", async ({
  page,
}) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const created = await page.request.post("/crm/v2.2/Leads", {
    headers: { "X-CRM-ORG": slug, Origin: new URL(page.url()).origin },
    data: { data: [{ Last_Name: "Convertible", Company: "Convert Co" }] },
  });
  expect(created.ok()).toBe(true);
  const leadId = (await created.json()).data[0].details.id as string;

  await page.goto(moduleRecordPath(slug, LEADS_MODULE, leadId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await page.getByRole("link", { name: "Convert" }).click();
  await expect(page).toHaveURL(new RegExp(`/tab/Leads/${leadId}/convert$`));
  await expect(page.getByRole("heading", { name: "Convert Lead" })).toBeVisible();

  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page).toHaveURL(/\/tab\/Contacts\/[^/]+$/);

  await page.goto(moduleRecordPath(slug, LEADS_MODULE, leadId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await expect(page.getByRole("link", { name: "Convert" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.getByText(/converted/i).first()).toBeVisible();
});
