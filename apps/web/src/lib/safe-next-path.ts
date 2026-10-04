/**
 * Keeps post-auth navigation on this site.
 *
 * A value is accepted only when it starts with a single "/", contains no
 * ASCII control character and no backslash, and resolves to the same origin
 * as a fixed base. The result is the resolved path, query, and hash.
 * Anything else becomes "/".
 */
const SAFE_NEXT_BASE = "https://app.test";

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  if (value.includes("\\") || hasAsciiControl(value)) {
    return "/";
  }

  let url: URL;
  try {
    url = new URL(value, SAFE_NEXT_BASE);
  } catch {
    return "/";
  }
  if (url.origin !== SAFE_NEXT_BASE) {
    return "/";
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Keeps a safe destination when linking between the auth screens. */
export function hrefWithNext(path: "/sign-in" | "/sign-up", next: string): string {
  if (next === "/") return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

export function readNextParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return safeNextPath(raw);
}
