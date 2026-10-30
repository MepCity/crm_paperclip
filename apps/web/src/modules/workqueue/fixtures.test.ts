import { expect, it } from "vitest";
import { previewQueue } from "./fixtures";

it("keeps count equal to rows for every selector", () => {
  for (const source of ["populated", "zero"] as const)
    for (const filter of ["today-overdue", "all-open"] as const) {
      const { rows, count } = previewQueue(source, filter);
      expect(count).toBe(rows.length);
    }
  expect(previewQueue("populated", "today-overdue").count).toBe(3);
  expect(previewQueue("populated", "all-open").count).toBe(4);
  expect(previewQueue("zero", "all-open").count).toBe(0);
});
