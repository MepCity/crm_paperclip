import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
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

export function computeClientHash(ip: string, secret = getAppSecret()): string {
  return createHmac("sha256", secret)
    .update(ip.trim() || "unknown")
    .digest("base64url");
}

export function createRenderToken(payload: RenderTokenPayload, secret = getAppSecret()): string {
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
  secret = getAppSecret(),
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

export function generateChallenge(): { code: string; challengeHash: string; svg: string } {
  const secret = getAppSecret();
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
    const y = 32 + ((b % 7) - 3);
    const rot = (b % 15) - 7;
    textSvg += `<text x="${x}" y="${y}" font-family="monospace, monospace" font-size="24" font-weight="bold" fill="#1e293b" transform="rotate(${rot} ${x} ${y})">${char}</text>`;
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
  const secret = getAppSecret();
  const calculatedHash = createHmac("sha256", secret)
    .update(`challenge:${answer.trim().toUpperCase()}`)
    .digest("hex");

  const aBuf = Buffer.from(calculatedHash, "hex");
  const bBuf = Buffer.from(challengeHash, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
