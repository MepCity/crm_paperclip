import { ValidationError } from "../errors";
import {
  createJourneySchema,
  type JourneyStateInput,
  type JourneyTransitionInput,
  updateJourneyDraftSchema,
} from "./types";

export function validateCreateJourney(input: unknown) {
  const parsed = createJourneySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    throw new ValidationError(fieldErrors);
  }
  return parsed.data;
}

export function validateUpdateJourneyDraft(input: unknown) {
  const parsed = updateJourneyDraftSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    throw new ValidationError(fieldErrors);
  }
  return parsed.data;
}

export function validateJourneyForPublish(
  states: JourneyStateInput[],
  transitions: JourneyTransitionInput[],
) {
  const errors: Record<string, string[]> = {};

  if (!states || states.length === 0) {
    throw new ValidationError({
      states: ["Bir yolculuğun yayınlanabilmesi için en az bir duruma sahip olması gerekir."],
    });
  }

  // 1. Exactly one start state
  const startStates = states.filter((s) => s.isStart === true);
  if (startStates.length === 0) {
    errors.startState = ["Tam olarak bir başlangıç durumu gereklidir."];
    errors.states = ["Bir başlangıç durumu belirlenmelidir."];
  } else if (startStates.length > 1) {
    errors.startState = ["Yalnızca bir başlangıç durumu olabilir."];
    errors.states = ["Birden fazla başlangıç durumu belirlenemez."];
  }

  const stateIds = new Set(states.map((s) => s.id));

  // 2. Transitions only between existing states
  transitions.forEach((t, index) => {
    if (!stateIds.has(t.from)) {
      errors[`transitions[${index}].from`] = [
        `Geçiş var olmayan bir kaynak duruma işaret ediyor (${t.from}).`,
      ];
    }
    if (!stateIds.has(t.to)) {
      errors[`transitions[${index}].to`] = [
        `Geçiş var olmayan bir hedef duruma işaret ediyor (${t.to}).`,
      ];
    }
  });

  // 3. Every non-start state must be reachable from the start state
  const startState = startStates[0];
  if (startStates.length === 1 && startState) {
    const visited = new Set<string>([startState.id]);
    const queue: string[] = [startState.id];

    // Build adjacency list for valid transitions
    const adj = new Map<string, string[]>();
    for (const s of states) adj.set(s.id, []);
    for (const t of transitions) {
      if (adj.has(t.from) && stateIds.has(t.to)) {
        adj.get(t.from)?.push(t.to);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      for (const next of adj.get(current) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    const unreachable = states.filter((s) => !visited.has(s.id));
    if (unreachable.length > 0) {
      for (const u of unreachable) {
        errors[`states[${u.id}]`] = [`'${u.name}' durumu başlangıç durumundan erişilebilir değil.`];
      }
      errors.reachability = [
        `Tüm durumlar başlangıç durumundan erişilebilir olmalıdır: ${unreachable
          .map((u) => u.name)
          .join(", ")}`,
      ];
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}
