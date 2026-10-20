import { readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { ciTestSelection, macosSpecs } from "./e2e-ci-selection";

it("routes every current spec to exactly one OS, including newly added specs", () => {
  const specs = readdirSync(new URL("../apps/web/e2e/", import.meta.url), {
    recursive: true,
  })
    .map(String)
    .filter((file) => file.endsWith(".spec.ts"));
  expect(specs.length).toBeGreaterThan(macosSpecs.length);
  expect(new Set(macosSpecs).size).toBe(macosSpecs.length);
  for (const name of macosSpecs) expect(specs).toContain(name);

  const ubuntu = ciTestSelection("ubuntu");
  const macos = ciTestSelection("macos");
  for (const spec of specs) {
    const pattern = `**/${spec}`;
    const owners = [
      !ubuntu.testIgnore?.includes(pattern),
      macos.testMatch?.includes(pattern),
    ].filter(Boolean);
    expect(owners, spec).toHaveLength(1);
  }
});

it("keeps local runs unrestricted and rejects misspelled CI groups", () => {
  expect(ciTestSelection(undefined)).toEqual({});
  expect(ciTestSelection("")).toEqual({});
  expect(() => ciTestSelection("ubnutu")).toThrow("Unknown MEP_E2E_CI_GROUP");
});
