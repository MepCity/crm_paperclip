import { createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { parseEnv } from "../env";

export interface RenderTokenPayload {
  orgId: string;
  formId: string;
  versionId: string;
  issuedAt: number;
  challengeHash?: string;
}

/**
 * Resolves the application secret used for HMAC signing of render tokens and client hashes.
 *
 * Security contract (ADR 0019 §3.2, §3.5):
 * - In non-test environments (production, staging, dev), APP_SECRET is mandatory and must contain
 *   at least 32 characters, validated via core env parsing. If missing or invalid, it fails closed (throws).
 * - In test environments (`NODE_ENV === "test"` or `VITEST`), a fallback test secret is permitted
 *   so unit tests can run without full environment bootstrapping.
 */
export function getAppSecret(envSource: Record<string, string | undefined> = process.env): string {
  const directSecret = envSource.APP_SECRET;
  if (directSecret) {
    if (directSecret.length < 32) {
      throw new Error("APP_SECRET must contain at least 32 characters");
    }
    return directSecret;
  }

  try {
    const env = parseEnv(envSource);
    return env.APP_SECRET;
  } catch (err) {
    const isTest = envSource.NODE_ENV === "test" || Boolean(envSource.VITEST);
    if (isTest) {
      return "default-webforms-token-secret-at-least-32-chars-long-for-tests";
    }
    throw new Error(
      `APP_SECRET is required and must contain at least 32 characters in production: ${
        err instanceof Error ? err.message : "Missing secret"
      }`,
    );
  }
}

/**
 * Derives an independent key for one purpose from the application secret (HKDF-SHA256), so a
 * token minted for one purpose can never be replayed as another. Public form keys and the
 * authentication library keep using the raw secret: they are persisted or already issued, and
 * re-keying would invalidate existing forms and sessions. Render tokens, challenge hashes and
 * client hashes are short-lived, so they moved to derived keys; tokens issued before this change
 * stop verifying (at most 2 h of open forms) and nothing else is affected.
 */
export function derivePurposeKey(purpose: string, secret = getAppSecret()): string {
  return Buffer.from(
    hkdfSync("sha256", secret, "crm-purpose-key-v1", `purpose:${purpose}`, 32),
  ).toString("base64url");
}

export function derivePublicKey(
  orgId: string,
  formId: string,
  createdAt: Date | string | number,
): { publicKey: string; keyHash: string } {
  const secret = getAppSecret();
  const timeMs = typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();
  const rawKey = createHmac("sha256", secret)
    .update(`webform_key:${orgId}:${formId}:${timeMs}`)
    .digest()
    .subarray(0, 16)
    .toString("base64url");
  const keyHash = createHash("sha256").update(rawKey).digest("base64url");
  return { publicKey: rawKey, keyHash };
}

export function computeClientHash(ip: string, secret = derivePurposeKey("client-hash")): string {
  return createHmac("sha256", secret)
    .update(ip.trim() || "unknown")
    .digest("base64url");
}

export function createRenderToken(
  payload: RenderTokenPayload,
  secret = derivePurposeKey("render-token"),
): string {
  const jsonStr = JSON.stringify({
    orgId: payload.orgId,
    formId: payload.formId,
    versionId: payload.versionId,
    issuedAt: payload.issuedAt,
    ...(payload.challengeHash ? { challengeHash: payload.challengeHash } : {}),
  });
  const data = Buffer.from(jsonStr, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyRenderToken(
  token: string,
  secret = derivePurposeKey("render-token"),
): { ok: true; payload: RenderTokenPayload } | { ok: false; reason: "tampered" | "malformed" } {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "malformed" };
  }
  const [data, sig] = parts as [string, string];
  const expectedSig = createHmac("sha256", secret).update(data).digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { ok: false, reason: "tampered" };
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf8");
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    if (
      typeof parsed.orgId !== "string" ||
      typeof parsed.formId !== "string" ||
      typeof parsed.versionId !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      !Number.isFinite(parsed.issuedAt)
    ) {
      return { ok: false, reason: "malformed" };
    }
    return {
      ok: true,
      payload: {
        orgId: parsed.orgId,
        formId: parsed.formId,
        versionId: parsed.versionId,
        issuedAt: parsed.issuedAt,
        ...(typeof parsed.challengeHash === "string"
          ? { challengeHash: parsed.challengeHash }
          : {}),
      },
    };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

const CHALLENGE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 5x7 bitmaps for the challenge alphabet; rows top to bottom, "1" = filled cell. */
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

const GLYPH_CELL = 3.4;

/** Draws a glyph as one filled path (no text element, so no font or OCR-by-text shortcut). */
function glyphPath(char: string): string {
  const rows = GLYPHS[char] ?? [];
  let d = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "1") {
        d += `M${+(x * GLYPH_CELL).toFixed(2)} ${+(y * GLYPH_CELL).toFixed(2)}h${GLYPH_CELL}v${GLYPH_CELL}h-${GLYPH_CELL}z`;
      }
    }
  });
  return d;
}

export function generateChallenge(): { code: string; challengeHash: string; svg: string } {
  const secret = derivePurposeKey("challenge");
  const bytes = randomBytes(5);
  let code = "";
  for (let i = 0; i < 5; i++) {
    const b = bytes[i] ?? 0;
    code += CHALLENGE_CHARS[b % CHALLENGE_CHARS.length];
  }
  const challengeHash = createHmac("sha256", secret)
    .update(`challenge:${code.toUpperCase()}`)
    .digest("hex");

  // Generate SVG representation
  const width = 160;
  const height = 50;
  const charSpacing = 28;
  const startX = 20;

  let textSvg = "";
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const b = bytes[i] ?? 0;
    const x = startX + i * charSpacing;
    const y = 12 + ((b % 7) - 3);
    const rot = (b % 15) - 7;
    textSvg += `<path d="${glyphPath(char ?? "")}" fill="#1e293b" transform="translate(${x} ${y}) rotate(${rot} 8.5 11.9)" />`;
  }

  // Add decorative noise lines and dots
  const b0 = bytes[0] ?? 0;
  const b1 = bytes[1] ?? 0;
  const b2 = bytes[2] ?? 0;
  const b3 = bytes[3] ?? 0;
  const b4 = bytes[4] ?? 0;
  const lineY1 = 15 + (b0 % 20);
  const lineY2 = 15 + (b1 % 20);
  const noiseSvg = `
    <line x1="10" y1="${lineY1}" x2="150" y2="${lineY2}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 2" />
    <circle cx="${30 + (b2 % 100)}" cy="${15 + (b3 % 20)}" r="2" fill="#cbd5e1" />
    <circle cx="${40 + (b4 % 100)}" cy="${20 + (b0 % 20)}" r="1.5" fill="#cbd5e1" />
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Visual verification code">
    <rect width="${width}" height="${height}" fill="#f1f5f9" rx="6" />
    ${noiseSvg}
    ${textSvg}
  </svg>`;

  return { code, challengeHash, svg };
}

export function verifyChallenge(
  answer: string | undefined,
  challengeHash: string | undefined,
): boolean {
  if (!challengeHash) return true;
  if (!answer || typeof answer !== "string") return false;
  const secret = derivePurposeKey("challenge");
  const calculatedHash = createHmac("sha256", secret)
    .update(`challenge:${answer.trim().toUpperCase()}`)
    .digest("hex");

  const aBuf = Buffer.from(calculatedHash, "hex");
  const bBuf = Buffer.from(challengeHash, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
