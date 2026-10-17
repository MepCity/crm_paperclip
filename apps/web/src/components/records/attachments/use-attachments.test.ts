import { expect, test } from "vitest";
import { BUDGET_MESSAGE, MAX_FILES, MAX_TOTAL_BYTES, withinBudget } from "./use-attachments";

test("budget allows 10 files and 100 MB combined", () => {
  const ten = Array.from({ length: MAX_FILES }, () => ({ size: MAX_TOTAL_BYTES / MAX_FILES }));
  expect(withinBudget(ten)).toBe(true);
});

test("budget rejects an eleventh file or one byte over", () => {
  expect(withinBudget(Array.from({ length: MAX_FILES + 1 }, () => ({ size: 1 })))).toBe(false);
  expect(withinBudget([{ size: MAX_TOTAL_BYTES }, { size: 1 }])).toBe(false);
});

test("budget toast text matches the reference wording", () => {
  expect(BUDGET_MESSAGE).toBe(
    "You can attach up to 10 files with a total size of 100 MB at a time.",
  );
});
