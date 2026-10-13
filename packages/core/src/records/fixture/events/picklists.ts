import type { PicklistOption } from "../../contract";
export const eventsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Meeting_Venue__s: [
    {
      displayValue: "In-office",
      storedValue: "In-office",
    },
    {
      displayValue: "Client location",
      storedValue: "Client location",
    },
    {
      displayValue: "Online",
      storedValue: "Online",
    },
  ],
  Meeting_Provider__s: [],
};
