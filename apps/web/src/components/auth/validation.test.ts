import { describe, expect, it } from "vitest";
import {
  authFailureState,
  currentPasswordError,
  emailError,
  nameError,
  newPasswordError,
} from "./validation";

describe("nameError", () => {
  it("returns an error for an empty string", () => {
    expect(nameError("")).toBe("Enter your name.");
  });

  it("returns an error for a whitespace-only string", () => {
    expect(nameError("   ")).toBe("Enter your name.");
  });

  it("returns null for a valid name", () => {
    expect(nameError("Alice")).toBeNull();
  });

  it("returns null for a name with surrounding whitespace", () => {
    expect(nameError("  Bob  ")).toBeNull();
  });
});

describe("emailError", () => {
  it("returns an error for an empty string", () => {
    expect(emailError("")).toBe("Enter your email.");
  });

  it("returns an error for a whitespace-only string", () => {
    expect(emailError("   ")).toBe("Enter your email.");
  });

  it("returns an error for an invalid email (no @)", () => {
    expect(emailError("notanemail")).toBe("Enter a valid email address.");
  });

  it("returns an error for an invalid email (no domain part)", () => {
    expect(emailError("user@")).toBe("Enter a valid email address.");
  });

  it("returns an error for an invalid email (no TLD)", () => {
    expect(emailError("user@domain")).toBe("Enter a valid email address.");
  });

  it("returns null for a valid email", () => {
    expect(emailError("user@example.com")).toBeNull();
  });

  it("returns null for a valid email with surrounding whitespace (trimmed)", () => {
    expect(emailError("  user@example.com  ")).toBeNull();
  });
});

describe("currentPasswordError", () => {
  it("returns an error for an empty string", () => {
    expect(currentPasswordError("")).toBe("Enter your password.");
  });

  it("returns null for a non-empty password", () => {
    expect(currentPasswordError("anypassword")).toBeNull();
  });

  it("returns null for a single character (does not enforce length)", () => {
    expect(currentPasswordError("x")).toBeNull();
  });
});

describe("newPasswordError", () => {
  it("returns an error for an empty string", () => {
    expect(newPasswordError("")).toBe("Enter your password.");
  });

  it("returns an error for a 9-character password (too short)", () => {
    expect(newPasswordError("a".repeat(9))).toBe("Password must be at least 10 characters.");
  });

  it("returns null for a 10-character password (minimum valid length)", () => {
    expect(newPasswordError("a".repeat(10))).toBeNull();
  });

  it("returns null for a 128-character password (maximum valid length)", () => {
    expect(newPasswordError("a".repeat(128))).toBeNull();
  });

  it("returns an error for a 129-character password (too long)", () => {
    expect(newPasswordError("a".repeat(129))).toBe("Password must be at most 128 characters.");
  });
});

describe("authFailureState", () => {
  it("returns error with empty message and fieldErrors when fieldErrors is non-empty", () => {
    const fieldErrors = { email: ["Email is taken"] };
    const result = authFailureState({
      message: "Validation failed",
      fieldErrors,
    });
    expect(result).toEqual({
      status: "error",
      message: "",
      fieldErrors,
    });
  });

  it("returns error with the message when fieldErrors is missing", () => {
    const result = authFailureState({ message: "Something went wrong" });
    expect(result).toEqual({
      status: "error",
      message: "Something went wrong",
    });
  });

  it("returns error with the message when fieldErrors is an empty object", () => {
    const result = authFailureState({
      message: "Something went wrong",
      fieldErrors: {},
    });
    expect(result).toEqual({
      status: "error",
      message: "Something went wrong",
    });
  });

  it("returns error with multiple field errors preserved", () => {
    const fieldErrors = {
      email: ["Email is taken"],
      password: ["Too short", "No uppercase"],
    };
    const result = authFailureState({ message: "", fieldErrors });
    expect(result).toEqual({ status: "error", message: "", fieldErrors });
  });
});
