import { AppError, ValidationError } from "@crm/core/errors";
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
