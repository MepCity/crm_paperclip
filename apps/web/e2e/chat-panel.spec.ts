import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { AUTH_NAVIGATION_TIMEOUT_MS, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("chat bottom bar, panel destinations, empty states, quick actions and invite dialog work", async ({
  page,
}) => {
  const screenshotDir = join(process.cwd(), "test-results", "chat-screenshots");
  await mkdir(screenshotDir, { recursive: true });

  await signUpNewUser(page, { name: "Test User" });
  await createOrganization(page, "Acme Corp");

  // Verify all 5 footer buttons are visible
  const pinsFooter = page.getByTestId("chat-footer-pins");
  const chatsFooter = page.getByTestId("chat-footer-chats");
  const channelsFooter = page.getByTestId("chat-footer-channels");
  const threadsFooter = page.getByTestId("chat-footer-threads");
  const contactsFooter = page.getByTestId("chat-footer-contacts");

  await expect(pinsFooter).toBeVisible();
  await expect(chatsFooter).toBeVisible();
  await expect(channelsFooter).toBeVisible();
  await expect(threadsFooter).toBeVisible();
  await expect(contactsFooter).toBeVisible();

  // 0. Screenshot closed shell footer
  await page.screenshot({ path: join(screenshotDir, "chat-shell.png") });

  // 1. Open Chats
  await chatsFooter.click();
  const panel = page.getByTestId("chat-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Test User")).toBeVisible();
  await expect(panel.getByText("Available")).toBeVisible();

  // Chats empty state
  await expect(panel.getByText("No conversations yet")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-chats.png") });

  // Switch to Unread tab
  await page.getByTestId("chat-tab-unread").click();
  await expect(page.getByTestId("chat-unread-empty")).toBeVisible();
  await expect(panel.getByText("No unread chats")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-unread.png") });

  // Switch back to Recent tab
  await page.getByTestId("chat-tab-recent").click();
  await expect(panel.getByText("No conversations yet")).toBeVisible();

  // 2. Switch to Pins
  await pinsFooter.click();
  await expect(page.getByTestId("chat-pins-empty")).toBeVisible();
  await expect(page.getByTestId("chat-add-chats")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-pins.png") });

  // 3. Switch to Channels
  await channelsFooter.click();
  await expect(page.getByTestId("chat-channels-empty")).toBeVisible();

  // 4. Switch to Threads
  await threadsFooter.click();
  await expect(page.getByTestId("chat-threads-empty")).toBeVisible();

  // 5. Switch to Contacts
  await contactsFooter.click();
  await expect(page.getByTestId("chat-contacts-empty")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-contacts.png") });

  // Contact categories dropdown
  await page.getByTestId("chat-category-caret").click();
  const categoryMenu = page.getByTestId("chat-contact-categories");
  await expect(categoryMenu).toBeVisible();
  await page.screenshot({
    path: join(screenshotDir, "chat-contact-categories.png"),
  });
  await page.getByTestId("chat-category-recent").click();
  await expect(categoryMenu).toBeHidden();

  // Email search in Contacts triggers invite row
  const searchInput = page.getByTestId("chat-search");
  await searchInput.fill("colleague@example.com");
  const emailInviteRow = page.getByTestId("chat-email-invite-row");
  await expect(emailInviteRow).toBeVisible();

  // 6. Quick Actions
  await page.getByTestId("chat-quick-actions-fab").click();
  const qaMenu = page.getByTestId("chat-quick-actions-menu");
  await expect(qaMenu).toBeVisible();
  await expect(page.getByTestId("chat-qa-direct")).toBeVisible();
  await expect(page.getByTestId("chat-qa-group")).toBeVisible();
  await expect(page.getByTestId("chat-qa-channel")).toBeVisible();
  await expect(page.getByTestId("chat-qa-invite")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-quick-actions.png") });

  // 7. Open Invite Dialog from Quick Actions
  await page.getByTestId("chat-qa-invite").click();
  const inviteDialog = page.getByTestId("chat-invite-dialog");
  await expect(inviteDialog).toBeVisible();
  await expect(inviteDialog.getByText("Invite People")).toBeVisible();
  await expect(
    inviteDialog.getByText("An invitation will be sent to this email address"),
  ).toBeVisible();

  // Verify no extra trigger button is visible outside the dialog (P1 regression guard)
  await expect(page.getByRole("button", { name: "Invite People" })).toHaveCount(0);

  await page.screenshot({ path: join(screenshotDir, "chat-invite.png") });

  // Cancel closes invite dialog
  await page.getByTestId("chat-invite-cancel").click();
  await expect(inviteDialog).toBeHidden();

  // 8. Presence menu
  await page.getByTestId("chat-presence-trigger").click();
  const presenceMenu = page.getByTestId("chat-presence-menu");
  await expect(presenceMenu).toBeVisible();
  await page.getByTestId("chat-presence-away").click();
  await expect(presenceMenu).toBeHidden();
  await expect(panel.getByText("Away")).toBeVisible();

  // 9. Maximize and Restore
  await page.getByTestId("chat-maximize").click();
  await expect(panel).toHaveClass(/chat-panel-maximized/);
  await page.getByTestId("chat-maximize").click();
  await expect(panel).not.toHaveClass(/chat-panel-maximized/);

  // 10. Minimize (close)
  await page.getByTestId("chat-minimize").click();
  await expect(panel).toBeHidden();
});

test("two members of one organization chat live: send, unread, read, edit, delete and presence", async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  const screenshotDir = join(process.cwd(), "test-results", "chat-screenshots");
  await mkdir(screenshotDir, { recursive: true });

  await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page, "Live Chat Org");

  // Ada invites Bea through the members page (reuses the invitation flow).
  await page.goto(`/crm/${organization.slug}/settings/members`);
  const beaEmail = `bea-${crypto.randomUUID()}@example.test`;
  await page.getByRole("button", { name: "Invite member" }).click();
  const inviteDialog = page.getByRole("dialog", { name: "Invite member" });
  await inviteDialog.getByRole("textbox", { name: "Email" }).fill(beaEmail);
  await inviteDialog.getByRole("button", { name: "Create invitation" }).click();
  const inviteUrl = (await inviteDialog.getByText(/\/invite\//).innerText()).trim();
  await inviteDialog.getByRole("button", { name: "Close" }).click();

  const beaContext = await browser.newContext();
  const bea = await beaContext.newPage();
  const beaErrors: string[] = [];
  bea.on("console", (message) => {
    if (message.type() === "error") beaErrors.push(message.text());
  });
  try {
    await bea.goto(inviteUrl);
    await bea.getByRole("link", { name: "Sign up" }).click();
    await bea.getByRole("textbox", { name: "Name" }).fill("Bea Member");
    await bea.getByRole("textbox", { name: "Email" }).fill(beaEmail);
    await bea.getByLabel("Password").fill("long-password-1");
    await bea.getByRole("button", { name: "Sign up" }).click();
    await expect(bea).toHaveURL(inviteUrl, { timeout: AUTH_NAVIGATION_TIMEOUT_MS });
    await bea.getByRole("button", { name: `Join ${organization.name}` }).click();
    await expect(bea).toHaveURL(`/crm/${organization.slug}`);

    // Bea keeps her panel open on Chats so her sync runs at the fast rate.
    await bea.getByTestId("chat-footer-chats").click();
    await expect(bea.getByText("No conversations yet")).toBeVisible();

    // Ada: Contacts lists Bea with an online dot; clicking opens the direct conversation.
    await page.reload();
    await page.getByTestId("chat-footer-contacts").click();
    const beaRow = page.getByTestId("chat-contact-row").filter({ hasText: "Bea Member" });
    await expect(beaRow).toBeVisible({ timeout: 10_000 });
    await expect(beaRow.locator(".chat-presence-available")).toBeVisible({ timeout: 10_000 });
    await beaRow.click();
    await expect(page.getByTestId("chat-conversation-title")).toHaveText("Bea Member");

    // Ada sends; Bea sees the row, the preview and the unread badge within 5 s.
    await page.getByTestId("chat-composer-input").fill("Hello Bea");
    await page.getByTestId("chat-composer-input").press("Enter");
    await expect(page.getByTestId("chat-message").filter({ hasText: "Hello Bea" })).toBeVisible();
    const beaChatRow = bea.getByTestId("chat-conversation-row").filter({ hasText: "Hello Bea" });
    await expect(beaChatRow).toBeVisible({ timeout: 5_000 });
    await expect(bea.getByTestId("chat-row-unread-badge")).toContainText("1");
    await expect(bea.getByTestId("chat-footer-chats")).toContainText("1");
    await bea.screenshot({ path: join(screenshotDir, "chat-live-unread.png") });

    // Bea opens it: the message shows and the badges clear.
    await beaChatRow.click();
    await expect(bea.getByTestId("chat-message").filter({ hasText: "Hello Bea" })).toBeVisible();
    await expect(bea.getByTestId("chat-conversation-title")).toHaveText("Ada Admin");
    await bea.getByTestId("chat-conversation-back").click();
    await expect(bea.getByTestId("chat-row-unread-badge")).toHaveCount(0, { timeout: 5_000 });
    await expect(bea.getByTestId("chat-footer-chats")).not.toContainText("1");
    await bea.getByTestId("chat-conversation-row").click();
    await bea.screenshot({ path: join(screenshotDir, "chat-live-conversation.png") });

    // Bea replies; Ada sees it live.
    await bea.getByTestId("chat-composer-input").fill("Hi Ada");
    await bea.getByTestId("chat-composer-input").press("Enter");
    await expect(page.getByTestId("chat-message").filter({ hasText: "Hi Ada" })).toBeVisible({
      timeout: 5_000,
    });

    // Ada edits her message; Bea sees the new text with the edited marker.
    const adaMessage = page.getByTestId("chat-message").filter({ hasText: "Hello Bea" });
    await adaMessage.hover();
    await adaMessage.getByTestId("chat-action-edit").click();
    await page.getByTestId("chat-edit-input").fill("Hello Bea, welcome");
    await page.getByTestId("chat-edit-input").press("Enter");
    const beaEdited = bea.getByTestId("chat-message").filter({ hasText: "Hello Bea, welcome" });
    await expect(beaEdited).toBeVisible({ timeout: 5_000 });
    await expect(beaEdited).toContainText("(edited)");

    // Ada deletes it after confirming; Bea sees the placeholder.
    await adaMessage.hover();
    await adaMessage.getByTestId("chat-action-delete").click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(bea.getByTestId("chat-message-deleted")).toBeVisible({ timeout: 5_000 });
    await expect(bea.getByText("Hello Bea, welcome")).toHaveCount(0);

    // Presence: Bea changes status; Ada sees it on the contact dot through the header menu.
    await bea.getByTestId("chat-presence-trigger").click();
    await bea.getByTestId("chat-presence-busy").click();
    await expect(bea.getByTestId("chat-presence-trigger")).toContainText("Busy");
    await page.getByTestId("chat-conversation-back").click();
    await expect(page.getByTestId("chat-contact-row").locator(".chat-presence-busy")).toBeVisible({
      timeout: 10_000,
    });

    expect(beaErrors).toEqual([]);
  } finally {
    await beaContext.close();
  }
});
