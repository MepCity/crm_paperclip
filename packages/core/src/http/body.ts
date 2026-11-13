/**
 * Reads a request body with a byte cap enforced while streaming, so an oversized or
 * chunked body is never buffered whole before the limit is checked.
 * Returns `null` when the body is larger than `maxBytes`.
 */
export async function readBoundedBody(request: Request, maxBytes: number): Promise<string | null> {
  const declared = request.headers.get("content-length");
  if (declared) {
    const length = Number.parseInt(declared, 10);
    if (Number.isFinite(length) && length > maxBytes) return null;
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}
