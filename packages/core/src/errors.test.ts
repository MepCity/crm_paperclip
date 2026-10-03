import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  isAppError,
  NotFoundError,
  parseInput,
  UnauthenticatedError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it("gives every subclass its code, name and a default message", () => {
    const cases = [
      [new UnauthenticatedError(), "unauthenticated", "UnauthenticatedError"],
      [new ForbiddenError(), "forbidden", "ForbiddenError"],
      [new NotFoundError(), "not_found", "NotFoundError"],
      [new ConflictError("That slug is taken."), "conflict", "ConflictError"],
      [new ValidationError({}), "validation", "ValidationError"],
    ] as const;

    for (const [error, code, name] of cases) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(code);
      expect(error.name).toBe(name);
      expect(error.message).not.toBe("");
    }
  });

  it("keeps a custom message", () => {
    expect(new NotFoundError("No such organization.").message).toBe("No such organization.");
  });
});

describe("isAppError", () => {
  it("accepts application errors only", () => {
    expect(isAppError(new ForbiddenError())).toBe(true);
    expect(isAppError(new Error("boom"))).toBe(false);
    expect(isAppError({ code: "forbidden", message: "fake" })).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError("forbidden")).toBe(false);
  });
});

describe("parseInput", () => {
  const schema = z.object({
    name: z.string().trim().min(1, "Enter a name."),
    slug: z
      .string()
      .min(3, "Use at least 3 characters.")
      .regex(/^[a-z0-9-]+$/, "Use lower-case letters, digits and hyphens."),
    address: z.object({ city: z.string().min(1, "Enter a city.") }).optional(),
  });

  it("returns the parsed output", () => {
    expect(parseInput(schema, { name: "  Acme  ", slug: "acme" })).toEqual({
      name: "Acme",
      slug: "acme",
    });
  });

  it("groups every message under its top-level field", () => {
    let thrown: unknown;
    try {
      parseInput(schema, { name: " ", slug: "A", address: { city: "" } });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ValidationError);
    const error = thrown as ValidationError;
    expect(error.fieldErrors).toEqual({
      name: ["Enter a name."],
      slug: ["Use at least 3 characters.", "Use lower-case letters, digits and hyphens."],
      address: ["Enter a city."],
    });
    expect(error.message).toBe("Check the highlighted fields.");
  });

  it("uses an issue on the whole input as the message", () => {
    const passwords = z
      .object({ password: z.string(), confirmation: z.string() })
      .refine((value) => value.password === value.confirmation, "The passwords do not match.");

    expect(() => parseInput(passwords, { password: "a", confirmation: "b" })).toThrow(
      "The passwords do not match.",
    );
  });
});
