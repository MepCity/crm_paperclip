import type { Criteria, CriteriaValue, ListView } from "../contract";

const all = ["Full_Name", "Company", "Email", "Phone", "Lead_Source", "Owner"];
const converted = ["Full_Name", "Company", "Phone", "Email"];
const custom = ["Last_Name", "First_Name", "Company", "Email"];

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
  criteria: Criteria,
): ListView {
  return {
    id,
    name,
    systemDefined,
    isDefault: id === "all-leads",
    columns,
    criteria,
    sort: null,
  };
}

const notConverted = equal("Converted__s", false);
const currentUser = equal("Owner", { token: "CURRENTUSER" });
const ageWithin31 = (field: string): Criteria => ({
  field,
  comparator: "less_equal",
  value: { token: "AGEINDAYS", offset: 31 },
});

/**
 * Fourteen Leads views in inventory order.
 * Mailing Labels drops five address columns that are absent from module metadata
 * (see README › Deferred). Every view has criteria and a null saved sort.
 */
export const leadsViews: readonly ListView[] = [
  view("all-leads", "All Leads", true, all, notConverted),
  view(
    "all-locked-leads",
    "All Locked Leads",
    true,
    all,
    and(equal("Locked__s", true), notConverted),
  ),
  view("converted-leads", "Converted Leads", true, converted, equal("Converted__s", true)),
  view(
    "junk-leads",
    "Junk Leads",
    false,
    custom,
    equal("Lead_Status", { token: "CATEGORY", name: "Junk" }),
  ),
  view(
    "mailing-labels",
    "Mailing Labels",
    true,
    ["Salutation", "Full_Name", "Company"],
    notConverted,
  ),
  view(
    "my-converted-leads",
    "My Converted Leads",
    true,
    converted,
    and(equal("Converted__s", true), currentUser),
  ),
  view("my-leads", "My Leads", true, all.slice(0, -1), and(currentUser, notConverted)),
  view(
    "not-qualified-leads",
    "Not Qualified Leads",
    false,
    custom,
    equal("Lead_Status", { token: "CATEGORY", name: "Not Qualified" }),
  ),
  view(
    "open-leads",
    "Open Leads",
    false,
    custom,
    equal("Lead_Status", { token: "CATEGORY", name: "Open" }),
  ),
  view(
    "recently-created-leads",
    "Recently Created Leads",
    true,
    all,
    and(
      and({ field: "Common_Status", comparator: "contains", value: "c" }, notConverted),
      ageWithin31("Created_Time"),
    ),
  ),
  view(
    "recently-modified-leads",
    "Recently Modified Leads",
    true,
    all,
    and(
      and({ field: "Common_Status", comparator: "contains", value: "m" }, notConverted),
      ageWithin31("Modified_Time"),
    ),
  ),
  view(
    "todays-leads",
    "Today's Leads",
    true,
    all,
    and(equal("Created_Time", { token: "TODAY" }), notConverted),
  ),
  view(
    "unread-leads",
    "Unread Leads",
    true,
    all,
    and(notConverted, { field: "Common_Status", comparator: "not_contains", value: "v" }),
  ),
  view(
    "unsubscribed-leads",
    "Unsubscribed Leads",
    true,
    [
      "Full_Name",
      "Company",
      "Email",
      "Owner",
      "Created_Time",
      "Unsubscribed_Mode",
      "Unsubscribed_Time",
    ],
    and(notConverted, equal("Email_Opt_Out", true)),
  ),
];
