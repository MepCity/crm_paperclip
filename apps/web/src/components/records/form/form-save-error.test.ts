import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { expect, test } from "vitest";
import { UnexpectedApiError } from "@/lib/api/wire/errors";
import {
  FORM_SAVE_GENERIC_ERROR_MESSAGE,
  formSaveBannerMessage,
  formSaveFieldErrors,
} from "./form-save-error";

test("formSaveFieldErrors maps validation errors", () => {
  expect(
    formSaveFieldErrors(
      new ValidationError({ Company: ["Required."], Last_Name: ["Also required."] }),
    ),
  ).toEqual({ Company: "Required.", Last_Name: "Also required." });
});

test("formSaveBannerMessage returns app messages and generic text for unknown failures", () => {
  expect(formSaveBannerMessage(new ConflictError("Duplicate lead."))).toBe("Duplicate lead.");
  expect(formSaveBannerMessage(new ForbiddenError("Denied."))).toBe("Denied.");
  expect(formSaveBannerMessage(new NotFoundError("Missing."))).toBe("Missing.");
  expect(formSaveBannerMessage(new ValidationError({ Email: ["Taken."] }))).toBeNull();
  expect(formSaveBannerMessage(new UnauthenticatedError())).toBeNull();
  expect(formSaveBannerMessage(new UnexpectedApiError(502))).toBe(FORM_SAVE_GENERIC_ERROR_MESSAGE);
  expect(formSaveBannerMessage(new TypeError("Failed to fetch"))).toBe(
    FORM_SAVE_GENERIC_ERROR_MESSAGE,
  );
});
