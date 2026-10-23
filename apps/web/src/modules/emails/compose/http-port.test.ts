import { ValidationError } from "@crm/core/errors";
import { afterEach, describe, expect, test, vi } from "vitest";
import { encodeError } from "@/lib/api/wire/errors";
import {
  createHttpComposePort,
  fetchComposeMailboxes,
  readComposeMailboxesResponse,
} from "./http-port";
import type { ComposeMailInput } from "./port";

const input: ComposeMailInput = {
  mailboxId: "mailbox-demo",
  idempotencyKey: "compose-intent",
  from: { address: "sender@example.com" },
  to: [{ address: "person@example.com" }],
  cc: [{ address: "copy@example.com" }],
  bcc: [{ address: "hidden@example.com" }],
  subject: "Subject",
  body: "Plain text body",
  summary: "Plain text body",
  attachments: [],
  scheduledAt: null,
};
afterEach(() => vi.unstubAllGlobals());
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("posts plain-text compose fields with session cookies and organization header", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(response({ data: { id: "message", status: "queued", scheduledAt: null } }));
  vi.stubGlobal("fetch", fetch);
  await expect(createHttpComposePort("demo").send(input)).resolves.toEqual({
    id: "message",
    status: "queued",
    scheduledAt: null,
  });
  const [path, options] = fetch.mock.calls[0] ?? [];
  expect(path).toBe("/crm/v2.2/mail/messages");
  expect(options).toMatchObject({ method: "POST", credentials: "same-origin" });
  expect(options.headers.get("X-CRM-ORG")).toBe("demo");
  expect(JSON.parse(options.body)).toEqual(input);
  expect(JSON.parse(options.body)).not.toHaveProperty("bodyRef");
});

test("preserves decoded field errors for the compose send-error state", async () => {
  const error = new ValidationError({ to: ["Recipient is not allowed."] });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(encodeError(error).body, 400)));
  await expect(createHttpComposePort("demo").send(input)).rejects.toMatchObject({
    fieldErrors: error.fieldErrors,
  });
});

test.each([
  [401, "AUTHENTICATION_FAILURE", "unauthenticated"],
  [403, "NO_PERMISSION", "forbidden"],
  [404, "not_found", "not_found"],
])("preserves the shared error codec for HTTP %s", async (status, code, expected) => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        response({ code, details: {}, message: "Unavailable", status: "error" }, status),
      ),
  );
  await expect(createHttpComposePort("demo").send(input)).rejects.toMatchObject({ code: expected });
});

test("retries a network failure with the same idempotency key", async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new TypeError("offline"))
    .mockResolvedValueOnce(
      response({ data: { id: "retry", status: "queued", scheduledAt: null } }),
    );
  vi.stubGlobal("fetch", fetch);
  const port = createHttpComposePort("demo");
  await expect(port.send(input)).rejects.toThrow("offline");
  await expect(port.send(input)).resolves.toMatchObject({ id: "retry" });
  expect(fetch.mock.calls.map((call) => JSON.parse(call[1].body).idempotencyKey)).toEqual([
    "compose-intent",
    "compose-intent",
  ]);
});

test.each([
  null,
  {},
  { data: { id: "x" } },
  { data: { id: "x", status: "queued", scheduledAt: "invalid" } },
])("rejects malformed compose success %j", async (body) => {
  const fetcher = vi.fn().mockResolvedValue(body);
  await expect(createHttpComposePort("demo", fetcher).send(input)).rejects.toThrow(
    "Malformed compose response",
  );
});

describe("fetchComposeMailboxes and readComposeMailboxesResponse", () => {
  test("parses valid mailbox list with and without optional name", () => {
    const raw = {
      data: [
        { id: "box-1", address: "first@example.com" },
        { id: "box-2", address: "second@example.com", name: "Second User" },
      ],
    };
    expect(readComposeMailboxesResponse(raw)).toEqual([
      { id: "box-1", address: "first@example.com" },
      { id: "box-2", address: "second@example.com", name: "Second User" },
    ]);
  });

  test("accepts empty data array", () => {
    expect(readComposeMailboxesResponse({ data: [] })).toEqual([]);
  });

  test.each([
    null,
    undefined,
    "string",
    123,
    [],
    {},
    { data: null },
    { data: "not-array" },
    { data: [], extraKey: true },
    { other: [] },
  ])("rejects malformed response root %j", (payload) => {
    expect(() => readComposeMailboxesResponse(payload)).toThrow(
      "Malformed compose mailboxes response",
    );
  });

  test.each([
    { data: [null] },
    { data: ["not-an-object"] },
    { data: [{ id: "box-1" }] },
    { data: [{ address: "a@b.com" }] },
    { data: [{ id: "", address: "a@b.com" }] },
    { data: [{ id: "box-1", address: "" }] },
    { data: [{ id: "box-1", address: "a@b.com", name: 123 }] },
    { data: [{ id: "box-1", address: "a@b.com", extra: "forbidden" }] },
    { data: [{ id: "box-1", address: "a@b.com", ownerUserId: "user-1" }] },
    { data: [{ id: "box-1", address: "a@b.com", status: "connected" }] },
  ])("strictly rejects item with invalid or extra fields %j", (payload) => {
    expect(() => readComposeMailboxesResponse(payload)).toThrow();
  });

  test("fetchComposeMailboxes invokes fetcher with GET /crm/v2.2/mail/mailboxes", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: [{ id: "box-live", address: "live@example.com" }],
    });
    const result = await fetchComposeMailboxes(fetchFn);
    expect(fetchFn).toHaveBeenCalledWith("/crm/v2.2/mail/mailboxes");
    expect(result).toEqual([{ id: "box-live", address: "live@example.com" }]);
  });
});
