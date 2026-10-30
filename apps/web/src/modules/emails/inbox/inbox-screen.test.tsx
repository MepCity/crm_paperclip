import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { inboxFixture } from "./fixture";
import { InboxScreen } from "./inbox-screen";
import type { EmailFolder } from "./view-model";

function InteractiveInbox() {
  const [folder, setFolder] = useState<EmailFolder>("inbox");
  const [message, setMessage] = useState<string | null>(null);
  return (
    <InboxScreen
      model={inboxFixture}
      folderParam={folder}
      messageParam={message}
      onNavigate={(next, id) => {
        setFolder(next);
        setMessage(id ?? null);
      }}
    />
  );
}

afterEach(cleanup);

test("folder counts come from the model; switching clears the selected conversation", () => {
  render(<InteractiveInbox />);
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Inbox 6" }).getAttribute("aria-current")).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: /Project overview/ }));
  expect(screen.getByRole("heading", { name: "Project overview" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Sent 2" }));
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Project overview/ })).toBeNull();
  expect(screen.getByRole("button", { name: /Planning summary/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Drafts 1" }));
  expect(screen.getByRole("button", { name: /Follow-up questions/ })).toBeTruthy();
});

test("only the last thread message starts open; earlier messages expand and collapse", () => {
  render(<InteractiveInbox />);
  fireEvent.click(screen.getByRole("button", { name: /Project overview/ }));
  const reader = screen.getByRole("region", { name: "Reading pane" });
  const toggles = within(reader).getAllByRole("button");
  expect(toggles.map((toggle) => toggle.getAttribute("aria-expanded"))).toEqual([
    "false",
    "false",
    "false",
    "true",
  ]);
  expect(within(reader).getByText("project-overview.pdf")).toBeTruthy();
  expect(within(reader).getByText("Casey Reed <casey@example.com>")).toBeTruthy();
  const first = toggles[0];
  if (!first) throw new Error("Missing first thread message");
  fireEvent.click(first);
  expect(first.getAttribute("aria-expanded")).toBe("true");
  expect(
    within(reader).getByText("Could you share an overview of the proposed work?"),
  ).toBeTruthy();
  fireEvent.click(first);
  expect(first.getAttribute("aria-expanded")).toBe("false");
});

test("empty folder and disconnected mailbox have distinct states", () => {
  const view = render(<InteractiveInbox />);
  fireEvent.click(screen.getByRole("button", { name: "Scheduled 0" }));
  expect(screen.getByRole("heading", { name: "No messages in Scheduled" })).toBeTruthy();
  view.unmount();
  render(
    <InboxScreen
      model={{ ...inboxFixture, connected: false }}
      folderParam="inbox"
      messageParam="conversation-1"
      onNavigate={vi.fn()}
    />,
  );
  expect(screen.getByRole("heading", { name: "No mailbox connected" })).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Email folders" })).toBeNull();
});

test("query selection is restricted to the selected folder and handles invalid values", () => {
  const view = render(
    <InboxScreen
      model={inboxFixture}
      folderParam="sent"
      messageParam="conversation-1"
      onNavigate={vi.fn()}
    />,
  );
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
  view.rerender(
    <InboxScreen
      model={inboxFixture}
      folderParam="unknown"
      messageParam="missing"
      onNavigate={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Inbox 6" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
});
