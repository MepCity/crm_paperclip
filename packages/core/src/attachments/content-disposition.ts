export const ATTACHMENT_DOWNLOAD_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "private, no-store",
});

/** Encodes a display basename without allowing quoted-string or header injection. */
export function contentDispositionAttachment(fileName: string): string {
  const base = fileName.slice(Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\")) + 1);
  const name =
    Array.from(base)
      .filter((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code > 0x1f && code !== 0x7f;
      })
      .join("") || "download";
  const fallback = Array.from(name, (character) =>
    /[^\x20-\x7e]|["\\]/.test(character) ? "_" : character,
  ).join("");
  const encoded = Array.from(new TextEncoder().encode(name), (byte) => {
    const character = String.fromCharCode(byte);
    return /^[A-Za-z0-9!#$&+\-.^_`|~]$/.test(character)
      ? character
      : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }).join("");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
