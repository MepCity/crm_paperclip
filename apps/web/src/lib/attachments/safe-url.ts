/**
 * Normalises an attachment link URL:
 * - string only, trimmed, max 2,048 chars
 * - must parse with `new URL(value)` as an absolute URL
 * - protocol is exactly `http:` or `https:`
 * - host/hostname is non-empty
 * Returns the normalized `url.href`, or null if invalid.
 */
export function safeAttachmentUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length > 0 &&
      parsed.href.length <= 2048
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}
