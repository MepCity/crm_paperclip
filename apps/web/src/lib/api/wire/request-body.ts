import { invalid } from "./codec";
import type { OperationRequest } from "./operations";

export async function bodyOf(input: OperationRequest): Promise<unknown> {
  if (input.body !== undefined) return input.body;
  const text = await input.request?.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return invalid("data", "Send valid JSON.");
  }
}
