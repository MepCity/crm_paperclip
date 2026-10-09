import type { Page } from "@playwright/test";
import { AUTH_NAVIGATION_TIMEOUT_MS } from "./auth";
import { expect } from "./test";

/** Creates an organization through the form and lands on its home page. */
export async function createOrganization(
  page: Page,
  name?: string,
): Promise<{ name: string; slug: string }> {
  const organizationName = name ?? `Org ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/orgs/new");
  await page.getByRole("textbox", { name: "Name" }).fill(organizationName);
  const slugField = page.getByRole("textbox", { name: "Slug" });
  await expect(slugField).not.toHaveValue("");
  const slug = await slugField.inputValue();
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(`/crm/${slug}`, { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
  return { name: organizationName, slug };
}
