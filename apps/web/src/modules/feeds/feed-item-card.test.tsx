import type { FeedItem } from "@crm/core/feeds";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { textToFeedHtml } from "./feed-composer";
import { FeedItemCard } from "./feed-item-card";

afterEach(cleanup);

const post: FeedItem = {
  type: "post",
  id: "p1",
  at: "2026-01-01T10:00:00.000Z",
  author: { id: "u1", name: "Ada" },
  body: "<p>Hello team</p>",
  editedAt: null,
  mentions: [],
  record: null,
  likeCount: 2,
  likedByMe: false,
  commentCount: 0,
  comments: [],
};

function setup(item: FeedItem = post, userId = "u1") {
  const handlers = {
    onLike: vi.fn(async () => {}),
    onComment: vi.fn(async () => {}),
    onDelete: vi.fn(async () => {}),
    onDeleteComment: vi.fn(async () => {}),
  };
  render(<FeedItemCard item={item} orgSlug="acme" currentUserId={userId} {...handlers} />);
  return handlers;
}

describe("FeedItemCard", () => {
  test("shows the post and likes it", async () => {
    const h = setup();
    expect(screen.getByText("Hello team")).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Like" }));
    await waitFor(() => expect(h.onLike).toHaveBeenCalledWith(post, true));
  });

  test("only the author sees delete", () => {
    setup(post, "someone-else");
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  test("renders field changes of an event", () => {
    setup({
      type: "event",
      id: "e1",
      at: "2026-01-01T10:00:00.000Z",
      actor: { id: "u2", name: "Bob" },
      eventKind: "fields_updated",
      record: { module: "Deals", id: "9", name: "Big Deal" },
      changes: [
        {
          apiName: "Stage",
          label: "Stage",
          dataType: "text",
          old: "a",
          new: "b",
          oldDisplay: "Qualification",
          newDisplay: "Negotiation",
        },
      ],
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
      comments: [],
    } as FeedItem);
    expect(screen.getByText("Stage: Qualification → Negotiation")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Big Deal" })).toBeTruthy();
  });
});

describe("textToFeedHtml", () => {
  test("escapes markup and wraps lines in paragraphs", () => {
    expect(textToFeedHtml("a <b>\n\nc")).toBe("<p>a &lt;b&gt;</p><p>c</p>");
    expect(textToFeedHtml("   ")).toBe("");
  });
});
