import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAesGcmSecretBox } from "../../../secrets/secret-box";
import { composeMime, envelopeRecipients } from "../../mime";
import type { MailSendRequest } from "../../outbox";
import { createGmailConnector, createInMemoryCredentialStore } from "./gmail-connector";
import { createGmailMailSender } from "./sender";
import type { HttpRequest, HttpResponse } from "./transport";

const mailbox = {
  organizationId: "org",
  id: "box",
  credentialRef: "cred",
  address: "sender@example.com",
};
const request: MailSendRequest = {
  organizationId: "org",
  mailboxId: "box",
  idempotencyKey: "intent",
  message: {
    from: [{ address: "spoof@example.com", name: "Sender" }],
    to: [{ address: "to@example.com" }],
    cc: [{ address: "cc@example.com" }],
    bcc: [],
    subject: "Hello",
    summary: "Summary",
    bodyRef: "body",
  },
  attachments: [],
};
const response = (status: number, body: unknown): HttpResponse => ({
  status,
  body: JSON.stringify(body),
  headers: {},
});
async function setup(
  send: (req: HttpRequest, attempt: number) => HttpResponse | Promise<HttpResponse>,
) {
  const calls: HttpRequest[] = [];
  let refreshes = 0;
  let attempts = 0;
  const connector = createGmailConnector({
    config: { clientId: "client", clientSecret: "secret", scopes: ["send"], syncWindowDays: 30 },
    credentials: createInMemoryCredentialStore(),
    secretBox: createAesGcmSecretBox({ keys: new Map([["k", randomBytes(32)]]), activeKeyId: "k" }),
    transport: async (req) => {
      calls.push(req);
      if (req.url.endsWith("/token"))
        return response(200, { access_token: `access-${++refreshes}` });
      return send(req, ++attempts);
    },
  });
  await connector.storeRefreshToken(mailbox, "refresh");
  const guarded: string[][] = [];
  const sender = createGmailMailSender({
    connector,
    resolveMailbox: async () => mailbox,
    loadContent: async () => ({ text: "Private body", attachments: [] }),
    recipientGuard: (recipients) => {
      guarded.push(recipients.map((r) => r.address));
    },
  });
  return { sender, calls, guarded };
}

describe("Gmail MailSender", () => {
  it("composes authenticated From and raw base64url MIME without Bcc", async () => {
    const { sender, calls } = await setup(() => response(200, { id: "sent-1" }));
    expect(await sender.send(request)).toEqual({ status: "accepted", providerMessageId: "sent-1" });
    const call = calls[1];
    if (!call) throw new Error("Expected send request");
    expect(call.method).toBe("POST");
    expect(call.url).toBe("https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    expect(call.headers.authorization).toBe("Bearer access-1");
    const { raw } = JSON.parse(call.body ?? "{}");
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    const mime = Buffer.from(raw, "base64url").toString();
    expect(mime).toContain("From: Sender <sender@example.com>\r\n");
    expect(mime).toContain("To: to@example.com\r\n");
    expect(mime).toContain("Cc: cc@example.com\r\n");
    expect(mime).toContain("Subject: Hello\r\n");
    expect(mime).toContain(Buffer.from("Private body").toString("base64"));
    expect(mime).not.toMatch(/^Bcc:/im);
    expect(mime).not.toContain("spoof@example.com");
  });
  it("refreshes once on 401 and retries identical MIME", async () => {
    const { sender, calls } = await setup((_, n) => response(n === 1 ? 401 : 200, { id: "sent" }));
    expect(await sender.send(request)).toEqual({ status: "accepted", providerMessageId: "sent" });
    expect(calls).toHaveLength(4);
    expect(calls[3]?.headers.authorization).toBe("Bearer access-2");
    expect(calls[1]?.body).toBe(calls[3]?.body);
  });
  it.each([
    [401, "auth_revoked", false],
    [400, "provider_rejected", false],
    [403, "provider_rejected", false],
    [429, "retryable", true],
    [500, "retryable", true],
  ])("maps HTTP %s safely", async (status, reason, retryable) => {
    const { sender, calls } = await setup(() =>
      response(Number(status), { private: "must not escape" }),
    );
    expect(await sender.send(request)).toEqual({ status: "rejected", reason, retryable });
    expect(calls.filter((c) => c.url.endsWith("/messages/send"))).toHaveLength(
      status === 401 ? 2 : 1,
    );
  });
  it.each([{}, null, { id: 12 }])(
    "holds ambiguous success without a valid id: %s",
    async (body) => {
      const { sender } = await setup(() => response(200, body));
      expect(await sender.send(request)).toEqual({ status: "unknown" });
    },
  );
  it("holds a transport failure after dispatch without retry", async () => {
    const { sender, calls } = await setup(() => {
      throw new Error("private transport details");
    });
    expect(await sender.send(request)).toEqual({ status: "unknown" });
    expect(calls).toHaveLength(2);
  });
  it("forwards cancellation and holds an abort after dispatch", async () => {
    const controller = new AbortController();
    const { sender, calls } = await setup((req) => {
      expect(req.signal).toBe(controller.signal);
      controller.abort();
      throw new Error("aborted");
    });
    expect(await sender.send(request, controller.signal)).toEqual({ status: "unknown" });
    expect(calls).toHaveLength(2);
  });
  it("does not dispatch an already cancelled intent", async () => {
    const { sender, calls } = await setup(() => response(200, { id: "sent" }));
    expect(await sender.send(request, AbortSignal.abort())).toEqual({
      status: "rejected",
      reason: "send_cancelled",
      retryable: true,
    });
    expect(calls).toHaveLength(0);
  });
  it("rejects invalid addresses before provider access", async () => {
    const { sender, calls } = await setup(() => response(200, { id: "sent" }));
    expect(
      await sender.send({
        ...request,
        message: { ...request.message, to: [{ address: "invalid" }] },
      }),
    ).toEqual({ status: "rejected", reason: "invalid_message", retryable: false });
    expect(calls).toHaveLength(0);
  });
  it("guards all envelope recipients and adds BCC only to provider submission", async () => {
    const { sender, calls, guarded } = await setup(() => response(200, { id: "sent" }));
    const message = {
      ...request.message,
      bcc: [{ address: "blind@example.com" }, { address: "other@example.com" }],
    };
    expect(envelopeRecipients(message)).toEqual([
      "to@example.com",
      "cc@example.com",
      "blind@example.com",
      "other@example.com",
    ]);
    expect(await sender.send({ ...request, message })).toEqual({
      status: "accepted",
      providerMessageId: "sent",
    });
    expect(guarded[0]).toEqual(envelopeRecipients(message));
    const body = JSON.parse(calls[1]?.body ?? "{}");
    expect(Object.keys(body)).toEqual(["raw"]);
    const submitted = Buffer.from(body.raw, "base64url").toString();
    expect(submitted.match(/^Bcc:/gm)).toHaveLength(1);
    expect(submitted).toContain("Bcc: blind@example.com, other@example.com\r\n");
    expect(composeMime({ ...message, from: { address: mailbox.address } })).not.toMatch(/^Bcc:/im);
  });
  it.each(["to", "cc", "bcc"] as const)(
    "rejects CR/LF injection in %s before dispatch",
    async (field) => {
      const { sender, calls } = await setup(() => response(200, { id: "sent" }));
      for (const entry of [
        { address: "safe@example.com\r\nBcc: injected@example.com" },
        { address: "safe@example.com", name: "Safe\r\nBcc: injected@example.com" },
      ]) {
        expect(
          await sender.send({ ...request, message: { ...request.message, [field]: [entry] } }),
        ).toEqual({ status: "rejected", reason: "invalid_message", retryable: false });
      }
      expect(calls).toHaveLength(0);
    },
  );
  it("delivers BCC-only mail without inventing visible recipients", async () => {
    const { sender, calls } = await setup(() => response(200, { id: "sent" }));
    expect(
      await sender.send({
        ...request,
        message: { ...request.message, to: [], cc: [], bcc: [{ address: "blind@example.com" }] },
      }),
    ).toEqual({ status: "accepted", providerMessageId: "sent" });
    const raw = Buffer.from(JSON.parse(calls[1]?.body ?? "{}").raw, "base64url").toString();
    expect(raw).toContain("Bcc: blind@example.com\r\n");
    expect(raw).not.toMatch(/^To:.*blind/im);
  });
});
