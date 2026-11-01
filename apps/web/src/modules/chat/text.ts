/**
 * Plain-text helpers for chat messages: auto-linking, mentions, day labels.
 * Refs: MEP-1420, ADR 0015 §7.3
 */
import type { ChatMemberView } from "./data";

export type TextPart =
  | { kind: "text"; value: string }
  | { kind: "link"; value: string; href: string };

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/;

/** Splits message text into plain and link parts; only http(s) URLs become links. */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    let url = match[0];
    const trailing = url.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    if (trailing) url = url.slice(0, -trailing.length);
    if (start > last) parts.push({ kind: "text", value: text.slice(last, start) });
    parts.push({ kind: "link", value: url, href: url });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

/** Mention ids whose `@Name` still appears in the body (picked or already stored). */
export function extractMentions(
  body: string,
  candidates: readonly ChatMemberView[],
  alreadyMentioned: readonly string[] = [],
): string[] {
  const ids: string[] = [];
  for (const member of candidates) {
    if (!member.name) continue;
    if (body.includes(`@${member.name}`)) ids.push(member.id);
  }
  // Keep stored mentions that cannot be re-resolved (member left the conversation).
  for (const id of alreadyMentioned) {
    if (!ids.includes(id) && !candidates.some((m) => m.id === id)) ids.push(id);
  }
  return ids;
}

/** Local calendar day key, e.g. `2026-11-01`. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function dayDiff(iso: string, now: Date = new Date()): number {
  const d = new Date(iso);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}
