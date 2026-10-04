import type { ActionState } from "@/lib/action";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function nameError(value: string): string | null {
  if (value.trim().length === 0) return "Enter your name.";
  return null;
}

export function emailError(value: string): string | null {
  const email = value.trim();
  if (email.length === 0) return "Enter your email.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

export function currentPasswordError(value: string): string | null {
  if (value.length === 0) return "Enter your password.";
  return null;
}

export function newPasswordError(value: string): string | null {
  if (value.length === 0) return "Enter your password.";
  if (value.length < 10) return "Password must be at least 10 characters.";
  if (value.length > 128) return "Password must be at most 128 characters.";
  return null;
}

export function authFailureState(result: {
  message: string;
  fieldErrors?: Record<string, string[]>;
}): ActionState {
  if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
    return { status: "error", message: "", fieldErrors: result.fieldErrors };
  }
  return { status: "error", message: result.message };
}
