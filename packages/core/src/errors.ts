import type { z } from "zod";

export type ErrorCode = "unauthenticated" | "forbidden" | "not_found" | "conflict" | "validation";

/** Messages per input field, keyed by the field's name in the service input. */
export type FieldErrors = Record<string, string[]>;

// A registered symbol, so the check also holds when a bundler loads this module twice.
const APP_ERROR = Symbol.for("crm.AppError");

/**
 * An expected failure. Its message is written for the user and is safe to show.
 * Callers branch on `code`; anything that is not an `AppError` is a bug or an outage.
 */
export class AppError extends Error {
  override name = "AppError";
  readonly code: ErrorCode;
  readonly [APP_ERROR] = true;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  override name = "UnauthenticatedError";

  constructor(message = "Sign in to continue.") {
    super("unauthenticated", message);
  }
}

export class ForbiddenError extends AppError {
  override name = "ForbiddenError";

  constructor(message = "You do not have permission to do this.") {
    super("forbidden", message);
  }
}

export class NotFoundError extends AppError {
  override name = "NotFoundError";

  constructor(message = "Not found.") {
    super("not_found", message);
  }
}

export class ConflictError extends AppError {
  override name = "ConflictError";

  constructor(message: string) {
    super("conflict", message);
  }
}

export class ValidationError extends AppError {
  override name = "ValidationError";
  readonly fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors, message = "Check the highlighted fields.") {
    super("validation", message);
    this.fieldErrors = fieldErrors;
  }
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === "object" && value !== null && APP_ERROR in value;
}

/**
 * Parses service input with a Zod schema. On failure throws a `ValidationError` whose
 * `fieldErrors` are keyed by top-level field name; an issue on the input as a whole
 * becomes the error message.
 */
export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: FieldErrors = {};
  let formMessage: string | undefined;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === undefined) {
      formMessage ??= issue.message;
    } else {
      const messages = fieldErrors[String(field)] ?? [];
      messages.push(issue.message);
      fieldErrors[String(field)] = messages;
    }
  }
  throw new ValidationError(fieldErrors, formMessage);
}
