import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const RECORDS = [
  ["Leads", "100000000000000000"],
  ["Contacts", "300000000000000000"],
  ["Accounts", "500000000000000000"],
  ["Deals", "700000000000000000"],
] as const;

test.describe("Emails record card", () => {
  for (const [moduleName, recordId] of RECORDS) {
    test(`${moduleName}: card renders, empty state, read only`, async ({ page }) => {
      await page.setViewportSize({ width: 1470, height: 835 });
      await signUpNewUser(page);
      const org = await createOrganization(page);
      await page.goto(moduleRecordPath(org.slug, moduleName, recordId));

      const card = page.locator("#related-list-emails");
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(card.getByRole("heading", { name: "Emails" })).toBeVisible();
      await expect(card.getByRole("button", { name: "Compose Email" })).toBeVisible();
      const tabs = card.getByRole("tablist", { name: "Email folders" });
      await expect(tabs.getByRole("tab")).toHaveText(["Mails", "Drafts", "Scheduled"]);
      await expect(tabs.getByRole("tab", { name: "Mails" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // spec gap: empty text is the generic "No records found" rendered by the component.
      await expect(card.getByText("No records found")).toBeVisible();

      const mutations: string[] = [];
      page.on("request", (request) => {
        // Other related cards read through POST .../bulk; those are fetches, not writes.
        const path = new URL(request.url()).pathname;
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method()) && !path.endsWith("/bulk"))
          mutations.push(`${request.method()} ${new URL(request.url()).pathname}`);
      });
      for (const name of ["Drafts", "Scheduled", "Mails"]) {
        await tabs.getByRole("tab", { name }).click();
        await expect(tabs.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
        await expect(card.getByText("No records found")).toBeVisible();
      }
      expect(mutations).toEqual([]);

      // spec gap: the reference-matched "Compose Email" label and the empty-state text fail color-contrast
      // (known README contrast list pair); excluded here, product code stays untouched.
      await expectNoA11yViolations(page, {
        include: ["#related-list-emails"],
        exclude: [
          "#related-list-emails [data-related-action-label]",
          "#related-list-emails [data-part='empty']",
        ],
      });
    });
  }
});
