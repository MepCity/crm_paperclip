import { describe, expect, it } from "vitest";
import {
  authFailureState,
  currentPasswordError,
  emailError,
  nameError,
  newPasswordError,
} from "./validation";

describe("nameError", () => {
  it("returns null for a valid name", () => {
    expect(nameError("Jane Doe")).toBeNull();
    expect(nameError("A")).toBeNull();
    expect(nameError("Valid Name With Special Chars - O'Connor")).toBeNull();
  });

  it("returns null when name has leading or trailing whitespace around text", () => {
    expect(nameError("  John  ")).toBeNull();
  });

  it("returns an error for an empty string", () => {
    expect(nameError("")).toBe("Enter your name.");
  });

  it("returns an error for whitespace-only strings", () => {
    expect(nameError(" ")).toBe("Enter your name.");
    expect(nameError("   ")).toBe("Enter your name.");
    expect(nameError("\t\n  \r")).toBe("Enter your name.");
  });
});

describe("emailError", () => {
  it("returns null for valid email addresses", () => {
    expect(emailError("user@example.com")).toBeNull();
    expect(emailError("first.last@company.org")).toBeNull();
    expect(emailError("user+tag@domain.co.uk")).toBeNull();
    expect(emailError("a@b.c")).toBeNull();
  });

  it("returns null for valid email with leading or trailing whitespace", () => {
    expect(emailError("  user@example.com  ")).toBeNull();
    expect(emailError("\tuser@example.com\n")).toBeNull();
  });

  it("returns 'Enter your email.' for an empty string", () => {
    expect(emailError("")).toBe("Enter your email.");
  });

  it("returns 'Enter your email.' for whitespace-only strings", () => {
    expect(emailError(" ")).toBe("Enter your email.");
    expect(emailError("   ")).toBe("Enter your email.");
    expect(emailError("\t\n")).toBe("Enter your email.");
  });

  it("returns 'Enter a valid email address.' for invalid formats", () => {
    expect(emailError("invalid")).toBe("Enter a valid email address.");
    expect(emailError("user@")).toBe("Enter a valid email address.");
    expect(emailError("@example.com")).toBe("Enter a valid email address.");
    expect(emailError("user@example")).toBe("Enter a valid email address.");
    expect(emailError("user@example.")).toBe("Enter a valid email address.");
    expect(emailError("user @example.com")).toBe("Enter a valid email address.");
    expect(emailError("user@ exam ple.com")).toBe("Enter a valid email address.");
    expect(emailError("user@@example.com")).toBe("Enter a valid email address.");
  });
});

describe("currentPasswordError", () => {
  it("returns null for non-empty password", () => {
    expect(currentPasswordError("secret123")).toBeNull();
    expect(currentPasswordError("a")).toBeNull();
    expect(currentPasswordError(" ")).toBeNull();
    expect(currentPasswordError("password with spaces")).toBeNull();
  });

  it("returns an error for an empty string", () => {
    expect(currentPasswordError("")).toBe("Enter your password.");
  });
});

describe("newPasswordError", () => {
  it("returns 'Enter your password.' for an empty string", () => {
    expect(newPasswordError("")).toBe("Enter your password.");
  });

  it("returns an error when password is shorter than 10 characters", () => {
    expect(newPasswordError("a")).toBe("Password must be at least 10 characters.");
    expect(newPasswordError("123456789")).toBe("Password must be at least 10 characters.");
  });

  it("accepts passwords with valid length between 10 and 128 characters inclusive", () => {
    expect(newPasswordError("1234567890")).toBeNull(); // exactly 10
    expect(newPasswordError("correct horse battery staple")).toBeNull();
    expect(newPasswordError("a".repeat(128))).toBeNull(); // exactly 128
  });

  it("returns an error when password exceeds 128 characters", () => {
    expect(newPasswordError("a".repeat(129))).toBe("Password must be at most 128 characters.");
    expect(newPasswordError("a".repeat(200))).toBe("Password must be at most 128 characters.");
  });
});

describe("authFailureState", () => {
  it("returns error state with empty message and fieldErrors when fieldErrors is non-empty", () => {
    const result = authFailureState({
      message: "Validation failed",
      fieldErrors: { email: ["Enter a valid email address."] },
    });
    expect(result).toEqual({
      status: "error",
      message: "",
      fieldErrors: { email: ["Enter a valid email address."] },
    });
  });

  it("preserves multiple field errors", () => {
    const result = authFailureState({
      message: "Multiple errors",
      fieldErrors: {
        name: ["Enter your name."],
        email: ["Enter a valid email address."],
      },
    });
    expect(result).toEqual({
      status: "error",
      message: "",
      fieldErrors: {
        name: ["Enter your name."],
        email: ["Enter a valid email address."],
      },
    });
  });

  it("returns message without fieldErrors when fieldErrors is empty object", () => {
    const result = authFailureState({
      message: "Something went wrong",
      fieldErrors: {},
    });
    expect(result).toEqual({
      status: "error",
      message: "Something went wrong",
    });
  });

  it("returns message without fieldErrors when fieldErrors is undefined", () => {
    const result = authFailureState({
      message: "Invalid email or password.",
    });
    expect(result).toEqual({
      status: "error",
      message: "Invalid email or password.",
    });
  });
});
