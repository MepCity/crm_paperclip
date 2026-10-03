import { type AppError, isAppError, ValidationError } from "@crm/core/errors";

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export const initialActionState: ActionState = { status: "idle" };

export function toActionState(error: unknown): ActionState {
  if (isAppError(error)) {
    if (error instanceof ValidationError) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.fieldErrors,
      };
    }
    return {
      status: "error",
      message: (error as AppError).message,
    };
  }
  throw error;
}
