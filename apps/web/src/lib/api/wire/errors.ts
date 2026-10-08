import {
  type AppError,
  ConflictError,
  type ErrorCode,
  type FieldErrors,
  ForbiddenError,
  isAppError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";

const STATUS_BY_CODE = {
  validation: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
} as const satisfies Record<ErrorCode, number>;

/** Wire-only code. It is not a member of `ErrorCode`. */
export const INTERNAL_ERROR_CODE = "internal_error" as const;

export const INTERNAL_ERROR_MESSAGE = "Something went wrong.";

export const UNEXPECTED_API_MESSAGE = "The response could not be read.";

const BODY_KEYS = ["code", "details", "message", "status"] as const;

export type WireErrorCode = ErrorCode | typeof INTERNAL_ERROR_CODE;

export type WireErrorBody = {
  code: WireErrorCode;
  details: { fields?: FieldErrors };
  message: string;
  status: number;
};

/**
 * A response this codec cannot restore as an `AppError`.
 * The message is fixed; text from the body is never copied.
 */
export class UnexpectedApiError extends Error {
  override name = "UnexpectedApiError";
  readonly status: number;

  constructor(status: number) {
    super(UNEXPECTED_API_MESSAGE);
    this.status = status;
  }
}

type ParsedBody = {
  code: string;
  details: Record<string, unknown>;
  message: string;
  status: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function copyFieldErrors(fieldErrors: FieldErrors): FieldErrors {
  const copy = Object.create(null) as FieldErrors;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    copy[field] = [...messages];
  }
  return copy;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((message) => typeof message === "string");
}

function readFieldErrors(details: Record<string, unknown>): FieldErrors | null {
  if (!isPlainObject(details.fields)) return null;
  const fieldErrors = Object.create(null) as FieldErrors;
  for (const [field, messages] of Object.entries(details.fields)) {
    if (field === "__proto__" || field === "constructor" || field === "prototype") return null;
    if (!isStringList(messages)) return null;
    fieldErrors[field] = [...messages];
  }
  return fieldErrors;
}

function coerceBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function parseBody(body: unknown): ParsedBody | null {
  const value = coerceBody(body);
  if (!isPlainObject(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== BODY_KEYS.length || BODY_KEYS.some((key) => !Object.hasOwn(value, key))) {
    return null;
  }
  if (typeof value.code !== "string" || typeof value.message !== "string") return null;
  if (typeof value.status !== "number" || !Number.isInteger(value.status)) return null;
  if (!isPlainObject(value.details)) return null;
  return {
    code: value.code,
    details: value.details,
    message: value.message,
    status: value.status,
  };
}

function isErrorCode(code: string): code is ErrorCode {
  return Object.hasOwn(STATUS_BY_CODE, code);
}

function restore(parsed: ParsedBody, status: number): AppError | UnexpectedApiError {
  switch (parsed.code) {
    case "unauthenticated":
      return new UnauthenticatedError(parsed.message);
    case "forbidden":
      return new ForbiddenError(parsed.message);
    case "not_found":
      return new NotFoundError(parsed.message);
    case "conflict":
      return new ConflictError(parsed.message);
    case "validation": {
      const fieldErrors = readFieldErrors(parsed.details);
      if (!fieldErrors) return new UnexpectedApiError(status);
      return new ValidationError(fieldErrors, parsed.message);
    }
    default:
      return new UnexpectedApiError(status);
  }
}

/** Writes an error as the four-key body. Non-`AppError` values become a fixed 500. */
export function encodeError(error: unknown): { status: number; body: WireErrorBody } {
  if (isAppError(error)) {
    const status = STATUS_BY_CODE[error.code];
    const details =
      error.code === "validation"
        ? { fields: copyFieldErrors((error as ValidationError).fieldErrors) }
        : {};
    return {
      status,
      body: {
        code: error.code,
        details,
        message: error.message,
        status,
      },
    };
  }
  return {
    status: 500,
    body: {
      code: INTERNAL_ERROR_CODE,
      details: {},
      message: INTERNAL_ERROR_MESSAGE,
      status: 500,
    },
  };
}

/**
 * Restores an `AppError` only for a four-key body whose `code` is one of the five
 * known codes and whose HTTP status and body `status` both match that code.
 */
export function decodeError(status: number, body: unknown): AppError | UnexpectedApiError {
  const parsed = parseBody(body);
  if (!parsed || status === 500 || !isErrorCode(parsed.code)) return new UnexpectedApiError(status);
  const expected = STATUS_BY_CODE[parsed.code];
  if (status !== expected || parsed.status !== expected) return new UnexpectedApiError(status);
  return restore(parsed, status);
}
