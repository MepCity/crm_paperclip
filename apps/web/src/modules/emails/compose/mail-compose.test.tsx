import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { MailCompose } from "./mail-compose";
import { composeMailboxes, type MailComposePort } from "./port";

afterEach(cleanup);
function setup(port: MailComposePort = { send: vi.fn().mockResolvedValue({ id: "sent" }) }) {
  const onClose = vi.fn();
  const onSent = vi.fn();
  render(
    <MailCompose mailboxes={composeMailboxes} port={port} onClose={onClose} onSent={onSent} />,
  );
  return { port, onClose, onSent };
}
function fill(label: string, value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
}

test("parses named recipients into removable chips and sends To, Cc, Bcc and body", async () => {
  const { port, onSent, onClose } = setup();
  fill("To", '"Last, First" <FIRST@example.com>; second@example.com');
  expect(screen.getByRole("button", { name: "Remove To first@example.com" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove To second@example.com" }));
  fireEvent.click(screen.getByRole("button", { name: "Cc" }));
  fireEvent.click(screen.getByRole("button", { name: "Bcc" }));
  fill("Cc", "copy@example.com");
  fill("Bcc", "hidden@example.com");
  fill("Subject", "A subject");
  fill("Message", "A body");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(onSent).toHaveBeenCalledWith({ id: "sent" }));
  expect(port.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: [{ name: "Last, First", address: "first@example.com" }],
      cc: [{ address: "copy@example.com" }],
      bcc: [{ address: "hidden@example.com" }],
      body: "A body",
      subject: "A subject",
      mailboxId: "fixture-mailbox",
    }),
  );
  expect(onClose).toHaveBeenCalledOnce();
});

test("blocks empty and malformed recipients", async () => {
  const { port } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(await screen.findByText("Add at least one recipient.")).toBeTruthy();
  fill("To", "bad-address");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(await screen.findByText("Enter valid email addresses in To, Cc and Bcc.")).toBeTruthy();
  expect(port.send).not.toHaveBeenCalled();
});

test("rejects too many and oversized attachments and supports removing accepted files", () => {
  setup();
  const picker = screen.getByLabelText("Attach files", { selector: "input" });
  fireEvent.change(picker, {
    target: {
      files: Array.from({ length: 51 }, () => new File(["ok"], "a.txt", { type: "text/plain" })),
    },
  });
  expect(screen.getByRole("alert").textContent).toContain("at most 50");
  const big = new File(["ok"], "large.txt", { type: "text/plain" });
  Object.defineProperty(big, "size", { value: 20 * 1024 * 1024 + 1 });
  fireEvent.change(picker, { target: { files: [big] } });
  expect(screen.getByRole("alert").textContent).toContain("20 MB");
  fireEvent.change(picker, {
    target: { files: [new File(["ok"], "a.txt", { type: "text/plain" })] },
  });
  expect(screen.getByText("a.txt")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove attachment 1" }));
  expect(screen.queryByText("a.txt")).toBeNull();
});

test("locks while sending and preserves the intent key when retrying a failure", async () => {
  let rejectSend: (error: Error) => void = () => {};
  const send = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSend = reject;
        }),
    )
    .mockResolvedValue({ id: "retry" });
  const { onClose } = setup({ send });
  fill("To", "person@example.com");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(screen.getByRole("textbox", { name: "To" }).hasAttribute("disabled")).toBe(true);
  fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
  rejectSend(new Error("failed"));
  await screen.findByText("Unable to send your message. Please try again.");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(send.mock.calls[0]?.[0].idempotencyKey).toBe(send.mock.calls[1]?.[0].idempotencyKey);
});

test("cancel and Escape confirm dirty content; keep editing retains it", async () => {
  const { onClose } = setup();
  fill("Message", "Keep this");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(await screen.findByRole("alertdialog")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  expect((screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement).value).toBe(
    "Keep this",
  );
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), { key: "Escape" });
  await screen.findByRole("alertdialog");
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});

test("cancel without edits closes immediately", () => {
  const { onClose } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("accepts the attachment boundary and includes metadata in the send input", async () => {
  const { port } = setup();
  fill("To", "person@example.com");
  const attachment = new File(["synthetic"], "boundary.txt", { type: "text/plain" });
  Object.defineProperty(attachment, "size", { value: 20 * 1024 * 1024 });
  fireEvent.change(screen.getByLabelText("Attach files", { selector: "input" }), {
    target: { files: [attachment] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() =>
    expect(port.send).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            name: "boundary.txt",
            size: 20 * 1024 * 1024,
            contentType: "text/plain",
          }),
        ],
      }),
    ),
  );
});

test("blocks disallowed attachment types and enforces the aggregate size limit", () => {
  setup();
  const picker = screen.getByLabelText("Attach files", { selector: "input" });
  fireEvent.change(picker, {
    target: { files: [new File(["script"], "script.html", { type: "text/html" })] },
  });
  expect(screen.getByRole("alert").textContent).toContain("not allowed");
  const file = new File(["a"], "a.txt", { type: "text/plain" });
  Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
  fireEvent.change(picker, { target: { files: [file] } });
  fireEvent.change(picker, { target: { files: [file] } });
  expect(screen.getByRole("alert").textContent).toContain("20 MB");
});

test("HTTP compose retains content and window key after failure, then closes on success", async () => {
  const { createHttpComposePort } = await import("./http-port");
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { id: "http-message", status: "queued", scheduledAt: null } });
  const { onSent, onClose } = setup(createHttpComposePort("demo", fetcher));
  fill("To", "person@example.com");
  fill("Message", "Retain this body");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByText("Unable to send your message. Please try again.");
  expect(onClose).not.toHaveBeenCalled();
  expect((screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement).value).toBe(
    "Retain this body",
  );
  fill("Subject", "Edited subject");
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() =>
    expect(onSent).toHaveBeenCalledWith({
      id: "http-message",
      status: "queued",
      scheduledAt: null,
    }),
  );
  expect(onClose).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0]?.[1].body.idempotencyKey).toBe(
    fetcher.mock.calls[1]?.[1].body.idempotencyKey,
  );
  expect(fetcher.mock.calls[1]?.[1].body.body).toBe("Retain this body");
});

test("existing fixture mounts use HTTP in organization routes", async () => {
  const { fixtureComposePort } = await import("./port");
  window.history.replaceState(null, "", "/crm/demo/emails");
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: "mounted", status: "queued", scheduledAt: null } }),
      ),
    );
  vi.stubGlobal("fetch", fetch);
  try {
    setup(fixtureComposePort);
    fill("To", "person@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(fetch.mock.calls[0]?.[1].headers.get("X-CRM-ORG")).toBe("demo");
  } finally {
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  }
});
