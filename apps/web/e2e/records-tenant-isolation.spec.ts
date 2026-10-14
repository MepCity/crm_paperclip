import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const MODULES = ["Contacts", "Accounts", "Deals"] as const;
const SEEDED_ACCOUNT_ID = "500000000000000000";

/** Creates a record through the API; seed ids repeat in every organization, new ids are scoped. */
async function createRecord(page: Page, slug: string, tab: string, name: string) {
  const data =
    tab === "Contacts"
      ? { Last_Name: name }
      : tab === "Accounts"
        ? { Account_Name: name }
        : {
            Deal_Name: name,
            Account_Name: { id: SEEDED_ACCOUNT_ID },
            Stage: "Qualification",
            Closing_Date: "2030-01-01",
          };
  const response = await page.request.post(`/crm/v2.2/${tab}`, {
    headers: { "X-CRM-ORG": slug, Origin: new URL(page.url()).origin },
    data: { data: [data] },
  });
  const body = await response.json();
  expect(response.status(), `${tab} ${JSON.stringify(body)}`).toBeLessThan(300);
  return body.data[0].details.id as string;
}

async function firstRecordId(page: Page, slug: string, tab: string) {
  await page.goto(moduleListDefaultPath(slug, tab));
  const links = page.locator(`a[href^="/crm/${slug}/tab/${tab}/"]`);
  let id = "";
  await expect
    .poll(async () => {
      const hrefs = await links.evaluateAll((items) =>
        items.map((link) => link.getAttribute("href") ?? ""),
      );
      id = hrefs.map((href) => href.split("/").pop() ?? "").find((v) => /^\d+$/.test(v)) ?? "";
      return id;
    })
    .not.toBe("");
  return id;
}

async function recordCount(page: Page, slug: string, tab: string) {
  const response = await page.request.post(
    `/crm/v2.2/${tab}/actions/count?cvid=all-${tab.toLowerCase()}`,
    {
      data: {},
      headers: { "X-CRM-ORG": slug, Origin: new URL(page.url()).origin },
    },
  );
  expect(response.status()).toBe(200);
  return ((await response.json()) as { count: number }).count;
}

for (const tab of MODULES) {
  test(`${tab} organizations isolate list rows, counts and record routes`, async ({
    page,
    browser,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const orgA = await createOrganization(page);
    const seedId = await firstRecordId(page, orgA.slug, tab);
    const seedCount = await recordCount(page, orgA.slug, tab);
    expect(seedCount).toBeGreaterThan(0);

    // A new record only exists in organization A; seed ids repeat in every organization.
    const name = `Isolation ${tab} ${crypto.randomUUID().slice(0, 8)}`;
    const recordId = await createRecord(page, orgA.slug, tab, name);
    expect(await recordCount(page, orgA.slug, tab)).toBe(seedCount + 1);

    const context = await browser.newContext();
    const other = await context.newPage();
    try {
      await signUpNewUser(other);
      const orgB = await createOrganization(other);

      // Membership: A's addresses are not found for B.
      const crossRead = await other.request.get(`/crm/v2.2/${tab}/${seedId}`, {
        headers: { "X-CRM-ORG": orgA.slug },
      });
      expect(crossRead.status()).toBe(404);
      for (const path of [
        moduleListDefaultPath(orgA.slug, tab),
        moduleRecordPath(orgA.slug, tab, recordId),
        moduleRecordEditPath(orgA.slug, tab, recordId),
        moduleRecordClonePath(orgA.slug, tab, recordId),
      ]) {
        await other.goto(path);
        await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
        await expect(other.getByRole("table")).toHaveCount(0);
        await expect(other.locator("[data-record-header]")).toHaveCount(0);
      }

      // Record scope: inside B's own organization A's new record does not exist.
      const scoped = await other.request.get(`/crm/v2.2/${tab}/${recordId}`, {
        headers: { "X-CRM-ORG": orgB.slug },
      });
      expect(scoped.status()).toBe(404);
      for (const path of [
        moduleRecordPath(orgB.slug, tab, recordId),
        moduleRecordEditPath(orgB.slug, tab, recordId),
        moduleRecordClonePath(orgB.slug, tab, recordId),
      ]) {
        await other.goto(path);
        await expect(other.locator("[data-record-header]")).toHaveCount(0);
        await expect(
          other
            .getByRole("heading", { name: "404 - Not Found" })
            .or(other.getByText("The requested page could not be found.")),
        ).toBeVisible();
      }

      // B's list shows no trace of A's new record; its count is the seed count only.
      await firstRecordId(other, orgB.slug, tab);
      await expect(other.getByText(name)).toHaveCount(0);
      await expect(other.locator(`a[href$="/${recordId}"]`)).toHaveCount(0);
      expect(await recordCount(other, orgB.slug, tab)).toBe(seedCount);
      ignoreFailedResponses(pageErrors, [404]);
    } finally {
      await context.close();
    }

    // Organization A's own user still sees the new record.
    await page.goto(moduleRecordPath(orgA.slug, tab, recordId));
    await expect(page.locator("[data-record-header]")).toBeVisible();
    await expect(page.getByText(name).first()).toBeVisible();
  });
}
