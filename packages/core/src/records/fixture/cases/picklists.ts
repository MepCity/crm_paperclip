import type { PicklistOption } from "../../contract";
export const casesPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Status: [
    {
      displayValue: "New",
      storedValue: "New",
    },
    {
      displayValue: "Escalated",
      storedValue: "Escalated",
    },
    {
      displayValue: "On Hold",
      storedValue: "On Hold",
    },
    {
      displayValue: "Closed",
      storedValue: "Closed",
    },
  ],
  Priority: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "High",
      storedValue: "High",
    },
    {
      displayValue: "Medium",
      storedValue: "Medium",
    },
    {
      displayValue: "Low",
      storedValue: "Low",
    },
  ],
  Type: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Problem",
      storedValue: "Problem",
    },
    {
      displayValue: "Feature Request",
      storedValue: "Feature Request",
    },
    {
      displayValue: "Question",
      storedValue: "Question",
    },
  ],
  Case_Reason: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "User did not attend any training",
      storedValue: "User did not attend any training",
    },
    {
      displayValue: "Complex functionality",
      storedValue: "Complex functionality",
    },
    {
      displayValue: "Existing problem",
      storedValue: "Existing problem",
    },
    {
      displayValue: "Instructions not clear",
      storedValue: "Instructions not clear",
    },
    {
      displayValue: "New problem",
      storedValue: "New problem",
    },
  ],
  Case_Origin: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Email",
      storedValue: "Email",
    },
    {
      displayValue: "Phone",
      storedValue: "Phone",
    },
    {
      displayValue: "Web",
      storedValue: "Web",
    },
  ],
};
