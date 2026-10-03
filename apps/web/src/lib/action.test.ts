import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { expect, test } from "vitest";
import { toActionState } from "./action";

test("toActionState handles AppError", () => {
  const error = new AppError("not_found", "Item not found");
  expect(toActionState(error)).toEqual({ status: "error", message: "Item not found" });
});

test("toActionState handles ValidationError", () => {
  const error = new ValidationError({ email: ["Invalid email"] }, "Check fields");
  expect(toActionState(error)).toEqual({
    status: "error",
    message: "Check fields",
    fieldErrors: { email: ["Invalid email"] },
  });
});

test("toActionState rethrows unknown error", () => {
  const error = new Error("Unknown");
  expect(() => toActionState(error)).toThrow("Unknown");
});

test("toActionState maps UnauthenticatedError to an error state", () => {
  const error = new UnauthenticatedError("Your session expired.");
  expect(toActionState(error)).toEqual({ status: "error", message: "Your session expired." });
});

test("toActionState maps ForbiddenError with its default message", () => {
  const error = new ForbiddenError();
  expect(toActionState(error)).toEqual({ status: "error", message: error.message });
  expect(toActionState(error)).toEqual({
    status: "error",
    message: "You do not have permission to do this.",
  });
});

test("toActionState maps NotFoundError with its default message", () => {
  const error = new NotFoundError();
  expect(toActionState(error)).toEqual({ status: "error", message: error.message });
  expect(toActionState(error)).toEqual({ status: "error", message: "Not found." });
});

test("toActionState maps ConflictError to an error state", () => {
  const error = new ConflictError("This lead is already assigned to someone else.");
  expect(toActionState(error)).toEqual({
    status: "error",
    message: "This lead is already assigned to someone else.",
  });
});

test("toActionState keeps every ValidationError field message", () => {
  const error = new ValidationError({ company: ["Too short", "Invalid characters"] });
  expect(toActionState(error)).toEqual({
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: { company: ["Too short", "Invalid characters"] },
  });
});

test("toActionState drops the error code so it never reaches the UI", () => {
  const error = new AppError("conflict", "Duplicate record");
  const state = toActionState(error);
  expect(state).toEqual({ status: "error", message: "Duplicate record" });
  expect(Object.keys(state)).toEqual(["status", "message"]);
});

test("toActionState rethrows a non-AppError unchanged", () => {
  const error = new Error("boom");
  expect(() => toActionState(error)).toThrow(error);
});
