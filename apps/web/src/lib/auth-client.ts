export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

type SignUpInput = { name: string; email: string; password: string };
type SignInInput = { email: string; password: string };

const INVALID_CREDENTIALS = "Invalid email or password.";

async function post(path: string, input?: SignUpInput | SignInInput): Promise<AuthResult> {
  try {
    const response = await fetch(`/api/auth/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input ?? {}),
    });
    if (response.ok) return { ok: true };
    const body: unknown = await response.json().catch(() => null);
    const error = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const code = typeof error.code === "string" ? error.code : "";
    if (
      path === "sign-in/email" &&
      (code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND")
    ) {
      return { ok: false, message: INVALID_CREDENTIALS };
    }
    const fieldErrors = error.fieldErrors;
    return {
      ok: false,
      message:
        typeof error.message === "string" && error.message
          ? error.message
          : "The request failed. Please try again.",
      ...(fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)
        ? { fieldErrors: fieldErrors as Record<string, string[]> }
        : {}),
    };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

export const signUp = (input: SignUpInput): Promise<AuthResult> => post("sign-up/email", input);
export const signIn = (input: SignInInput): Promise<AuthResult> => post("sign-in/email", input);
export const signOut = (): Promise<AuthResult> => post("sign-out");
