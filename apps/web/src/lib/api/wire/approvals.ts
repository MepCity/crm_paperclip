import { DECISION_ACTIONS, type DecisionAction, decisionSchema } from "@crm/core/approvals";
import { NotFoundError, ValidationError } from "@crm/core/errors";
import { z } from "zod";
import { parseBody } from "./chat";

export { decisionSchema, parseBody };

/** Reads an optional JSON body: an empty body means no fields. */
export async function parseOptionalBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const text = await request.text();
  if (text.trim() === "") return schema.parse({});
  return parseBody(new Request(request.url, { method: "POST", body: text }), schema);
}

export function decisionAction(value: string | undefined): DecisionAction {
  if (!DECISION_ACTIONS.includes(value as DecisionAction)) throw new NotFoundError();
  return value as DecisionAction;
}

const PAGE_LIMIT = z.coerce.number().int().min(1).max(50);

export function pageLimit(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = PAGE_LIMIT.safeParse(value);
  if (!parsed.success) throw new ValidationError({ limit: ["Send a number from 1 to 50."] });
  return parsed.data;
}

export const reorderBodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });
export const seenBodySchema = z.object({ ids: z.array(z.string().uuid()).max(100).optional() });
