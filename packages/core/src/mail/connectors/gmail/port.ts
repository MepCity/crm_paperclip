import type { MailAttachmentMeta, MailFolder, MailThread, UpsertMailMessage } from "../../types";

/** Safe, public failure classes. Messages never carry provider bodies or tokens. */
export type ConnectorErrorCode = "auth_revoked" | "retryable" | "permanent" | "disconnected";

export class ConnectorError extends Error {
  readonly code: ConnectorErrorCode;
  readonly retryAfterSeconds: number | null;
  constructor(code: ConnectorErrorCode, retryAfterSeconds: number | null = null) {
    super(`Mail connector error: ${code}`);
    this.name = "ConnectorError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** A send may have been accepted; it must never be automatically replayed. */
export class GmailDeliveryUnknownError extends Error {
  constructor() {
    super("Mail delivery outcome is unknown");
    this.name = "GmailDeliveryUnknownError";
  }
}

/** Identifies one mailbox for a connector call; `credentialRef` is the opaque locator. */
export interface ConnectorMailbox {
  organizationId: string;
  id: string;
  credentialRef: string;
  /** Omitted by legacy callers to scan both supported folders. */
  folder?: Exclude<MailFolder, "draft">;
}

export interface ChangeSet {
  /** Provider message ids to fetch, oldest first, de-duplicated. */
  messageIds: string[];
  /** Opaque cursor (history id) to persist after the changes are applied. */
  nextCursor: string;
}

export interface MappedMessage {
  thread: MailThread;
  message: UpsertMailMessage;
  attachments: MailAttachmentMeta[];
}

/** Provider-neutral port. Cursor replay is safe: all outputs are keyed by provider ids. */
export interface MailConnector {
  /** `cursor === null` starts the initial window (inbox + sent, last N days). */
  listChanges(mailbox: ConnectorMailbox, cursor: string | null): Promise<ChangeSet>;
  /** Returns null for messages outside inbox/sent or without a usable sender. */
  fetchMessage(mailbox: ConnectorMailbox, messageId: string): Promise<MappedMessage | null>;
  sendRaw(
    mailbox: ConnectorMailbox,
    rawMime: string,
    signal?: AbortSignal,
  ): Promise<{ providerMessageKey: string }>;
  revoke(mailbox: ConnectorMailbox): Promise<void>;
  /** Deletes the stored secret and drops cached tokens; later calls throw `disconnected`. */
  disconnect(mailbox: ConnectorMailbox): Promise<void>;
}

export type { MailFolder };
