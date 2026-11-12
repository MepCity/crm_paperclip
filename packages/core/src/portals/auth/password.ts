import { hashPassword, verifyPassword } from "better-auth/crypto";
import { COMMON_PASSWORDS } from "./common-passwords";

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export type PasswordProblem = "too_short" | "too_long" | "equals_email" | "too_common";

/**
 * ADR 0019a §2.1: 10–128 characters, any characters, no composition rules; not the login
 * email (case-insensitive) and not in the built-in common-password list.
 */
export function checkPasswordPolicy(password: string, email: string): PasswordProblem | null {
  const length = [...password].length;
  if (length < PASSWORD_MIN) return "too_short";
  if (length > PASSWORD_MAX) return "too_long";
  if (password.trim().toLowerCase() === email.trim().toLowerCase()) return "equals_email";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "too_common";
  return null;
}

export const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
  too_short: `Use at least ${PASSWORD_MIN} characters.`,
  too_long: `Use at most ${PASSWORD_MAX} characters.`,
  equals_email: "The password cannot be your email address.",
  too_common: "This password is too common. Choose another one.",
};

/** Member auth's scrypt primitive (ADR 0019a §1.1); no second auth instance. */
export function hashPortalPassword(password: string): Promise<string> {
  return hashPassword(password);
}

export function verifyPortalPassword(hash: string, password: string): Promise<boolean> {
  return verifyPassword({ hash, password });
}

let dummy: Promise<string> | undefined;
/**
 * Runs a verify against a fixed dummy hash so an unknown email costs the same time as a
 * wrong password (ADR 0019a §2.5). Always resolves to false.
 */
export async function dummyVerify(password: string): Promise<false> {
  dummy ??= hashPassword("portal-dummy-password-never-valid");
  await verifyPassword({ hash: await dummy, password: `${password}\u0000x` });
  return false;
}
