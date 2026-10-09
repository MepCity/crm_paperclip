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
  conflict: 400,
} as const satisfies Record<ErrorCode, number>;

/** Wire-only code. It is not a member of `ErrorCode`. */
export const INTERNAL_ERROR_CODE = "INTERNAL_ERROR" as const;

export const INTERNAL_ERROR_MESSAGE = "Something went wrong.";

export const UNEXPECTED_API_MESSAGE = "The response could not be read.";

const BODY_KEYS = ["code", "details", "message", "status"] as const;

const WIRE_CODES = {
  unauthenticated: "AUTHENTICATION_FAILURE",
  forbidden: "NO_PERMISSION",
  not_found: "not_found",
  conflict: "DUPLICATE_DATA",
  validation: "INVALID_DATA",
} as const;
export type WireErrorCode =
  | (typeof WIRE_CODES)[ErrorCode]
  | "MANDATORY_NOT_FOUND"
  | "LIMIT_EXCEEDED"
  | typeof INTERNAL_ERROR_CODE;

export type WireErrorBody = {
  code: WireErrorCode;
  details: { fields?: FieldErrors };
  message: string;
  status: "error";
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
  status: "error";
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
  if (value.status !== "error") return null;
  if (!isPlainObject(value.details)) return null;
  return {
    code: value.code,
    details: value.details,
    message: value.message,
    status: value.status,
  };
}

function appCode(code: string): ErrorCode | undefined {
  if (code === "MANDATORY_NOT_FOUND" || code === "LIMIT_EXCEEDED") return "validation";
  return (Object.keys(WIRE_CODES) as ErrorCode[]).find((key) => WIRE_CODES[key] === code);
}

function restore(parsed: ParsedBody, status: number): AppError | UnexpectedApiError {
  switch (appCode(parsed.code)) {
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
      return new ValidationError(
        fieldErrors,
        parsed.message,
        parsed.code === "MANDATORY_NOT_FOUND"
          ? "mandatory"
          : parsed.code === "LIMIT_EXCEEDED"
            ? "limit"
            : "invalid",
      );
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
        code:
          error.code === "validation"
            ? (error as ValidationError).reason === "mandatory"
              ? "MANDATORY_NOT_FOUND"
              : (error as ValidationError).reason === "limit"
                ? "LIMIT_EXCEEDED"
                : "INVALID_DATA"
            : WIRE_CODES[error.code],
        details,
        message: error.message,
        status: "error",
      },
    };
  }
  return {
    status: 500,
    body: {
      code: INTERNAL_ERROR_CODE,
      details: {},
      message: INTERNAL_ERROR_MESSAGE,
      status: "error",
    },
  };
}

/**
 * Restores an `AppError` only for a four-key body whose `code` is a known
 * application code and whose HTTP status matches that code; body status is "error".
 */
export function decodeError(status: number, body: unknown): AppError | UnexpectedApiError {
  const parsed = parseBody(body);
  const code = parsed ? appCode(parsed.code) : undefined;
  if (!parsed || !code || status !== STATUS_BY_CODE[code]) return new UnexpectedApiError(status);
  return restore(parsed, status);
}
