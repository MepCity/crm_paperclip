/** Extracts message ids (`<id>`) from a `References` / `In-Reply-To` value: ordered, de-duplicated, lowercase-insensitive on nothing (ids are case-sensitive). */
export function parseReferences(headerValue: string | null | undefined): string[] {
  if (!headerValue) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of headerValue.matchAll(/<([^<>\s]+)>/g)) {
    const id = m[1] as string;
    if (!id.includes("@") || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

const PREFIX = /^(?:(?:re|fwd?|aw|wg)\s*:\s*|\[[^\]]*\]\s*)/i;

/** Strips repeated reply/forward prefixes and leading list tags, collapses whitespace. */
export function normalizeSubject(subject: string): string {
  let s = subject.replace(/\s+/g, " ").trim();
  for (;;) {
    const next = s.replace(PREFIX, "").trim();
    if (next === s) break;
    s = next;
  }
  return s;
}
