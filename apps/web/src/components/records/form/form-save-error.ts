import { type FieldErrors, isAppError, type ValidationError } from "@crm/core/errors";
import { INTERNAL_ERROR_MESSAGE, UnexpectedApiError } from "@/lib/api/wire/errors";

export const FORM_SAVE_GENERIC_ERROR_MESSAGE = INTERNAL_ERROR_MESSAGE;

function fieldErrorsMap(error: unknown): FieldErrors | null {
  if (!isAppError(error)) return null;
  if (error.code === "validation") return (error as ValidationError).fieldErrors;
  if ("fieldErrors" in error) {
    const fieldErrors = (error as { fieldErrors?: unknown }).fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
      return fieldErrors as FieldErrors;
    }
  }
  return null;
}

function toSingleMessageMap(fieldErrors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([name, items]) => [name, items.join(" ")]),
  );
}

export function formSaveFieldErrors(error: unknown): Record<string, string> | null {
  const fieldErrors = fieldErrorsMap(error);
  if (!fieldErrors) return null;
  return toSingleMessageMap(fieldErrors);
}

/** User-visible banner text for non-field save failures; null when the caller handles the error. */
export function formSaveBannerMessage(error: unknown): string | null {
  if (formSaveFieldErrors(error)) return null;
  if (isAppError(error)) {
    if (error.code === "unauthenticated" || error.code === "validation") return null;
    return error.message;
  }
  if (error instanceof UnexpectedApiError) return FORM_SAVE_GENERIC_ERROR_MESSAGE;
  return FORM_SAVE_GENERIC_ERROR_MESSAGE;
}
