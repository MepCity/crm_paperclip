import { readFileSync } from "node:fs";
import {
  ConflictError,
  ForbiddenError,
  isAppError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { describe, expect, it, vi } from "vitest";
import {
  decodeError,
  encodeError,
  INTERNAL_ERROR_CODE,
  INTERNAL_ERROR_MESSAGE,
  UNEXPECTED_API_MESSAGE,
  UnexpectedApiError,
} from "./errors";

const fieldErrors = {
  Last_Name: ["Enter a last name.", "Use at most 80 characters."],
  Email: ["Enter an email address."],
};

describe("encodeError / decodeError", () => {
  it.each([
    ["unauthenticated", new UnauthenticatedError("Sign in again.")],
    ["forbidden", new ForbiddenError("You cannot change this record.")],
    ["not_found", new NotFoundError("That view does not exist.")],
    ["conflict", new ConflictError("That record was changed.")],
    ["validation", new ValidationError(fieldErrors, "Check the highlighted fields.")],
  ] as const)("round-trips %s through JSON", (_label, error) => {
    const encoded = encodeError(error);
    const decoded = decodeError(encoded.status, JSON.parse(JSON.stringify(encoded.body)));

    expect(decoded).toBeInstanceOf(error.constructor);
    expect(decoded).toBeInstanceOf(Error);
    expect(isAppError(decoded)).toBe(true);
    expect(decoded.message).toBe(error.message);
    expect(encoded.status).toBe(
      { unauthenticated: 401, forbidden: 403, not_found: 404, conflict: 400, validation: 400 }[
        error.code
      ],
    );
    expect(encoded.body.status).toBe("error");
    expect(Object.keys(encoded.body).sort()).toEqual(["code", "details", "message", "status"]);
    if (error instanceof ValidationError && decoded instanceof ValidationError) {
      expect(decoded.fieldErrors).toEqual(error.fieldErrors);
      expect(decoded.fieldErrors).not.toBe(error.fieldErrors);
    }
  });

  it.each([
    [
      new ValidationError({ Company: ["This field is required."] }, undefined, "mandatory"),
      400,
      "MANDATORY_NOT_FOUND",
    ],
    [new ValidationError(fieldErrors), 400, "INVALID_DATA"],
    [
      new ValidationError({ ids: ["Choose between 1 and 500 records."] }, undefined, "limit"),
      400,
      "LIMIT_EXCEEDED",
    ],
    [new ConflictError("Duplicate."), 400, "DUPLICATE_DATA"],
    [new ForbiddenError(), 403, "NO_PERMISSION"],
    [new UnauthenticatedError(), 401, "AUTHENTICATION_FAILURE"],
    [new NotFoundError(), 404, "not_found"],
    [new Error("Unexpected."), 500, "INTERNAL_ERROR"],
  ] as const)("maps %s to HTTP %s and %s", (error, status, code) => {
    const encoded = encodeError(error);
    expect(encoded).toMatchObject({ status, body: { code, status: "error" } });
    const restored = decodeError(status, JSON.stringify(encoded.body));
    if (error instanceof ValidationError) {
      expect(restored).toBeInstanceOf(ValidationError);
      expect(restored).toMatchObject({ fieldErrors: error.fieldErrors, reason: error.reason });
    }
  });

  it("encodes field errors from a second module instance", async () => {
    vi.resetModules();
    const { ValidationError: OtherValidationError } = await import("@crm/core/errors");
    const error = new OtherValidationError(fieldErrors);
    expect(error).not.toBeInstanceOf(ValidationError);
    expect(encodeError(error)).toMatchObject({
      status: 400,
      body: { details: { fields: fieldErrors } },
    });
  });

  it("does not copy a validation stack or share field-error arrays", () => {
    const error = new ValidationError({ name: ["Enter a name."] });
    error.stack = "STACK_SENTINEL at secretFunction";
    const encoded = encodeError(error);
    const fields = encoded.body.details.fields;
    if (!fields) throw new Error("expected field errors");
    fields.name?.push("mutated");

    expect(JSON.stringify(encoded.body)).not.toContain("STACK_SENTINEL");
    expect(error.fieldErrors.name).toEqual(["Enter a name."]);
  });

  it("writes a non-AppError as a fixed 500 without the internal message", () => {
    const error = new Error("connect ECONNREFUSED secret-host");
    error.stack = "Error: connect ECONNREFUSED secret-host\n    at secretFunction";
    const encoded = encodeError(error);
    const serialized = JSON.stringify(encoded.body);

    expect(encoded.status).toBe(500);
    expect(encoded.body).toEqual({
      code: INTERNAL_ERROR_CODE,
      details: {},
      message: INTERNAL_ERROR_MESSAGE,
      status: "error",
    });
    expect(serialized).not.toContain("secret-host");
    expect(serialized).not.toContain("ECONNREFUSED");
    expect(serialized).not.toContain("secretFunction");
    expect(JSON.stringify(encodeError("database down").body)).not.toContain("database");
    expect(encodeError(null).body.message).toBe(INTERNAL_ERROR_MESSAGE);
  });
});

describe("decodeError unexpected responses", () => {
  const leaked = "UNIQUE_BODY_MESSAGE_secret";
  const validNotFound = {
    code: "not_found",
    details: {},
    message: leaked,
    status: "error",
  };

  it.each([
    ["http 500", 500, { code: INTERNAL_ERROR_CODE, details: {}, message: leaked, status: 500 }],
    ["http 500 with an app code", 500, validNotFound],
    ["non-json string", 404, `not json ${leaked}`],
    ["empty string", 401, ""],
    ["missing body", 403, null],
    ["missing body undefined", 400, undefined],
    ["unknown code", 404, { code: "missing_record", details: {}, message: leaked, status: 404 }],
    ["http status mismatch", 400, validNotFound],
    ["body status mismatch", 404, { ...validNotFound, status: 400 }],
    ["extra key", 404, { ...validNotFound, stack: leaked }],
    ["missing key", 404, { code: "not_found", message: leaked, status: 404 }],
    ["string status", 404, { ...validNotFound, status: "404" }],
    [
      "invalid field messages",
      400,
      {
        code: "INVALID_DATA",
        details: { fields: { name: "Enter a name." } },
        message: leaked,
        status: "error",
      },
    ],
  ] as const)("returns UnexpectedApiError for %s", (_label, status, body) => {
    const decoded = decodeError(status, body);

    expect(decoded).toBeInstanceOf(UnexpectedApiError);
    expect(isAppError(decoded)).toBe(false);
    expect(decoded).toBeInstanceOf(Error);
    if (decoded instanceof UnexpectedApiError) expect(decoded.status).toBe(status);
    expect(decoded.message).toBe(UNEXPECTED_API_MESSAGE);
    expect(decoded.message).not.toContain(leaked);
  });

  it("rejects a prototype field name instead of restoring a validation error", () => {
    const body = JSON.parse(
      '{"code":"INVALID_DATA","details":{"fields":{"__proto__":["owned"],"name":["ok"]}},"message":"UNIQUE_BODY_MESSAGE_secret","status":"error"}',
    );
    const decoded = decodeError(400, body);
    expect(decoded).toBeInstanceOf(UnexpectedApiError);
    expect(isAppError(decoded)).toBe(false);
    expect(decoded.message).toBe(UNEXPECTED_API_MESSAGE);
    expect(decoded.message).not.toContain("UNIQUE_BODY_MESSAGE_secret");
  });
});

describe("wire module boundary", () => {
  it("imports only the errors entry of core", () => {
    const source = readFileSync(new URL("./errors.ts", import.meta.url), "utf8");
    expect(source).toMatch(/@crm\/core\/errors/);
    expect(source).not.toMatch(/from ["']@crm\/core["']/);
    expect(source).not.toMatch(/from ["']next/);
    expect(source).not.toMatch(/@crm\/db/);
  });
});
