import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { ChatPanel } from "./chat-panel";
import { Composer } from "./composer";
import { ConversationView } from "./conversation-view";
import {
  type ChatContact,
  type ChatConversation,
  type ChatMessageView,
  EmptyChatDataSource,
} from "./data";
import { MemberPickerDialog } from "./member-picker-dialog";
import { extractMentions, linkify } from "./text";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const SELF = "u-self";
const user = { name: "Self User", initials: "SU" };

function msg(over: Partial<ChatMessageView> & { id: string }): ChatMessageView {
  return {
    seq: 1,
    authorId: "u-peer",
    authorName: "Peer Person",
    body: "hello",
    mentions: [],
    createdAt: new Date().toISOString(),
    edited: false,
    deleted: false,
    starred: false,
    status: "sent",
    ...over,
  };
}

class FakeSource extends EmptyChatDataSource {
  override selfId = SELF;
  messages: ChatMessageView[] = [];
  members = [{ id: "u-peer", name: "Peer Person" }];
  older = false;
  readonly calls = {
    send: vi.fn<(c: string, body: string, mentions: string[]) => void>(),
    edit: vi.fn<(c: string, id: string, body: string, mentions: string[]) => Promise<void>>(
      async () => {},
    ),
    del: vi.fn<(c: string, id: string) => Promise<void>>(async () => {}),
    star: vi.fn<(c: string, id: string, star: boolean) => Promise<void>>(async () => {}),
    retry: vi.fn<(c: string, id: string) => Promise<void>>(async () => {}),
    discard: vi.fn<(c: string, id: string) => void>(),
    markRead: vi.fn<(c: string) => void>(),
    loadOlder: vi.fn<(c: string) => Promise<void>>(async () => {}),
    openDirect: vi.fn<(id: string) => Promise<string>>(async (id) => `direct-${id}`),
    createGroup: vi.fn<() => Promise<string>>(async () => "group-1"),
  };
  constructor() {
    super();
    // The views take methods off the data source (the live one is closure based).
    const self = this as unknown as Record<string, unknown>;
    for (const name of Object.getOwnPropertyNames(FakeSource.prototype)) {
      const method = self[name];
      if (name !== "constructor" && typeof method === "function") self[name] = method.bind(this);
    }
  }
  override messagesOf() {
    return this.messages;
  }
  override membersOf() {
    return this.members;
  }
  override hasOlder() {
    return this.older;
  }
  override async sendMessage(c: string, b: string, m: string[]) {
    this.calls.send(c, b, m);
  }
  override async editMessage(c: string, id: string, b: string, m: string[]) {
    await this.calls.edit(c, id, b, m);
  }
  override async deleteMessage(c: string, id: string) {
    await this.calls.del(c, id);
  }
  override async starMessage(c: string, id: string, s: boolean) {
    await this.calls.star(c, id, s);
  }
  override async retryMessage(c: string, id: string) {
    await this.calls.retry(c, id);
  }
  override discardMessage(c: string, id: string) {
    this.calls.discard(c, id);
  }
  override markRead(c: string) {
    this.calls.markRead(c);
  }
  override async loadOlder(c: string) {
    await this.calls.loadOlder(c);
  }
  override async openDirect(id: string) {
    return this.calls.openDirect(id);
  }
  override async createGroup(_n: string, _ids: string[]) {
    return this.calls.createGroup();
  }
}

const conversation: ChatConversation = {
  id: "c1",
  kind: "direct",
  title: "Peer Person",
  peerId: "u-peer",
  presence: "available",
  unreadCount: 0,
  pinned: false,
  lastActivityAt: new Date().toISOString(),
};

describe("text helpers", () => {
  test("linkify only links http(s) URLs and drops trailing punctuation", () => {
    const parts = linkify("see https://example.com/a?b=1, or javascript:alert(1)");
    expect(parts.filter((p) => p.kind === "link").map((p) => p.value)).toEqual([
      "https://example.com/a?b=1",
    ]);
    expect(parts.map((p) => p.value).join("")).toBe(
      "see https://example.com/a?b=1, or javascript:alert(1)",
    );
  });

  test("extractMentions keeps ids whose @name remains in the body", () => {
    const members = [
      { id: "a", name: "Ada Lovelace" },
      { id: "b", name: "Bob" },
    ];
    expect(extractMentions("hi @Ada Lovelace and Bob", members)).toEqual(["a"]);
  });
});

describe("Composer", () => {
  test("Enter sends the trimmed text, Shift+Enter keeps a new line, empty is ignored", async () => {
    const onSend = vi.fn();
    const ev = userEvent.setup();
    render(<Composer members={[]} onSend={onSend} />);
    const input = screen.getByTestId("chat-composer-input") as HTMLTextAreaElement;

    await ev.type(input, "{Enter}");
    expect(onSend).not.toHaveBeenCalled();

    await ev.type(input, "line one{Shift>}{Enter}{/Shift}line two");
    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("line one\nline two");

    await ev.type(input, "{Enter}");
    expect(onSend).toHaveBeenCalledWith("line one\nline two", []);
    expect(input.value).toBe("");
  });

  test("the @ picker fills mentions and Enter selects instead of sending", async () => {
    const onSend = vi.fn();
    const ev = userEvent.setup();
    render(
      <Composer
        members={[
          { id: "u1", name: "Ada Lovelace" },
          { id: "u2", name: "Bob Stone" },
        ]}
        onSend={onSend}
      />,
    );
    const input = screen.getByTestId("chat-composer-input") as HTMLTextAreaElement;
    await ev.type(input, "hi @ad");
    expect(screen.getAllByTestId("chat-mention-option")).toHaveLength(1);
    await ev.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("hi @Ada Lovelace ");
    await ev.type(input, "welcome{Enter}");
    expect(onSend).toHaveBeenCalledWith("hi @Ada Lovelace welcome", ["u1"]);
  });
});

describe("ConversationView", () => {
  test("renders day separators, edited marker, deleted placeholder and links", () => {
    const ds = new FakeSource();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    ds.messages = [
      msg({ id: "m1", createdAt: yesterday, body: "old one" }),
      msg({ id: "m2", body: "fixed", edited: true }),
      msg({ id: "m3", body: "", deleted: true }),
      msg({ id: "m4", body: "go to https://example.com now", authorId: SELF }),
    ];
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    expect(screen.getAllByTestId("chat-day-separator")).toHaveLength(2);
    expect(screen.getByText("(edited)")).toBeTruthy();
    expect(screen.getByTestId("chat-message-deleted").textContent).toBe("This message was deleted");
    const link = screen.getByRole("link", { name: "https://example.com" });
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getByText("Available")).toBeTruthy();
  });

  test("marks the conversation read when it opens at the bottom", () => {
    const ds = new FakeSource();
    ds.messages = [msg({ id: "m1" })];
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    expect(ds.calls.markRead).toHaveBeenCalledWith("c1");
  });

  test("sending goes through the data source", async () => {
    const ds = new FakeSource();
    const ev = userEvent.setup();
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    await ev.type(screen.getByTestId("chat-composer-input"), "ping{Enter}");
    expect(ds.calls.send).toHaveBeenCalledWith("c1", "ping", []);
  });

  test("own messages can be edited and deleted after confirmation; others cannot", async () => {
    const ds = new FakeSource();
    ds.messages = [
      msg({ id: "m1", authorId: "u-peer", body: "theirs" }),
      msg({ id: "m2", authorId: SELF, body: "mine" }),
    ];
    const ev = userEvent.setup();
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    expect(screen.getAllByTestId("chat-action-edit")).toHaveLength(1);
    expect(screen.getAllByTestId("chat-action-delete")).toHaveLength(1);
    expect(screen.getAllByTestId("chat-action-star")).toHaveLength(2);

    await ev.click(screen.getByTestId("chat-action-edit"));
    const editor = screen.getByTestId("chat-edit-input");
    await ev.clear(editor);
    await ev.type(editor, "mine edited{Enter}");
    expect(ds.calls.edit).toHaveBeenCalledWith("c1", "m2", "mine edited", []);

    await ev.click(screen.getByTestId("chat-action-delete"));
    expect(ds.calls.del).not.toHaveBeenCalled();
    await ev.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(ds.calls.del).toHaveBeenCalledWith("c1", "m2"));
  });

  test("star toggles through the data source", async () => {
    const ds = new FakeSource();
    ds.messages = [msg({ id: "m1", starred: false })];
    const ev = userEvent.setup();
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    await ev.click(screen.getByTestId("chat-action-star"));
    expect(ds.calls.star).toHaveBeenCalledWith("c1", "m1", true);
  });

  test("a failed message offers retry and discard", async () => {
    const ds = new FakeSource();
    ds.messages = [msg({ id: "client-1", seq: null, authorId: SELF, status: "failed" })];
    const ev = userEvent.setup();
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    expect(screen.getByText(/Message not sent/)).toBeTruthy();
    expect(screen.queryByTestId("chat-action-edit")).toBeNull();
    await ev.click(screen.getByTestId("chat-retry"));
    expect(ds.calls.retry).toHaveBeenCalledWith("c1", "client-1");
    await ev.click(screen.getByRole("button", { name: "Discard" }));
    expect(ds.calls.discard).toHaveBeenCalledWith("c1", "client-1");
  });

  test("loads older history on request", async () => {
    const ds = new FakeSource();
    ds.older = true;
    ds.messages = [msg({ id: "m1" })];
    const ev = userEvent.setup();
    render(<ConversationView dataSource={ds} conversation={conversation} onBack={vi.fn()} />);
    await ev.click(screen.getByTestId("chat-load-older"));
    expect(ds.calls.loadOlder).toHaveBeenCalledWith("c1");
  });

  test("back returns to the list", async () => {
    const onBack = vi.fn();
    const ev = userEvent.setup();
    render(
      <ConversationView
        dataSource={new FakeSource()}
        conversation={conversation}
        onBack={onBack}
      />,
    );
    await ev.click(screen.getByTestId("chat-conversation-back"));
    expect(onBack).toHaveBeenCalled();
  });
});

const people: ChatContact[] = [
  { id: "u1", name: "Ada Lovelace", email: "ada@example.test", presence: "available" },
  { id: "u2", name: "Bob Stone", email: "bob@example.test", presence: "offline" },
  { id: "u3", name: "Cleo Park", email: "cleo@example.test", presence: "away" },
];

describe("MemberPickerDialog", () => {
  test("direct mode filters by search and submits the picked member", async () => {
    const onDirect = vi.fn(async () => {});
    const onClose = vi.fn();
    const ev = userEvent.setup();
    render(
      <MemberPickerDialog
        mode="direct"
        directory={people}
        onSubmitDirect={onDirect}
        onSubmitGroup={vi.fn()}
        onClose={onClose}
      />,
    );
    await ev.type(screen.getByTestId("chat-picker-search"), "bob");
    expect(screen.getAllByTestId("chat-picker-row")).toHaveLength(1);
    await ev.click(screen.getByTestId("chat-picker-row"));
    await waitFor(() => expect(onDirect).toHaveBeenCalledWith("u2"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test("group mode needs a name and two members", async () => {
    const onGroup = vi.fn(async () => {});
    const ev = userEvent.setup();
    render(
      <MemberPickerDialog
        mode="group"
        directory={people}
        onSubmitDirect={vi.fn()}
        onSubmitGroup={onGroup}
        onClose={vi.fn()}
      />,
    );
    const create = screen.getByTestId("chat-group-create") as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    const rows = screen.getAllByTestId("chat-picker-row");
    await ev.click(rows[0] as HTMLElement);
    await ev.type(screen.getByTestId("chat-group-name"), "Team");
    expect(create.disabled).toBe(true);
    await ev.click(rows[2] as HTMLElement);
    expect(screen.getByTestId("chat-picker-count").textContent).toBe("2 selected");
    expect(create.disabled).toBe(false);
    await ev.click(create);
    await waitFor(() => expect(onGroup).toHaveBeenCalledWith("Team", ["u1", "u3"]));
  });

  test("shows an error and stays open when creating fails", async () => {
    const ev = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MemberPickerDialog
        mode="direct"
        directory={people}
        onSubmitDirect={async () => {
          throw new Error("nope");
        }}
        onSubmitGroup={vi.fn()}
        onClose={onClose}
      />,
    );
    await ev.click(screen.getAllByTestId("chat-picker-row")[0] as HTMLElement);
    expect((await screen.findByRole("alert")).textContent).toContain("Something went wrong");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ChatPanel with live data", () => {
  function panelDs() {
    const ds = new FakeSource();
    ds.conversations = [
      {
        ...conversation,
        unreadCount: 2,
        lastMessage: {
          text: "are you there?",
          timestamp: new Date().toISOString(),
          authorId: "u-peer",
          authorName: "Peer Person",
          deleted: false,
        },
      },
      { ...conversation, id: "c2", title: "Read Chat", unreadCount: 0 },
    ];
    ds.counts = { chats: 1, channels: 0, threads: 0, mentions: 0, pins: 0 };
    ds.directory = people;
    ds.frequentContacts = people;
    ds.recentContacts = [people[1] as ChatContact];
    ds.messages = [msg({ id: "m1" })];
    return ds;
  }

  test("lists chats with unread badge, filters Unread and opens a conversation", async () => {
    const ds = panelDs();
    const ev = userEvent.setup();
    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId("chat-conversation-row")).toHaveLength(2);
    expect(screen.getByText("are you there?")).toBeTruthy();
    expect(screen.getByTestId("chat-row-unread-badge").textContent).toContain("2");
    expect(screen.getByTestId("chat-tab-unread-badge").textContent).toContain("1");

    await ev.click(screen.getByTestId("chat-tab-unread"));
    expect(screen.getAllByTestId("chat-conversation-row")).toHaveLength(1);

    await ev.click(screen.getByTestId("chat-conversation-row"));
    expect(screen.getByTestId("chat-conversation-title").textContent).toBe("Peer Person");
    expect(ds.calls.markRead).toHaveBeenCalledWith("c1");
    await ev.click(screen.getByTestId("chat-conversation-back"));
    expect(screen.getByTestId("chat-conversation-list")).toBeTruthy();
  });

  test("Contacts lists members and a click opens the direct conversation", async () => {
    const ds = panelDs();
    ds.conversations = [{ ...conversation, id: "direct-u1", title: "Ada Lovelace" }];
    const ev = userEvent.setup();
    render(
      <ChatPanel
        destination="contacts"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId("chat-contact-row")).toHaveLength(3);
    await ev.click(screen.getAllByTestId("chat-contact-row")[0] as HTMLElement);
    expect(ds.calls.openDirect).toHaveBeenCalledWith("u1");
    expect(await screen.findByTestId("chat-conversation")).toBeTruthy();
  });

  test("presence menu goes through the data source", async () => {
    const ds = panelDs();
    const spy = vi.spyOn(ds, "setPresence");
    const ev = userEvent.setup();
    render(
      <ChatPanel
        destination="chats"
        user={user}
        dataSource={ds}
        onClose={vi.fn()}
        onDestinationChange={vi.fn()}
      />,
    );
    await ev.click(screen.getByTestId("chat-presence-trigger"));
    await ev.click(screen.getByTestId("chat-presence-busy"));
    expect(spy).toHaveBeenCalledWith("busy");
  });
});
