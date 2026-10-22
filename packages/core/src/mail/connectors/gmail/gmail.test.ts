import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAesGcmSecretBox } from "../../../secrets/secret-box";
import { createInMemoryMailRepository } from "../../repository";
import {
  ConnectorError,
  createGmailConnector,
  createInMemoryCredentialStore,
  type GmailConfig,
  type HttpRequest,
  type HttpResponse,
  mapGmailMessage,
  parseAddressList,
  readGmailConfig,
  syncMailbox,
} from "./index";

const SECRET = "refresh-secret-value";
const ACCESS = "access-secret-value";
const config: GmailConfig = {
  clientId: "cid",
  clientSecret: "csecret",
  scopes: ["s"],
  syncWindowDays: 30,
};
const mb = { organizationId: "org", id: "box", credentialRef: "cred-1" };
const json = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): HttpResponse => ({
  status,
  headers,
  body: JSON.stringify(body),
});

const msg = (id: string, labels: string[], extra: object = {}) => ({
  id,
  threadId: `t-${id}`,
  labelIds: labels,
  snippet: "hi",
  internalDate: "1760000000000",
  payload: {
    headers: [
      { name: "From", value: '"Ann B" <Ann@Example.com>' },
      { name: "To", value: "x@example.com, Y <y@example.com>" },
      { name: "Subject", value: "Hello" },
      { name: "Message-ID", value: `<${id}@x>` },
    ],
    parts: [
      { filename: "a.pdf", mimeType: "application/pdf", body: { attachmentId: "A1", size: 100 } },
      {
        filename: "big.bin",
        mimeType: "application/zip",
        body: { attachmentId: "A2", size: 30 * 1024 * 1024 },
      },
    ],
  },
  ...extra,
});

function setup(handler: (req: HttpRequest, n: number) => HttpResponse) {
  const calls: HttpRequest[] = [];
  const secretBox = createAesGcmSecretBox({
    keys: new Map([["k1", randomBytes(32)]]),
    activeKeyId: "k1",
  });
  const credentials = createInMemoryCredentialStore();
  const connector = createGmailConnector({
    config,
    secretBox,
    credentials,
    transport: async (req) => {
      calls.push(req);
      return handler(req, calls.length);
    },
  });
  return { calls, connector, credentials };
}

const standard = (req: HttpRequest): HttpResponse => {
  if (req.url.includes("oauth2.googleapis.com/token"))
    return json(200, { access_token: ACCESS, expires_in: 3600 });
  if (req.url.endsWith("/profile")) return json(200, { historyId: "500" });
  if (req.url.includes("labelIds=INBOX"))
    return json(200, { messages: [{ id: "m2" }, { id: "m1" }] });
  if (req.url.includes("labelIds=SENT")) return json(200, { messages: [{ id: "s1" }] });
  if (req.url.includes("/messages/m"))
    return json(200, msg(req.url.includes("m1") ? "m1" : "m2", ["INBOX"]));
  if (req.url.includes("/messages/s1")) return json(200, msg("s1", ["SENT"]));
  return json(404, {});
};

describe("mapping", () => {
  it("parses address lists", () => {
    expect(parseAddressList('"A, B" <a@x.com>, bad, c@y.com')).toEqual([
      { address: "a@x.com", name: "A, B" },
      { address: "c@y.com" },
    ]);
  });
  it("maps folder, thread, participants and attachments within the limit", () => {
    const out = mapGmailMessage("org", "box", msg("m1", ["INBOX"]));
    expect(out?.message.folder).toBe("inbox");
    expect(out?.message.from).toEqual([{ address: "ann@example.com", name: "Ann B" }]);
    expect(out?.thread.providerThreadKey).toBe("t-m1");
    expect(out?.attachments.map((a) => a.storage)).toEqual(["stored", "not_stored"]);
    expect(out?.attachments[1]?.blobRef).toBeNull();
  });
  it("skips other folders and messages without a sender", () => {
    expect(mapGmailMessage("org", "box", msg("x", ["TRASH"]))).toBeNull();
    expect(
      mapGmailMessage("org", "box", { id: "x", threadId: "t", labelIds: ["INBOX"] }),
    ).toBeNull();
  });
});

describe("gmail connector", () => {
  it("reads config from env names only", () => {
    expect(() => readGmailConfig({})).toThrow();
    expect(
      readGmailConfig({
        GMAIL_OAUTH_CLIENT_ID: "a",
        GMAIL_OAUTH_CLIENT_SECRET: "b",
        GMAIL_OAUTH_SCOPES: "x y",
      }).scopes,
    ).toEqual(["x", "y"]);
  });

  it("stores the refresh token only as ciphertext and syncs idempotently", async () => {
    const { connector, credentials, calls } = setup(standard);
    await connector.storeRefreshToken(mb, SECRET);
    expect(await credentials.get("cred-1")).not.toContain(SECRET);
    const repo = createInMemoryMailRepository();
    await repo.createMailbox({
      organizationId: "org",
      id: "box",
      ownerUserId: "u",
      provider: "google",
      status: "connected",
      credentialRef: "cred-1",
      lastSyncAt: null,
      lastError: null,
    });
    const first = await syncMailbox(connector, repo, mb, null);
    expect(first).toEqual({ nextCursor: "500", stored: 3 });
    const again = await syncMailbox(connector, repo, mb, null);
    expect(again.stored).toBe(3);
    const snap = await repo.read("org");
    expect(snap.messages).toHaveLength(3);
    expect(snap.attachments).toHaveLength(6);
    // One token refresh serves all calls (access token cached in memory).
    expect(calls.filter((c) => c.url.includes("/token"))).toHaveLength(1);
  });

  it("uses history cursor and falls back to the window when it expired", async () => {
    const { connector } = setup((req) => {
      if (req.url.includes("/history")) {
        return req.url.includes("startHistoryId=old")
          ? json(404, {})
          : json(200, { history: [{ messagesAdded: [{ message: { id: "m9" } }] }] });
      }
      return standard(req);
    });
    await connector.storeRefreshToken(mb, SECRET);
    expect((await connector.listChanges(mb, "400")).messageIds).toEqual(["m9"]);
    expect((await connector.listChanges(mb, "old")).messageIds).toHaveLength(3);
  });

  it("refreshes once on 401 then reports auth_revoked without leaking tokens", async () => {
    const { connector, calls } = setup((req) => {
      if (req.url.includes("/token")) return json(200, { access_token: ACCESS, expires_in: 3600 });
      return json(401, { error: ACCESS });
    });
    await connector.storeRefreshToken(mb, SECRET);
    const err = await connector.listChanges(mb, null).catch((e) => e);
    expect(err).toBeInstanceOf(ConnectorError);
    expect(err.code).toBe("auth_revoked");
    expect(calls.filter((c) => c.url.includes("/token"))).toHaveLength(2);
    expect(`${err.message}${err.stack}`).not.toContain(ACCESS);
    expect(`${err.message}${err.stack}`).not.toContain(SECRET);
  });

  it("maps revoked refresh token, 429 and 5xx", async () => {
    let mode = "revoked";
    const { connector } = setup((req) => {
      if (req.url.includes("/token")) {
        return mode === "revoked"
          ? json(400, { error: "invalid_grant" })
          : json(200, { access_token: ACCESS });
      }
      return mode === "429" ? json(429, {}, { "retry-after": "17" }) : json(503, {});
    });
    await connector.storeRefreshToken(mb, SECRET);
    expect((await connector.listChanges(mb, null).catch((e) => e)).code).toBe("auth_revoked");
    mode = "429";
    const e429 = await connector.listChanges(mb, null).catch((e) => e);
    expect([e429.code, e429.retryAfterSeconds]).toEqual(["retryable", 17]);
    mode = "503";
    expect((await connector.listChanges(mb, null).catch((e) => e)).code).toBe("retryable");
  });

  it("hides transport failures behind a safe retryable error", async () => {
    const secretBox = createAesGcmSecretBox({
      keys: new Map([["k1", randomBytes(32)]]),
      activeKeyId: "k1",
    });
    const connector = createGmailConnector({
      config,
      secretBox,
      credentials: createInMemoryCredentialStore(),
      transport: async () => {
        throw new Error(`boom ${SECRET}`);
      },
    });
    await connector.storeRefreshToken(mb, SECRET);
    const err = await connector.listChanges(mb, null).catch((e) => e);
    expect(err.code).toBe("retryable");
    expect(err.message).not.toContain(SECRET);
  });

  it("limits initial and incremental queries to the requested folder", async () => {
    const { connector, calls } = setup((req) =>
      req.url.includes("/history?") ? json(200, { history: [] }) : standard(req),
    );
    await connector.storeRefreshToken(mb, SECRET);
    const box = { ...mb, folder: "inbox" as const };
    expect((await connector.listChanges(box, null)).messageIds).toEqual(["m1", "m2"]);
    await connector.listChanges(box, "500");
    expect(
      calls.some((c) => c.url.includes("labelIds=SENT") || c.url.includes("labelId=SENT")),
    ).toBe(false);
    expect(calls.some((c) => c.url.includes("labelId=INBOX"))).toBe(true);
  });

  it("sends raw MIME as base64url", async () => {
    const { connector, calls } = setup((req) =>
      req.url.includes("/token")
        ? json(200, { access_token: ACCESS })
        : json(200, { id: "sent-1" }),
    );
    await connector.storeRefreshToken(mb, SECRET);
    expect(await connector.sendRaw(mb, "Subject: a\r\n\r\nb")).toEqual({
      providerMessageKey: "sent-1",
    });
    expect(JSON.parse(calls[1]?.body ?? "{}").raw).toBe(
      Buffer.from("Subject: a\r\n\r\nb").toString("base64url"),
    );
  });

  it("disconnect deletes the secret and stops further calls", async () => {
    const { connector, credentials, calls } = setup(standard);
    await connector.storeRefreshToken(mb, SECRET);
    await connector.listChanges(mb, null);
    await connector.revoke(mb);
    expect(calls.some((c) => c.url.includes("/revoke"))).toBe(true);
    await connector.disconnect(mb);
    expect(await credentials.get("cred-1")).toBeNull();
    const before = calls.length;
    expect((await connector.listChanges(mb, null).catch((e) => e)).code).toBe("disconnected");
    expect(calls.length).toBe(before);
  });
});
