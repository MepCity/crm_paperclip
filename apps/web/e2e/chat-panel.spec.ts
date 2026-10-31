import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
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
