import { ValidationError } from "../../../errors";
import type { FieldValue } from "../../contract";
import type { FixtureModuleHooks } from "../hooks";
export function referenceId(value: FieldValue | undefined): string | null {
  return value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
    ? value.id
    : null;
}
export const campaignsHooks: FixtureModuleHooks = {
  applyRules(fields, _input, _previous, ctx) {
    const visited = new Set([String(fields.id)]);
    let parent = referenceId(fields.Parent_Campaign);
    while (parent) {
      if (visited.has(parent))
        throw new ValidationError({ Parent_Campaign: ["A campaign cannot be its own ancestor."] });
      visited.add(parent);
      parent = referenceId(
        ctx.moduleStore("Campaigns").records.get(parent)?.fields.Parent_Campaign,
      );
    }
  },
};
