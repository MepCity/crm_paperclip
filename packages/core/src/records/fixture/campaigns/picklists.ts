import type { PicklistOption } from "../../contract";
export const campaignsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Type: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Conference",
      storedValue: "Conference",
    },
    {
      displayValue: "Webinar",
      storedValue: "Webinar",
    },
    {
      displayValue: "Trade Show",
      storedValue: "Trade Show",
    },
    {
      displayValue: "Public Relations",
      storedValue: "Public Relations",
    },
    {
      displayValue: "Partners",
      storedValue: "Partners",
    },
    {
      displayValue: "Referral Program",
      storedValue: "Referral Program",
    },
    {
      displayValue: "Advertisement",
      storedValue: "Advertisement",
    },
    {
      displayValue: "Banner Ads",
      storedValue: "Banner Ads",
    },
    {
      displayValue: "Direct mail",
      storedValue: "Direct mail",
    },
    {
      displayValue: "Email",
      storedValue: "Email",
    },
    {
      displayValue: "Telemarketing",
      storedValue: "Telemarketing",
    },
    {
      displayValue: "Others",
      storedValue: "Others",
    },
  ],
  Status: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Planning",
      storedValue: "Planning",
    },
    {
      displayValue: "Active",
      storedValue: "Active",
    },
    {
      displayValue: "Inactive",
      storedValue: "Inactive",
    },
    {
      displayValue: "Complete",
      storedValue: "Complete",
    },
  ],
};
