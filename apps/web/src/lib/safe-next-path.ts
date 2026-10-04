/**
 * Keeps post-auth navigation on this site.
 * A usable value is a relative path: it starts with "/" and does not start
 * with "//" or "/\". Anything else, including a full URL or a scheme, becomes "/".
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
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
