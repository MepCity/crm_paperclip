import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { AUTH_NAVIGATION_TIMEOUT_MS, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// Match reference CRM capture resolution: 1470x835 @ 2x = 2940x1670 px
test.use({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });

test("chat bottom bar, panel destinations, empty states, quick actions and invite dialog work", async ({
  page,
}) => {
  const screenshotDir = join(process.cwd(), "test-results", "chat-screenshots");
  await mkdir(screenshotDir, { recursive: true });

  await signUpNewUser(page, { name: "Test User" });
  await createOrganization(page, "Acme Corp");

  // Switch to "tr" locale to match reference CRM capture environment (Screen QA standard)
  const pinned = await page.request.put("/api/personal-settings/language", {
    headers: { Origin: new URL(page.url()).origin },
    data: { language: "tr" },
  });
  expect(pinned.ok()).toBe(true);
  await page.reload();

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
  await expect(
    panel.getByText(
      /Start a conversation with your team members|İnsanlar ve ekiplerle yaptığınız görüşmeler/,
    ),
  ).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-chats.png") });

  // Switch to Unread tab
  await page.getByTestId("chat-tab-unread").click();
  await expect(page.getByTestId("chat-unread-empty")).toBeVisible();
  await expect(panel.getByText("No unread chats")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-unread.png") });

  // Switch back to Recent tab
  await page.getByTestId("chat-tab-recent").click();
  await expect(
    panel.getByText(
      /Start a conversation with your team members|İnsanlar ve ekiplerle yaptığınız görüşmeler/,
    ),
  ).toBeVisible();

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
    inviteDialog.getByText(/An invitation will be sent|davet gönderilecek/i),
  ).toBeVisible();

  // Verify no extra trigger button is visible outside the dialog (P1 regression guard)
  await expect(page.getByRole("button", { name: "Invite People" })).toHaveCount(0);

  await page.screenshot({ path: join(screenshotDir, "chat-invite.png") });

  // Cancel closes invite dialog
  await page.getByTestId("chat-invite-cancel").click();
  await expect(inviteDialog).toBeHidden();

  // 7b. Open Group picker from Quick Actions (MEP-1433)
  await page.getByTestId("chat-quick-actions-fab").click();
  await page.getByTestId("chat-qa-group").click();
  const groupPickerDialog = page.getByTestId("chat-picker-dialog");
  await expect(groupPickerDialog).toBeVisible();
  await expect(
    groupPickerDialog.getByText(
      /Select users to create a group chat|Grup sohbeti oluşturmak için kullanıcı seçin/i,
    ),
  ).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "chat-group-picker.png") });
  await page.keyboard.press("Escape");
  await expect(groupPickerDialog).toBeHidden();

  // 8. Presence menu
  await page.getByTestId("chat-presence-trigger").click();
  const presenceMenu = page.getByTestId("chat-presence-menu");
  await expect(presenceMenu).toBeVisible();
  await page.getByTestId("chat-presence-away").click();
  await expect(presenceMenu).toBeHidden();
  await expect(panel.getByText(/Away|Uzakta/)).toBeVisible();

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
  await page.goto(`/crm/${organization.slug}/settings/users`);
  const beaEmail = `bea-${crypto.randomUUID()}@example.test`;
  await page.getByRole("button", { name: "New User" }).click();
  const inviteDialog = page.getByRole("dialog", { name: "Invite member" });
  await inviteDialog.getByRole("textbox", { name: "Email" }).fill(beaEmail);
  await inviteDialog.getByRole("button", { name: "Create invitation" }).click();
  const inviteUrl = (await inviteDialog.getByText(/\/invite\//).innerText()).trim();
  await inviteDialog.getByRole("button", { name: "Close" }).click();

  const beaContext = await browser.newContext({
    viewport: { width: 1470, height: 835 },
    deviceScaleFactor: 2,
  });
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
    await expect(
      bea.getByText("Start a conversation with your team members or create a channel."),
    ).toBeVisible();

    // Ada: Contacts lists Bea with an online dot; clicking opens the direct conversation.
    await page.reload();
    await page.getByTestId("chat-footer-contacts").click();
    const beaRow = page.getByTestId("chat-contact-row").filter({ hasText: "Bea Member" });
    await expect(beaRow).toBeVisible({ timeout: 10_000 });
    await expect(beaRow.locator(".chat-presence-available")).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: join(screenshotDir, "chat-contacts-live.png") });
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

    // 1. Channel scenario: User A creates a public channel; User B browses, joins and posts a message; User A sees it.
    await page.getByTestId("chat-footer-channels").click();
    await expect(page.getByTestId("chat-channels-empty")).toBeVisible();
    await page.getByTestId("chat-create-channel-btn").click();
    const createChannelDialog = page.getByTestId("chat-create-channel-dialog");
    await expect(createChannelDialog).toBeVisible();

    await page.getByTestId("chat-channel-name-input").fill("general-public");
    await expect(page.getByTestId("chat-channel-public-radio")).toBeChecked();
    await page.getByTestId("chat-create-channel-submit").click();
    await expect(createChannelDialog).toBeHidden();

    // Ada's conversation view for the new public channel opens
    await expect(page.getByTestId("chat-conversation")).toBeVisible();
    await expect(page.getByTestId("chat-conversation-title")).toContainText("general-public");

    // Bea opens Channels -> Browse channels, sees general-public and joins
    await bea.getByTestId("chat-footer-channels").click();
    await bea.getByTestId("chat-tab-browse-channels").click();
    const browseChannelRow = bea
      .getByTestId("chat-browse-channel-list")
      .locator("li")
      .filter({ hasText: "general-public" });
    await expect(browseChannelRow).toBeVisible({ timeout: 10_000 });
    await browseChannelRow.getByTestId("chat-channel-join").click();

    // Bea's conversation view opens for the joined channel
    await expect(bea.getByTestId("chat-conversation")).toBeVisible();
    await expect(bea.getByTestId("chat-conversation-title")).toContainText("general-public");

    // Bea posts a message in the channel; Ada sees it live
    await bea.getByTestId("chat-composer-input").fill("Hello everyone in general-public!");
    await bea.getByTestId("chat-composer-input").press("Enter");
    await expect(
      bea.getByTestId("chat-message").filter({ hasText: "Hello everyone in general-public!" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("chat-message").filter({ hasText: "Hello everyone in general-public!" }),
    ).toBeVisible({ timeout: 10_000 });

    // 2. Starred scenario: User A stars a message -> opens Starred dialog -> message is listed; unstar -> empty state.
    const messageToStar = page
      .getByTestId("chat-message")
      .filter({ hasText: "Hello everyone in general-public!" });
    await messageToStar.hover();
    await messageToStar.getByTestId("chat-action-star").click();
    await expect(messageToStar.getByTestId("chat-action-star")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Back to list to access header controls (search/mentions/starred row)
    await page.getByTestId("chat-conversation-back").click();
    await expect(page.getByTestId("chat-starred-btn")).toBeVisible();
    await page.getByTestId("chat-starred-btn").click();

    const starredDialog = page.getByTestId("chat-starred");
    await expect(starredDialog).toBeVisible();
    await expect(starredDialog.getByText("Hello everyone in general-public!")).toBeVisible();

    // Unstar the message -> dialog switches to empty state
    await starredDialog.locator("[data-testid^='chat-starred-unstar-']").click();
    await expect(starredDialog.locator("[data-testid^='chat-starred-item-']")).toHaveCount(0, {
      timeout: 5_000,
    });
    await expect(
      starredDialog.getByText(/Star important messages|Önemli mesajları/i),
    ).toBeVisible();
    await page.getByTestId("chat-starred-close").click();
    await expect(starredDialog).toBeHidden();

    // 3. Mentions scenario: User B mentions user A in a message -> user A opens Mentions dialog -> message is listed; Go to Message opens conversation.
    await bea.getByTestId("chat-composer-input").fill("@Ada");
    const mentionOption = bea.getByTestId("chat-mention-option").filter({ hasText: "Ada Admin" });
    await expect(mentionOption).toBeVisible({ timeout: 5_000 });
    await mentionOption.click();
    await bea.getByTestId("chat-composer-input").pressSequentially("check out the updates");
    await bea.getByTestId("chat-composer-input").press("Enter");
    await expect(
      bea.getByTestId("chat-message").filter({ hasText: "check out the updates" }),
    ).toBeVisible();

    // Ada opens Mentions dialog
    await page.getByTestId("chat-mentions-btn").click();
    const mentionsDialog = page.getByTestId("chat-mentions");
    await expect(mentionsDialog).toBeVisible();
    await expect(mentionsDialog.getByText("check out the updates")).toBeVisible({
      timeout: 10_000,
    });

    // Click Go to Message -> Mentions dialog closes and the conversation opens
    await mentionsDialog.locator("[data-testid^='chat-mention-go-']").click();
    await expect(mentionsDialog).toBeHidden();
    await expect(page.getByTestId("chat-conversation")).toBeVisible();
    await expect(page.getByTestId("chat-conversation-title")).toContainText("general-public");
    await expect(
      page.getByTestId("chat-message").filter({ hasText: "check out the updates" }),
    ).toBeVisible();

    // 4. Advanced search scenario: query a word from a sent message -> result appears under Messages; clicking it opens the conversation.
    await page.getByTestId("chat-conversation-back").click();
    await expect(page.getByTestId("chat-advanced-search-btn")).toBeVisible();
    await page.getByTestId("chat-advanced-search-btn").click();

    const searchModal = page.getByTestId("chat-advanced-search");
    await expect(searchModal).toBeVisible();

    await page.getByTestId("chat-advanced-search-input").fill("updates");
    await page.getByTestId("chat-advanced-search-submit").click();

    const searchResult = searchModal
      .locator("[data-testid^='chat-search-result-']")
      .filter({ hasText: "updates" });
    await expect(searchResult).toBeVisible({ timeout: 5_000 });

    // Clicking search result closes modal and opens the conversation
    await searchResult.click();
    await expect(searchModal).toBeHidden();
    await expect(page.getByTestId("chat-conversation")).toBeVisible();
    await expect(page.getByTestId("chat-conversation-title")).toContainText("general-public");
    await expect(
      page.getByTestId("chat-message").filter({ hasText: "check out the updates" }),
    ).toBeVisible();

    expect(beaErrors).toEqual([]);
  } finally {
    await beaContext.close();
  }
});

test("channels, threads, pins, mentions, starred and advanced search dialogs work", async ({
  page,
}) => {
  const screenshotDir = join(process.cwd(), "test-results", "chat-screenshots");
  await mkdir(screenshotDir, { recursive: true });

  await signUpNewUser(page, { name: "Channel Tester" });
  await createOrganization(page, "Chat Features Org");

  const panel = page.getByTestId("chat-panel");

  // 1. Open channels destination
  await page.getByTestId("chat-footer-channels").click();
  await expect(panel).toBeVisible();
  await expect(page.getByTestId("chat-channels-empty")).toBeVisible();

  // Create channel from empty state button
  await page.getByTestId("chat-create-channel-btn").click();
  const createChannelDialog = page.getByTestId("chat-create-channel-dialog");
  await expect(createChannelDialog).toBeVisible();

  // Fill channel name and submit
  await page.getByTestId("chat-channel-name-input").fill("general-discussion");
  await page.getByTestId("chat-create-channel-submit").click();
  await expect(createChannelDialog).toBeHidden();

  // Conversation view for the new channel opens
  await expect(page.getByTestId("chat-conversation")).toBeVisible();
  await expect(page.getByTestId("chat-conversation-title")).toContainText("general-discussion");

  // Send a root message in the channel
  await page.getByTestId("chat-composer-input").fill("Root channel announcement");
  await page.getByTestId("chat-composer-input").press("Enter");
  const rootMsg = page.getByTestId("chat-message").filter({ hasText: "Root channel announcement" });
  await expect(rootMsg).toBeVisible();

  // Reply in thread
  await rootMsg.hover();
  await rootMsg.getByTestId("chat-action-reply").click();
  const threadPane = page.getByTestId("chat-thread-pane");
  await expect(threadPane).toBeVisible();
  await expect(threadPane.getByText("Root channel announcement")).toBeVisible();

  // Send reply in thread
  await threadPane.getByRole("textbox").fill("First thread reply");
  await threadPane.getByRole("textbox").press("Enter");
  await expect(threadPane.getByText("First thread reply")).toBeVisible();

  // Close thread pane
  await threadPane.getByTestId("chat-thread-close").click();
  await expect(threadPane).toBeHidden();

  // Verify reply count under root message
  await expect(rootMsg.getByTestId("chat-thread-trigger")).toContainText("1");

  // Pin the channel from conversation header
  await page.getByTestId("chat-conversation-pin").click();

  // Back to list
  await page.getByTestId("chat-conversation-back").click();

  // Switch to My Pins: channel is listed with unpin button
  await page.getByTestId("chat-footer-pins").click();
  await expect(
    page.getByTestId("chat-conversation-row").filter({ hasText: "general-discussion" }),
  ).toBeVisible();
  await expect(page.getByTestId("chat-conversation-unpin")).toBeVisible();

  // Switch to Threads destination: the thread is listed
  await page.getByTestId("chat-footer-threads").click();
  await expect(page.getByTestId("chat-threads-list")).toBeVisible();
  await expect(page.getByText("Root channel announcement")).toBeVisible();

  // Open Mentions dialog
  await page.getByTestId("chat-mentions-btn").click();
  const mentionsDialog = page.getByTestId("chat-mentions");
  await expect(mentionsDialog).toBeVisible();
  const hideBroadcastCheckbox = page.getByTestId("chat-mentions-hide-broadcast");
  await expect(hideBroadcastCheckbox).toBeVisible();
  await expect(hideBroadcastCheckbox).not.toBeChecked();
  await page.screenshot({ path: join(screenshotDir, "chat-mentions.png") });
  await page.getByTestId("chat-mentions-close").click();
  await expect(mentionsDialog).toBeHidden();

  // Open Starred dialog
  await page.getByTestId("chat-starred-btn").click();
  const starredDialog = page.getByTestId("chat-starred");
  await expect(starredDialog).toBeVisible();
  await page.getByTestId("chat-starred-close").click();
  await expect(starredDialog).toBeHidden();

  // Open Advanced search dialog
  await page.getByTestId("chat-advanced-search-btn").click();
  const searchModal = page.getByTestId("chat-advanced-search");
  await expect(searchModal).toBeVisible();
  await page.getByTestId("chat-advanced-search-close").click();
  await expect(searchModal).toBeHidden();
});
