import type { PicklistOption } from "../../contract";

export const callsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Call_Type: [
    {
      displayValue: "Outbound",
      storedValue: "Outbound",
    },
    {
      displayValue: "Inbound",
      storedValue: "Inbound",
    },
    {
      displayValue: "Missed",
      storedValue: "Missed",
    },
  ],
  Call_Purpose: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Prospecting",
      storedValue: "Prospecting",
    },
    {
      displayValue: "Administrative",
      storedValue: "Administrative",
    },
    {
      displayValue: "Negotiation",
      storedValue: "Negotiation",
    },
    {
      displayValue: "Demo",
      storedValue: "Demo",
    },
    {
      displayValue: "Project",
      storedValue: "Project",
    },
    {
      displayValue: "Desk",
      storedValue: "Support",
    },
  ],
  Call_Result: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Interested",
      storedValue: "Interested",
    },
    {
      displayValue: "Not interested",
      storedValue: "Not interested",
    },
    {
      displayValue: "No response/Busy",
      storedValue: "No response/Busy",
    },
    {
      displayValue: "Requested more info",
      storedValue: "Requested more info",
    },
    {
      displayValue: "Requested call back",
      storedValue: "Requested call back",
    },
    {
      displayValue: "Invalid number",
      storedValue: "Invalid number",
    },
  ],
  Reminder: [
    {
      displayValue: "None",
      storedValue: "none",
    },
    {
      displayValue: "5 minutes before",
      storedValue: "5 mins",
    },
    {
      displayValue: "10 minutes before",
      storedValue: "10 mins",
    },
    {
      displayValue: "15 minutes before",
      storedValue: "15 mins",
    },
    {
      displayValue: "30 minutes before",
      storedValue: "30 mins",
    },
    {
      displayValue: "1 hour before",
      storedValue: "1 hrs",
    },
    {
      displayValue: "2 hours before",
      storedValue: "2 hrs",
    },
    {
      displayValue: "1 day before",
      storedValue: "1 days",
    },
    {
      displayValue: "2 days before",
      storedValue: "2 days",
    },
  ],
  Outgoing_Call_Status: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Scheduled",
      storedValue: "Scheduled",
    },
    {
      displayValue: "Completed",
      storedValue: "Completed",
    },
    {
      displayValue: "Overdue",
      storedValue: "Overdue",
    },
    {
      displayValue: "Cancelled",
      storedValue: "Cancelled",
    },
  ],
  Scheduled_In_CRM: [
    {
      displayValue: "False",
      storedValue: "False",
    },
    {
      displayValue: "True",
      storedValue: "True",
    },
  ],
};
