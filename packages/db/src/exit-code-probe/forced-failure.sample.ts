import { expect, it } from "vitest";

// Deliberate failure for vitest-exit-code.test.ts. The file name is outside the
// root Vitest include patterns, so a normal run never collects it.
it("fails on purpose", () => {
  expect(1).toBe(2);
});
