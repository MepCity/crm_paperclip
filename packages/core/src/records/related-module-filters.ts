import { ValidationError } from "../errors";
import type { RelatedFilterModule, RelatedModuleFilter } from "./contract";

export const MAX_RELATED_MODULE_FILTERS = 3;
export const MAX_RELATED_MODULE_CRITERIA = 5;

/** Child module api name and the field that links a child to its parent, per filter row. */
export const relatedFilterModules: Readonly<
  Record<RelatedFilterModule, { module: string; kind: "activity" | "note" }>
> = {
  Calls: { module: "Calls", kind: "activity" },
  Meetings: { module: "Events", kind: "activity" },
  Notes: { module: "Notes", kind: "note" },
  Tasks: { module: "Tasks", kind: "activity" },
};
/** Parent modules that expose related-module rows; Cases first. */
export const relatedFilterParentModules: ReadonlySet<string> = new Set(["Cases"]);

export function validateRelatedModules(
  value: unknown,
): asserts value is readonly RelatedModuleFilter[] {
  const fail = (message = "Choose valid related-module conditions."): never => {
    throw new ValidationError({ relatedModules: [message] });
  };
  if (!Array.isArray(value)) fail();
  const rows = value as unknown[];
  if (rows.length > MAX_RELATED_MODULE_FILTERS) fail("Send at most 3 related-module conditions.");
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) fail();
    const entry = row as Record<string, unknown>;
    if (Object.keys(entry).some((key) => !["module", "presence", "criteria"].includes(key))) fail();
    if (typeof entry.module !== "string" || !Object.hasOwn(relatedFilterModules, entry.module))
      fail();
    if (entry.presence !== "with" && entry.presence !== "without") fail();
    if (!Array.isArray(entry.criteria)) fail();
    const criteria = entry.criteria as unknown[];
    if (criteria.length > MAX_RELATED_MODULE_CRITERIA)
      fail("Send at most 5 criteria per related-module condition.");
    for (const item of criteria) {
      if (!item || typeof item !== "object" || !("field" in item) || "group" in item) fail();
    }
  }
}
