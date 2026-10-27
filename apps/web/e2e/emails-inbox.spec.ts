import type { Request } from "@playwright/test";
import { inboxFixture } from "../src/modules/emails/inbox/fixture";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, ignoreFailedResponses, test } from "./support/test";

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

test("compose validates recipients and posts through the HTTP port", async ({ page }) => {
  const sent: { method: string; org: string | undefined; body: Record<string, unknown> }[] = [];
  await page.route("**/crm/v2.2/mail/messages", async (route) => {
    const request = route.request();
    sent.push({
      method: request.method(),
      org: request.headers()["x-crm-org"],
      body: request.postDataJSON(),
    });
    await route.fulfill({
      json: { data: { id: "synthetic-message", status: "queued", scheduledAt: null } },
    });
  });
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
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({
    method: "POST",
    org: org.slug,
    body: {
      to: [{ address: "recipient@example.com" }],
      cc: [{ address: "copy@example.com" }],
      body: "Synthetic mail body",
      idempotencyKey: expect.any(String),
    },
  });
  expect(sent[0]?.body).not.toHaveProperty("bodyRef");
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

test("an HTTP permission failure uses the denied dialog", async ({ page, pageErrors }) => {
  await page.route("**/crm/v2.2/mail/conversations?*", (route) =>
    route.fulfill({ status: 403, json: { code: "FORBIDDEN" } }),
  );
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Emails`);
  await expect(page.getByRole("dialog", { name: "Permission Denied" })).toBeVisible();
  ignoreFailedResponses(pageErrors, [403]);
});

test("emails inbox control inventory (E-01..E-38) matches what Module 10 renders", async ({
  page,
  pageErrors,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  const nonGetRequests: string[] = [];
  const captureNonGetRequest = (request: Request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      nonGetRequests.push(`${request.method()} ${request.url()}`);
    }
  };
  page.on("request", captureNonGetRequest);

  await page.goto(`/crm/${org.slug}/tab/Emails`);

  // E-31 (Module 10 owned control in Top bar): Calendar icon button/link
  const calendarLink = page
    .getByRole("banner")
    .getByRole("link", { name: "Calendar", exact: true });
  await expect(calendarLink).toBeVisible();
  await expect(calendarLink).toHaveAttribute("href", `/crm/${org.slug}/calendar`);

  // E-36–E-38 (Body rows in spec: Access dialog Permission Denied heading, explanation, OK button):
  // Not implemented in Module 10 (access gap from research; app renders mailbox interface instead)
  await expect(page.getByRole("heading", { name: "Permission Denied" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "OK", exact: true })).toHaveCount(0);

  // Module 10 body controls rendered by apps/web/src/modules/emails:
  // 1. Compose button
  const composeButton = page.getByRole("button", { name: "Compose", exact: true });
  await expect(composeButton).toBeVisible();

  // 2. Email folders navigation in documented order: Inbox, Sent, Drafts, Scheduled
  const foldersNav = page.getByRole("navigation", { name: "Email folders" });
  await expect(foldersNav).toBeVisible();
  await expect(
    foldersNav.getByRole("heading", { level: 1, name: "Emails", exact: true }),
  ).toBeVisible();

  const folderButtons = foldersNav.getByRole("button");
  await expect(folderButtons).toHaveCount(4);
  await expect(folderButtons.nth(0)).toHaveAttribute("aria-label", /^Inbox \d+$/);
  await expect(folderButtons.nth(0)).toHaveAttribute("aria-current", "page");
  await expect(folderButtons.nth(1)).toHaveAttribute("aria-label", /^Sent \d+$/);
  await expect(folderButtons.nth(2)).toHaveAttribute("aria-label", /^Drafts \d+$/);
  await expect(folderButtons.nth(3)).toHaveAttribute("aria-label", /^Scheduled \d+$/);

  // 3. Message list section
  const messageList = page.getByRole("region", { name: "Message list" });
  await expect(messageList).toBeVisible();
  await expect(
    messageList.getByRole("heading", { level: 2, name: "Inbox", exact: true }),
  ).toBeVisible();
  const conversationList = messageList.getByRole("list", { name: "Inbox messages" });
  await expect(conversationList).toBeVisible();

  // 4. Reading pane section with initial empty state
  const readingPane = page.getByRole("region", { name: "Reading pane" });
  await expect(readingPane).toBeVisible();
  await expect(
    readingPane.getByRole("heading", { level: 2, name: "Select a message", exact: true }),
  ).toBeVisible();
  await expect(readingPane.getByText("Choose a message to read its conversation.")).toBeVisible();

  // Safe local interactions:
  // Navigate through folders (Sent, Drafts, Scheduled, back to Inbox)
  await folderButtons.nth(1).click();
  await expect(page).toHaveURL(/folder=sent$/);
  await expect(
    messageList.getByRole("heading", { level: 2, name: "Sent", exact: true }),
  ).toBeVisible();

  await folderButtons.nth(2).click();
  await expect(page).toHaveURL(/folder=drafts$/);
  await expect(
    messageList.getByRole("heading", { level: 2, name: "Drafts", exact: true }),
  ).toBeVisible();

  await folderButtons.nth(3).click();
  await expect(page).toHaveURL(/folder=scheduled$/);
  await expect(
    messageList.getByRole("heading", { level: 2, name: "Scheduled", exact: true }),
  ).toBeVisible();
  await expect(
    messageList.getByRole("heading", { name: "No messages in Scheduled" }),
  ).toBeVisible();

  // Switch back to Inbox and select a conversation
  await folderButtons.nth(0).click();
  await expect(page).toHaveURL(/folder=inbox$/);
  const firstConversation = messageList.getByRole("button", { name: /Project overview/ });
  await expect(firstConversation).toBeVisible();
  await firstConversation.click();
  await expect(page).toHaveURL(/folder=inbox&message=conversation-1$/);
  await expect(
    readingPane.getByRole("heading", { level: 2, name: "Project overview" }),
  ).toBeVisible();

  // Open and close compose modal safely without submitting
  await composeButton.click();
  const composeDialog = page.getByRole("dialog", { name: "Compose Email" });
  await expect(composeDialog).toBeVisible();
  await composeDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(composeDialog).not.toBeVisible();

  // Inbox interactions must not write. Calendar loads events through a read-only POST
  // bulk query, so finish the inbox guard before checking cross-module navigation.
  expect(nonGetRequests).toEqual([]);
  page.off("request", captureNonGetRequest);

  // Safe navigation on E-31 (Calendar link in top bar)
  await calendarLink.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/calendar`);
  await page.goBack();
  await expect(page).toHaveURL(/folder=inbox&message=conversation-1$/);

  // Clean page errors
  assertNoPageErrors(pageErrors);
});
