import { parseImipReply } from "./imip-reply";
import { type ImipRequest, parseImipRequest } from "./imip-request";
import { applyImipReply, type InvitationState } from "./rsvp";

export interface InvitationStateStore {
  get(organizationId: string, uid: string): Promise<InvitationState | null>;
  put(organizationId: string, state: InvitationState): Promise<void>;
}

export interface IncomingInvitationStore {
  /** Latest request per (organization, UID); an older SEQUENCE never replaces a newer one. */
  put(organizationId: string, request: ImipRequest): Promise<void>;
  get(organizationId: string, uid: string): Promise<ImipRequest | null>;
  list(organizationId: string): Promise<ImipRequest[]>;
}

/** Remembers which messages were already processed so a re-sync applies nothing twice. */
export interface ProcessedMessageStore {
  markIfNew(organizationId: string, messageId: string): Promise<boolean>;
}

const key = (organizationId: string, uid: string) => JSON.stringify([organizationId, uid]);

export function createInMemoryInvitationStateStore(): InvitationStateStore {
  const map = new Map<string, InvitationState>();
  return {
    async get(o, uid) {
      return map.get(key(o, uid)) ?? null;
    },
    async put(o, state) {
      map.set(key(o, state.uid), state);
    },
  };
}

export function createInMemoryIncomingInvitationStore(): IncomingInvitationStore {
  const map = new Map<string, ImipRequest>();
  return {
    async put(o, request) {
      const k = key(o, request.uid);
      const current = map.get(k);
      if (current && current.sequence > request.sequence) return;
      map.set(k, request);
    },
    async get(o, uid) {
      return map.get(key(o, uid)) ?? null;
    },
    async list(o) {
      return [...map.entries()]
        .filter(([k]) => (JSON.parse(k) as string[])[0] === o)
        .map(([, v]) => v);
    },
  };
}

export function createInMemoryProcessedMessageStore(): ProcessedMessageStore {
  const seen = new Set<string>();
  return {
    async markIfNew(o, messageId) {
      const k = key(o, messageId);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    },
  };
}

export interface InvitationSyncStats {
  replyApplied: number;
  replyStale: number;
  replyUnknownEvent: number;
  replyUnknownAttendee: number;
  replySenderMismatch: number;
  requestOwnOrganizer: number;
  requestStored: number;
  cancelStored: number;
  parseFailures: number;
  duplicates: number;
}

export function emptyInvitationSyncStats(): InvitationSyncStats {
  return {
    replyApplied: 0,
    replyStale: 0,
    replyUnknownEvent: 0,
    replyUnknownAttendee: 0,
    replySenderMismatch: 0,
    requestOwnOrganizer: 0,
    requestStored: 0,
    cancelStored: 0,
    parseFailures: 0,
    duplicates: 0,
  };
}

export interface InvitationProcessor {
  states: InvitationStateStore;
  incoming: IncomingInvitationStore;
  processed: ProcessedMessageStore;
  stats: InvitationSyncStats;
}

export function createInvitationProcessor(
  parts: Partial<Omit<InvitationProcessor, "stats">> = {},
): InvitationProcessor {
  return {
    states: parts.states ?? createInMemoryInvitationStateStore(),
    incoming: parts.incoming ?? createInMemoryIncomingInvitationStore(),
    processed: parts.processed ?? createInMemoryProcessedMessageStore(),
    stats: emptyInvitationSyncStats(),
  };
}

function methodOf(ics: string): string | null {
  const m = /^METHOD(?:;[^:\r\n]*)?:\s*([A-Za-z-]+)\s*$/im.exec(ics);
  return m?.[1] ? m[1].toUpperCase() : null;
}

/** Who sent the message and which addresses belong to the receiving mailbox. */
export interface MessageAddressContext {
  sender: string;
  mailboxAddresses: readonly string[];
}

const normalizeAddress = (a: string) =>
  a
    .trim()
    .replace(/^mailto:/i, "")
    .toLowerCase();

/** Processes one text/calendar body of a synced message. Never throws on bad calendar data. */
export async function processCalendarPart(
  p: InvitationProcessor,
  organizationId: string,
  ics: string,
  context?: MessageAddressContext,
): Promise<void> {
  try {
    const method = methodOf(ics);
    if (method === "REPLY") {
      const reply = parseImipReply(ics);
      if (context && normalizeAddress(context.sender) !== normalizeAddress(reply.attendee.email)) {
        p.stats.replySenderMismatch++;
        return;
      }
      const state = await p.states.get(organizationId, reply.uid);
      if (!state) {
        p.stats.replyUnknownEvent++;
        return;
      }
      const { outcome, next } = applyImipReply(state, reply);
      if (outcome === "applied") {
        await p.states.put(organizationId, next);
        p.stats.replyApplied++;
      } else if (outcome === "stale") p.stats.replyStale++;
      else if (outcome === "unknown_event") p.stats.replyUnknownEvent++;
      else p.stats.replyUnknownAttendee++;
    } else if (method === "REQUEST" || method === "CANCEL") {
      const request = parseImipRequest(ics);
      const organizer = normalizeAddress(request.organizer.email);
      if (context?.mailboxAddresses.some((a) => normalizeAddress(a) === organizer)) {
        p.stats.requestOwnOrganizer++;
        return;
      }
      await p.incoming.put(organizationId, request);
      if (request.method === "REQUEST") p.stats.requestStored++;
      else p.stats.cancelStored++;
    }
  } catch {
    p.stats.parseFailures++;
  }
}

export async function processMessageCalendarParts(
  p: InvitationProcessor,
  organizationId: string,
  messageId: string,
  parts: readonly string[],
  context?: MessageAddressContext,
): Promise<void> {
  if (parts.length === 0) return;
  if (!(await p.processed.markIfNew(organizationId, messageId))) {
    p.stats.duplicates++;
    return;
  }
  for (const ics of parts) await processCalendarPart(p, organizationId, ics, context);
}
