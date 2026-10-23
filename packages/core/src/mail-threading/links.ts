import { normalizeAddress } from "./address";
import type { RecordEmail, RecordLinkMatch, RecordLinkResult } from "./types";

/** Exact, case-insensitive address match against record email entries. Domain matching is deferred (ADR 0009). */
export function matchRecordLinks(
  participants: readonly string[],
  recordEmails: readonly RecordEmail[],
): RecordLinkResult {
  const index = new Map<string, RecordEmail[]>();
  for (const r of recordEmails) {
    const n = normalizeAddress(r.email);
    if (!n) continue;
    const list = index.get(n) ?? [];
    list.push(r);
    index.set(n, list);
  }
  const matches: RecordLinkMatch[] = [];
  const seen = new Set<string>();
  let ambiguous = false;
  for (const p of participants) {
    const n = normalizeAddress(p);
    if (!n) continue;
    const hits = index.get(n) ?? [];
    const distinct = new Set<string>();
    for (const h of hits) {
      const key = `${n}|${h.kind}|${h.recordId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({ address: n, kind: h.kind, recordId: h.recordId });
    }
    for (const h of hits) distinct.add(`${h.kind}|${h.recordId}`);
    if (distinct.size > 1) ambiguous = true;
  }
  return { matches, ambiguous };
}
