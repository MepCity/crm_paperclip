import type { PicklistOption } from "../contract";

function options(values: readonly (string | readonly [string, string])[]): PicklistOption[] {
  return values.map((value) =>
    typeof value === "string"
      ? { displayValue: value, storedValue: value }
      : { displayValue: value[0], storedValue: value[1] },
  );
}

/** Lead Status options plus the record category each stored value belongs to. */
const leadStatusOptions: readonly { display: string; stored: string; category?: string }[] = [
  { display: "-None-", stored: "-None-" },
  { display: "Attempted to Contact", stored: "Attempted to Contact", category: "Open" },
  { display: "Contact in Future", stored: "Contact in Future", category: "Open" },
  { display: "Contacted", stored: "Contacted", category: "Open" },
  { display: "Junk Lead", stored: "Junk Lead", category: "Junk" },
  { display: "Lost Lead", stored: "Lost Lead", category: "Open" },
  { display: "Not Contacted", stored: "Not Contacted", category: "Open" },
  { display: "Pre-Qualified", stored: "Pre-Qualified", category: "Open" },
  { display: "Not Qualified", stored: "Not Qualified", category: "Not Qualified" },
];

const categorySources: Readonly<Record<string, readonly { stored: string; category?: string }[]>> =
  {
    Lead_Status: leadStatusOptions,
  };

/** Stored values of `field` whose picklist category is `category`, in option order. */
export function categoryStoredValues(field: string, category: string): readonly string[] {
  return (categorySources[field] ?? [])
    .filter((option) => option.category === category)
    .map((option) => option.stored);
}

export const leadsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Lead_Source: options([
    "-None-",
    "Advertisement",
    "Cold Call",
    "Employee Referral",
    "External Referral",
    ["Online Store", "OnlineStore"],
    ["X (Twitter)", "Twitter"],
    "Facebook",
    "Partner",
    "Public Relations",
    ["Sales Email Alias", "Sales Mail Alias"],
    "Seminar Partner",
    ["Internal Seminar", "Seminar-Internal"],
    "Trade Show",
    "Web Download",
    "Web Research",
    "Chat",
  ]),
  Lead_Status: leadStatusOptions.map((option) => ({
    displayValue: option.display,
    storedValue: option.stored,
  })),
  Industry: options([
    "-None-",
    "ASP (Application Service Provider)",
    "Data/Telecom OEM",
    "ERP (Enterprise Resource Planning)",
    "Government/Military",
    "Large Enterprise",
    "ManagementISV",
    "MSP (Management Service Provider)",
    ["Network Equipment Enterprise", "Network Equipment (Enterprise)"],
    "Non-management ISV",
    "Optical Networking",
    "Service Provider",
    "Small/Medium Enterprise",
    "Storage Equipment",
    "Storage Service Provider",
    "Systems Integrator",
    "Wireless Industry",
    "ERP",
    "Management ISV",
  ]),
  Rating: options([
    "-None-",
    "Acquired",
    "Active",
    "Market Failed",
    "Project Cancelled",
    ["Shut Down", "ShutDown"],
  ]),
  Salutation: options(["-None-", "Mr.", "Mrs.", "Ms.", "Dr.", "Prof."]),
  Unsubscribed_Mode: options(["Consent form", "Manual", "Unsubscribe link"]),
  Enrich_Status__s: options(["Available", "Enriched", "Data not found"]),
};
