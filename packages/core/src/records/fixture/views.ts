import type { ListView } from "../contract";

/** Unresearched system predicates: null is an interim fixture policy. */
export const SYSTEM_VIEW_IDS_WITH_INTERIM_NULL_CRITERIA = [
  "all-leads",
  "all-locked-leads",
  "converted-leads",
  "mailing-labels",
  "my-converted-leads",
  "my-leads",
  "recently-created-leads",
  "recently-modified-leads",
  "todays-leads",
  "unread-leads",
  "unsubscribed-leads",
] as const;

export const OPEN_STATUS_VALUES = [
  "Attempted to Contact",
  "Contact in Future",
  "Contacted",
  "Lost Lead",
  "Not Contacted",
  "Pre-Qualified",
] as const;
const interimSystemViewIds = new Set<string>(SYSTEM_VIEW_IDS_WITH_INTERIM_NULL_CRITERIA);
const all = ["Full_Name", "Company", "Email", "Phone", "Lead_Source", "Owner"];
const converted = ["Full_Name", "Company", "Phone", "Email"];
const custom = ["Last_Name", "First_Name", "Company", "Email"];
function view(
  id: string,
  name: string,
  columns: readonly string[],
  statuses?: readonly string[],
): ListView {
  return {
    id,
    name,
    columns,
    systemDefined: interimSystemViewIds.has(id),
    isDefault: id === "all-leads",
    sort: null,
    criteria: interimSystemViewIds.has(id)
      ? null
      : { field: "Lead_Status", comparator: "is", value: statuses ?? [] },
  };
}
export const leadsViews: readonly ListView[] = [
  view("all-leads", "All Leads", all),
  view("all-locked-leads", "All Locked Leads", all),
  view("converted-leads", "Converted Leads", converted),
  view("junk-leads", "Junk Leads", custom, ["Junk Lead"]),
  view("mailing-labels", "Mailing Labels", ["Salutation", "Full_Name", "Company"]),
  view("my-converted-leads", "My Converted Leads", converted),
  view("my-leads", "My Leads", all.slice(0, -1)),
  view("not-qualified-leads", "Not Qualified Leads", custom, ["Not Qualified"]),
  view("open-leads", "Open Leads", custom, OPEN_STATUS_VALUES),
  view("recently-created-leads", "Recently Created Leads", all),
  view("recently-modified-leads", "Recently Modified Leads", all),
  view("todays-leads", "Today's Leads", all),
  view("unread-leads", "Unread Leads", all),
  view("unsubscribed-leads", "Unsubscribed Leads", [
    "Full_Name",
    "Company",
    "Email",
    "Owner",
    "Created_Time",
    "Unsubscribed_Mode",
    "Unsubscribed_Time",
  ]),
];
