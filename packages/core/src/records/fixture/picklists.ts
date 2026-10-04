import type { PicklistOption } from "../contract";

function options(values: readonly (string | readonly [string, string])[]): PicklistOption[] {
  return values.map((value) =>
    typeof value === "string"
      ? { displayValue: value, storedValue: value }
      : { displayValue: value[0], storedValue: value[1] },
  );
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
  Lead_Status: options([
    "-None-",
    "Attempted to Contact",
    "Contact in Future",
    "Contacted",
    "Junk Lead",
    "Lost Lead",
    "Not Contacted",
    "Pre-Qualified",
    "Not Qualified",
  ]),
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
