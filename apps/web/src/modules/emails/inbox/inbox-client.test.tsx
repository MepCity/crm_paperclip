import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { inboxFixture } from "./fixture";
import { loadInboxFixture } from "./fixture-loader";
import { InboxClient, type InboxLoader } from "./inbox-client";
import type { InboxViewModel } from "./view-model";

const query = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query.value),
}));

afterEach(() => {
  cleanup();
  query.value = "";
  vi.restoreAllMocks();
});

function deferred() {
  let resolve!: (model: InboxViewModel) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<InboxViewModel>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("shows loading until the loader resolves, then restores URL selection", async () => {
  query.value = "folder=inbox&message=conversation-1";
  const pending = deferred();
  const load = vi.fn<InboxLoader>(() => pending.promise);
  render(<InboxClient load={load} />);
  expect(load).toHaveBeenCalledWith("inbox");
  expect(screen.getByRole("status").textContent).toBe("Loading emails...");
  expect(screen.queryByRole("heading", { name: "Project overview" })).toBeNull();
  await act(async () => pending.resolve(inboxFixture));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("heading", { name: "Project overview" })).toBeTruthy();
});

test("renders a safe error without treating failure as an empty or disconnected mailbox", async () => {
  const load = vi.fn<InboxLoader>().mockRejectedValue(new Error("private service detail"));
  render(<InboxClient load={load} />);
  expect((await screen.findByRole("alert")).textContent).toBe("Unable to load emails");
  expect(screen.queryByText("private service detail")).toBeNull();
  expect(screen.queryByText("No mailbox connected")).toBeNull();
  expect(screen.queryByText("No messages in Inbox")).toBeNull();
  expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
});

test("shows the disconnected mailbox state returned by the loader", async () => {
  const load = vi.fn<InboxLoader>().mockResolvedValue({ connected: false, conversations: [] });
  render(<InboxClient load={load} />);
  expect(await screen.findByRole("heading", { name: "No mailbox connected" })).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Email folders" })).toBeNull();
});

test("reloads on folder changes, keeps selection local, and preserves other query parameters", async () => {
  query.value = "extra=keep&folder=inbox&message=conversation-1";
  const load = vi.fn<InboxLoader>().mockResolvedValue(inboxFixture);
  const push = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  const view = render(<InboxClient load={load} />);
  await screen.findByRole("heading", { name: "Project overview" });
  fireEvent.click(screen.getByRole("button", { name: "Sent 2" }));
  expect(push).toHaveBeenLastCalledWith(null, "", "?extra=keep&folder=sent");
  query.value = "extra=keep&folder=sent&message=conversation-1";
  view.rerender(<InboxClient load={load} />);
  await screen.findByRole("button", { name: /Planning summary/ });
  expect(load.mock.calls.map(([folder]) => folder)).toEqual(["inbox", "sent"]);
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Planning summary/ }));
  expect(push).toHaveBeenLastCalledWith(null, "", "?extra=keep&folder=sent&message=conversation-7");
  query.value = "folder=sent&message=conversation-7";
  view.rerender(<InboxClient load={load} />);
  expect(screen.getByRole("heading", { name: "Planning summary" })).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(2);
});

test.each(["resolve", "reject"] as const)(
  "ignores a late %s from the old folder, even after returning to that folder",
  async (outcome) => {
    const first = deferred();
    const second = deferred();
    const third = deferred();
    const load = vi
      .fn<InboxLoader>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    const view = render(<InboxClient load={load} />);
    query.value = "folder=sent";
    view.rerender(<InboxClient load={load} />);
    await act(async () => second.resolve(inboxFixture));
    expect(screen.getByRole("button", { name: /Planning summary/ })).toBeTruthy();
    query.value = "folder=inbox";
    view.rerender(<InboxClient load={load} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "Message list" })).queryByRole("list"),
    ).toBeNull();
    await act(async () => third.resolve({ connected: true, conversations: [] }));
    await act(async () => {
      if (outcome === "resolve") first.resolve(inboxFixture);
      else first.reject(new Error("Old failure"));
    });
    expect(screen.getByRole("heading", { name: "No messages in Inbox" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: /Project overview/ })).toBeNull();
  },
);

test("an invalid folder loads Inbox and the default fixture preserves all folder counts", async () => {
  query.value = "folder=unknown&message=missing";
  render(<InboxClient />);
  expect(await screen.findByRole("button", { name: "Inbox 6" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sent 2" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Select a message" })).toBeTruthy();
  expect(await loadInboxFixture("sent")).toEqual(inboxFixture);
});

test("replacing a loader or unmounting ignores the previous pending result", async () => {
  const pending = deferred();
  const oldLoad = vi.fn<InboxLoader>(() => pending.promise);
  const newLoad = vi.fn<InboxLoader>().mockResolvedValue({ connected: false, conversations: [] });
  const view = render(<InboxClient load={oldLoad} />);
  view.rerender(<InboxClient load={newLoad} />);
  await screen.findByRole("heading", { name: "No mailbox connected" });
  await act(async () => pending.resolve(inboxFixture));
  expect(screen.getByRole("heading", { name: "No mailbox connected" })).toBeTruthy();
  const unmounted = deferred();
  view.rerender(<InboxClient load={() => unmounted.promise} />);
  view.unmount();
  await act(async () => unmounted.reject(new Error("Disposed request")));
});
