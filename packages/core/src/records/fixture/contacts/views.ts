import type { Criteria, CriteriaValue, ListView } from "../../contract";
import { contactsMetadata } from "./metadata";

const knownFields = new Set(contactsMetadata.fields.map((field) => field.apiName));
const listColumns = ["Full_Name", "Account_Name", "Email", "Phone", "Owner"];
const myColumns = ["Full_Name", "Account_Name", "Email", "Phone"];
const unsubscribedColumns = [
  "Full_Name",
  "Account_Name",
  "Email",
  "Owner",
  "Created_Time",
  "Unsubscribed_Mode",
  "Unsubscribed_Time",
];
const mailingColumns = [
  "Salutation",
  "Full_Name",
  "Mailing_Address",
  "Mailing_Coordinates",
  "Mailing_Flat_House_No_Building_Apartment_Name",
  "Mailing_Street",
  "Mailing_City",
  "Mailing_State",
  "Mailing_Zip",
  "Mailing_Country",
  "Mailing_Latitude",
  "Mailing_Longitude",
].filter((name) => knownFields.has(name));

function equal(field: string, value: CriteriaValue): Criteria {
  return { field, comparator: "equal", value };
}
function and(...group: Criteria[]): Criteria {
  return { groupOperator: "and", group };
}
function view(
  id: string,
  name: string,
  systemDefined: boolean,
  columns: readonly string[],
  criteria: Criteria | null,
): ListView {
  return {
    id,
    name,
    systemDefined,
    isDefault: id === "all-contacts",
    columns,
    criteria,
    sort: null,
  };
}

const currentUser = equal("Owner", { token: "CURRENTUSER" });
const ageWithin31 = (field: string): Criteria => ({
  field,
  comparator: "less_equal",
  value: { token: "AGEINDAYS", offset: 31 },
});
const thisWeek = equal("Created_Time", { token: "PERIOD", name: "THIS_WEEK" });
const lastWeek = equal("Created_Time", { token: "PERIOD", name: "PREVIOUS_WEEK" });

/** Ten Contacts views in inventory order. Mailing Labels omits legacy address columns absent from metadata. */
export const contactsViews: readonly ListView[] = [
  view("all-contacts", "All Contacts", true, listColumns, null),
  view("all-locked-contacts", "All Locked Contacts", true, listColumns, equal("Locked__s", true)),
  view("mailing-labels", "Mailing Labels", true, mailingColumns, null),
  view("my-contacts", "My Contacts", true, myColumns, currentUser),
  view("new-last-week", "New Last Week", true, listColumns, lastWeek),
  view("new-this-week", "New This Week", true, listColumns, thisWeek),
  view(
    "recently-created-contacts",
    "Recently Created Contacts",
    true,
    listColumns,
    and(
      { field: "Common_Status", comparator: "contains", value: "c" },
      ageWithin31("Created_Time"),
    ),
  ),
  view(
    "recently-modified-contacts",
    "Recently Modified Contacts",
    true,
    listColumns,
    and(
      { field: "Common_Status", comparator: "contains", value: "m" },
      ageWithin31("Modified_Time"),
    ),
  ),
  view("unread-contacts", "Unread Contacts", true, listColumns, {
    field: "Common_Status",
    comparator: "not_contains",
    value: "v",
  }),
  view(
    "unsubscribed-contacts",
    "Unsubscribed Contacts",
    true,
    unsubscribedColumns,
    equal("Email_Opt_Out", true),
  ),
];
