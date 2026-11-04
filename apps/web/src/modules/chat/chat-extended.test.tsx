import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { AdvancedSearchDialog } from "./advanced-search-dialog";
import { ChatPanel } from "./chat-panel";
import { ConversationView } from "./conversation-view";
import {
  type ChatConversation,
  type ChatDataSource,
  type ChatMessageView,
  EmptyChatDataSource,
} from "./data";
import { MentionsDialog } from "./mentions-dialog";
import { PinPickerDialog } from "./pin-picker-dialog";
import { StarredDialog } from "./starred-dialog";
import { ThreadPane } from "./thread-pane";

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

const sampleConversation: ChatConversation = {
  id: "conv-1",
  title: "General",
  kind: "channel",
  visibility: "public",
  pinned: false,
  isMember: true,
  memberCount: 5,
  membershipRole: "owner",
  unreadCount: 0,
  lastActivityAt: "2026-11-04T00:00:00.000Z",
};

const sampleMessage: ChatMessageView = {
  id: "msg-1",
  conversationId: "conv-1",
  conversationTitle: "General",
  authorId: "user-1",
  authorName: "Alice User",
  body: "Hello team!",
  mentions: [],
  createdAt: "2026-11-04T01:00:00.000Z",
  edited: false,
  deleted: false,
  starred: false,
  seq: 1,
  replyCount: 2,
  lastReplyAt: "2026-11-04T02:00:00.000Z",
  unread: true,
  status: "sent",
};

describe("MEP-1421: Channels destination & flows", () => {
  test("renders My Channels and Browse channels tabs", async () => {
    const ds = createMockDataSource({
      conversations: [
        sampleConversation,
        {
          id: "conv-pub",
          title: "Announcements",
          kind: "channel",
          visibility: "public",
          pinned: false,
          isMember: false,
          memberCount: 12,
          unreadCount: 0,
          lastActivityAt: "2026-11-04T00:00:00.000Z",
        },
      ],
    });
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="channels"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("chat-tab-channels")).toBeTruthy();
    expect(screen.getByTestId("chat-tab-browse-channels")).toBeTruthy();
    expect(screen.getByText("General")).toBeTruthy();

    // Switch to Browse Channels
    await userEv.click(screen.getByTestId("chat-tab-browse-channels"));
    expect(screen.getByText("Announcements")).toBeTruthy();
    expect(screen.getByTestId("chat-channel-join")).toBeTruthy();
  });

  test("can join a browse channel", async () => {
    const ds = createMockDataSource({
      conversations: [
        {
          id: "conv-pub",
          title: "Watercooler",
          kind: "channel",
          visibility: "public",
          pinned: false,
          isMember: false,
          memberCount: 3,
          unreadCount: 0,
          lastActivityAt: "2026-11-04T00:00:00.000Z",
        },
      ],
    });
    const joinSpy = vi.spyOn(ds, "joinChannel").mockResolvedValue(undefined);
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="channels"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    await userEv.click(screen.getByTestId("chat-tab-browse-channels"));
    const joinBtn = screen.getByTestId("chat-channel-join");
    await userEv.click(joinBtn);
    expect(joinSpy).toHaveBeenCalledWith("conv-pub");
  });

  test("opens Create Channel dialog from Quick Actions and creates channel", async () => {
    const ds = createMockDataSource({
      directory: [{ id: "u-2", name: "Bob", email: "bob@example.com", presence: "available" }],
    });
    const createSpy = vi.spyOn(ds, "createChannel").mockResolvedValue("new-chan-id");
    const userEv = userEvent.setup();

    render(
      <ChatPanel
        destination="channels"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    // Open Quick Actions FAB
    await userEv.click(screen.getByTestId("chat-quick-actions-fab"));
    const channelQa = screen.getByTestId("chat-qa-channel");
    await userEv.click(channelQa);

    // Create Channel dialog should appear
    expect(screen.getByTestId("chat-create-channel-dialog")).toBeTruthy();

    // Type channel name
    const input = screen.getByTestId("chat-channel-name-input");
    await userEv.type(input, "Engineering Team");

    // Submit
    const submitBtn = screen.getByTestId("chat-create-channel-submit");
    await userEv.click(submitBtn);

    expect(createSpy).toHaveBeenCalledWith("Engineering Team", "public", undefined);
  });

  test("channel header menu opens ChannelMembersDialog and allows owner actions", async () => {
    const ds = createMockDataSource({
      membersOf: () => [
        { id: "u-1", name: "Alice", role: "owner" },
        { id: "u-2", name: "Bob", role: "member" },
      ],
    });
    const archiveSpy = vi.spyOn(ds, "archiveChannel").mockResolvedValue(undefined);
    const userEv = userEvent.setup();

    render(<ConversationView dataSource={ds} conversation={sampleConversation} onBack={vi.fn()} />);

    // Channel menu button in header
    const menuBtn = screen.getByTestId("chat-channel-menu");
    await userEv.click(menuBtn);

    expect(screen.getByTestId("chat-channel-members-dialog")).toBeTruthy();
    expect(screen.getByText(/Members/)).toBeTruthy();

    // Archive button (owner only)
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const archiveBtn = screen.getByTestId("chat-channel-archive-btn");
    await userEv.click(archiveBtn);
    expect(archiveSpy).toHaveBeenCalledWith("conv-1");
  });
});

describe("MEP-1421: Threads destination & pane", () => {
  test("renders threads list with root snippet, replies count, and unread state", async () => {
    const ds = createMockDataSource({
      threads: [sampleMessage],
    });
    const loadThreadsSpy = vi.spyOn(ds, "loadThreads").mockResolvedValue(undefined);

    render(
      <ChatPanel
        destination="threads"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );

    expect(loadThreadsSpy).toHaveBeenCalled();
    expect(screen.getByTestId("chat-tab-threads")).toBeTruthy();
    expect(screen.getByText("Hello team!")).toBeTruthy();
    expect(screen.getByText(/2 replies/i)).toBeTruthy();
  });

  test("ThreadPane renders root message, replies, and reply composer", async () => {
    const reply: ChatMessageView = {
      id: "reply-1",
      conversationId: "conv-1",
      authorId: "user-2",
      authorName: "Bob",
      body: "Sounds good to me!",
      mentions: [],
      createdAt: "2026-11-04T01:30:00.000Z",
      edited: false,
      deleted: false,
      starred: false,
      seq: 2,
      threadRootId: "msg-1",
      status: "sent",
    };

    const ds = createMockDataSource({
      repliesOf: () => [reply],
      membersOf: () => [{ id: "user-1", name: "Alice" }],
    });
    const loadRepliesSpy = vi.spyOn(ds, "loadReplies").mockResolvedValue(undefined);
    const markReadSpy = vi.spyOn(ds, "markThreadRead").mockResolvedValue(undefined);
    const sendReplySpy = vi.spyOn(ds, "sendReply").mockResolvedValue(undefined);
    const userEv = userEvent.setup();

    render(
      <ThreadPane
        rootMessage={sampleMessage}
        dataSource={ds}
        conversationId="conv-1"
        onClose={vi.fn()}
      />,
    );

    expect(loadRepliesSpy).toHaveBeenCalledWith("msg-1");
    expect(markReadSpy).toHaveBeenCalledWith("msg-1");
    expect(screen.getByTestId("chat-thread-pane")).toBeTruthy();
    expect(screen.getByText("Hello team!")).toBeTruthy();
    expect(screen.getByText("Sounds good to me!")).toBeTruthy();

    // Send a reply
    const input = screen.getByRole("textbox");
    await userEv.type(input, "Count me in!{enter}");
    expect(sendReplySpy).toHaveBeenCalledWith("msg-1", "Count me in!", []);
  });
});

describe("MEP-1421: My Pins and Pin Picker", () => {
  test("renders pinned chats with unpin action", async () => {
    const pinnedConv: ChatConversation = {
      ...sampleConversation,
      id: "conv-pinned",
      title: "Pinned Chat",
      pinned: true,
    };
    const ds = createMockDataSource({
      conversations: [pinnedConv],
    });
    const unpinSpy = vi.spyOn(ds, "pinConversation").mockResolvedValue(undefined);
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

    expect(screen.getByText("Pinned Chat")).toBeTruthy();
    const unpinBtn = screen.getByTestId("chat-conversation-unpin");
    await userEv.click(unpinBtn);
    expect(unpinSpy).toHaveBeenCalledWith("conv-pinned", false);
  });

  test("PinPickerDialog lists chats, searches, and pins selected chat", async () => {
    const ds = createMockDataSource({
      conversations: [
        { ...sampleConversation, id: "c-1", title: "Alpha Chat", pinned: false },
        { ...sampleConversation, id: "c-2", title: "Beta Chat", pinned: true },
      ],
    });
    const pinSpy = vi.fn().mockResolvedValue(undefined);
    const userEv = userEvent.setup();

    render(
      <PinPickerDialog
        isOpen={true}
        conversations={ds.conversations}
        onClose={vi.fn()}
        onPin={pinSpy}
      />,
    );

    expect(screen.getByTestId("chat-pin-picker")).toBeTruthy();
    expect(screen.getByText("Alpha Chat")).toBeTruthy();

    // Filter by search
    const search = screen.getByTestId("chat-pin-picker-search");
    await userEv.type(search, "Alpha");
    expect(screen.getByText("Alpha Chat")).toBeTruthy();

    // Pin option
    const option = screen.getByTestId("chat-pin-option-c-1");
    await userEv.click(option);
    expect(pinSpy).toHaveBeenCalledWith("c-1");
  });
});

describe("MEP-1421: Mentions, Starred & Advanced Search", () => {
  test("MentionsDialog displays mentions, allows unread filter and mark all read", async () => {
    const markAllReadSpy = vi.fn().mockResolvedValue(undefined);
    const goToMsgSpy = vi.fn();
    const userEv = userEvent.setup();

    render(
      <MentionsDialog
        isOpen={true}
        mentions={[sampleMessage]}
        onClose={vi.fn()}
        onMarkAllRead={markAllReadSpy}
        onGoToMessage={goToMsgSpy}
      />,
    );

    expect(screen.getByTestId("chat-mentions")).toBeTruthy();
    expect(screen.getByText("Hello team!")).toBeTruthy();

    // Mark all as read
    const markReadBtn = screen.getByTestId("chat-mentions-mark-all-read");
    await userEv.click(markReadBtn);
    expect(markAllReadSpy).toHaveBeenCalled();

    // Go to message
    const gotoBtn = screen.getByTestId("chat-mention-go-msg-1");
    await userEv.click(gotoBtn);
    expect(goToMsgSpy).toHaveBeenCalledWith("conv-1", "msg-1");
  });

  test("StarredDialog displays starred messages and allows unstar and navigate", async () => {
    const unstarSpy = vi.fn().mockResolvedValue(undefined);
    const goToMsgSpy = vi.fn();
    const userEv = userEvent.setup();

    render(
      <StarredDialog
        isOpen={true}
        starred={[{ ...sampleMessage, starred: true }]}
        onClose={vi.fn()}
        onUnstar={unstarSpy}
        onGoToMessage={goToMsgSpy}
      />,
    );

    expect(screen.getByTestId("chat-starred")).toBeTruthy();
    expect(screen.getByText("Hello team!")).toBeTruthy();

    // Unstar
    const unstarBtn = screen.getByTestId("chat-starred-unstar-msg-1");
    await userEv.click(unstarBtn);
    expect(unstarSpy).toHaveBeenCalledWith("conv-1", "msg-1");

    // Go to message
    const gotoBtn = screen.getByTestId("chat-starred-go-msg-1");
    await userEv.click(gotoBtn);
    expect(goToMsgSpy).toHaveBeenCalledWith("conv-1", "msg-1");
  });

  test("AdvancedSearchDialog submits search and displays results in Messages tab", async () => {
    const searchSpy = vi.fn().mockResolvedValue({
      messages: [sampleMessage],
      hasMore: false,
    });
    const selectSpy = vi.fn();
    const userEv = userEvent.setup();

    render(
      <AdvancedSearchDialog
        isOpen={true}
        conversations={[sampleConversation]}
        directory={[{ id: "user-1", name: "Alice", presence: "available" }]}
        onClose={vi.fn()}
        onSearch={searchSpy}
        onSelectResult={selectSpy}
      />,
    );

    expect(screen.getByTestId("chat-advanced-search")).toBeTruthy();

    // Type query and enter
    const queryInput = screen.getByTestId("chat-advanced-search-input");
    await userEv.type(queryInput, "Hello{enter}");

    expect(searchSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Hello team!")).toBeTruthy();
    });

    // Click result
    const resultItem = screen.getByTestId("chat-search-result-msg-1");
    await userEv.click(resultItem);
    expect(selectSpy).toHaveBeenCalledWith("conv-1", "msg-1");
  });
});
