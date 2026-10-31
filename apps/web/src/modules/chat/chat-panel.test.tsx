import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { InvitationActionState } from "@/components/members/invitation-state";
import { ChatBottomBar } from "@/components/shell/chat-bottom-bar";
import { render } from "@/test/render";
import { ChatPanel } from "./chat-panel";
import { type ChatDataSource, EmptyChatDataSource } from "./data";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const user = { name: "Current User", initials: "CU" };

function createMockDataSource(overrides?: Partial<ChatDataSource>): ChatDataSource {
  const ds = new EmptyChatDataSource();
  ds.canInvite = true;
  if (overrides) {
    Object.assign(ds, overrides);
  }
  return ds;
}

describe("ChatPanel", () => {
  test("renders header with user identity, presence dot and initial status", () => {
    const ds = createMockDataSource();
    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Current User")).toBeTruthy();
    expect(screen.getByText("CU")).toBeTruthy();
    expect(screen.getByTestId("chat-presence-trigger")).toBeTruthy();
    expect(screen.getByText("Available")).toBeTruthy();
  });

  test("toggles presence menu and updates status when clicked", async () => {
    const ds = createMockDataSource();
    const setPresenceSpy = vi.spyOn(ds, "setPresence");
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    // Open presence menu
    await userEv.click(screen.getByTestId("chat-presence-trigger"));
    expect(screen.getByTestId("chat-presence-menu")).toBeTruthy();

    // Select 'busy'
    await userEv.click(screen.getByTestId("chat-presence-busy"));
    expect(setPresenceSpy).toHaveBeenCalledWith("busy");
    expect(screen.getByText("Busy")).toBeTruthy();
    expect(screen.queryByTestId("chat-presence-menu")).toBeNull();
  });

  test("toggles maximize mode when enlarge button or backdrop is clicked", async () => {
    const ds = createMockDataSource();
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    const panel = screen.getByTestId("chat-panel");
    expect(panel.className).not.toContain("chat-panel-maximized");

    // Click maximize
    await userEv.click(screen.getByTestId("chat-maximize"));
    expect(panel.className).toContain("chat-panel-maximized");

    // Click backdrop to restore
    const backdrop = document.querySelector(".chat-panel-backdrop");
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      await userEv.click(backdrop);
    }
    expect(panel.className).not.toContain("chat-panel-maximized");
  });

  test("calls onClose when minimize button is clicked", async () => {
    const ds = createMockDataSource();
    const onClose = vi.fn();
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={onClose}
        onDestinationChange={vi.fn()}
      />,
    );

    await userEv.click(screen.getByTestId("chat-minimize"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("switches between primary tab and unread tab", async () => {
    const ds = createMockDataSource();
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No conversations yet")).toBeTruthy();
    expect(screen.queryByTestId("chat-unread-empty")).toBeNull();

    // Click Unread tab
    await userEv.click(screen.getByTestId("chat-tab-unread"));
    expect(screen.getByTestId("chat-unread-empty")).toBeTruthy();
    expect(screen.getByText("No unread chats")).toBeTruthy();

    // Click Recent tab
    await userEv.click(screen.getByTestId("chat-tab-recent"));
    expect(screen.getByText("No conversations yet")).toBeTruthy();
    expect(screen.queryByTestId("chat-unread-empty")).toBeNull();
  });

  test("renders My Pins empty state and handles +Add Chats", async () => {
    const ds = createMockDataSource();
    const startDirectSpy = vi.spyOn(ds.actions, "startDirectMessage");
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="pins"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("chat-pins-empty")).toBeTruthy();
    expect(screen.getByText("No pinned chats")).toBeTruthy();
    const addChatsBtn = screen.getByTestId("chat-add-chats");
    expect(addChatsBtn).toBeTruthy();

    await userEv.click(addChatsBtn);
    expect(startDirectSpy).toHaveBeenCalledTimes(1);
  });

  test("renders Contacts empty state and category dropdown", async () => {
    const ds = createMockDataSource();
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="contacts"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("chat-contacts-empty")).toBeTruthy();
    expect(screen.getByText("No contacts found")).toBeTruthy();

    // Open category dropdown
    await userEv.click(screen.getByTestId("chat-category-caret"));
    expect(screen.getByTestId("chat-contact-categories")).toBeTruthy();

    // Switch to Recent
    await userEv.click(screen.getByTestId("chat-category-recent"));
    expect(screen.queryByTestId("chat-contact-categories")).toBeNull();
  });

  test("shows Invite row in Contacts when searching an email address", async () => {
    const ds = createMockDataSource();
    const inviteAction = vi.fn(async (): Promise<InvitationActionState> => ({ status: "idle" }));
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="contacts"
        user={user}
        dataSource={ds}
        inviteAction={inviteAction}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    const searchInput = screen.getByTestId("chat-search");
    await userEv.type(searchInput, "someone@company.test");

    const inviteRow = screen.getByTestId("chat-email-invite-row");
    expect(inviteRow).toBeTruthy();
    expect(inviteRow.textContent).toContain("someone@company.test");

    // Click invite row -> opens Invite dialog with prefilled email
    await userEv.click(inviteRow);
    const dialog = screen.getByTestId("chat-invite-dialog");
    expect(dialog).toBeTruthy();
    const emailField = within(dialog).getByRole("textbox", { name: "Email Address" });
    expect((emailField as HTMLInputElement).value).toBe("someone@company.test");

    // Cancel closes dialog
    await userEv.click(screen.getByTestId("chat-invite-cancel"));
    expect(screen.queryByTestId("chat-invite-dialog")).toBeNull();
  });

  test("opens Quick Actions menu and calls action stubs", async () => {
    const ds = createMockDataSource();
    const startDirectSpy = vi.spyOn(ds.actions, "startDirectMessage");
    const startGroupSpy = vi.spyOn(ds.actions, "startGroupConversation");
    const createChannelSpy = vi.spyOn(ds.actions, "createChannel");
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    // Click Quick Actions FAB
    const fab = screen.getByTestId("chat-quick-actions-fab");
    await userEv.click(fab);

    const menu = screen.getByTestId("chat-quick-actions-menu");
    expect(menu).toBeTruthy();

    // Direct message
    await userEv.click(screen.getByTestId("chat-qa-direct"));
    expect(startDirectSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("chat-quick-actions-menu")).toBeNull();

    // Reopen and try group
    await userEv.click(fab);
    await userEv.click(screen.getByTestId("chat-qa-group"));
    expect(startGroupSpy).toHaveBeenCalledTimes(1);

    // Reopen and try channel
    await userEv.click(fab);
    await userEv.click(screen.getByTestId("chat-qa-channel"));
    expect(createChannelSpy).toHaveBeenCalledTimes(1);
  });

  test("submits Invite People dialog successfully", async () => {
    const ds = createMockDataSource();
    const inviteAction = vi.fn(
      async (): Promise<InvitationActionState> => ({
        status: "success",
        inviteUrl: "https://crm.local/invite/abc-123",
      }),
    );
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        inviteAction={inviteAction}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    // Open Quick Actions
    await userEv.click(screen.getByTestId("chat-quick-actions-fab"));
    await userEv.click(screen.getByTestId("chat-qa-invite"));

    const dialog = screen.getByTestId("chat-invite-dialog");
    expect(dialog).toBeTruthy();

    const emailInput = within(dialog).getByRole("textbox", { name: "Email Address" });
    await userEv.type(emailInput, "newuser@example.test");
    await userEv.click(within(dialog).getByRole("button", { name: "Send Invites" }));

    await waitFor(() => {
      expect(screen.getByText("Invitation sent successfully.")).toBeTruthy();
    });
    expect(screen.getByText("https://crm.local/invite/abc-123")).toBeTruthy();
  });
});

describe("ChatBottomBar", () => {
  test("renders all five footer entries and badges", () => {
    render(<ChatBottomBar user={user} counts={{ chats: 3, channels: 0, threads: 5, pins: 1 }} />);

    expect(screen.getByTestId("chat-footer-pins")).toBeTruthy();
    expect(screen.getByTestId("chat-footer-chats")).toBeTruthy();
    expect(screen.getByTestId("chat-footer-channels")).toBeTruthy();
    expect(screen.getByTestId("chat-footer-threads")).toBeTruthy();
    expect(screen.getByTestId("chat-footer-contacts")).toBeTruthy();

    // Badge values
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    // 0 is hidden
    expect(screen.queryByText("0")).toBeNull();
  });

  test("clicking a footer entry opens and closes the ChatPanel", async () => {
    const userEv = userEvent.setup();

    render(<ChatBottomBar user={user} />);

    expect(screen.queryByTestId("chat-panel")).toBeNull();

    // Click Chats
    await userEv.click(screen.getByTestId("chat-footer-chats"));
    expect(screen.getByTestId("chat-panel")).toBeTruthy();
    expect(screen.getByText("No conversations yet")).toBeTruthy();

    // Clicking Chats again toggles it closed
    await userEv.click(screen.getByTestId("chat-footer-chats"));
    expect(screen.queryByTestId("chat-panel")).toBeNull();

    // Clicking Pins opens with Pins
    await userEv.click(screen.getByTestId("chat-footer-pins"));
    expect(screen.getByTestId("chat-panel")).toBeTruthy();
    expect(screen.getByTestId("chat-pins-empty")).toBeTruthy();
  });
});
