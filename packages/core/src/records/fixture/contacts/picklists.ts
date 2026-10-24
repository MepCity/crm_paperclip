import type { PicklistOption } from "../../contract";

import { countryOptions, stateOptions } from "./address-picklists";

export const contactsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Mailing_Country: countryOptions,
  Other_Country: countryOptions,
  Mailing_State: stateOptions,
  Other_State: stateOptions,
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
      displayValue: "X (Twitter)",
      storedValue: "Twitter",
    },
    {
      displayValue: "Facebook",
      storedValue: "Facebook",
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
      displayValue: "Web Cases",
      storedValue: "Web Cases",
    },
    {
      displayValue: "Web Mail",
      storedValue: "Web Mail",
    },
    {
      displayValue: "Chat",
      storedValue: "Chat",
    },
  ],
  Salutation: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Mr.",
      storedValue: "Mr.",
    },
    {
      displayValue: "Mrs.",
      storedValue: "Mrs.",
    },
    {
      displayValue: "Ms.",
      storedValue: "Ms.",
    },
    {
      displayValue: "Dr.",
      storedValue: "Dr.",
    },
    {
      displayValue: "Prof.",
      storedValue: "Prof.",
    },
  ],
  Unsubscribed_Mode: [
    {
      displayValue: "Consent form",
      storedValue: "Consent form",
    },
    {
      displayValue: "Manual",
      storedValue: "Manual",
    },
    {
      displayValue: "Unsubscribe link",
      storedValue: "Unsubscribe link",
    },
    {
      displayValue: "reference CRM campaigns",
      storedValue: "reference CRM campaigns",
    },
  ],
  Enrich_Status__s: [
    {
      displayValue: "Available",
      storedValue: "Available",
    },
    {
      displayValue: "Enriched",
      storedValue: "Enriched",
    },
    {
      displayValue: "Data not found",
      storedValue: "Data not found",
    },
  ],
};
