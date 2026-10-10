import { isAppError, type ValidationError } from "@crm/core/errors";
import { INTERNAL_ERROR_MESSAGE, UnexpectedApiError } from "@/lib/api/wire/errors";

export const FORM_SAVE_GENERIC_ERROR_MESSAGE = INTERNAL_ERROR_MESSAGE;

export function formSaveFieldErrors(error: unknown): Record<string, string> | null {
  if (!isAppError(error) || error.code !== "validation") return null;
  const fieldErrors = (error as ValidationError).fieldErrors;
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([name, items]) => [name, items.join(" ")]),
  );
}

/** User-visible banner text for non-field save failures; null when the caller handles the error. */
export function formSaveBannerMessage(error: unknown): string | null {
  if (isAppError(error)) {
    if (error.code === "unauthenticated" || error.code === "validation") return null;
    return error.message;
  }
  if (error instanceof UnexpectedApiError) return FORM_SAVE_GENERIC_ERROR_MESSAGE;
  return FORM_SAVE_GENERIC_ERROR_MESSAGE;
}
