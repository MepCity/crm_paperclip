import { inboxFixture } from "../src/modules/emails/inbox/fixture";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

// Keep browser scenarios synthetic while exercising the production HTTP loader.
test.beforeEach(async ({ page }) => {
  await page.route("**/crm/v2.2/mail/conversations?*", async (route) => {
    const folder = new URL(route.request().url()).searchParams.get("folder");
    await route.fulfill({
      json: {
        connected: true,
        data: inboxFixture.conversations.filter((row) => row.folder === folder),
      },
    });
  });
});

test("email folders and messages persist in URL and browser history", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await expect(page.getByRole("heading", { name: "Select a message" })).toBeVisible();
  // Selection is local. Ignore prefetches from existing shell navigation links.
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.headers()["next-router-prefetch"] !== "1") requests.push(request.url());
  });
  await page.getByRole("button", { name: /Project overview/ }).click();
  await expect(page).toHaveURL(/folder=inbox&message=conversation-1$/);
  const reader = page.getByRole("region", { name: "Reading pane" });
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  await expect(reader.getByText("project-overview.pdf")).toBeVisible();
  const firstMessage = reader.getByRole("button").first();
  await expect(firstMessage).toHaveAttribute("aria-expanded", "false");
  await firstMessage.click();
  await expect(reader.getByText("Could you share an overview of the proposed work?")).toBeVisible();
  await page.getByRole("button", { name: "Sent 0" }).click();
  await expect(page).toHaveURL(/\?folder=sent$/);
  await page.getByRole("button", { name: /Planning summary/ }).click();
  await expect(reader.getByRole("heading", { name: "Planning summary" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Select a message" })).toBeVisible();
  await page.goBack();
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).pathname === "/crm/v2.2/mail/conversations")).toBe(
    true,
  );
  await page.reload();
  await expect(reader.getByRole("heading", { name: "Project overview" })).toBeVisible();
  await page.getByRole("button", { name: "Scheduled 0" }).click();
  await expect(page.getByRole("heading", { name: "No messages in Scheduled" })).toBeVisible();
});

test("compose validates recipients and sends through the fixture port", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await page.getByRole("button", { name: "Compose", exact: true }).click();
  const compose = page.getByRole("dialog", { name: "Compose Email" });
  await expect(compose).toBeVisible();
  await compose.getByRole("button", { name: "Send", exact: true }).click();
  await expect(compose.getByRole("alert")).toHaveText("Add at least one recipient.");
  await compose.getByRole("textbox", { name: "To", exact: true }).fill("recipient@example.com");
  await compose.getByRole("button", { name: "Cc", exact: true }).click();
  await compose.getByRole("textbox", { name: "Cc", exact: true }).fill("copy@example.com");
  await compose.getByRole("textbox", { name: "Subject" }).fill("Fixture composition");
  await compose.getByRole("textbox", { name: "Message", exact: true }).fill("Synthetic mail body");
  await compose.getByRole("button", { name: "Send", exact: true }).click();
  await expect(compose).not.toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Message sent (fixture)" }),
  ).toBeVisible();
});

test("a disconnected mailbox uses the existing empty state", async ({ page }) => {
  await page.route("**/crm/v2.2/mail/conversations?*", (route) =>
    route.fulfill({ json: { connected: false, data: [] } }),
  );
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await expect(page.getByRole("heading", { name: "No mailbox connected" })).toBeVisible();
});

test("an HTTP failure uses the existing error state", async ({ page, pageErrors }) => {
  await page.route("**/crm/v2.2/mail/conversations?*", (route) =>
    route.fulfill({ status: 403, json: { code: "FORBIDDEN" } }),
  );
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await expect(page.getByRole("alert").filter({ hasText: "Unable to load emails" })).toBeVisible();
  ignoreFailedResponses(pageErrors, [403]);
});
