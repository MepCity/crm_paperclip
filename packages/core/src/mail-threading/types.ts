/** A message as seen by the threading functions. Addresses are raw header values or already normalized. */
export interface ThreadingMessage {
  /** Provider thread id (Gmail `threadId`, Graph `conversationId`), when the provider has one. */
  providerThreadId?: string | null;
  /** Own `Message-ID` header value. */
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
  subject: string;
  /** From / To / Cc addresses. */
  participants: readonly string[];
  /** Sent or received time, epoch milliseconds. */
  sentAt: number;
}

/** A thread already known to the caller. */
export interface KnownThread {
  threadKey: string;
  /** Message ids (angle brackets optional) of messages in this thread. */
  messageIds: readonly string[];
  /** Subject of the thread, raw or normalized. */
  subject: string;
  participants: readonly string[];
  /** Time of the latest message, epoch milliseconds. */
  lastMessageAt: number;
}

export type ThreadSource = "provider" | "headers" | "subject" | "new";

export interface ThreadResolution {
  threadKey: string;
  source: ThreadSource;
}

export type RecordKind = "lead" | "contact" | "account";

export interface RecordEmail {
  kind: RecordKind;
  recordId: string;
  email: string;
}

export interface RecordLinkMatch {
  address: string;
  kind: RecordKind;
  recordId: string;
}

export interface RecordLinkResult {
  matches: RecordLinkMatch[];
  /** True when one address matches more than one distinct record. */
  ambiguous: boolean;
}
