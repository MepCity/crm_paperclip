import type { FilterGroup } from "@/components/records/list/filter-panel";

const systemDefinedItems = [
  "Activities",
  "Campaigns",
  "Latest Email Status",
  "Locked",
  "Record Action",
  "Related Records Action",
  "Touched Records",
  "Untouched Records",
  "Cadences",
];

const fieldFilterLabels =
  `Address;Address - City;Address - Country / Region;Address - Flat / House No./ Building / Apartment Name;Address - State / Province;Address - Street Address;Address - Zip / Postal Code;Annual Revenue;Company;Connected To;Converted Account;Converted Contact;Converted Deal;Created By;Created Time;Email;Email Opt Out;Fax;First Name;Industry;Last Activity Time;Last Name;Lead Conversion Time;Lead Name;Lead Owner;Lead Source;Lead Status;Mobile;Modified By;Modified Time;No. of Employees;Phone;Rating;Salutation;Secondary Email;Skype ID;Tag;Title;Twitter;Unsubscribed Mode;Unsubscribed Time;Website`.split(
    ";",
  );

const relatedModuleLabels =
  `Accounts (Connected Records);Calls;Campaigns (Connected Records);Cases (Connected Records);Contacts (Connected Records);Deals (Connected Records);Emails;Invitees (Invited Meetings);Invoices (Connected Records);Lead Product Relation (Products);Meetings;Notes;Products (Connected Records);Purchase Orders (Connected Records);Quotes (Connected Records);Sales Orders (Connected Records);Solutions (Connected Records);Tasks;Vendors (Connected Records)`.split(
    ";",
  );

function disabledItems(labels: readonly string[], prefix: string) {
  return labels.map((label, index) => ({
    id: `${prefix}-${index}`,
    label,
    disabled: true,
  }));
}

/** Left filter panel rows for Leads, in spec order; rows stay disabled until research lands. */
export const leadsFilterGroups: readonly FilterGroup[] = [
  {
    id: "system",
    label: "System Defined Filters",
    items: disabledItems(systemDefinedItems, "system"),
  },
  {
    id: "fields",
    label: "Filter By Fields",
    items: disabledItems(fieldFilterLabels, "field"),
  },
  {
    id: "related",
    label: "Filter By Related Modules",
    items: disabledItems(relatedModuleLabels, "related"),
  },
];
