/**
 * RFC 3464 Delivery Status Notification (DSN) parser.
 *
 * Pure function — no I/O, no side effects, no persistence.
 * Wiring into the mail pipeline is a later slice.
 */

export type BounceKind = "permanent" | "transient" | "other";

export interface RecipientReport {
  /** rfc822; address value (unquoted). */
  finalRecipient: string;
  /** Raw Action field value (e.g. "failed", "delayed", "delivered"). */
  action: string;
  /** Raw Status field value (e.g. "5.1.1"). */
  status: string;
  /** Raw Diagnostic-Code value, or null when absent. */
  diagnosticCode: string | null;
  /** Derived bounce kind from status / action. */
  kind: BounceKind;
}

export interface DeliveryReport {
  /** Message-ID of the original message, when recoverable. */
  originalMessageId: string | null;
  recipients: RecipientReport[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Unfold RFC 5322 header continuation lines (CRLF or LF followed by WSP). */
function unfoldHeaders(raw: string): string {
  return raw.replace(/\r?\n[ \t]+/g, " ");
}

/**
 * Parse a block of RFC 5322-style header lines into a name→value map.
 * Names are lowercased; values are trimmed and unfolded.
 */
function parseHeaders(block: string): Map<string, string> {
  const map = new Map<string, string>();
  const unfolded = unfoldHeaders(block);
  for (const line of unfolded.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    // Keep the first occurrence (RFC 5322 §3.6 allows duplicates; first wins here).
    if (!map.has(name)) map.set(name, value);
  }
  return map;
}

/**
 * Split a multipart body into its constituent parts.
 * Returns the raw text of each part (headers + body), without the boundary lines.
 */
function splitMultipart(body: string, boundary: string): string[] {
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;
  const lines = body.split(/\r?\n/);
  const parts: string[] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed === closeDelimiter) {
      if (current !== null) parts.push(current.join("\n"));
      break;
    }
    if (trimmed === delimiter) {
      if (current !== null) parts.push(current.join("\n"));
      current = [];
    } else if (current !== null) {
      current.push(line);
    }
  }
  return parts;
}

/**
 * Extract the content-type and an optional parameter map from a Content-Type header value.
 * Example: `multipart/report; report-type=delivery-status; boundary="dsn-boundary"`
 */
function parseContentType(value: string): { type: string; params: Map<string, string> } {
  const parts = value.split(";");
  const [typeRaw, ...paramParts] = parts;
  const type = (typeRaw ?? "").trim().toLowerCase();
  const params = new Map<string, string>();
  for (const part of paramParts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const val = part
      .slice(eq + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
    params.set(key, val);
  }
  return { type, params };
}

/**
 * Derive the bounce kind from an RFC 3464 status code and action field.
 *
 * - `permanent`: status starts with "5." OR action is "failed"
 * - `transient`: status starts with "4." OR action is "delayed"
 * - `other`: anything else
 */
function deriveKind(status: string, action: string): BounceKind {
  const s = status.trim();
  const a = action.trim().toLowerCase();
  if (s.startsWith("5.") || a === "failed") return "permanent";
  if (s.startsWith("4.") || a === "delayed") return "transient";
  return "other";
}

/**
 * Extract the address portion from a Final-Recipient field value.
 * RFC 3464 format: `address-type; address` (e.g. `rfc822; nobody@example.org`).
 */
function extractFinalRecipientAddress(value: string): string {
  const semicolon = value.indexOf(";");
  return semicolon >= 0 ? value.slice(semicolon + 1).trim() : value.trim();
}

/**
 * Extract a Message-ID header value from a raw part string.
 * Returns the first found `<...>` form, or null.
 */
function extractMessageId(partText: string): string | null {
  // Split on the header/body separator
  const sepIdx = partText.search(/\r?\n\r?\n/);
  const headerSection = sepIdx >= 0 ? partText.slice(0, sepIdx) : partText;
  const headers = parseHeaders(headerSection);
  const mid = headers.get("message-id");
  if (!mid) return null;
  // Normalise to bare <id@host> form
  const m = /<[^<>\s]+>/.exec(mid);
  return m ? m[0] : mid;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a raw email string and, if it is a `multipart/report` DSN, return a
 * {@link DeliveryReport}. Returns `null` for any non-DSN message.
 */
export function parseDeliveryStatus(raw: string): DeliveryReport | null {
  // Locate the header/body boundary
  const sepIdx = raw.search(/\r?\n\r?\n/);
  if (sepIdx < 0) return null;

  const outerHeaders = parseHeaders(raw.slice(0, sepIdx));
  const outerBody = raw.slice(sepIdx).replace(/^\r?\n/, "");

  const contentTypeHeader = outerHeaders.get("content-type");
  if (!contentTypeHeader) return null;

  const { type, params } = parseContentType(contentTypeHeader);

  // Must be multipart/report with report-type=delivery-status
  if (type !== "multipart/report") return null;
  const reportType = params.get("report-type")?.toLowerCase();
  if (reportType !== "delivery-status") return null;

  const boundary = params.get("boundary");
  if (!boundary) return null;

  const parts = splitMultipart(outerBody, boundary);
  if (parts.length === 0) return null;

  let originalMessageId: string | null = null;
  const recipients: RecipientReport[] = [];

  for (const part of parts) {
    // Each part has its own headers + blank line + body
    const partSepIdx = part.search(/\r?\n\r?\n/);
    const partHeaderText = partSepIdx >= 0 ? part.slice(0, partSepIdx) : part;
    const partBody = partSepIdx >= 0 ? part.slice(partSepIdx).replace(/^\r?\n/, "") : "";

    const partHeaders = parseHeaders(partHeaderText);
    const partCT = partHeaders.get("content-type");
    if (!partCT) continue;

    const { type: partType } = parseContentType(partCT);

    if (partType === "message/delivery-status") {
      // The delivery-status body may contain multiple per-recipient blocks
      // separated by blank lines. The first block (before any blank line) is
      // the per-message block (Reporting-MTA etc.); subsequent blocks are per-
      // recipient. We parse each block that contains a Final-Recipient header.
      const blocks = partBody.split(/(?:\r?\n){2,}/);
      for (const block of blocks) {
        if (!block.trim()) continue;
        const blockHeaders = parseHeaders(block);
        const finalRecipientRaw = blockHeaders.get("final-recipient");
        if (!finalRecipientRaw) continue;
        const action = blockHeaders.get("action") ?? "";
        const status = blockHeaders.get("status") ?? "";
        const diagnosticCode = blockHeaders.get("diagnostic-code") ?? null;
        recipients.push({
          finalRecipient: extractFinalRecipientAddress(finalRecipientRaw),
          action,
          status,
          diagnosticCode,
          kind: deriveKind(status, action),
        });
      }
    } else if (partType === "message/rfc822" || partType === "text/rfc822-headers") {
      // Extract Message-ID from the original message headers
      if (originalMessageId === null) {
        originalMessageId = extractMessageId(partBody);
      }
    }
  }

  return { originalMessageId, recipients };
}
