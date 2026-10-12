import type { PicklistOption } from "../../contract";
import { countryOptions, stateOptions } from "../contacts/address-picklists";

export const accountsPicklists: Readonly<Record<string, readonly PicklistOption[]>> = {
  Rating: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Acquired",
      storedValue: "Acquired",
    },
    {
      displayValue: "Active",
      storedValue: "Active",
    },
    {
      displayValue: "Market Failed",
      storedValue: "Market Failed",
    },
    {
      displayValue: "Project Cancelled",
      storedValue: "Project Cancelled",
    },
    {
      displayValue: "Shut Down",
      storedValue: "ShutDown",
    },
  ],
  Account_Type: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Analyst",
      storedValue: "Analyst",
    },
    {
      displayValue: "Competitor",
      storedValue: "Competitor",
    },
    {
      displayValue: "Customer",
      storedValue: "Customer",
    },
    {
      displayValue: "Distributor",
      storedValue: "Distributor",
    },
    {
      displayValue: "Integrator",
      storedValue: "Integrator",
    },
    {
      displayValue: "Investor",
      storedValue: "Investor",
    },
    {
      displayValue: "Other",
      storedValue: "Other",
    },
    {
      displayValue: "Partner",
      storedValue: "Partner",
    },
    {
      displayValue: "Press",
      storedValue: "Press",
    },
    {
      displayValue: "Prospect",
      storedValue: "Prospect",
    },
    {
      displayValue: "Reseller",
      storedValue: "Reseller",
    },
    {
      displayValue: "Supplier",
      storedValue: "Supplier",
    },
    {
      displayValue: "Vendor",
      storedValue: "Vendor",
    },
  ],
  Ownership: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "Other",
      storedValue: "Other",
    },
    {
      displayValue: "Private",
      storedValue: "Private",
    },
    {
      displayValue: "Public",
      storedValue: "Public",
    },
    {
      displayValue: "Subsidiary",
      storedValue: "Subsidiary",
    },
    {
      displayValue: "Partnership",
      storedValue: "Partnership",
    },
    {
      displayValue: "Government",
      storedValue: "Government",
    },
    {
      displayValue: "Privately Held",
      storedValue: "Privately Held",
    },
    {
      displayValue: "Public Company",
      storedValue: "Public Company",
    },
  ],
  Industry: [
    {
      displayValue: "-None-",
      storedValue: "-None-",
    },
    {
      displayValue: "ASP (Application Service Provider)",
      storedValue: "ASP (Application Service Provider)",
    },
    {
      displayValue: "Data/Telecom OEM",
      storedValue: "Data/Telecom OEM",
    },
    {
      displayValue: "ERP (Enterprise Resource Planning)",
      storedValue: "ERP (Enterprise Resource Planning)",
    },
    {
      displayValue: "Government/Military",
      storedValue: "Government/Military",
    },
    {
      displayValue: "Large Enterprise",
      storedValue: "Large Enterprise",
    },
    {
      displayValue: "ManagementISV",
      storedValue: "ManagementISV",
    },
    {
      displayValue: "MSP (Management Service Provider)",
      storedValue: "MSP (Management Service Provider)",
    },
    {
      displayValue: "Network Equipment Enterprise",
      storedValue: "Network Equipment (Enterprise)",
    },
    {
      displayValue: "Non-management ISV",
      storedValue: "Non-management ISV",
    },
    {
      displayValue: "Optical Networking",
      storedValue: "Optical Networking",
    },
    {
      displayValue: "Service Provider",
      storedValue: "Service Provider",
    },
    {
      displayValue: "Small/Medium Enterprise",
      storedValue: "Small/Medium Enterprise",
    },
    {
      displayValue: "Storage Equipment",
      storedValue: "Storage Equipment",
    },
    {
      displayValue: "Storage Service Provider",
      storedValue: "Storage Service Provider",
    },
    {
      displayValue: "Systems Integrator",
      storedValue: "Systems Integrator",
    },
    {
      displayValue: "Wireless Industry",
      storedValue: "Wireless Industry",
    },
    {
      displayValue: "Financial Services",
      storedValue: "Financial Services",
    },
    {
      displayValue: "Education",
      storedValue: "Education",
    },
    {
      displayValue: "Technology",
      storedValue: "Technology",
    },
    {
      displayValue: "Real Estate",
      storedValue: "Real Estate",
    },
    {
      displayValue: "Consulting",
      storedValue: "Consulting",
    },
    {
      displayValue: "Communications",
      storedValue: "Communications",
    },
    {
      displayValue: "Manufacturing",
      storedValue: "Manufacturing",
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
  Billing_Country: countryOptions,
  Shipping_Country: countryOptions,
  Billing_State: stateOptions,
  Shipping_State: stateOptions,
};
