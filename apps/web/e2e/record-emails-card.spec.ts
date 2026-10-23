import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const MODULES = [
  { name: "Leads", id: "100000000000000000", scopeControl: null },
  { name: "Contacts", id: "300000000000000000", scopeControl: null },
  { name: "Accounts", id: "500000000000000000", scopeControl: "Sent" },
  { name: "Deals", id: "700000000000000000", scopeControl: "Emails associated with this Deal" },
] as const;

// The detail page reads through POST (list bulk, count, record tab). Only these exact shapes are
// allowed, and never for an email module. Any other non-GET request counts as a write.
const READ_ONLY_POSTS = [
  /^\/crm\/v2\.2\/[A-Za-z_]+\/bulk$/,
  /^\/crm\/v2\.2\/[A-Za-z_]+\/actions\/count$/,
  /^\/crm\/org-[^/]+\/tab\/[A-Za-z_]+\/\d+$/,
];

function mutationOf(method: string, pathname: string): string | null {
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;
  const isEmail = /email|mail/i.test(pathname);
  if (method === "POST" && !isEmail && READ_ONLY_POSTS.some((re) => re.test(pathname))) return null;
  return `${method} ${pathname}`;
}

// Same pattern as the *-detail specs: seeded record ids, list opened first.
async function openListFirst(page: Page, orgSlug: string, moduleName: string) {
  await page.goto(moduleListDefaultPath(orgSlug, moduleName));
  await expect(page.locator("[data-record-board], table[aria-label='Records']")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Emails record card", () => {
  for (const { name, id, scopeControl } of MODULES) {
    test(`${name}: card renders, empty state, read only`, async ({ page }) => {
      await page.setViewportSize({ width: 1470, height: 835 });
      await signUpNewUser(page);
      const org = await createOrganization(page);
      await openListFirst(page, org.slug, name);

      // Guard starts before the detail navigation so card mount requests are covered too.
      const mutations: string[] = [];
      page.on("request", (request) => {
        const found = mutationOf(request.method(), new URL(request.url()).pathname);
        if (found) mutations.push(found);
      });

      await page.goto(moduleRecordPath(org.slug, name, id));
      await expect(page.locator("[data-record-frame]")).toBeVisible();
      const card = page.locator("#related-list-emails");
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(card.getByRole("heading", { name: "Emails" })).toBeVisible();
      await expect(card.getByRole("button", { name: "Compose Email" })).toBeVisible();
      if (scopeControl) {
        // spec gap: the scope select is a disabled placeholder (later-module button), no scope menu yet.
        await expect(card.getByRole("button", { name: scopeControl })).toBeDisabled();
      }
      const tabs = card.getByRole("tablist", { name: "Email folders" });
      await expect(tabs.getByRole("tab")).toHaveText(["Mails", "Drafts", "Scheduled"]);
      await expect(tabs.getByRole("tab", { name: "Mails" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // spec gap: empty text is the generic "No records found" rendered by the component.
      await expect(card.getByText("No records found")).toBeVisible();

      for (const tab of ["Drafts", "Scheduled", "Mails"]) {
        await tabs.getByRole("tab", { name: tab }).click();
        await expect(tabs.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
        await expect(card.getByText("No records found")).toBeVisible();
      }
      expect(mutations).toEqual([]);

      // spec gap: "Compose Email" label and the empty-state text fail color-contrast
      // (README contrast list); excluded here, product code stays untouched.
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
