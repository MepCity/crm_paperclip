import { describe, expect, it } from "vitest";
import type { Criteria } from "../../contract";
import { accountsMetadata } from "./metadata";
import { accountsViews } from "./views";

// Virtual status field evaluated by the record service, not an exported metadata field.
const virtualFields = new Set(["Common_Status"]);
const known = new Set(accountsMetadata.fields.map((field) => field.apiName));

function criteriaFields(criteria: Criteria | null): string[] {
  if (criteria === null) return [];
  if ("group" in criteria) return criteria.group.flatMap(criteriaFields);
  return [criteria.field];
}

describe("Accounts fixture views", () => {
  it("has unique view ids and names, with exactly one default", () => {
    expect(new Set(accountsViews.map((view) => view.id)).size).toBe(accountsViews.length);
    expect(new Set(accountsViews.map((view) => view.name)).size).toBe(accountsViews.length);
    expect(accountsViews.filter((view) => view.isDefault)).toHaveLength(1);
  });

  it.each(accountsViews.map((view) => [view.id, view] as const))(
    "%s only references fields present in the metadata",
    (_id, view) => {
      for (const name of view.columns) expect(known.has(name)).toBe(true);
      for (const name of criteriaFields(view.criteria))
        expect(known.has(name) || virtualFields.has(name)).toBe(true);
      if (view.sort) expect(known.has(view.sort.field)).toBe(true);
    },
  );
});
