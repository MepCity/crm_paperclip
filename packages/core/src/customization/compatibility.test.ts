import { describe, expect, it } from "vitest";
import type { ModuleMetadata } from "../records/contract";
import { fixtureModules } from "../records/fixture/registry";

/** API names serve as test-only stable identities; no runtime fixture adapter. */
function inspectLayout(metadata: ModuleMetadata) {
  const catalog = new Set(metadata.fields.map((field) => field.apiName));
  const seen = new Set<string>();
  return metadata.layout.map((section) => {
    const duplicateAcrossSections = section.fields.filter((id) => seen.has(id));
    for (const id of section.fields) seen.add(id);
    return {
      section: section.label,
      unknown: section.fields.filter((id) => !catalog.has(id)),
      duplicateWithinSection: section.fields.filter(
        (id, index) => section.fields.indexOf(id) !== index,
      ),
      outsideMembership: section.columns.flat().filter((id) => !section.fields.includes(id)),
      duplicateAcrossSections,
    };
  });
}

describe("fixture section membership compatibility", () => {
  it.each(Object.entries(fixtureModules))("checks every section in %s", (_module, bundle) => {
    for (const result of inspectLayout(bundle.metadata)) {
      expect(result.unknown, result.section).toEqual([]);
      expect(result.duplicateWithinSection, result.section).toEqual([]);
      expect(result.outsideMembership, result.section).toEqual([]);
    }
  });

  it("records the existing cross-section duplicate instead of enforcing global uniqueness", () => {
    const duplicates = Object.entries(fixtureModules).flatMap(([module, bundle]) =>
      inspectLayout(bundle.metadata)
        .filter((result) => result.duplicateAcrossSections.length > 0)
        .map((result) => ({
          module,
          section: result.section,
          fields: result.duplicateAcrossSections,
        })),
    );
    expect(duplicates).toEqual([
      { module: "Calls", section: "Reason For Incoming Call", fields: ["Description"] },
    ]);
  });
});
