import type { PicklistOption } from "../../contract";
export const solutionsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Status: [
    {
      displayValue: "Draft",
      storedValue: "Draft",
    },
    {
      displayValue: "Reviewed",
      storedValue: "Reviewed",
    },
    {
      displayValue: "Duplicate",
      storedValue: "Duplicate",
    },
  ],
};
