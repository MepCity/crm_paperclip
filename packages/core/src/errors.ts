import type { z } from "zod";

export type ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "schema_stale"
  | "conflict"
  | "validation"
  | "record_locked"
  | "file_too_large"
  | "too_many_columns"
  | "too_many_rows"
  | "malformed_csv"
  | "empty_file"
  | "no_header"
  | "duplicate_header"
  | "bad_encoding"
  | "upload_expired"
  | "mapping_duplicate_field"
  | "mapping_missing_required"
  | "mapping_system_field"
  | "match_field_required"
  | "invalid_match_field"
  | "export_too_large"
  | "field_not_allowed"
  | "not_undoable";

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

export class RecordLockedError extends AppError {
  override name = "RecordLockedError";

  constructor(message = "Cannot update record that is not approved yet") {
    super("record_locked", message);
  }
}

export class ValidationError extends AppError {
  override name = "ValidationError";
  readonly fieldErrors: FieldErrors;
  readonly reason: "invalid" | "mandatory" | "limit";

  constructor(
    fieldErrors: FieldErrors,
    message = "Check the highlighted fields.",
    reason: "invalid" | "mandatory" | "limit" = "invalid",
  ) {
    super("validation", message);
    this.fieldErrors = fieldErrors;
    this.reason = reason;
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

/** A stale schema is distinct from a duplicate record or ordinary conflict. */
export class SchemaStaleError extends AppError {
  override name = "SchemaStaleError";
  constructor(readonly revision: string) {
    super("schema_stale", "The schema changed. Refresh metadata before retrying.");
  }
}
