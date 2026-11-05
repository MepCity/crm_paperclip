import type { APIResponse, Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

async function api(page: Page, slug: string, method: "POST" | "PUT", path: string, data: unknown) {
  const origin = new URL(page.url()).origin;
  const response: APIResponse = await page.request.fetch(path, {
    method,
    headers: { Origin: origin, "X-CRM-ORG": slug, "Content-Type": "application/json" },
    data: JSON.stringify(data),
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

function idOf(body: unknown): string {
  const found = JSON.stringify(body).match(/"id":"(\d+)"/);
  if (!found?.[1]) throw new Error("no id in response");
  return found[1];
}

test("wall: post, comment, like, filters and empty states", async ({ page }) => {
  await signUpNewUser(page, { name: "Feed User" });
  const org = await createOrganization(page, "Feed Corp");
  await page.goto(`/crm/${org.slug}/tab/Feeds`);

  await page.getByRole("textbox").first().fill("Hello wall");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  const card = page.locator('[data-feed-item="post"]').first();
  await expect(card.getByText("Hello wall")).toBeVisible();

  await card.getByRole("button", { name: "Like", exact: true }).click();
  await expect(card.getByRole("button", { name: "Unlike" })).toBeVisible();
  await expect(card.getByText("1 like")).toBeVisible();

  await card.getByRole("button", { name: "Comment", exact: true }).click();
  await card.getByPlaceholder("Write a comment").fill("First comment");
  await card.getByRole("button", { name: "Send" }).click();
  await expect(card.getByText("First comment")).toBeVisible();
  await expect(card.getByText("1 comment")).toBeVisible();

  await page.getByRole("tab", { name: "Mine" }).click();
  await expect(page).toHaveURL(/filter=mine/);
  await expect(page.getByText("Hello wall")).toBeVisible();
  await page.getByRole("tab", { name: "Following" }).click();
  await expect(page).toHaveURL(/filter=followed/);
});

test("record feed on a deal shows a field change and follow toggles", async ({ page }) => {
  await signUpNewUser(page, { name: "Deal Owner" });
  const org = await createOrganization(page, "Deal Feed Corp");
  const account = await api(page, org.slug, "POST", "/crm/v2.2/Accounts", {
    data: [{ Account_Name: "Feed Account" }],
  });
  const accountId = idOf(account);
  const deal = await api(page, org.slug, "POST", "/crm/v2.2/Deals", {
    data: [
      {
        Deal_Name: "Feed Deal",
        Stage: "Qualification",
        Closing_Date: "2030-01-01",
        Account_Name: { id: accountId },
      },
    ],
  });
  const dealId = idOf(deal);
  await api(page, org.slug, "PUT", `/crm/v2.2/Deals/${dealId}`, {
    data: [{ Stage: "Negotiation/Review" }],
  });

  await page.goto(`/crm/${org.slug}/tab/Deals/${dealId}`);
  await page.getByRole("tab", { name: "Feeds" }).click();
  await expect(page.getByText(/Stage: Qualification → Negotiation\/Review/)).toBeVisible();

  await page.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: "Unfollow" }).click();
  await page.getByRole("button", { name: "More options" }).click();
  await expect(page.getByRole("menuitem", { name: "Follow", exact: true })).toBeVisible();
});
