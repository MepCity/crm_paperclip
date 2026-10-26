import type { PicklistOption } from "../../contract";

export const dealsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Stage: [
    {
      displayValue: "Qualification",
      storedValue: "Qualification",
      stage: {
        probability: 10,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Needs Analysis",
      storedValue: "Needs Analysis",
      stage: {
        probability: 20,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Value Proposition",
      storedValue: "Value Proposition",
      stage: {
        probability: 40,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Identify Decision Makers",
      storedValue: "Id. Decision Makers",
      stage: {
        probability: 60,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Proposal/Price Quote",
      storedValue: "Proposal/Price Quote",
      stage: {
        probability: 75,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Negotiation/Review",
      storedValue: "Negotiation/Review",
      stage: {
        probability: 90,
        forecastCategory: "Pipeline",
        category: "Open",
      },
    },
    {
      displayValue: "Closed Won",
      storedValue: "Closed Won",
      stage: {
        probability: 100,
        forecastCategory: "Closed",
        category: "Closed Won",
      },
    },
    {
      displayValue: "Closed Lost",
      storedValue: "Closed Lost",
      stage: {
        probability: 0,
        forecastCategory: "Omitted",
        category: "Closed Lost",
      },
    },
    {
      displayValue: "Closed Lost to Competition",
      storedValue: "Closed Lost to Competition",
      stage: {
        probability: 0,
        forecastCategory: "Omitted",
        category: "Closed Lost",
      },
    },
  ],
  Type: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Existing Business",
      storedValue: "Existing Business",
    },
    {
      displayValue: "New Business",
      storedValue: "New Business",
    },
  ],
  Lead_Source: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Advertisement",
      storedValue: "Advertisement",
    },
    {
      displayValue: "Cold Call",
      storedValue: "Cold Call",
    },
    {
      displayValue: "Employee Referral",
      storedValue: "Employee Referral",
    },
    {
      displayValue: "External Referral",
      storedValue: "External Referral",
    },
    {
      displayValue: "Online Store",
      storedValue: "OnlineStore",
    },
    {
      displayValue: "Partner",
      storedValue: "Partner",
    },
    {
      displayValue: "Public Relations",
      storedValue: "Public Relations",
    },
    {
      displayValue: "Sales Email Alias",
      storedValue: "Sales Mail Alias",
    },
    {
      displayValue: "Seminar Partner",
      storedValue: "Seminar Partner",
    },
    {
      displayValue: "Internal Seminar",
      storedValue: "Seminar-Internal",
    },
    {
      displayValue: "Trade Show",
      storedValue: "Trade Show",
    },
    {
      displayValue: "Web Download",
      storedValue: "Web Download",
    },
    {
      displayValue: "Web Research",
      storedValue: "Web Research",
    },
    {
      displayValue: "Chat",
      storedValue: "Chat",
    },
  ],
  Reason_For_Loss__s: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Expectation Mismatch",
      storedValue: "Expectation Mismatch",
    },
    {
      displayValue: "Price",
      storedValue: "Price",
    },
    {
      displayValue: "Unqualified Customer",
      storedValue: "Unqualified Customer",
    },
    {
      displayValue: "Lack of response",
      storedValue: "Lack of response",
    },
    {
      displayValue: "Missed Follow Ups",
      storedValue: "Missed Follow Ups",
    },
    {
      displayValue: "Wrong Target",
      storedValue: "Wrong Target",
    },
    {
      displayValue: "Competition",
      storedValue: "Competition",
    },
    {
      displayValue: "Future Interest",
      storedValue: "Future Interest",
    },
    {
      displayValue: "Other",
      storedValue: "Other",
    },
  ],
};
