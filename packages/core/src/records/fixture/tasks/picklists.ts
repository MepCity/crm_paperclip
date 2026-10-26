import type { PicklistOption } from "../../contract";

export const tasksPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Subject: [
    {
      displayValue: "Email",
      storedValue: "Email",
    },
    {
      displayValue: "Call",
      storedValue: "Call",
    },
    {
      displayValue: "Meeting",
      storedValue: "Meeting",
    },
    {
      displayValue: "Send Letter",
      storedValue: "Send Letter",
    },
    {
      displayValue: "Product Demo",
      storedValue: "Product Demo",
    },
  ],
  Status: [
    {
      displayValue: "Not Started",
      storedValue: "Not Started",
    },
    {
      displayValue: "Deferred",
      storedValue: "Deferred",
    },
    {
      displayValue: "In Progress",
      storedValue: "In Progress",
    },
    {
      displayValue: "Completed",
      storedValue: "Completed",
    },
    {
      displayValue: "Waiting for input",
      storedValue: "Waiting on someone else",
    },
  ],
  Priority: [
    {
      displayValue: "High",
      storedValue: "High",
    },
    {
      displayValue: "Highest",
      storedValue: "Highest",
    },
    {
      displayValue: "Low",
      storedValue: "Low",
    },
    {
      displayValue: "Lowest",
      storedValue: "Lowest",
    },
    {
      displayValue: "Normal",
      storedValue: "Normal",
    },
  ],
};
