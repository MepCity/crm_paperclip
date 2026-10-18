/**
 * Safely parse and validate an attachment link URL.
 * Accepts only http and https protocols with non-empty hostname.
 * Length must be <= 2048.
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
      parsed.hostname.length > 0
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}
