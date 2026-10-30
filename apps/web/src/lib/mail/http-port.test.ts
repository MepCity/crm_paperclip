import { UnauthenticatedError, ValidationError } from "@crm/core/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeError, UnexpectedApiError } from "@/lib/api/wire/errors";
import { createHttpMailPort, fetchConversations, fetchRecordConversations } from "./http-port";

const row = {
  id: "thread",
  folder: "inbox",
  subject: "Example",
  snippet: "Preview",
  unread: true,
  messages: [
    {
      id: "message",
      from: { name: "Sender", address: "sender@example.test" },
      to: [],
      cc: [],
      date: "2026-01-01T10:00:00Z",
      body: "Body",
      attachments: [{ id: "attachment", name: "example.txt", sizeLabel: "1.2 KB" }],
    },
  ],
};
afterEach(() => vi.unstubAllGlobals());

describe("mail HTTP port", () => {
  it("requests the folder and validates the full conversation", async () => {
    const fetcher = vi.fn(async () => ({ connected: true, data: [row] }));
    expect(await fetchConversations("inbox", fetcher)).toEqual({ connected: true, data: [row] });
    expect(fetcher).toHaveBeenCalledWith("/crm/v2.2/mail/conversations?folder=inbox");
  });
  it.each([
    null,
    {},
    { connected: "true", data: [] },
    { connected: true, data: [{}] },
    { connected: false, data: [row] },
    { connected: true, data: [{ ...row, folder: "sent" }] },
    ...[
      null,
      {},
      { ...row.messages[0], date: "yesterday" },
      { ...row.messages[0], from: { address: "sender@example.test" } },
      { ...row.messages[0], attachments: [{ id: "a", name: "x", sizeLabel: 12 }] },
      { ...row.messages[0], to: [null] },
      { ...row.messages[0], body: null },
    ].map((message) => ({ connected: true, data: [{ ...row, messages: [message] }] })),
  ])("rejects malformed response %#", async (body) => {
    await expect(fetchConversations("inbox", async () => body)).rejects.toThrow(
      "Malformed mail response",
    );
  });
  it("accepts the disconnected empty response", async () => {
    expect(await fetchConversations("inbox", async () => ({ connected: false, data: [] }))).toEqual(
      { connected: false, data: [] },
    );
  });
  it("sends organization and session options through shared apiFetch", async () => {
    const fetcher = vi.fn(async () => Response.json({ connected: true, data: [] }));
    vi.stubGlobal("fetch", fetcher);
    await createHttpMailPort("example").fetchConversations("sent");
    const [path, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/crm/v2.2/mail/conversations?folder=sent");
    expect(options.credentials).toBe("same-origin");
    expect(new Headers(options.headers).get("X-CRM-ORG")).toBe("example");
  });
  it("maps route-specific 400 and preserves shared 401/500 error types", async () => {
    for (const [status, body, type] of [
      [
        400,
        { code: "INVALID_FOLDER", status: "error", message: "Invalid folder.", details: {} },
        ValidationError,
      ],
      [401, encodeError(new UnauthenticatedError()).body, UnauthenticatedError],
      [500, encodeError(new Error()).body, UnexpectedApiError],
    ] as const) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json(body, { status })),
      );
      await expect(
        createHttpMailPort("example").fetchConversations("inbox"),
      ).rejects.toBeInstanceOf(type);
    }
  });
});

describe("record mail HTTP port", () => {
  it("encodes the record scope and accepts conversations from different folders", async () => {
    const data = [row, { ...row, id: "sent-thread", folder: "sent" }];
    const fetcher = vi.fn(async () => ({ connected: true, data }));
    expect(await fetchRecordConversations("Contacts", "record &1", fetcher)).toEqual({
      connected: true,
      data,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "/crm/v2.2/mail/conversations?module=Contacts&recordId=record+%261",
    );
  });
  it.each([
    null,
    {},
    { connected: "yes", data: [] },
    { connected: false, data: [row] },
    { connected: true, data: [{ ...row, folder: "unknown" }] },
    { connected: true, data: [{ ...row, messages: [] }] },
    { connected: true, data: [{ ...row, messages: [{ ...row.messages[0], date: "bad" }] }] },
  ])("rejects malformed record response %#", async (body) => {
    await expect(fetchRecordConversations("Leads", "example", async () => body)).rejects.toThrow(
      "Malformed mail response",
    );
  });
  it("accepts disconnected state and preserves fetch errors", async () => {
    expect(
      await fetchRecordConversations("Deals", "example", async () => ({
        connected: false,
        data: [],
      })),
    ).toEqual({ connected: false, data: [] });
    const error = new ValidationError({ recordId: ["Invalid record."] });
    await expect(
      fetchRecordConversations("Deals", "example", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });
  it("uses the organization-bound factory fetcher", async () => {
    const fetcher = vi.fn(async () => ({ connected: true, data: [] }));
    await createHttpMailPort("example", fetcher).fetchRecordConversations("Accounts", "record");
    expect(fetcher).toHaveBeenCalledWith(
      "/crm/v2.2/mail/conversations?module=Accounts&recordId=record",
    );
  });
});
