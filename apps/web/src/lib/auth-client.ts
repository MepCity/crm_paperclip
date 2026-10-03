export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

type SignUpInput = { name: string; email: string; password: string };
type SignInInput = { email: string; password: string };

const INVALID_CREDENTIALS = "Invalid email or password.";
const GENERAL_ERROR = "The request failed. Please try again.";

const FIELD_ERRORS: Record<string, { field: string; message: string }> = {
  PASSWORD_TOO_SHORT: { field: "password", message: "Password must be at least 10 characters." },
  PASSWORD_TOO_LONG: { field: "password", message: "Password must be at most 128 characters." },
  INVALID_EMAIL: { field: "email", message: "Enter a valid email address." },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    field: "email",
    message: "An account with this email already exists.",
  },
};

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
    const fieldError =
      code === "VALIDATION_ERROR" &&
      typeof error.message === "string" &&
      error.message.startsWith("[body.email]")
        ? FIELD_ERRORS.INVALID_EMAIL
        : FIELD_ERRORS[code];
    if (fieldError) {
      return {
        ok: false,
        message: fieldError.message,
        fieldErrors: { [fieldError.field]: [fieldError.message] },
      };
    }
    return { ok: false, message: GENERAL_ERROR };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

export const signUp = (input: SignUpInput): Promise<AuthResult> => post("sign-up/email", input);
export const signIn = (input: SignInInput): Promise<AuthResult> => post("sign-in/email", input);
export const signOut = (): Promise<AuthResult> => post("sign-out");
