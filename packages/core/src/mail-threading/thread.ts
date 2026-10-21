import { normalizeAddress } from "./address";
import { normalizeSubject, parseReferences } from "./headers";
import type { KnownThread, ThreadingMessage, ThreadResolution } from "./types";

export const SUBJECT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function addressSet(list: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const a of list) {
    const n = normalizeAddress(a);
    if (n) out.add(n);
  }
  return out;
}

function newKey(message: ThreadingMessage): string {
  const own = parseReferences(message.messageId)[0];
  if (own) return `mid:${own}`;
  const parts = [...addressSet(message.participants)].sort().join(",");
  return `hash:${fnv1a(`${normalizeSubject(message.subject).toLowerCase()}|${parts}|${message.sentAt}`)}`;
}

/** Option C: provider id, then headers, then guarded subject fallback, else a new thread. Pure and deterministic. */
export function resolveThread(
  message: ThreadingMessage,
  knownThreads: readonly KnownThread[],
): ThreadResolution {
  const provider = message.providerThreadId?.trim();
  if (provider) return { threadKey: provider, source: "provider" };

  const byMessageId = new Map<string, string>();
  for (const t of knownThreads) {
    for (const raw of t.messageIds) {
      const id = parseReferences(raw.startsWith("<") ? raw : `<${raw}>`)[0];
      if (id && !byMessageId.has(id)) byMessageId.set(id, t.threadKey);
    }
  }
  const refs = [
    ...parseReferences(message.inReplyTo),
    ...parseReferences(message.references).reverse(),
  ];
  for (const id of refs) {
    const key = byMessageId.get(id);
    if (key) return { threadKey: key, source: "headers" };
  }

  const subject = normalizeSubject(message.subject).toLowerCase();
  if (subject) {
    const mine = addressSet(message.participants);
    const candidates = knownThreads
      .filter((t) => {
        if (normalizeSubject(t.subject).toLowerCase() !== subject) return false;
        if (Math.abs(message.sentAt - t.lastMessageAt) > SUBJECT_WINDOW_MS) return false;
        for (const a of addressSet(t.participants)) if (mine.has(a)) return true;
        return false;
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt || a.threadKey.localeCompare(b.threadKey));
    if (candidates[0]) return { threadKey: candidates[0].threadKey, source: "subject" };
  }

  return { threadKey: newKey(message), source: "new" };
}
