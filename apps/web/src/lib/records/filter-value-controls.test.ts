import { describe, expect, it } from "vitest";
import { type FilterFieldType, filterOperators } from "./filter-operators";

/** list-views.md › Value control by operator (observed rows). */
const valueControlByOperator: {
  fieldType: FilterFieldType;
  operatorLabel: string;
  control: string;
}[] = [
  { fieldType: "text", operatorLabel: "is empty", control: "none" },
  { fieldType: "datetime", operatorLabel: "due in", control: "days" },
  { fieldType: "datetime", operatorLabel: "Previous", control: "days" },
  { fieldType: "datetime", operatorLabel: "Next", control: "days" },
  { fieldType: "datetime", operatorLabel: "On", control: "date" },
  { fieldType: "datetime", operatorLabel: "before", control: "date" },
  { fieldType: "datetime", operatorLabel: "between", control: "date_range" },
  { fieldType: "datetime", operatorLabel: "not between", control: "date_range" },
  { fieldType: "datetime", operatorLabel: "Today", control: "none" },
  { fieldType: "datetime", operatorLabel: "is empty", control: "none" },
  { fieldType: "currency", operatorLabel: "between", control: "range" },
  { fieldType: "currency", operatorLabel: "is empty", control: "none" },
  { fieldType: "picklist", operatorLabel: "is empty", control: "none" },
  { fieldType: "ownerlookup", operatorLabel: "belongs to Role", control: "choices" },
  { fieldType: "ownerlookup", operatorLabel: "belongs to Group", control: "choices" },
  { fieldType: "ownerlookup", operatorLabel: "is empty", control: "none" },
];

describe("value control by operator (spec table)", () => {
  for (const { fieldType, operatorLabel, control } of valueControlByOperator) {
    it(`${fieldType} › ${operatorLabel} → ${control}`, () => {
      const operator = filterOperators[fieldType].operators.find(
        (row) => row.label === operatorLabel,
      );
      expect(operator?.control).toBe(control);
    });
  }
});
