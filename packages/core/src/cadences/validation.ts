import { ValidationError } from "../errors";
import { type CadenceStep, createCadenceSchema, updateCadenceDraftSchema } from "./types";

export function validateCreateCadence(input: unknown) {
  const parsed = createCadenceSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    throw new ValidationError(fieldErrors);
  }
  return parsed.data;
}

export function validateUpdateCadenceDraft(input: unknown) {
  const parsed = updateCadenceDraftSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    throw new ValidationError(fieldErrors);
  }
  return parsed.data;
}

export function validateStepsForPublish(steps: CadenceStep[]) {
  if (!steps || steps.length === 0) {
    throw new ValidationError({
      steps: ["A cadence must have at least one step before it can be published"],
    });
  }
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step) continue;
    if (step.delay.amount < 0) {
      throw new ValidationError({
        [`steps[${i}].delay`]: ["Delay amount cannot be negative"],
      });
    }
  }
}
