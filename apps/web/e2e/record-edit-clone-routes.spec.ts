import { signUpNewUser } from "./support/auth";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const MODULE_TABS = ["Leads", "Contacts", "Accounts", "Deals"] as const;

for (const tab of MODULE_TABS) {
  test(`${tab} edit and clone routes open from a direct page load`, async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, tab));
    const recordLink = page.locator(`a[href^="/crm/${org.slug}/tab/${tab}/"]`).filter({
      hasNot: page.locator("svg"),
    });
    let recordId = "";
    await expect
      .poll(async () => {
        const hrefs = await recordLink.evaluateAll((links) =>
          links.map((link) => link.getAttribute("href") ?? ""),
        );
        recordId =
          hrefs.map((value) => value.split("/").pop() ?? "").find((id) => /^\d+$/.test(id)) ?? "";
        return recordId;
      })
      .not.toBe("");

    await page.goto(moduleRecordPath(org.slug, tab, recordId));
    await expect(page.locator("[data-record-header]")).toBeVisible();

    for (const [path, heading] of [
      [moduleRecordEditPath(org.slug, tab, recordId), /^Edit /],
      [moduleRecordClonePath(org.slug, tab, recordId), /^Clone /],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      await expect(page.getByText("The requested page could not be found.")).toHaveCount(0);
    }
  });
}
