import { signUpNewUser } from "./support/auth";
import { moduleListCustomPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

type Case = {
  module: string;
  viewId: string;
  viewName: string;
  columns: readonly string[];
  query: string;
};

const CASES: readonly Case[] = [
  {
    module: "Contacts",
    viewId: "unsubscribed-contacts",
    viewName: "Unsubscribed Contacts",
    columns: [
      "Contact Name",
      "Account Name",
      "Email",
      "Contact Owner",
      "Created Time",
      "Unsubscribed Mode",
      "Unsubscribed Time",
    ],
    query: "",
  },
  {
    module: "Accounts",
    viewId: "my-accounts",
    viewName: "My Accounts",
    columns: ["Account Name", "Phone", "Website"],
    query: "",
  },
  {
    module: "Deals",
    viewId: "my-deals",
    viewName: "My Deals",
    columns: ["Deal Name", "Amount", "Stage", "Closing Date", "Account Name", "Contact Name"],
    query: "?presentation=table",
  },
];

for (const c of CASES) {
  test.describe(`${c.module} custom view routes`, () => {
    test(`custom view route shows that view columns in order`, async ({ page }) => {
      await signUpNewUser(page);
      const org = await createOrganization(page);
      await page.goto(`${moduleListCustomPath(org.slug, c.module, c.viewId)}${c.query}`);
      const headers = page.getByRole("columnheader");
      await expect(headers.filter({ hasText: c.columns[0] ?? "" }).first()).toBeVisible();
      const texts = (await headers.allInnerTexts())
        .map((t) => (t.split("\n")[0] ?? "").trim())
        .filter((t) => t !== "Select all rows on this page" && t !== "Badges");
      expect(texts).toEqual([...c.columns]);
      await expect(page.locator("[data-view-pill]").filter({ hasText: c.viewName })).toBeVisible();
    });

    test(`shows not found for an unknown custom view`, async ({ page, pageErrors }) => {
      await signUpNewUser(page);
      const org = await createOrganization(page);
      await page.goto(moduleListCustomPath(org.slug, c.module, "missing-view"));
      await expect(page.getByText(/could not be found/i)).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);
      ignoreFailedResponses(pageErrors, [404]);
    });
  });
}
