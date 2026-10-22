import type { SecretBox } from "../../../secrets/secret-box";
import { type GmailMessage, mapGmailMessage } from "./mapping";
import {
  type ChangeSet,
  ConnectorError,
  type ConnectorMailbox,
  type MailConnector,
  type MappedMessage,
} from "./port";
import type { GmailConfig, HttpRequest, HttpResponse, HttpTransport } from "./transport";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const PURPOSE = "mail-refresh-token";

/** Stores only SecretBox ciphertext, addressed by the mailbox's opaque credentialRef. */
export interface CredentialStore {
  get(credentialRef: string): Promise<string | null>;
  put(credentialRef: string, sealed: string): Promise<void>;
  delete(credentialRef: string): Promise<void>;
}

export function createInMemoryCredentialStore(): CredentialStore {
  const data = new Map<string, string>();
  return {
    get: async (ref) => data.get(ref) ?? null,
    put: async (ref, sealed) => void data.set(ref, sealed),
    delete: async (ref) => void data.delete(ref),
  };
}

export interface GmailConnectorOptions {
  config: GmailConfig;
  transport: HttpTransport;
  secretBox: SecretBox;
  credentials: CredentialStore;
  now?: () => number;
}

const retryAfter = (res: HttpResponse): number | null => {
  const n = Number(res.headers["retry-after"]);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function classify(res: HttpResponse): ConnectorError | null {
  if (res.status >= 200 && res.status < 300) return null;
  if (res.status === 429 || res.status >= 500) {
    return new ConnectorError("retryable", retryAfter(res));
  }
  return new ConnectorError("permanent");
}

export function createGmailConnector(options: GmailConnectorOptions): MailConnector & {
  /** Seals and stores the refresh token from the OAuth callback. */
  storeRefreshToken(mailbox: ConnectorMailbox, refreshToken: string): Promise<void>;
} {
  const { config, transport, secretBox, credentials } = options;
  const now = options.now ?? Date.now;
  /** Access tokens live in memory only, keyed by credentialRef. */
  const access = new Map<string, { token: string; expiresAt: number }>();
  const dead = new Set<string>();

  const aad = (m: ConnectorMailbox) => ({ organizationId: m.organizationId, purpose: PURPOSE });

  async function send(req: HttpRequest): Promise<HttpResponse> {
    try {
      return await transport(req);
    } catch {
      // Transport errors may embed request details; surface a safe class only.
      throw new ConnectorError("retryable");
    }
  }

  async function refresh(m: ConnectorMailbox): Promise<string> {
    const sealed = await credentials.get(m.credentialRef);
    if (!sealed) throw new ConnectorError("disconnected");
    let refreshToken: string;
    try {
      refreshToken = secretBox.open(sealed, aad(m));
    } catch {
      throw new ConnectorError("permanent");
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }).toString();
    const res = await send({
      method: "POST",
      url: TOKEN_URL,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (res.status === 400 || res.status === 401) throw new ConnectorError("auth_revoked");
    const err = classify(res);
    if (err) throw err;
    let parsed: { access_token?: string; expires_in?: number };
    try {
      parsed = JSON.parse(res.body);
    } catch {
      throw new ConnectorError("permanent");
    }
    if (!parsed.access_token) throw new ConnectorError("permanent");
    access.set(m.credentialRef, {
      token: parsed.access_token,
      expiresAt: now() + Math.max(0, (parsed.expires_in ?? 3600) - 60) * 1000,
    });
    return parsed.access_token;
  }

  async function token(m: ConnectorMailbox): Promise<string> {
    if (dead.has(m.credentialRef)) throw new ConnectorError("disconnected");
    const cached = access.get(m.credentialRef);
    if (cached && cached.expiresAt > now()) return cached.token;
    return refresh(m);
  }

  /** One authorised call; a 401 triggers exactly one refresh, then `auth_revoked`. */
  async function call(
    m: ConnectorMailbox,
    method: "GET" | "POST",
    url: string,
    json?: unknown,
  ): Promise<unknown> {
    let bearer = await token(m);
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await send({
        method,
        url,
        headers: {
          authorization: `Bearer ${bearer}`,
          ...(json === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(json === undefined ? {} : { body: JSON.stringify(json) }),
      });
      if (res.status === 401) {
        access.delete(m.credentialRef);
        if (attempt === 1) throw new ConnectorError("auth_revoked");
        bearer = await refresh(m);
        continue;
      }
      const err = classify(res);
      if (err) throw Object.assign(err, { httpStatus: res.status });
      try {
        return JSON.parse(res.body);
      } catch {
        throw new ConnectorError("permanent");
      }
    }
    throw new ConnectorError("auth_revoked");
  }

  const listIds = async (m: ConnectorMailbox, url: string, key: string) => {
    const ids: string[] = [];
    let page: string | undefined;
    do {
      const data = (await call(
        m,
        "GET",
        page ? `${url}&pageToken=${encodeURIComponent(page)}` : url,
      )) as {
        nextPageToken?: string;
        [k: string]: unknown;
      };
      ids.push(...extract(data, key));
      page = data.nextPageToken;
    } while (page);
    return ids;
  };

  return {
    async storeRefreshToken(m, refreshToken) {
      dead.delete(m.credentialRef);
      await credentials.put(m.credentialRef, secretBox.seal(refreshToken, aad(m)));
    },

    async listChanges(m, cursor): Promise<ChangeSet> {
      const profile = (await call(m, "GET", `${API}/profile`)) as { historyId?: string };
      const head = String(profile.historyId ?? "");
      if (!head) throw new ConnectorError("permanent");
      const seen = new Set<string>();
      const ordered: string[] = [];
      const add = (ids: string[]) => {
        for (const id of ids)
          if (!seen.has(id)) {
            seen.add(id);
            ordered.push(id);
          }
      };
      const initial = async () => {
        for (const label of m.folder ? [m.folder.toUpperCase()] : ["INBOX", "SENT"]) {
          const q = encodeURIComponent(`newer_than:${config.syncWindowDays}d`);
          add(
            await listIds(m, `${API}/messages?labelIds=${label}&q=${q}&maxResults=100`, "messages"),
          );
        }
        // List order is newest first; process oldest first.
        ordered.reverse();
      };
      if (cursor === null) await initial();
      else {
        try {
          for (const label of m.folder ? [m.folder.toUpperCase()] : ["INBOX", "SENT"]) {
            add(
              await listIds(
                m,
                `${API}/history?startHistoryId=${encodeURIComponent(cursor)}&historyTypes=messageAdded&labelId=${label}&maxResults=100`,
                "history",
              ),
            );
          }
        } catch (e) {
          // Expired history id: fall back to the bounded initial window.
          if ((e as { httpStatus?: number }).httpStatus === 404) {
            seen.clear();
            ordered.length = 0;
            await initial();
          } else throw e;
        }
      }
      return { messageIds: ordered, nextCursor: head };
    },

    async fetchMessage(m, messageId): Promise<MappedMessage | null> {
      try {
        const gm = (await call(
          m,
          "GET",
          `${API}/messages/${encodeURIComponent(messageId)}?format=full`,
        )) as GmailMessage;
        return mapGmailMessage(m.organizationId, m.id, gm);
      } catch (e) {
        if ((e as { httpStatus?: number }).httpStatus === 404) return null;
        throw e;
      }
    },

    async sendRaw(m, rawMime) {
      const raw = Buffer.from(rawMime, "utf8").toString("base64url");
      const data = (await call(m, "POST", `${API}/messages/send`, { raw })) as { id?: string };
      if (!data.id) throw new ConnectorError("permanent");
      return { providerMessageKey: data.id };
    },

    async revoke(m) {
      const sealed = await credentials.get(m.credentialRef);
      if (!sealed) return;
      let refreshToken: string;
      try {
        refreshToken = secretBox.open(sealed, aad(m));
      } catch {
        return;
      }
      // Best effort: the secret is deleted by `disconnect` either way.
      await send({
        method: "POST",
        url: REVOKE_URL,
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken }).toString(),
      });
    },

    async disconnect(m) {
      await credentials.delete(m.credentialRef);
      access.delete(m.credentialRef);
      dead.add(m.credentialRef);
    },
  };
}

function extract(data: Record<string, unknown>, key: string): string[] {
  if (key === "messages") {
    return ((data.messages as { id: string }[] | undefined) ?? []).map((x) => x.id);
  }
  const out: string[] = [];
  for (const h of (data.history as
    | { messagesAdded?: { message: { id: string } }[] }[]
    | undefined) ?? []) {
    for (const a of h.messagesAdded ?? []) out.push(a.message.id);
  }
  return out;
}
